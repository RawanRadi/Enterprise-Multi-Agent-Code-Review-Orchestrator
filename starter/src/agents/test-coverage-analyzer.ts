/**
 * Test Coverage Analyzer Subagent Definition
 * 
 * Responsible for evaluating test completeness, identifying critical untested 
 * code paths, and proposing actionable test cases with meaningful assertions.
 */

import { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { testCoverageAnalyzerPrompt } from '../prompts/test-coverage-analyzer.prompt.js';

export const testCoverageAnalyzer: AgentDefinition = {
  // Clear description used by the orchestrator for task delegation
  description: 'Evaluates test completeness, identifies untested paths, and suggests specific actionable test cases with meaningful assertions.',
  
  // Targeted prompt defining its analytical process and schema output structure
  prompt: testCoverageAnalyzerPrompt,
  
  // Inherit the base model configuration from the orchestrator
  model: 'inherit',
  
  // Allowed tools for inspecting source code and test files
  tools: ['Read', 'Grep', 'Glob', 'Skill'],
};