import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  // Activa el MCP server en /_next/mcp (Next.js 16+)
  experimental: {
    mcpServer: true,
  },
}

export default withSentryConfig(nextConfig, {
  // Sentry org/project (se leen de .env si están definidos)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Sube source maps solo en CI/build, no localmente
  silent: !process.env.CI,
  // Disable source maps upload if no auth token (dev environment)
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Reduce bundle size: tree-shake unused Sentry code
  disableLogger: true,
  // Automatically instrument server components, route handlers, etc.
  autoInstrumentServerFunctions: true,
})
