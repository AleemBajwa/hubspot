interface Config {
  openai: {
    apiKey: string;
    modelName: string;
  };
  app: {
    env: string;
    apiUrl: string;
  };
  cache: {
    ttl: number;
    cleanupInterval: number;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  security: {
    jwtSecret: string;
    encryptionKey: string;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    filePath: string;
  };
}

function validateConfig(config: Partial<Config>): asserts config is Config {
  const required = {
    openai: ['apiKey', 'modelName'],
    app: ['env', 'apiUrl'],
    cache: ['ttl', 'cleanupInterval'],
    rateLimit: ['windowMs', 'maxRequests'],
    security: ['jwtSecret', 'encryptionKey'],
    logging: ['level', 'filePath'],
  };

  for (const [section, keys] of Object.entries(required)) {
    for (const key of keys) {
      if (!config[section as keyof Config]?.[key as keyof typeof config[typeof section]]) {
        throw new Error(`Missing required config: ${section}.${key}`);
      }
    }
  }
}

export const config: Config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    modelName: process.env.OPENAI_MODEL_NAME || 'gpt-4',
  },
  app: {
    env: process.env.NODE_ENV || 'development',
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  },
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '300000', 10),
    cleanupInterval: parseInt(process.env.CACHE_CLEANUP_INTERVAL || '60000', 10),
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  security: {
    jwtSecret: process.env.JWT_SECRET || 'development-secret',
    encryptionKey: process.env.ENCRYPTION_KEY || 'development-key',
  },
  logging: {
    level: (process.env.LOG_LEVEL || 'info') as Config['logging']['level'],
    filePath: process.env.LOG_FILE_PATH || 'logs/app.log',
  },
};

// Validate configuration on startup
validateConfig(config);

// Export a function to get config values
export function getConfig(): Config {
  return config;
}

// Export a function to get a specific config value
export function getConfigValue<T extends keyof Config>(
  section: T,
  key: keyof Config[T]
): Config[T][typeof key] {
  return config[section][key];
} 