import { dbService } from '../dbService.js';
import { telegramScoutService } from './telegramScoutService.js';

export class TelegramPollingService {
  private isRunning = false;
  private offset = 0;
  private pollAbortController: AbortController | null = null;
  private currentToken: string | null = null;

  /**
   * Starts the continuous long polling service.
   * Outbound polling to api.telegram.org bypasses any ingress proxy or firewall restrictions.
   */
  public async start() {
    if (this.isRunning) {
      console.log('🤖 [TelegramPolling] Service already running.');
      return;
    }

    this.isRunning = true;
    console.log('🤖 [TelegramPolling] Initializing continuous Telegram polling service...');

    // Run polling loop asynchronously
    this.pollLoop().catch((err) => {
      console.error('❌ [TelegramPolling] Fatal error in polling loop:', err);
    });
  }

  /**
   * Stops the polling loop.
   */
  public stop() {
    this.isRunning = false;
    if (this.pollAbortController) {
      try {
        this.pollAbortController.abort();
      } catch {
        // ignore
      }
      this.pollAbortController = null;
    }
    console.log('⏸️ [TelegramPolling] Service stopped.');
  }

  /**
   * Continuous long-polling loop with exponential backoff on errors.
   */
  private async pollLoop() {
    let failureCount = 0;

    while (this.isRunning) {
      try {
        const settings = await dbService.getScoutSettings();
        const token = settings.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;

        if (!token) {
          // Wait 10 seconds and re-check if token was configured
          await this.delay(10000);
          continue;
        }

        // When token changes or on initial run, ensure webhook is cleared so getUpdates works
        if (this.currentToken !== token) {
          this.currentToken = token;
          console.log('🔗 [TelegramPolling] Resetting webhook to enable real-time long polling...');
          try {
            await fetch(`https://api.telegram.org/bot${token}/deleteWebhook?drop_pending_updates=false`);
            await telegramScoutService.syncBotCommands(token);
          } catch (e: any) {
            console.warn('[TelegramPolling] deleteWebhook warning:', e?.message || e);
          }
        }

        this.pollAbortController = new AbortController();
        const timeoutSeconds = 20;
        const fetchTimeout = setTimeout(() => {
          if (this.pollAbortController) {
            try {
              this.pollAbortController.abort();
            } catch {
              // ignore
            }
          }
        }, (timeoutSeconds + 10) * 1000);

        const url = `https://api.telegram.org/bot${token}/getUpdates?offset=${this.offset}&timeout=${timeoutSeconds}&allowed_updates=${encodeURIComponent(
          JSON.stringify(['message', 'callback_query'])
        )}`;

        const response = await fetch(url, {
          signal: this.pollAbortController.signal,
        });
        clearTimeout(fetchTimeout);

        if (!response.ok) {
          const errData: any = await response.json().catch(() => ({}));
          console.warn(`⚠️ [TelegramPolling] Telegram API returned HTTP ${response.status}:`, errData?.description || '');

          if (errData?.error_code === 409) {
            // Another webhook or polling instance is active - delete webhook and retry
            await fetch(`https://api.telegram.org/bot${token}/deleteWebhook?drop_pending_updates=false`).catch(() => {});
            await this.delay(3000);
          } else {
            failureCount++;
            const backoff = Math.min(failureCount * 2000, 15000);
            await this.delay(backoff);
          }
          continue;
        }

        const data: any = await response.json();
        failureCount = 0; // Reset consecutive failures on success

        if (data.ok && Array.isArray(data.result)) {
          for (const update of data.result) {
            this.offset = update.update_id + 1;
            try {
              // Process update immediately
              await telegramScoutService.handleWebhookUpdate(update);
            } catch (processErr: any) {
              console.warn('⚠️ [TelegramPolling] Error processing update:', processErr?.message || processErr);
            }
          }
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          // Normal timeout from long polling, immediately loop again
          continue;
        }
        failureCount++;
        console.warn(`⚠️ [TelegramPolling] Connection error (attempt ${failureCount}):`, err?.message || err);
        const backoff = Math.min(failureCount * 2000, 15000);
        await this.delay(backoff);
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const telegramPollingService = new TelegramPollingService();
