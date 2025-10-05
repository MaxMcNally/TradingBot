import { TradingDatabase } from '../../src/database/tradingSchema';

/**
 * Service to monitor and automatically terminate trading sessions
 */
export class SessionMonitor {
  private static instance: SessionMonitor;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  private constructor() {}

  static getInstance(): SessionMonitor {
    if (!SessionMonitor.instance) {
      SessionMonitor.instance = new SessionMonitor();
    }
    return SessionMonitor.instance;
  }

  /**
   * Start monitoring sessions
   */
  start(): void {
    if (this.isRunning) {
      console.log('Session monitor is already running');
      return;
    }

    console.log('Starting session monitor...');
    this.isRunning = true;
    
    // Check every minute for sessions that need to be terminated
    this.intervalId = setInterval(async () => {
      await this.checkAndTerminateSessions();
    }, 60000); // Check every minute

    // Also run immediately
    this.checkAndTerminateSessions();
  }

  /**
   * Stop monitoring sessions
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Session monitor stopped');
  }

  /**
   * Check for sessions that should be terminated and terminate them
   */
  private async checkAndTerminateSessions(): Promise<void> {
    try {
      const now = new Date().toISOString();
      
      // Get all active sessions with scheduled end times
      const sessionsToTerminate = await this.getSessionsToTerminate(now);
      
      if (sessionsToTerminate.length > 0) {
        console.log(`Found ${sessionsToTerminate.length} sessions to terminate`);
        
        for (const session of sessionsToTerminate) {
          await this.terminateSession(session.id!);
        }
      }
    } catch (error) {
      console.error('Error in session monitor:', error);
    }
  }

  /**
   * Get sessions that should be terminated based on their scheduled end time
   */
  private async getSessionsToTerminate(currentTime: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const db = require('../initDb').db;
      
      db.all(
        `SELECT * FROM trading_sessions 
         WHERE status = 'ACTIVE' 
         AND end_time IS NOT NULL 
         AND end_time <= ?`,
        [currentTime],
        (err: any, rows: any[]) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows || []);
          }
        }
      );
    });
  }

  /**
   * Terminate a specific session
   */
  private async terminateSession(sessionId: number): Promise<void> {
    try {
      console.log(`Terminating session ${sessionId} due to scheduled end time`);
      
      await TradingDatabase.updateTradingSession(sessionId, {
        end_time: new Date().toISOString(),
        status: 'COMPLETED'
      });
      
      console.log(`Session ${sessionId} terminated successfully`);
    } catch (error) {
      console.error(`Error terminating session ${sessionId}:`, error);
    }
  }

  /**
   * Get the current status of the monitor
   */
  getStatus(): { isRunning: boolean; intervalId: NodeJS.Timeout | null } {
    return {
      isRunning: this.isRunning,
      intervalId: this.intervalId
    };
  }
}

// Export singleton instance
export const sessionMonitor = SessionMonitor.getInstance();
