interface AppConfig {
  hubspot: {
    apiKey: string;
    baseUrl: string;
  };
  openai: {
    apiKey: string;
    model: string;
  };
  analytics: {
    cacheTTL: number;
    updateInterval: number;
  };
  logging: {
    level: string;
    filePath: string;
  };
}

const config: AppConfig = {
  hubspot: {
    apiKey: process.env.HUBSPOT_API_KEY || '',
    baseUrl: 'https://api.hubapi.com',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: 'gpt-4',
  },
  analytics: {
    cacheTTL: 5 * 60 * 1000, // 5 minutes
    updateInterval: 10 * 1000, // 10 seconds
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || 'logs/app.log',
  },
};

export function getConfig(): AppConfig {
  return config;
}

export function validateConfig(): string[] {
  const errors: string[] = [];
  
  if (!config.hubspot.apiKey) {
    errors.push('HUBSPOT_API_KEY is not configured');
  }
  
  if (!config.openai.apiKey) {
    errors.push('OPENAI_API_KEY is not configured');
  }
  
  return errors;
}

export default config; 