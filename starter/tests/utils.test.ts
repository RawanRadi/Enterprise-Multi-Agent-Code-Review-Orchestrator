import { describe, it, expect } from 'vitest';
import { withRetry, withTimeout, formatError, ReviewError } from '../src/utils/error-handler.js';
import { RateLimiter } from '../src/utils/rate-limiter.js';

describe('Utility Functions & Error Handling', () => {
  describe('withRetry', () => {
    it('succeeds after a transient failure', async () => {
      let attempts = 0;
      const result = await withRetry(async () => {
        attempts++;
        if (attempts < 2) {
          throw new Error('Temporary glitch');
        }
        return 'success';
      }, 3, 10); // 3 max retries, 10ms delay

      expect(result).toBe('success');
      expect(attempts).toBe(2);
    });

    it('throws the error if max retries are exceeded', async () => {
      let attempts = 0;
      await expect(
        withRetry(async () => {
          attempts++;
          throw new Error('Persistent failure');
        }, 2, 10)
      ).rejects.toThrow('Persistent failure');
      
      expect(attempts).toBe(2);
    });
  });

  describe('withTimeout', () => {
    it('resolves successfully if execution completes within time', async () => {
      const result = await withTimeout(async () => {
        return 'quick task';
      }, 1000);

      expect(result).toBe('quick task');
    });

    it('rejects with ReviewError if execution exceeds timeout limit', async () => {
      await expect(
        withTimeout(async () => {
          return new Promise((resolve) => setTimeout(resolve, 100));
        }, 10) // 10ms timeout
      ).rejects.toBeInstanceOf(ReviewError);
    });
  });

  describe('RateLimiter', () => {
    it('allows requests that are within the configured token limits', () => {
      const limiter = new RateLimiter({
        maxRequestsPerMinute: 10,
        maxTokensPerMinute: 5000,
        maxConcurrent: 2,
      });

      expect(limiter.canProceed(500)).toBe(true);
    });
  });

  describe('formatError', () => {
    it('correctly formats standard Error instances', () => {
      const err = new Error('Database connection failed');
      const formatted = formatError(err);
      expect(formatted).toContain('Database connection failed');
    });

    it('handles non-Error objects/strings gracefully', () => {
      const formatted = formatError('Unknown failure string');
      expect(formatted).toContain('Unknown failure string');
    });
  });
});
//npm run dev -- udacity cd14715-simple-todo-app 1
