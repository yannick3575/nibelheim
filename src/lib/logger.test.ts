import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger, reportError } from './logger';

describe('logger', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('logger.log', () => {
    it('should log messages (isDev is evaluated at module load)', () => {
      // isDev is determined at module load time, so we just test the function works
      logger.log('test message');
      // In test environment, NODE_ENV is usually 'test' which is not 'production'
      // so isDev should be true
      expect(console.log).toHaveBeenCalledWith('test message');
    });

    it('should log multiple arguments', () => {
      logger.log('message', { key: 'value' }, 123);
      expect(console.log).toHaveBeenCalledWith('message', { key: 'value' }, 123);
    });
  });

  describe('logger.error', () => {
    it('should always log errors', () => {
      logger.error('[test]', 'error message');
      expect(console.error).toHaveBeenCalledWith('[test]', 'error message');
    });

    it('should log error objects', () => {
      const error = new Error('test error');
      logger.error('Error occurred:', error);
      expect(console.error).toHaveBeenCalledWith('Error occurred:', error);
    });

    it('should log with tag format', () => {
      logger.error('[tech-watch]', 'Failed to fetch');
      expect(console.error).toHaveBeenCalledWith('[tech-watch]', 'Failed to fetch');
    });
  });

  describe('logger.warn', () => {
    it('should log warnings', () => {
      logger.warn('warning message');
      expect(console.warn).toHaveBeenCalledWith('warning message');
    });

    it('should log warnings with multiple arguments', () => {
      logger.warn('[api]', 'Deprecated endpoint', { path: '/old' });
      expect(console.warn).toHaveBeenCalledWith('[api]', 'Deprecated endpoint', { path: '/old' });
    });
  });

  describe('logger.info', () => {
    it('should log info messages', () => {
      logger.info('info message');
      expect(console.info).toHaveBeenCalledWith('info message');
    });

    it('should log info with multiple arguments', () => {
      logger.info('[startup]', 'Server initialized', { port: 3000 });
      expect(console.info).toHaveBeenCalledWith('[startup]', 'Server initialized', { port: 3000 });
    });
  });

  describe('reportError', () => {
    it('should log error with tag, message, and error object', () => {
      const error = new Error('test error');
      reportError('[test-tag]', 'test message', error);
      expect(console.error).toHaveBeenCalledWith('[test-tag]', 'test message', error);
    });

    it('should log without error object when not provided', () => {
      reportError('[test-tag]', 'test message');
      expect(console.error).toHaveBeenCalledWith('[test-tag]', 'test message');
    });

    it('should log with undefined error', () => {
      reportError('[test-tag]', 'test message', undefined);
      expect(console.error).toHaveBeenCalledWith('[test-tag]', 'test message');
    });

    it('should handle extra data parameter', () => {
      reportError('[test-tag]', 'test message', undefined, { key: 'value' });
      expect(console.error).toHaveBeenCalledWith('[test-tag]', 'test message');
    });

    it('should handle all parameters', () => {
      const error = new Error('test');
      reportError('[api]', 'Request failed', error, { userId: '123' });
      expect(console.error).toHaveBeenCalledWith('[api]', 'Request failed', error);
    });
  });
});
