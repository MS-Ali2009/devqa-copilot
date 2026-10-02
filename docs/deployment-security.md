# DevQA Copilot: Deployment Security & Operations Guide

> **Document Status**: Production Operational Runbook  
> **Target Audience**: Repository Owner, DevOps, QA Lead, Security Reviewer  
> **Last Updated**: October 2026

---

## 1. Executive Summary & Security Model

DevQA Copilot is an AI-powered assistant engineered for developers and QA engineers to turn raw requirements, bugs, and PR notes into structured artifacts.

### Core Security Guarantees
1. **Server-Side AI Secrets**: OpenAI API keys (`OPENAI_API_KEY`) are handled strictly server-side inside Next.js Route Handlers (`/api/generate`). No API keys or tokens are ever bundled into client JavaScript, stored in `localStorage`, or exposed to browser environments.
2. **Local Artifact Isolation**: History and user data are retained solely within the user's browser `localStorage` under schema `v1`. No customer requirements or database state are stored on remote servers.
3. **Secret Scrubbing Before Storage**: If high-confidence secrets (API keys, JWTs, AWS credentials, database passwords) are detected in user input, the application explicitly warns the user and **skips saving to local history** to prevent persistent exposure.
4. **Environment Isolation**: Support for `FORCE_MOCK_PROVIDER=true` ensures that CI pipelines, Preview deployments, and local offline runs cannot inadvertently trigger billable OpenAI API calls.

---

## 2. Mandatory Vercel Deployment Checklist (Manual Actions)

> [!CAUTION]
> **No code change can enable Vercel project-level deployment protection for you.**  
> You must perform the following manual steps in the Vercel Dashboard to protect your application from anonymous public access and unbounded API billing.

### Step 1: Enable Deployment Protection (Vercel Dashboard)
1. Open the [Vercel Dashboard](https://vercel.com/dashboard) and select your **`devqa-copilot`** project.
2. Navigate to **Settings** &rarr; **Deployment Protection**.
3. Under **Vercel Authentication**:
   - Enable **Vercel Authentication** (available for team and hobby accounts).
   - This prevents anyone who is not authenticated with your Vercel account from accessing your Production and Preview deployment URLs.
4. *Alternative Fallback (if Vercel Authentication is unavailable on your plan)*:
   - Enable **Password Protection** under Deployment Protection and set a strong, unique shared password.
   - Do NOT share this password publicly or commit it to GitHub.

### Step 2: Configure Environment Variables by Deployment Target

In **Settings** &rarr; **Environment Variables**, configure each environment strictly as follows:

| Environment | Variable Name | Recommended Value | Notes |
| :--- | :--- | :--- | :--- |
| **Production** | `OPENAI_API_KEY` | `sk-proj-...` | Your private production OpenAI key. Never check "Preview" or "Development". |
| **Production** | `OPENAI_MODEL` | `gpt-4o-mini` | Default cost-efficient model. |
| **Production** | `FORCE_MOCK_PROVIDER` | `false` | Enables live AI generation in your authenticated production app. |
| **Preview** | `FORCE_MOCK_PROVIDER` | `true` | **CRITICAL**: Forces all PR and preview deployments to use zero-cost mock data. |
| **Preview** | `OPENAI_API_KEY` | *(leave blank)* | Never add live OpenAI keys to Preview environments. |
| **Development** | `FORCE_MOCK_PROVIDER` | `false` | Handled locally via `.env.local`. |

---

## 3. GitHub Repository Visibility & Secret Hygiene

- **Private Repository Policy**: Keep the `MS-Ali2009/devqa-copilot` repository **Private**. Even though the project uses an MIT license, keeping the repository private provides defense-in-depth against unauthorized traffic discovery and scraping of custom prompt rules.
- **Git Ignore Protection**: Verify that `.env`, `.env.local`, `.env.*.local`, `.next`, and `.vercel` are ignored by git.
- **Secret Scanning Pre-Flight**: CI automatically scans all commits with grep patterns to ensure no `sk-proj-` or `NEXT_PUBLIC_OPENAI_API_KEY` tokens exist anywhere in `src/`.
- **Rotations & Incidents**: If any OpenAI key is inadvertently logged or exposed:
  1. Revoke the key immediately in the [OpenAI API Keys Dashboard](https://platform.openai.com/api-keys).
  2. Generate a new key and update Vercel Production Environment Variables.
  3. Trigger a redeploy of the latest production deployment.

---

## 4. Serverless Rate Limiting Architecture

### Understanding the Serverless Model
Next.js route handlers on Vercel execute as isolated serverless micro-containers.
- The built-in `InMemoryRateLimiter` (`src/lib/security/rate-limiter.ts`) uses a sliding window per instance.
- It provides single-instance loop prevention and local development defense.
- However, multiple serverless instances do not share memory across parallel invocations or regions.

### Production Abuse Prevention Hierarchy
1. **Tier 1 (Primary)**: Vercel Deployment Protection / Authentication blocks all anonymous internet traffic at the edge before route handlers execute.
2. **Tier 2 (Payload Boundary)**: The `/api/generate` handler rejects payloads exceeding 1MB (HTTP 413), enforces `application/json` (HTTP 415), and bounds inputs to 15,000 characters.
3. **Tier 3 (Timeout & Cancel)**: 25-second server-side AbortController prevents lingering hanging executions.
4. **Tier 4 (Future Distributed Upstash Redis)**: If public multi-user access is ever desired, implement the `RateLimiterProvider` interface with Upstash Redis.

---

## 5. Security Headers Reference (`vercel.json`)

The following modern security headers are enforced globally on all routes:

```json
{
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self';",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin"
}
```

---

## 6. Pre-Flight Deployment Verification Checklist

Before considering any production deployment complete, verify:

- [ ] Vercel Authentication / Deployment Protection is verified active via an Incognito browser window (should prompt for Vercel login or password).
- [ ] Production build succeeds: `npm run build`
- [ ] TypeScript typecheck passes with zero errors: `npm run typecheck`
- [ ] Unit tests and coverage gates pass (≥70% on critical security modules): `npm run test:coverage`
- [ ] E2E integration test suite runs clean: `npm run test:e2e`
- [ ] Preview environment has `FORCE_MOCK_PROVIDER=true` set.
- [ ] OpenAI usage limits / monthly soft spend limits are configured in OpenAI platform settings ($5 - $20 cap recommended).
