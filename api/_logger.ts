/**
 * Logger utility for API routes (serverless functions)
 * Only logs in development mode
 * In production, errors can be sent to error tracking service
 */

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

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
    // if (process.env.NODE_ENV === 'production') {
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

  /**
   * Log API request (only in dev)
   */
  request(method: string, path: string, data?: unknown): void {
    if (isDev) {
      console.log(`[API] ${method} ${path}`, data ? { data } : '');
    }
  }

  /**
   * Log API response (only in dev)
   */
  response(method: string, path: string, status: number, data?: unknown): void {
    if (isDev) {
      const emoji = status >= 500 ? '❌' : status >= 400 ? '⚠️' : '✅';
      console.log(`${emoji} [API] ${method} ${path} → ${status}`, data ? { data } : '');
    }
  }
}

export const logger = new Logger();

