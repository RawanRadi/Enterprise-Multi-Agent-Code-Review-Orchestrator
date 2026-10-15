import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { CodeReviewOrchestrator } from './orchestrator.js';
import { ReportGenerator } from './utils/report-generator.js';
import { formatError } from './utils/error-handler.js';

async function main() {
  // 1. Validate environment credentials
  const hasApiKey = Boolean(process.env.ANTHROPIC_API_KEY);
  const hasAwsCreds = Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

  if (!hasApiKey && !hasAwsCreds) {
    console.error('\n❌ Error: No authentication credentials found.');
    console.error('Please set either ANTHROPIC_API_KEY or AWS credentials in your .env file.\n');
    process.exit(1);
  }

  if (!process.env.GITHUB_TOKEN) {
    console.error('\n❌ Error: GitHub token not found.');
    console.error('Please set GITHUB_TOKEN in your .env file or shell environment.');
    console.error('Example: GITHUB_TOKEN=ghp_your_token_here\n');
    process.exit(1);
  }

  // 2. Parse and validate CLI arguments
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.error('Usage: npm run dev -- <owner> <repo> <prNumber>');
    console.error('Example: npm run dev -- udacity cd14715-simple-todo-app 1');
    process.exit(1);
  }

  const [owner, repo, prArg] = args as [string, string, string];
  const prNumber = Number(prArg);

  if (isNaN(prNumber) || prNumber <= 0 || !Number.isInteger(prNumber)) {
    console.error(`❌ Error: Invalid PR number "${prArg}". Must be a positive integer.`);
    process.exit(1);
  }

  console.log(`\n🚀 Starting multi-agent code review for ${owner}/${repo} PR #${prNumber}...\n`);

  try {
    const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929';
    const orchestrator = new CodeReviewOrchestrator({ model });

    const startTime = Date.now();
    const report = await orchestrator.reviewPullRequest(owner, repo, prNumber);

    // 3. Generate reports using ReportGenerator
    const reportsDir = path.resolve('reports');
    fs.mkdirSync(reportsDir, { recursive: true });

    const baseFilename = `${owner}_${repo}_${prNumber}`;
    const generator = new ReportGenerator();

    const jsonContent = generator.generateJSONReport(report);
    const mdContent = generator.generateMarkdownReport(report);
    const htmlContent = generator.generateHTMLReport(report);

    // Save exactly the 3 PR-specific report files
    fs.writeFileSync(path.join(reportsDir, `${baseFilename}.json`), jsonContent);
    fs.writeFileSync(path.join(reportsDir, `${baseFilename}.md`), mdContent);
    fs.writeFileSync(path.join(reportsDir, `${baseFilename}.html`), htmlContent);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✨ Code review completed successfully in ${duration}s! Reports saved to /reports (${baseFilename}.*)\n`);
  } catch (error) {
    console.error('\n❌ Code review execution failed:');
    console.error(formatError(error));
    process.exit(1);
  }
}

main();