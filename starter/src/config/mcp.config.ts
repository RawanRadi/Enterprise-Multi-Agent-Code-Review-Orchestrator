export const mcpServersConfig = {
  /**
   * GitHub MCP Server
   * Provides tools for GitHub API operations
   */
  github: {
    type: 'stdio' as const,
    command: 'npx',
    args: ['--offline', '-y', '@modelcontextprotocol/server-github'],
    env: {
      GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_TOKEN || '',
    },
  },

  /**
   * ESLint MCP Server
   * Provides tools for linting and code quality analysis
   */
  eslint: {
    type: 'stdio' as const,
    command: 'npx',
    args: ['--offline', '-y', '@eslint/mcp'],
    env: {},
  },
};