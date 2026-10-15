import { describe, it, expect } from 'vitest';
import { ZodError } from 'zod';
import { 
  ReviewReportSchema, 
  ReviewReportJSONSchema 
} from '../src/types/index.js';

describe('Phase 5.1: Zod Schema Unit Tests', () => {
  const validCodeQuality = {
    file: 'src/index.ts',
    issues: [
      {
        line: 10,
        severity: 'high',
        category: 'security',
        description: 'Potential SQL injection risk',
        suggestion: 'Use parameterized queries',
      },
    ],
    overallScore: 75,
    summary: 'Good code with minor security note.',
  };

  const validTestCoverage = {
    file: 'src/index.ts',
    hasTests: true,
    testFiles: ['tests/index.test.ts'],
    untestedPaths: [],
    coverageEstimate: 85,
    summary: 'Tests cover main flows.',
  };

  const validRefactorings = {
    file: 'src/index.ts',
    suggestions: [
      {
        type: 'modernize',
        location: 'line 5',
        impact: 'medium',
        description: 'Use async/await instead of callbacks',
        before: 'fs.readFile(path, (err, data) => {})',
        after: 'await fs.promises.readFile(path)',
        benefits: 'Better readability',
      },
    ],
    summary: 'Modernization suggested.',
  };

  const validReport = {
    pullRequest: {
      owner: 'udacity',
      repo: 'cd14715-simple-todo-app',
      number: 1,
    },
    fileReviews: [
      {
        file: 'src/index.ts',
        codeQuality: validCodeQuality,
        testCoverage: validTestCoverage,
        refactorings: validRefactorings,
      },
    ],
    summary: {
      totalFiles: 1,
      overallScore: 80,
      criticalIssues: 0,
      highPriorityTests: 0,
      refactoringOpportunities: 1,
    },
    recommendations: [
      {
        priority: 'high',
        category: 'security',
        description: 'Fix SQL injection',
        files: ['src/index.ts'],
      },
    ],
    metadata: {
      analyzedAt: new Date().toISOString(),
      duration: 12.5,
      agentVersions: {
        'code-quality-analyzer': '1.0.0',
        'test-coverage-analyzer': '1.0.0',
        'refactoring-suggester': '1.0.0',
      },
    },
  };

  it('1. should successfully parse valid review report data without throwing', () => {
    const parsed = ReviewReportSchema.parse(validReport);
    expect(parsed).toBeDefined();
    expect(parsed.pullRequest.owner).toBe('udacity');
  });

  it('2. should throw ZodError when invalid data or missing fields are provided', () => {
    const invalidReport = {
      ...validReport,
      pullRequest: { owner: 'udacity' }, // missing repo and number fields
    };
    
    expect(() => ReviewReportSchema.parse(invalidReport)).toThrow(ZodError);
  });

  it('3. should handle edge cases such as empty arrays and boundary scores (0 and 100)', () => {
    const zeroScoreReport = {
      ...validReport,
      summary: { ...validReport.summary, overallScore: 0 },
      fileReviews: [],
      recommendations: [],
    };
    const maxScoreReport = {
      ...validReport,
      summary: { ...validReport.summary, overallScore: 100 },
    };

    expect(() => ReviewReportSchema.parse(zeroScoreReport)).not.toThrow();
    expect(() => ReviewReportSchema.parse(maxScoreReport)).not.toThrow();
  });

  it('4. should export valid JSON schema with correct required properties', () => {
    expect(ReviewReportJSONSchema).toBeDefined();
    expect(typeof ReviewReportJSONSchema).toBe('object');
    expect((ReviewReportJSONSchema as any).type).toBe('object');
    expect((ReviewReportJSONSchema as any).properties).toBeDefined();
  });
});