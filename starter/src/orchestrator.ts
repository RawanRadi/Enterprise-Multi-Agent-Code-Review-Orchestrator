import { query } from '@anthropic-ai/claude-agent-sdk';
import { codeQualityAnalyzer, testCoverageAnalyzer, refactoringSuggester } from './agents/index.js';
import { orchestratorPrompt } from './prompts/orchestrator.prompt.js';
import { ReviewReportJSONSchema, ReviewReportSchema, ReviewReport } from './types/index.js';
import { mcpServersConfig } from './config/mcp.config.js';
import { withTimeout, ReviewError } from './utils/error-handler.js';

export interface OrchestratorOptions {
  model?: string;
  maxTurns?: number;
}

export class CodeReviewOrchestrator {
  private model: string;
  private maxTurns: number;

  constructor(options: OrchestratorOptions = {}) {
    this.model = options.model || process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929';
    this.maxTurns = options.maxTurns || 35;
  }

  async reviewPullRequest(owner: string, repo: string, prNumber: number): Promise<ReviewReport> {
    const startTime = Date.now();
    let rawReport: any = null;
    let assistantText = '';

    try {
      console.log(`🤖 Executing multi-agent analysis with MCP servers connected for ${owner}/${repo} PR #${prNumber}...`);
      
      const promptText = orchestratorPrompt
        .replace('{owner}', owner)
        .replace('{repo}', repo)
        .replace('{prNumber}', String(prNumber));

      console.log(`🔌 Initializing query stream and connecting MCP servers...`);

      // 10-minute timeout for thorough multi-agent execution with MCP tools
      await withTimeout(async () => {
        for await (const message of query({
          prompt: promptText,
          options: {
            model: this.model,
            maxTurns: this.maxTurns,
            mcpServers: mcpServersConfig,
            allowedTools: [
              'Task',
              'mcp__github__get_pull_request',
              'mcp__github__get_pull_request_files',
              'mcp__eslint__lint',
              'StructuredOutput'
            ],
            agents: {
              'code-quality-analyzer': codeQualityAnalyzer,
              'test-coverage-analyzer': testCoverageAnalyzer,
              'refactoring-suggester': refactoringSuggester
            },
            outputFormat: { type: 'json_schema', schema: ReviewReportJSONSchema }
          }
        })) {
          // Real-time progress logging
          console.log(`📥 [SDK Event] type: ${message.type}`);

          if (message.type === 'assistant') {
            for (const block of message.message.content) {
              if (block.type === 'text') {
                console.log(`💬 [Assistant]: ${block.text.substring(0, 120)}...`);
                assistantText += block.text;
              } else if (block.type === 'tool_use') {
                console.log(`🛠️ [Tool Use]: Executing '${block.name}' with input:`, JSON.stringify(block.input));
              }
            }
          } else if ((message as any).type === 'tool' || (message as any).type === 'tool_result') {
            console.log(`🔧 [Tool Result]: Received response from tool execution.`);
          } else {
            console.log(`📦 [Payload]:`, JSON.stringify(message).substring(0, 150));
          }

          if (message.type === 'result') {
            console.log(`✅ [Result Event] Received final result from query workflow.`);
            const structuredOutput = 
              (message as any).structured_output || 
              (message as any).structuredOutput || 
              (message as any).result || 
              (message as any).data;

            if (structuredOutput) {
              rawReport = typeof structuredOutput === 'string' ? JSON.parse(structuredOutput) : structuredOutput;
            }
          }
        }
      }, 600000); // 10 minutes

      if (!rawReport && assistantText) {
        try {
          const jsonMatch = assistantText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            rawReport = JSON.parse(jsonMatch[0]);
          }
        } catch (e) {
          // parse error handled below
        }
      }

      if (!rawReport) {
        throw new ReviewError('REVIEW_ERROR', `Agent execution completed without returning structured output for ${owner}/${repo} PR #${prNumber}.`);
      }

    } catch (error: any) {
      if (error instanceof ReviewError) {
        throw error;
      }
      throw new ReviewError('REVIEW_ERROR', `Multi-agent review failed for ${owner}/${repo} PR #${prNumber}: ${error.message}`);
    }

    // Validate agents' output against Zod schema
    const parseResult = ReviewReportSchema.safeParse(rawReport);

    if (!parseResult.success) {
      throw new ReviewError('VALIDATION_ERROR', `Agent output failed schema validation: ${JSON.stringify(parseResult.error.format())}`);
    }

    return parseResult.data;
  }
}