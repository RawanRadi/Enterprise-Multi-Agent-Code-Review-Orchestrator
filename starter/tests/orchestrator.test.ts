import { describe, it, expect } from 'vitest';
import { CodeReviewOrchestrator } from '../src/orchestrator.js';

describe('CodeReviewOrchestrator', () => {
  describe('Configuration', () => {
    it('should initialize with default options', () => {
      const orchestrator = new CodeReviewOrchestrator();
      expect(orchestrator).toBeDefined();
    });

    it('should accept custom model configuration', () => {
      const orchestrator = new CodeReviewOrchestrator({ model: 'claude-sonnet-4-5-20250929', maxTurns: 15 });
      expect(orchestrator).toBeDefined();
    });
  });

  describe('reviewPullRequest structure', () => {
    it('should be defined as a method on CodeReviewOrchestrator', () => {
      const orchestrator = new CodeReviewOrchestrator();
      expect(typeof orchestrator.reviewPullRequest).toBe('function');
    });
  });

  describe('Integration', () => {
    // These tests require actual API keys and should be skipped in CI
    it.skip('should review a real small PR', async () => {
      const orchestrator = new CodeReviewOrchestrator();
      const report = await orchestrator.reviewPullRequest('octocat', 'Hello-World', 1);
      expect(report).toBeDefined();
      expect(report.pullRequest.number).toBe(1);
    });
  });
});