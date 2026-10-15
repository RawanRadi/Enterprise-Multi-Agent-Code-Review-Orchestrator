/**
 * Centralized Prompt Management Index
 * 
 * Exports all prompt templates for the orchestrator and specialized subagents.
 */

export { orchestratorPrompt } from './orchestrator.prompt.js';
export { codeQualityAnalyzerPrompt } from './code-quality-analyzer.prompt.js';
export { testCoverageAnalyzerPrompt } from './test-coverage-analyzer.prompt.js';
export { refactoringSuggesterPrompt } from './refactoring-suggester.prompt.js';