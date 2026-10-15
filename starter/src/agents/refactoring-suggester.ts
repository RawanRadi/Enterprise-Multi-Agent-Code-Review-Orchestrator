/**
 * Refactoring Suggester Subagent Definition
 * 
 * Responsible for identifying code architecture improvements, code modernization,
 * design pattern application, and clean code practices.
 */

import { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { refactoringSuggesterPrompt } from '../prompts/refactoring-suggester.prompt.js';

export const refactoringSuggester: AgentDefinition = {
  // Description used by the orchestrator to determine when to delegate refactoring tasks
  description: 'Identifies opportunities to improve code structure, modernize patterns, eliminate dead code, and apply clean design patterns.',
  
  // Targeted prompt defining its role and output structure adherence
  prompt: refactoringSuggesterPrompt,
  
  // Inherit model settings from the parent orchestrator
  model: 'inherit',
  
  // Restricted toolset: File inspection tools + Skill execution tool
  tools: ['Read', 'Grep', 'Glob', 'Skill'],
};