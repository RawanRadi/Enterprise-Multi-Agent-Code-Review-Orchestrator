/**
 * Code Quality Analyzer Subagent Definition
 * 
 * Responsible for inspecting code for security vulnerabilities, performance 
 * anti-patterns, and maintainability issues using Claude Skills.
 */

import { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { codeQualityAnalyzerPrompt } from '../prompts/code-quality-analyzer.prompt.js';

export const codeQualityAnalyzer: AgentDefinition = {
  // Description used by the orchestrator to determine when to delegate tasks to this agent
  description: 'Analyzes code for security vulnerabilities, performance issues, and maintainability concerns. Uses Claude Skills for specialized review.',
  
  // Targeted prompt defining its role, process, and output schema adherence
  prompt: codeQualityAnalyzerPrompt,
  
  // Inherit model settings from the parent orchestrator
  model: 'inherit',
  
  // Restricted toolset: File inspection tools + Skill execution tool
  tools: ['Skill'],
};