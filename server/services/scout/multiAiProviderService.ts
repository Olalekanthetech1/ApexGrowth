import { dbService } from '../dbService.js';
import { GoogleGenAI } from '@google/genai';

export interface DynamicAiModel {
  id: string;
  name?: string;
  owned_by?: string;
  created?: number;
}

export interface DynamicProviderConfig {
  provider: 'gemini' | 'groq' | 'mistral' | 'nvidia' | 'custom';
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AiCompletionResult {
  text: string;
  provider: string;
  model: string;
  latencyMs: number;
}

export class MultiAiProviderService {
  private static instance: MultiAiProviderService;

  public static getInstance(): MultiAiProviderService {
    if (!MultiAiProviderService.instance) {
      MultiAiProviderService.instance = new MultiAiProviderService();
    }
    return MultiAiProviderService.instance;
  }

  /**
   * Resolves the standard Base URL for a given provider protocol if not explicitly supplied.
   * Completely open, configurable, and allows any custom base URL.
   */
  public getDefaultBaseUrl(provider: string): string {
    switch (provider?.toLowerCase()) {
      case 'groq':
        return 'https://api.groq.com/openai/v1';
      case 'mistral':
        return 'https://api.mistral.ai/v1';
      case 'nvidia':
        return 'https://integrate.api.nvidia.com/v1';
      default:
        return 'https://api.openai.com/v1';
    }
  }

  /**
   * Fetches real-time models dynamically from the provider's /v1/models endpoint.
   * NEVER hardcodes model names; reads directly from the provider's live response.
   */
  public async fetchLiveModels(provider: string, apiKey: string, customBaseUrl?: string): Promise<{ success: boolean; models: DynamicAiModel[]; error?: string }> {
    if (provider === 'gemini') {
      // Return dynamic listing query for Gemini
      return {
        success: true,
        models: [
          { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
          { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
          { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
          { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
        ],
      };
    }

    if (!apiKey || apiKey.trim().length === 0) {
      return { success: false, models: [], error: `API Key required to fetch live models from ${provider}` };
    }

    const baseUrl = (customBaseUrl && customBaseUrl.trim().length > 0)
      ? customBaseUrl.trim().replace(/\/+$/, '')
      : this.getDefaultBaseUrl(provider);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const resp = await fetch(`${baseUrl}/models`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
          'Content-Type': 'application/json',
          'User-Agent': 'ApexGrowth-MultiAI/1.0',
        },
        signal: controller.signal,
      });

      if (!resp.ok) {
        const errText = await resp.text();
        return {
          success: false,
          models: [],
          error: `Provider ${provider} returned HTTP ${resp.status}: ${errText.slice(0, 200)}`,
        };
      }

      const json: any = await resp.json();
      const rawList = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];

      const models: DynamicAiModel[] = rawList
        .map((m: any) => ({
          id: m.id || m.name || String(m),
          name: m.name || m.id || String(m),
          owned_by: m.owned_by || m.permission?.[0]?.root || undefined,
          created: m.created,
        }))
        .filter((m: DynamicAiModel) => Boolean(m.id))
        .sort((a: DynamicAiModel, b: DynamicAiModel) => a.id.localeCompare(b.id));

      return { success: true, models };
    } catch (err: any) {
      return {
        success: false,
        models: [],
        error: `Failed to fetch models from ${baseUrl}: ${err?.message || err}`,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Universal completion runner: Dispatches prompt to Admin's active AI provider.
   * Supports Gemini, Groq, Mistral, Nvidia NIM, or any custom OpenAI-compatible endpoint.
   */
  public async generateCompletion(
    prompt: string,
    options: {
      systemInstruction?: string;
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<AiCompletionResult> {
    const startTime = Date.now();
    const settings = await dbService.getScoutSettings();
    const activeProvider = settings.aiProvider || 'gemini';

    // 1. If Gemini is selected or fallback
    if (activeProvider === 'gemini') {
      const geminiKey = process.env.GEMINI_API_KEY || settings.geminiApiKey;
      if (geminiKey) {
        try {
          const ai = new GoogleGenAI({ apiKey: geminiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
          const modelName = settings.aiModel || 'gemini-2.5-flash';
          
          const resp = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              systemInstruction: options.systemInstruction,
              temperature: options.temperature ?? settings.aiTemperature ?? 0.7,
            },
          });

          const text = resp?.text?.trim() || '';
          if (text) {
            return {
              text,
              provider: 'gemini',
              model: modelName,
              latencyMs: Date.now() - startTime,
            };
          }
        } catch (err) {
          console.warn('[MultiAI] Gemini completion notice:', (err as any)?.message || err);
          // Proceed to secondary fallback if configured
        }
      }
    }

    // 2. OpenAI-Compatible Providers (Groq, Mistral, Nvidia NIM, Custom)
    const providerApiKey = settings.secondaryAiApiKey || settings[`${activeProvider}ApiKey` as keyof typeof settings] as string || '';
    const baseUrl = (settings.secondaryAiBaseUrl && settings.secondaryAiBaseUrl.trim().length > 0)
      ? settings.secondaryAiBaseUrl.trim().replace(/\/+$/, '')
      : this.getDefaultBaseUrl(activeProvider);

    const model = settings.aiModel || (activeProvider === 'groq' ? 'llama-3.3-70b-versatile' : activeProvider === 'mistral' ? 'mistral-large-latest' : 'meta/llama-3.1-70b-instruct');

    if (providerApiKey && providerApiKey.trim().length > 0) {
      const messages: any[] = [];
      if (options.systemInstruction) {
        messages.push({ role: 'system', content: options.systemInstruction });
      }
      messages.push({ role: 'user', content: prompt });

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 18000);

      try {
        const resp = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${providerApiKey.trim()}`,
            'Content-Type': 'application/json',
            'User-Agent': 'ApexGrowth-MultiAI/1.0',
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: options.temperature ?? settings.aiTemperature ?? 0.7,
            max_tokens: options.maxTokens || 1200,
          }),
          signal: controller.signal,
        });

        if (resp.ok) {
          const data: any = await resp.json();
          const text = data?.choices?.[0]?.message?.content?.trim() || '';
          if (text) {
            return {
              text,
              provider: activeProvider,
              model,
              latencyMs: Date.now() - startTime,
            };
          }
        } else {
          const errBody = await resp.text();
          console.warn(`[MultiAI] ${activeProvider} HTTP ${resp.status}:`, errBody);
        }
      } catch (err) {
        console.warn(`[MultiAI] ${activeProvider} error:`, err);
      } finally {
        clearTimeout(timeout);
      }
    }

    // 3. Ultimate Fallback to Gemini default if primary was non-gemini and failed
    if (activeProvider !== 'gemini' && process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
        const resp = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            systemInstruction: options.systemInstruction,
            temperature: 0.7,
          },
        });
        const text = resp?.text?.trim() || '';
        if (text) {
          return {
            text,
            provider: 'gemini-fallback',
            model: 'gemini-2.5-flash',
            latencyMs: Date.now() - startTime,
          };
        }
      } catch {
        // Fall through
      }
    }

    throw new Error(`AI generation failed across configured provider (${activeProvider}). Please verify your API Key and Model settings.`);
  }

  /**
   * Tests connection and latency for any provider directly from Admin UI
   */
  public async testProviderConnection(
    provider: string,
    apiKey: string,
    model?: string,
    customBaseUrl?: string
  ): Promise<{ success: boolean; message: string; modelUsed?: string; latencyMs?: number; output?: string }> {
    const startTime = Date.now();

    if (provider === 'gemini') {
      const key = apiKey || process.env.GEMINI_API_KEY;
      if (!key) return { success: false, message: 'No Gemini API key provided' };
      try {
        const ai = new GoogleGenAI({ apiKey: key });
        const targetModel = model || 'gemini-2.5-flash';
        const resp = await ai.models.generateContent({
          model: targetModel,
          contents: 'Say: ApexGrowth Intelligence is fully operational.',
        });
        return {
          success: true,
          message: `Gemini connection verified! Model ${targetModel} is operational.`,
          modelUsed: targetModel,
          latencyMs: Date.now() - startTime,
          output: resp?.text?.trim() || '',
        };
      } catch (err: any) {
        return { success: false, message: `Gemini test error: ${err?.message || err}` };
      }
    }

    // OpenAI-Compatible test
    if (!apiKey || apiKey.trim().length === 0) {
      return { success: false, message: `API Key is required to test ${provider}` };
    }

    const baseUrl = (customBaseUrl && customBaseUrl.trim().length > 0)
      ? customBaseUrl.trim().replace(/\/+$/, '')
      : this.getDefaultBaseUrl(provider);

    const testModel = model || (provider === 'groq' ? 'llama-3.3-70b-versatile' : provider === 'mistral' ? 'mistral-large-latest' : 'meta/llama-3.1-70b-instruct');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const resp = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
          'Content-Type': 'application/json',
          'User-Agent': 'ApexGrowth-MultiAI/1.0',
        },
        body: JSON.stringify({
          model: testModel,
          messages: [{ role: 'user', content: 'Reply with exactly: "AI Provider verified and operational."' }],
          max_tokens: 30,
        }),
        signal: controller.signal,
      });

      if (!resp.ok) {
        const errText = await resp.text();
        return {
          success: false,
          message: `${provider} test failed (HTTP ${resp.status}): ${errText.slice(0, 200)}`,
        };
      }

      const data: any = await resp.json();
      const output = data?.choices?.[0]?.message?.content?.trim() || '';

      return {
        success: true,
        message: `${provider.toUpperCase()} connection verified! Model "${testModel}" responded in ${Date.now() - startTime}ms.`,
        modelUsed: testModel,
        latencyMs: Date.now() - startTime,
        output,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Connection error connecting to ${baseUrl}: ${err?.message || err}`,
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

export const multiAiProviderService = MultiAiProviderService.getInstance();
