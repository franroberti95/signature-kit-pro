/**
 * Logger utility that only logs in development mode
 * In production, logs are silenced (or can be sent to error tracking service)
 */

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';

class Logger {
  private shouldLog(level: LogLevel): boolean {
    // Always log errors, even in production (for debugging)
    if (level === 'error') return true;
    // Only log other levels in development
    return isDev;
  }

  log(...args: unknown[]): void {
    if (this.shouldLog('log')) {
      console.log(...args);
    }
  }

  info(...args: unknown[]): void {
    if (this.shouldLog('info')) {
      console.info(...args);
    }
  }

  warn(...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn(...args);
    }
  }

  error(...args: unknown[]): void {
    if (this.shouldLog('error')) {
      console.error(...args);
    }
    // TODO: In production, send to error tracking service (Sentry, etc.)
    // if (import.meta.env.PROD) {
    //   // Send to error tracking
    // }
  }

  debug(...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.debug(...args);
    }
  }

  /**
   * Group logs together (only in dev)
   */
  group(label: string, fn: () => void): void {
    if (isDev) {
      console.group(label);
      fn();
      console.groupEnd();
    } else {
      fn();
    }
  }

  /**
   * Log with a label (only in dev)
   */
  labeled(label: string, ...args: unknown[]): void {
    if (isDev) {
      console.log(`[${label}]`, ...args);
    }
  }
}

export const logger = new Logger();

