import { getConfig } from './config';
import fs from 'fs';
import path from 'path';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  metadata?: Record<string, unknown>;
}

interface LoggerOptions {
  level?: LogLevel;
  filePath?: string;
}

class Logger {
  private level: LogLevel;
  private filePath: string;
  private logStream: fs.WriteStream | null;

  constructor(options: LoggerOptions = {}) {
    const config = getConfig();
    const configLevel = config.logging.level;
    this.level = options.level || (['debug', 'info', 'warn', 'error'].includes(configLevel) ? configLevel as LogLevel : 'info');
    this.filePath = options.filePath || config.logging.filePath;
    this.logStream = null;
    this.initializeLogStream();
  }

  private initializeLogStream(): void {
    try {
      const logDir = path.dirname(this.filePath);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      this.logStream = fs.createWriteStream(this.filePath, { flags: 'a' });
    } catch (error) {
      console.error('Failed to initialize log stream:', error);
      this.logStream = null;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  private formatLogEntry(level: LogLevel, message: string, metadata?: Record<string, unknown>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata
    };
  }

  private writeLog(entry: LogEntry): void {
    const logLine = JSON.stringify(entry) + '\n';
    
    if (this.logStream) {
      this.logStream.write(logLine);
    }
    
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[${entry.level.toUpperCase()}] ${entry.message}`, entry.metadata || '');
    }
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    if (this.shouldLog('debug')) {
      this.writeLog(this.formatLogEntry('debug', message, metadata));
  }
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    if (this.shouldLog('info')) {
      this.writeLog(this.formatLogEntry('info', message, metadata));
  }
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    if (this.shouldLog('warn')) {
      this.writeLog(this.formatLogEntry('warn', message, metadata));
  }
  }

  error(message: string, metadata?: Record<string, unknown>): void {
    if (this.shouldLog('error')) {
      this.writeLog(this.formatLogEntry('error', message, metadata));
  }
  }

  close(): void {
    if (this.logStream) {
      this.logStream.end();
      this.logStream = null;
    }
  }
}

export const logger = new Logger();

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