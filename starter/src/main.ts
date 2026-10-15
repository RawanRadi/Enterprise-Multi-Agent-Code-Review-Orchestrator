/**
 * Main CLI Entry Point
 * 
 * Parses command-line arguments, validates authentication and configuration,
 * runs the code review orchestrator, and generates multi-format submission reports.
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { CodeReviewOrchestrator } from './orchestrator.js';
import { ReportGenerator } from './utils/report-generator.js';
import { formatError } from './utils/error-handler.js';
import { logger } from './utils/logger.js';

async function main() {
  // 1. Parse and validate Command-Line Arguments explicitly
  const args = process.argv.slice(2);
  const owner = args[0];
  const repo = args[1];
  const prArg = args[2];

  if (!owner || !repo || !prArg) {
    console.error('\n❌ Error: Missing required arguments.');
    console.error('Usage: npm run dev -- <owner> <repo> <prNumber>');
    console.error('Example: npm run dev -- udacity cd14715-simple-todo-app 1\n');
    process.exit(1);
  }

  const prNumber = parseInt(prArg, 10);

  // 2. Validate that prNumber is a valid positive integer
  if (isNaN(prNumber) || prNumber <= 0 || !Number.isInteger(prNumber)) {
    console.error(`\n❌ Error: Invalid Pull Request number "${prArg}". Must be a positive integer.\n`);
    process.exit(1);
  }

  // 3. Validate Authentication (Anthropic API Key or AWS Credentials)
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
  const hasAwsCreds = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

  if (!hasApiKey && !hasAwsCreds) {
    console.error('\n❌ Error: Authentication credentials not found.');
    console.error('Please configure either:');
    console.error('  - ANTHROPIC_API_KEY in your .env file');
    console.error('  - AWS credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION)\n');
    process.exit(1);
  }

  if (hasApiKey) {
    logger.info('Using Anthropic API Key authentication.');
  } else if (hasAwsCreds) {
    logger.info(`Using AWS Bedrock authentication (Region: ${process.env.AWS_REGION || 'default'}).`);
  }

  // 4. Validate Model Configuration
  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929';
  logger.info(`Using model: ${model}`);

  console.log(`\n🚀 Starting multi-agent code review for ${owner}/${repo} PR #${prNumber}...\n`);

  try {
    const orchestrator = new CodeReviewOrchestrator({ model });

    // 5. Run the review
    const report = await orchestrator.reviewPullRequest(owner, repo, prNumber);

// 6. Generate Reports with specific naming convention (Task 6.2)
    logger.info('Generating analysis reports...');

    const reportsDir = path.resolve('reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Naming convention: owner_repo_prNumber (e.g., udacity_cd14715-simple-todo-app_1)
    const baseFilename = `${owner}_${repo}_${prNumber}`;
    const jsonPath = path.join(reportsDir, `${baseFilename}.json`);
    const mdPath = path.join(reportsDir, `${baseFilename}.md`);
    const htmlPath = path.join(reportsDir, `${baseFilename}.html`);

    const jsonContent = JSON.stringify(report, null, 2);

    // Comprehensive Markdown Generator
    const generateMarkdown = (rep: any): string => {
      const { pullRequest, summary, fileReviews, recommendations, metadata } = rep;
      let md = `# Code Review Report\n\n`;
      md += `**Owner:** ${pullRequest.owner} | **Repo:** ${pullRequest.repo} | **PR:** #${pullRequest.number}\n\n`;
      
      md += `## Summary\n`;
      md += `- **Overall Score:** ${summary.overallScore}/100\n`;
      md += `- **Total Files Analyzed:** ${summary.totalFiles}\n`;
      md += `- **Critical Issues:** ${summary.criticalIssues}\n`;
      md += `- **High Priority Tests:** ${summary.highPriorityTests}\n`;
      md += `- **Refactoring Opportunities:** ${summary.refactoringOpportunities}\n\n`;

      md += `## File Reviews\n`;
      for (const review of fileReviews) {
        md += `### File: \`${review.file}\`\n`;
        md += `- **Code Quality Score:** ${review.codeQuality.overallScore}/100\n`;
        md += `- **Test Coverage Estimate:** ${review.testCoverage.coverageEstimate}%\n`;
        
        if (review.codeQuality.issues && review.codeQuality.issues.length > 0) {
          md += `\n**Code Quality Issues:**\n`;
          for (const issue of review.codeQuality.issues) {
            md += `  - Line ${issue.line} [${issue.severity.toUpperCase()} / ${issue.category}]: ${issue.suggestion || issue.description}\n`;
          }
        }
        md += `\n`;
      }

      if (recommendations && recommendations.length > 0) {
        md += `## Recommendations\n`;
        for (const rec of recommendations) {
          md += `- **[${rec.priority.toUpperCase()}] (${rec.category})**: ${rec.description}\n`;
        }
        md += `\n`;
      }

      md += `---\n*Generated at ${metadata.analyzedAt} in ${metadata.duration}s using multi-agent workflow.*\n`;
      return md;
    };

    const mdContent = generateMarkdown(report);

    // Enhanced HTML view formatting the JSON / Markdown cleanly
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Code Review Report - ${baseFilename}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 900px; margin: 40px auto; padding: 0 20px; background: #f9f9f9; }
    h1, h2, h3 { color: #2c3e50; }
    pre { background: #2d3748; color: #e2e8f0; padding: 15px; border-radius: 6px; overflow-x: auto; }
    .card { background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Code Review Report</h1>
    <p><strong>Owner:</strong> ${owner} | <strong>Repo:</strong> ${repo} | <strong>PR:</strong> #${prNumber}</p>
  </div>
  <div class="card">
    <h2>Full JSON Report</h2>
    <pre>${JSON.stringify(report, null, 2)}</pre>
  </div>
</body>
</html>`;

    fs.writeFileSync(jsonPath, jsonContent);
    fs.writeFileSync(mdPath, mdContent);
    fs.writeFileSync(htmlPath, htmlContent);

    console.log('\n✨ Code review completed successfully!');
    console.log(`📁 Generated reports saved for ${baseFilename}:`);
    console.log(`   - JSON:     ${jsonPath}`);
    console.log(`   - Markdown: ${mdPath}`);
    console.log(`   - HTML:     ${htmlPath}\n`);
  } catch (error) {
    console.error('\n❌ Code review execution failed:');
    console.error(formatError(error));
    process.exit(1);
  }
}

main();
