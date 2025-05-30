import '@testing-library/jest-dom';
import { logger } from '../lib/logger';

// Configure test environment
process.env.NODE_ENV = 'test';
process.env.OPENAI_API_KEY = 'test-key';
process.env.OPENAI_MODEL_NAME = 'gpt-4';

// Global test timeout
jest.setTimeout(30000);

// Suppress console output during tests
const originalConsole = { ...console };
beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
  console.info = jest.fn();
  console.debug = jest.fn();
});

afterAll(() => {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  console.info = originalConsole.info;
  console.debug = originalConsole.debug;
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global error handler
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled promise rejection in tests:', error);
  throw error;
});

// Extend expect matchers
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
}); 