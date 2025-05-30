import { getConfigValue } from './config';
import fs from 'fs';
import path from 'path';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private logFilePath: string;
  private logStream: fs.WriteStream | null = null;

  private constructor() {
    // Ensure the log level from config is a valid LogLevel
    const configLevel = getConfigValue('logging', 'level');
    this.logLevel = (['debug', 'info', 'warn', 'error'].includes(configLevel) 
      ? configLevel 
      : 'info') as LogLevel;
    this.logFilePath = getConfigValue('logging', 'filePath');
    this.initializeLogStream();
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private initializeLogStream(): void {
    try {
      // Ensure log directory exists
      const logDir = path.dirname(this.logFilePath);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      // Create or append to log file
      this.logStream = fs.createWriteStream(this.logFilePath, { flags: 'a' });
    } catch (error) {
      console.error('Failed to initialize log stream:', error);
      this.logStream = null;
    }
  }

  private getLogLevelValue(level: LogLevel): number {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };
    return levels[level];
  }

  private shouldLog(level: LogLevel): boolean {
    return this.getLogLevelValue(level) >= this.getLogLevelValue(this.logLevel);
  }

  private formatMessage(level: LogLevel, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaString = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaString}\n`;
  }

  private writeLog(level: LogLevel, message: string, meta?: any): void {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, meta);
    
    // Always log to console
    console.log(formattedMessage.trim());

    // Write to file if stream is available
    if (this.logStream) {
      this.logStream.write(formattedMessage);
    }
  }

  public debug(message: string, meta?: any): void {
    this.writeLog('debug', message, meta);
  }

  public info(message: string, meta?: any): void {
    this.writeLog('info', message, meta);
  }

  public warn(message: string, meta?: any): void {
    this.writeLog('warn', message, meta);
  }

  public error(message: string, meta?: any): void {
    this.writeLog('error', message, meta);
  }

  public async close(): Promise<void> {
    if (this.logStream) {
      return new Promise((resolve) => {
        this.logStream!.end(() => resolve());
      });
    }
  }
}

export const logger = Logger.getInstance();

// Export a function to create a child logger with context
export function createLogger(context: string) {
  return {
    debug: (message: string, meta?: any) => 
      logger.debug(`[${context}] ${message}`, meta),
    info: (message: string, meta?: any) => 
      logger.info(`[${context}] ${message}`, meta),
    warn: (message: string, meta?: any) => 
      logger.warn(`[${context}] ${message}`, meta),
    error: (message: string, meta?: any) => 
      logger.error(`[${context}] ${message}`, meta),
  };
} 