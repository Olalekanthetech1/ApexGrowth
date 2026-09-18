import { actionCenter } from './actionCenter.js';
import { dbService } from '../dbService.js';

export class BackgroundScoutWorker {
  private timer: NodeJS.Timeout | null = null;
  private isRunningCycle = false;

  /**
   * Starts the 24/7 background scheduler.
   */
  public start() {
    if (this.timer) {
      clearInterval(this.timer);
    }

    console.log('🤖 [BackgroundScoutWorker] Initializing 24/7 Autonomous Opportunity Scout worker...');

    // Run first check 15 seconds after server startup
    setTimeout(() => {
      this.checkAndRunCycle().catch((err) => {
        console.warn('⚠️ [BackgroundScoutWorker] Initial run notice:', err?.message || err);
      });
    }, 15000);

    // Re-check every 5 minutes to see if interval elapsed or settings changed
    this.timer = setInterval(() => {
      this.checkAndRunCycle().catch((err) => {
        console.warn('⚠️ [BackgroundScoutWorker] Periodic check notice:', err?.message || err);
      });
    }, 5 * 60 * 1000);
  }

  /**
   * Stops the background scheduler.
   */
  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('⏸️ [BackgroundScoutWorker] Autonomous worker stopped.');
    }
  }

  /**
   * Evaluates whether it is time to execute a new discovery cycle.
   */
  private async checkAndRunCycle() {
    if (this.isRunningCycle) {
      return;
    }

    try {
      const settings = await dbService.getScoutSettings();
      if (!settings.autonomousWorkerEnabled) {
        return;
      }

      const now = Date.now();
      const lastRun = settings.lastRunAt ? new Date(settings.lastRunAt).getTime() : 0;
      const intervalMs = (settings.runIntervalMinutes || 60) * 60 * 1000;

      // Check if enough time has passed since last run
      if (now - lastRun >= intervalMs) {
        console.log('🔄 [BackgroundScoutWorker] Triggering scheduled autonomous discovery cycle...');
        this.isRunningCycle = true;
        const result = await actionCenter.runDiscoveryCycle();
        console.log(
          `✅ [BackgroundScoutWorker] Cycle completed. Discovered: ${result.candidatesDiscovered}, New Opportunities: ${result.opportunitiesCreated}, Telegram Alerts: ${result.telegramAlertsDispatched}`
        );
      }
    } catch (err: any) {
      console.warn('⚠️ [BackgroundScoutWorker] Cycle error notice:', err?.message || err);
    } finally {
      this.isRunningCycle = false;
    }
  }

  /**
   * Triggers an immediate scout run on-demand.
   */
  public async triggerNow() {
    if (this.isRunningCycle) {
      throw new Error('A discovery cycle is currently in progress. Please wait a moment.');
    }
    this.isRunningCycle = true;
    try {
      return await actionCenter.runDiscoveryCycle();
    } finally {
      this.isRunningCycle = false;
    }
  }
}

export const backgroundScoutWorker = new BackgroundScoutWorker();
