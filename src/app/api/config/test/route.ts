import { NextRequest, NextResponse } from 'next/server';
import { getConfig } from '../../../lib/config';
import { logger } from '../../../lib/logger';

const configLogger = logger;

export async function GET(req: NextRequest) {
  try {
    const config = getConfig();
    
    // Create a safe version of the config without sensitive data
    const safeConfig = {
      ...config,
      openai: {
        ...config.openai,
        apiKey: config.openai.apiKey ? '***' : undefined,
      },
      security: {
        ...config.security,
        jwtSecret: config.security.jwtSecret ? '***' : undefined,
        encryptionKey: config.security.encryptionKey ? '***' : undefined,
      },
    };

    configLogger.info('Configuration loaded successfully', {
      env: config.app.env,
      logLevel: config.logging.level,
    });

    return NextResponse.json({
      status: 'success',
      config: safeConfig,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    configLogger.error('Error loading configuration', { error });
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Failed to load configuration',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
} 