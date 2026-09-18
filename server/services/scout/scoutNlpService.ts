import { FunctionDeclaration, GoogleGenAI, Type } from '@google/genai';
import { dbService } from '../dbService.js';
import { actionCenter } from './actionCenter.js';
import { intelligenceEngine } from './intelligenceEngine.js';
import { telegramScoutService } from './telegramScoutService.js';
import { tavilySearchService } from './tavilySearchService.js';
import { ScoutSettings } from '../../../src/types/index.js';

let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });
  }
  return genAIClient;
}

// ---------------------------------------------------------------------------
// Native Gemini Function Declarations (Tools)
// ---------------------------------------------------------------------------

const auditWebsiteTool: FunctionDeclaration = {
  name: 'auditWebsite',
  description:
    'Conduct a real-time live HTTP network latency, DOM checkout elements, and public contact audit on any website or e-commerce store URL. Analyzes actual latency in ms, payload weight, viewport tags, lazy-loaded images, checkout forms, and extracts public contact info.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      url: {
        type: Type.STRING,
        description: 'The full URL of the website or store to audit (e.g. https://example.com)',
      },
    },
    required: ['url'],
  },
};

const getPipelineStatsTool: FunctionDeclaration = {
  name: 'getPipelineStats',
  description:
    'Query the live database for real pipeline counts: total opportunities discovered, pending review (drafted), approved, sent, and scanner running status.',
  parameters: {
    type: Type.OBJECT,
    properties: {},
  },
};

const controlAutonomousScannerTool: FunctionDeclaration = {
  name: 'controlAutonomousScanner',
  description: 'Pause or resume the 24/7 autonomous background community discovery worker in the database.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      enabled: {
        type: Type.BOOLEAN,
        description: 'true to resume/start scanning, false to pause/stop scanning',
      },
    },
    required: ['enabled'],
  },
};

const getRecentOpportunitiesTool: FunctionDeclaration = {
  name: 'getRecentOpportunities',
  description: 'Retrieve the most recent leads and audited stores discovered in the database.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      limit: {
        type: Type.NUMBER,
        description: 'Number of opportunities to return (default 3, max 10)',
      },
      status: {
        type: Type.STRING,
        description: 'Optional filter: DRAFTED, APPROVED, REJECTED, or SENT',
      },
    },
  },
};

const refineOutreachDraftTool: FunctionDeclaration = {
  name: 'refineOutreachDraft',
  description: 'Refine, rewrite, shorten, or adjust the tone/pricing of an outreach draft for an opportunity.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      instruction: {
        type: Type.STRING,
        description:
          'The user instruction on how to refine the draft (e.g., make it shorter, mention 48-hour sprint, friendly tone)',
      },
      opportunityId: {
        type: Type.STRING,
        description: 'Optional opportunity ID. If not specified, uses the latest drafted opportunity.',
      },
    },
    required: ['instruction'],
  },
};

const approveOpportunityTool: FunctionDeclaration = {
  name: 'approveOpportunity',
  description: 'Approve a pending opportunity draft in the database so it is marked ready for dispatch.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      opportunityId: {
        type: Type.STRING,
        description: 'The opportunity ID to approve. If not specified, approves the latest drafted opportunity.',
      },
    },
  },
};

const updateScannerSettingsTool: FunctionDeclaration = {
  name: 'updateScannerSettings',
  description: 'Updates autonomous scout scanner settings such as scan interval minutes, enabled/paused state, or target niches in the database.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      intervalMinutes: {
        type: Type.NUMBER,
        description: 'New scan interval in minutes (e.g. 15, 30, 60, 120).',
      },
      enabled: {
        type: Type.BOOLEAN,
        description: 'True to activate 24/7 scanning, false to pause.',
      },
      addNiche: {
        type: Type.STRING,
        description: 'A new target e-commerce niche to add to the scanner scope (e.g. "sustainable fashion", "luxury jewelry").',
      },
      removeNiche: {
        type: Type.STRING,
        description: 'A niche to remove from the scanner scope.',
      },
    },
  },
};

const searchWebTool: FunctionDeclaration = {
  name: 'searchWeb',
  description:
    'Search the live web in real time using Tavily AI Search. Use this whenever the user asks for current web data, brand background, founder articles, competitor stores, news, or niche trends.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: 'The search query to look up on the live web (e.g. "latest Shopify checkout conversion trends 2026", "gymshark founders background")',
      },
      searchDepth: {
        type: Type.STRING,
        description: 'Search depth: "basic" for quick facts or "advanced" for comprehensive analysis',
      },
    },
    required: ['query'],
  },
};

const getDealsPipelineTool: FunctionDeclaration = {
  name: 'getDealsPipeline',
  description: 'Retrieve commercial deals, proposal stages, and monetary pipeline value.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      stage: {
        type: Type.STRING,
        description: 'Optional stage filter: PROPOSAL_DRAFTED, PROPOSAL_SENT, NEGOTIATING, WON, LOST',
      },
    },
  },
};

const createDealTool: FunctionDeclaration = {
  name: 'createDeal',
  description: 'Creates a commercial deal with structured proposal scope from an audited prospect/opportunity.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      prospectId: {
        type: Type.STRING,
        description: 'The opportunity/prospect ID to convert into a commercial deal.',
      },
      servicePackage: {
        type: Type.STRING,
        description: 'The service tier (e.g. "$99 Starter Evidence Audit", "$2,500 Full Funnel CRO Sprint", "$4,000 Monthly Retainer")',
      },
      proposedPrice: {
        type: Type.NUMBER,
        description: 'Proposed investment amount in USD.',
      },
    },
    required: ['prospectId'],
  },
};

const convertDealToProjectTool: FunctionDeclaration = {
  name: 'convertDealToProject',
  description: 'Converts an agreed commercial deal into an active client delivery project with initialized sprint phases and deliverables.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      dealId: {
        type: Type.STRING,
        description: 'The deal ID to convert into an active project.',
      },
    },
    required: ['dealId'],
  },
};

const getActiveProjectsTool: FunctionDeclaration = {
  name: 'getActiveProjects',
  description: 'Retrieve active client projects, current phase status, and pending deliverables.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      phase: {
        type: Type.STRING,
        description: 'Optional phase filter: ONBOARDING, PHASE_1, PHASE_2, PHASE_3, RETAINER, COMPLETED',
      },
    },
  },
};

const coWorkOnProjectTool: FunctionDeclaration = {
  name: 'coWorkOnProject',
  description: 'Collaborate and draft project execution assets, CRO audit teardowns, phase deliverables, or client updates for an active project.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      projectId: {
        type: Type.STRING,
        description: 'The project ID or client name to work on.',
      },
      instruction: {
        type: Type.STRING,
        description: 'The specific co-working instruction (e.g. "Draft the Phase 1 CRO audit teardown", "Break down checkout bottlenecks")',
      },
    },
    required: ['projectId', 'instruction'],
  },
};

const scoutTools = [
  {
    functionDeclarations: [
      auditWebsiteTool,
      searchWebTool,
      getPipelineStatsTool,
      controlAutonomousScannerTool,
      getRecentOpportunitiesTool,
      refineOutreachDraftTool,
      approveOpportunityTool,
      updateScannerSettingsTool,
      getDealsPipelineTool,
      createDealTool,
      convertDealToProjectTool,
      getActiveProjectsTool,
      coWorkOnProjectTool,
    ],
  },
];

const SYSTEM_INSTRUCTION = `You are ApexGrowth Intelligence, an autonomous AI partner and consultative lead scout for ApexGrowth Digital.
You chat completely freely, naturally, warmly, and intelligently with the agency operator in Telegram, exactly like a trusted human co-founder and senior growth consultant.

You have zero canned scripts or rigid templates. The user can chat with you about ANYTHING:
- E-commerce conversion rate optimization (CRO), UX bottlenecks, mobile speed, cart abandonment
- Agency strategy, consultative outreach methods, positioning, pricing, and client acquisition
- General brainstorming, marketing ideas, or open-ended casual conversation

You also have direct access to live operational tools for the agency:
- auditWebsite: runs real live HTTP latency, DOM analysis, and contact extraction on any URL
- getPipelineStats: fetches live database counts (total, drafted, approved, sent) and worker status
- controlAutonomousScanner: pauses or resumes the 24/7 background worker
- getRecentOpportunities: inspects recent leads in the pipeline
- refineOutreachDraft: rewrites and personalizes an outreach draft based on feedback
- approveOpportunity: marks a lead as approved in the database
- updateScannerSettings: updates scan cadence/interval minutes, paused state, or target niches

When the user asks you to perform an action (e.g. audit a website, check stats, change interval, pause/resume scanning, or polish copy), invoke your tools to get real data, then discuss the results naturally and conversationally in your reply.
Format your responses cleanly for Telegram using HTML formatting where appropriate (<b>bold</b>, <i>italic</i>, <code>code</code>, <blockquote>quote</blockquote>). Avoid Markdown asterisks **; use <b> instead. Keep responses engaging, concise, and clear.`;

// ---------------------------------------------------------------------------
// Scout NLP Service
// ---------------------------------------------------------------------------

export class ScoutNlpService {
  // Conversational sessions keyed by Telegram chatId to preserve multi-turn context
  private sessions = new Map<string | number, any>();

  /**
   * Gets or initializes a multi-turn chat session with Gemini for the given Telegram user.
   */
  private getOrCreateChatSession(chatId: string | number): any {
    const existing = this.sessions.get(chatId);
    if (existing) return existing;

    const ai = getGenAI();
    if (!ai) return null;

    try {
      const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: scoutTools,
          temperature: 0.7,
        },
      });

      this.sessions.set(chatId, chat);
      return chat;
    } catch (err) {
      console.warn('[ScoutNLP] Error creating chat session with gemini-2.5-flash:', err);
      return null;
    }
  }

  /**
   * Handles natural language messages from Telegram.
   * Enables open, fluid, multi-turn conversation with real-time tool execution.
   */
  public async handleNaturalLanguageMessage(
    userText: string,
    chatId: string | number,
    token: string,
    settings: ScoutSettings
  ): Promise<void> {
    const chat = this.getOrCreateChatSession(chatId);

    if (!chat) {
      // Fallback if AI key is missing: direct message explaining key status
      await telegramScoutService.sendMessage(
        token,
        chatId,
        `👋 <b>ApexGrowth Intelligence</b>\n\nI'm ready to chat and scout leads! Please ensure <code>GEMINI_API_KEY</code> is active in your project settings so I can converse freely and run live tool intelligence.`
      );
      return;
    }

    try {
      // 1. Send the natural language message into the conversational session
      const response = await chat.sendMessage({ message: userText });

      // 2. Check if the model invoked any live tools
      if (response.functionCalls && response.functionCalls.length > 0) {
        const functionResponses: any[] = [];

        for (const call of response.functionCalls) {
          const { name, args } = call;
          console.log(`[ScoutNLP] Executing tool: ${name} with args:`, args);

          try {
            switch (name) {
              case 'auditWebsite': {
                let targetUrl = (args as any)?.url?.trim() || '';
                if (!/^https?:\/\//i.test(targetUrl)) {
                  targetUrl = `https://${targetUrl}`;
                }

                // Send a quick inline status message so the user knows it's actively inspecting the live site
                await telegramScoutService.sendMessage(
                  token,
                  chatId,
                  `⚡ <i>Inspecting live network latency, DOM checkout elements, and contact channels for ${telegramScoutService.escapeHtml(targetUrl)}...</i>`
                );

                const opp = await actionCenter.conductManualAudit(targetUrl, 'Telegram Operator');

                // Send the interactive opportunity card with Approve / Reject buttons
                await telegramScoutService.sendOpportunityAlert(opp, settings);

                functionResponses.push({
                  functionResponse: {
                    name,
                    response: {
                      success: true,
                      targetUrl,
                      prospectName: opp.prospectName,
                      businessName: opp.businessName,
                      opportunityScore: opp.opportunityScore,
                      evidenceCount: opp.evidence.length,
                      observations: opp.evidence.map((e) => `${e.category}: ${e.observation}`),
                      publicContacts: opp.publicContacts.map((c) => `${c.type}: ${c.value}`),
                      draftedOutreach: opp.outreachDraft,
                    },
                  },
                });
                break;
              }

              case 'searchWeb': {
                const query = (args as any)?.query?.trim();
                const searchDepth = (args as any)?.searchDepth === 'advanced' ? 'advanced' : 'basic';

                if (!query) {
                  functionResponses.push({
                    functionResponse: {
                      name,
                      response: { error: 'Search query is required' },
                    },
                  });
                  break;
                }

                await telegramScoutService.sendMessage(
                  token,
                  chatId,
                  `🔍 <i>Searching live web via Tavily AI for: "<b>${telegramScoutService.escapeHtml(query)}</b>"...</i>`
                );

                try {
                  const searchRes = await tavilySearchService.search(query, {
                    searchDepth,
                    maxResults: 4,
                    includeAnswer: true,
                  });

                  functionResponses.push({
                    functionResponse: {
                      name,
                      response: {
                        success: true,
                        query: searchRes.query,
                        aiSummary: searchRes.answer || undefined,
                        results: searchRes.results.map((r) => ({
                          title: r.title,
                          url: r.url,
                          snippet: r.content.slice(0, 350),
                        })),
                      },
                    },
                  });
                } catch (searchErr: any) {
                  functionResponses.push({
                    functionResponse: {
                      name,
                      response: {
                        success: false,
                        error: searchErr?.message || 'Tavily search failed. Please verify Tavily API Key in Admin Settings.',
                      },
                    },
                  });
                }
                break;
              }

              case 'getPipelineStats': {
                const stats = await dbService.getScoutStats();
                const currentSettings = await dbService.getScoutSettings();
                functionResponses.push({
                  functionResponse: {
                    name,
                    response: {
                      totalDiscovered: stats.total,
                      pendingReview: stats.drafted,
                      approved: stats.approved,
                      sentOutreach: stats.sent,
                      scannerEnabled: currentSettings.autonomousWorkerEnabled,
                      intervalMinutes: currentSettings.runIntervalMinutes,
                      lastRunAt: currentSettings.lastRunAt,
                    },
                  },
                });
                break;
              }

              case 'controlAutonomousScanner': {
                const enabled = Boolean((args as any)?.enabled);
                await dbService.updateScoutSettings({ autonomousWorkerEnabled: enabled });
                functionResponses.push({
                  functionResponse: {
                    name,
                    response: {
                      success: true,
                      autonomousScannerEnabled: enabled,
                      message: enabled ? 'Scanner resumed' : 'Scanner paused',
                    },
                  },
                });
                break;
              }

              case 'getRecentOpportunities': {
                const limit = Math.min((args as any)?.limit || 3, 10);
                const status = (args as any)?.status;
                const filter = status ? { status, limit } : { limit };
                const opps = await dbService.getOpportunities(filter);
                functionResponses.push({
                  functionResponse: {
                    name,
                    response: {
                      count: opps.length,
                      opportunities: opps.map((o) => ({
                        id: o.id,
                        businessName: o.businessName,
                        prospectName: o.prospectName,
                        websiteUrl: o.websiteUrl,
                        outreachStatus: o.outreachStatus,
                        opportunityScore: o.opportunityScore,
                        evidenceCount: o.evidence.length,
                        draftSnippet: o.refinedDraft || o.outreachDraft,
                      })),
                    },
                  },
                });
                break;
              }

              case 'refineOutreachDraft': {
                const instruction = (args as any)?.instruction || userText;
                let targetId = (args as any)?.opportunityId;
                let opp = targetId ? await dbService.getOpportunityById(targetId) : null;

                if (!opp) {
                  const drafted = await dbService.getOpportunities({ status: 'DRAFTED', limit: 1 });
                  opp = drafted.length > 0 ? drafted[0] : null;
                }

                if (!opp) {
                  functionResponses.push({
                    functionResponse: {
                      name,
                      response: {
                        error: 'No drafted opportunity found to refine. Ask user which website to audit first.',
                      },
                    },
                  });
                  break;
                }

                const refinedCopy = await intelligenceEngine.refineOutreachDraft(opp, instruction);
                const updated = await dbService.updateOpportunityRefinedDraft(opp.id, refinedCopy, instruction);

                // Send the refined card with an interactive Approve button directly in Telegram
                const refinedCard = `✨ <b>REFINED OUTREACH COPY</b>\n
Target: <b>${telegramScoutService.escapeHtml(updated.prospectName)}</b> (${telegramScoutService.escapeHtml(updated.businessName)})
Instruction: <i>"${telegramScoutService.escapeHtml(instruction)}"</i>\n
<blockquote>${telegramScoutService.escapeHtml(refinedCopy)}</blockquote>\n
<i>Tap Approve below to accept or let me know if you want any further adjustments:</i>`;

                await telegramScoutService.sendMessageWithApproveButton(token, chatId, refinedCard, updated.id);

                functionResponses.push({
                  functionResponse: {
                    name,
                    response: {
                      success: true,
                      opportunityId: updated.id,
                      prospectName: updated.prospectName,
                      refinedCopy,
                    },
                  },
                });
                break;
              }

              case 'approveOpportunity': {
                let targetId = (args as any)?.opportunityId;
                let opp = targetId ? await dbService.getOpportunityById(targetId) : null;

                if (!opp) {
                  const drafted = await dbService.getOpportunities({ status: 'DRAFTED', limit: 1 });
                  opp = drafted.length > 0 ? drafted[0] : null;
                }

                if (!opp) {
                  functionResponses.push({
                    functionResponse: {
                      name,
                      response: { error: 'No drafted opportunity found to approve.' },
                    },
                  });
                  break;
                }

                await dbService.updateOpportunityStatus(opp.id, 'APPROVED');
                functionResponses.push({
                  functionResponse: {
                    name,
                    response: {
                      success: true,
                      opportunityId: opp.id,
                      businessName: opp.businessName,
                      status: 'APPROVED',
                    },
                  },
                });
                break;
              }

              case 'updateScannerSettings': {
                const currentSettings = await dbService.getScoutSettings();
                const updates: any = {};
                if ((args as any)?.intervalMinutes !== undefined) {
                  updates.runIntervalMinutes = Number((args as any).intervalMinutes);
                }
                if ((args as any)?.enabled !== undefined) {
                  updates.autonomousWorkerEnabled = Boolean((args as any).enabled);
                }
                if ((args as any)?.addNiche && typeof (args as any).addNiche === 'string') {
                  const trimmed = (args as any).addNiche.trim();
                  if (trimmed && !currentSettings.targetNiches.includes(trimmed)) {
                    updates.targetNiches = [...currentSettings.targetNiches, trimmed];
                  }
                }
                if ((args as any)?.removeNiche && typeof (args as any).removeNiche === 'string') {
                  const trimmed = (args as any).removeNiche.trim().toLowerCase();
                  updates.targetNiches = currentSettings.targetNiches.filter((n) => n.toLowerCase() !== trimmed);
                }
                const updated = await dbService.updateScoutSettings(updates);
                functionResponses.push({
                  functionResponse: {
                    name,
                    response: {
                      success: true,
                      autonomousWorkerEnabled: updated.autonomousWorkerEnabled,
                      runIntervalMinutes: updated.runIntervalMinutes,
                      targetNiches: updated.targetNiches,
                    },
                  },
                });
                break;
              }

              case 'getDealsPipeline': {
                const { pipelineOperationsService } = await import('./pipelineOperationsService.js');
                const stage = (args as any)?.stage;
                const deals = await pipelineOperationsService.getDeals(stage);
                functionResponses.push({
                  functionResponse: {
                    name,
                    response: {
                      count: deals.length,
                      deals: deals.map((d) => ({
                        id: d.id,
                        clientName: d.clientName,
                        clientCompany: d.clientCompany,
                        servicePackage: d.servicePackage,
                        proposedPrice: d.proposedPrice,
                        stage: d.stage,
                        projectId: d.projectId,
                      })),
                    },
                  },
                });
                break;
              }

              case 'createDeal': {
                const { pipelineOperationsService } = await import('./pipelineOperationsService.js');
                const prospectId = (args as any)?.prospectId;
                const servicePackage = (args as any)?.servicePackage;
                const proposedPrice = (args as any)?.proposedPrice ? Number((args as any).proposedPrice) : undefined;
                const deal = await pipelineOperationsService.createDealFromProspect(prospectId, servicePackage, proposedPrice);
                functionResponses.push({
                  functionResponse: {
                    name,
                    response: {
                      success: true,
                      dealId: deal.id,
                      clientName: deal.clientName,
                      servicePackage: deal.servicePackage,
                      proposedPrice: deal.proposedPrice,
                      stage: deal.stage,
                      proposalDraft: deal.proposalDraft,
                    },
                  },
                });
                break;
              }

              case 'convertDealToProject': {
                const { pipelineOperationsService } = await import('./pipelineOperationsService.js');
                const dealId = (args as any)?.dealId;
                const project = await pipelineOperationsService.convertDealToActiveProject(dealId);
                functionResponses.push({
                  functionResponse: {
                    name,
                    response: {
                      success: true,
                      projectId: project.id,
                      clientName: project.clientName,
                      servicePackage: project.servicePackage,
                      agreedPrice: project.agreedPrice,
                      currentPhase: project.currentPhase,
                      deliverableCount: project.deliverables?.length || 0,
                    },
                  },
                });
                break;
              }

              case 'getActiveProjects': {
                const { pipelineOperationsService } = await import('./pipelineOperationsService.js');
                const phase = (args as any)?.phase;
                const projects = await pipelineOperationsService.getActiveProjects(phase);
                functionResponses.push({
                  functionResponse: {
                    name,
                    response: {
                      count: projects.length,
                      projects: projects.map((p) => ({
                        id: p.id,
                        clientName: p.clientName,
                        clientCompany: p.clientCompany,
                        servicePackage: p.servicePackage,
                        agreedPrice: p.agreedPrice,
                        currentPhase: p.currentPhase,
                        deliverables: p.deliverables?.map((d) => ({
                          id: d.id,
                          title: d.title,
                          status: d.status,
                          phase: d.phase,
                        })),
                      })),
                    },
                  },
                });
                break;
              }

              case 'coWorkOnProject': {
                const { pipelineOperationsService } = await import('./pipelineOperationsService.js');
                const projIdentifier = (args as any)?.projectId;
                const instruction = (args as any)?.instruction;

                // Match project ID or search by client name
                let project = await pipelineOperationsService.getProjectById(projIdentifier);
                if (!project) {
                  const all = await pipelineOperationsService.getActiveProjects();
                  project = all.find(
                    (p) =>
                      p.clientName.toLowerCase().includes(projIdentifier.toLowerCase()) ||
                      (p.clientCompany && p.clientCompany.toLowerCase().includes(projIdentifier.toLowerCase()))
                  ) || null;
                }

                if (!project) {
                  functionResponses.push({
                    functionResponse: {
                      name,
                      response: { error: `Project not found for identifier: ${projIdentifier}` },
                    },
                  });
                  break;
                }

                const result = await pipelineOperationsService.coWorkWithAi(project.id, instruction);
                functionResponses.push({
                  functionResponse: {
                    name,
                    response: {
                      success: true,
                      projectId: project.id,
                      clientName: project.clientName,
                      phase: project.currentPhase,
                      coWorkOutput: result.responseText,
                    },
                  },
                });
                break;
              }

              default:
                functionResponses.push({
                  functionResponse: {
                    name,
                    response: { error: `Tool ${name} not recognized` },
                  },
                });
            }
          } catch (toolErr: any) {
            console.error(`[ScoutNLP] Error executing ${name}:`, toolErr);
            functionResponses.push({
              functionResponse: {
                name,
                response: { error: toolErr?.message || String(toolErr) },
              },
            });
          }
        }

        // 3. Send tool results back to the conversational session so Gemini generates the final conversational response
        const followUpResponse = await chat.sendMessage({ message: functionResponses });
        const finalContent = followUpResponse?.text?.trim();
        if (finalContent) {
          await telegramScoutService.sendMessage(token, chatId, finalContent);
        }
      } else {
        // 4. Pure conversational dialogue (no tool required)
        const chatText = response?.text?.trim();
        if (chatText) {
          await telegramScoutService.sendMessage(token, chatId, chatText);
        }
      }
    } catch (err: any) {
      console.error('[ScoutNLP] Conversational chat loop error:', err);
      // Reset session if it got corrupted
      this.sessions.delete(chatId);

      await telegramScoutService.sendMessage(
        token,
        chatId,
        `I encountered a temporary connection glitch processing that. Could you say that again?`
      );
    }
  }

  /**
   * Clears a chat session if the user wants to start completely fresh.
   */
  public resetChatSession(chatId: string | number): void {
    this.sessions.delete(chatId);
  }
}

export const scoutNlpService = new ScoutNlpService();
