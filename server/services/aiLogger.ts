export interface AILogEntry {
  correlationId: string;
  timestamp: string;
  eventType: 'chat_request' | 'tool_execution' | 'lead_creation' | 'provider_error' | 'security_alert';
  provider: 'Gemini';
  model: string;
  latencyMs?: number;
  success: boolean;
  toolName?: string;
  role?: string;
  userEmail?: string;
  error?: string;
  metadata?: Record<string, any>;
}

export class AILogger {
  /**
   * Logs structured AI operational event without PII or credentials
   */
  log(entry: AILogEntry): void {
    const sanitizedMetadata = entry.metadata ? this.sanitize(entry.metadata) : undefined;
    const logPayload = {
      timestamp: entry.timestamp || new Date().toISOString(),
      correlationId: entry.correlationId,
      eventType: entry.eventType,
      provider: entry.provider,
      model: entry.model,
      latencyMs: entry.latencyMs,
      success: entry.success,
      toolName: entry.toolName,
      role: entry.role,
      userEmail: entry.userEmail,
      error: entry.error ? entry.error.substring(0, 200) : undefined,
      metadata: sanitizedMetadata,
    };

    if (entry.success) {
      console.log(`[AI LOG] [${logPayload.eventType}] tool=${logPayload.toolName || 'N/A'} role=${logPayload.role || 'public'} latency=${logPayload.latencyMs || 0}ms`);
    } else {
      console.warn(`[AI WARN] [${logPayload.eventType}] tool=${logPayload.toolName || 'N/A'} role=${logPayload.role || 'public'} error=${logPayload.error}`);
    }
  }

  private sanitize(data: Record<string, any>): Record<string, any> {
    const clean: Record<string, any> = {};
    for (const [key, val] of Object.entries(data)) {
      if (/key|secret|token|password|auth|authorization|cred/i.test(key)) {
        clean[key] = '[REDACTED]';
      } else if (typeof val === 'string') {
        clean[key] = val.substring(0, 150);
      } else {
        clean[key] = val;
      }
    }
    return clean;
  }
}

export const aiLogger = new AILogger();
