# DevQA Copilot 🚀

> **Personal AI Assistant for Developers & QA Automation Engineers**  
> Turn unstructured Jira tickets, user stories, bug notes, API specs, and PR summaries into structured, actionable engineering and QA drafts with strong prompt injection defenses and local history privacy.

---

## 🌟 Key Features

* **15 Specialized Output Modes:**
  * Full DevQA Analysis (with Facts, Assumptions, Risks, AC, and DoD)
  * QA Test Cases (Structured Markdown table with unique `TC-001` IDs)
  * Acceptance Criteria (Given / When / Then)
  * Developer Implementation Checklist
  * Structured Bug Reports (with Suggested Severity & Priority)
  * Targeted Regression Test Plans
  * In-depth API Test Matrices
  * BDD Gherkin Feature Scenarios
  * Jira-Ready Ticket / Comment Drafts
  * Pull Request Review Checklists
  * Release Risk Assessments
  * QA Test Summaries & Sign-off Drafts
  * Security & Code Review Audit Checklists
  * Daily Work & Standup Summaries
  * Edge-Case & Boundary Analyzer
* **9 Source Input Types:** From raw Jira stories and bug notes to PR diff summaries and error logs.
* **Security & Secret Scanner:** Automatic pre-flight heuristics warn if API keys, tokens, or credentials are typed into prompts, and automatically skip local history persistence to protect sensitive credentials.
* **Prompt Injection Defense:** Strict XML boundaries (`<UNTRUSTED_USER_INPUT>`) and explicit instruction-override defense phrases ensure pasted untrusted content cannot hijack system prompts.
* **Local-First History Privacy:** All prompt history is persisted strictly in browser `localStorage` (`devqa_copilot_history_v1`). Zero server-side customer databases.
* **Server-Side LLM Execution:** OpenAI API keys are isolated to the server route (`/api/generate`). Zero client bundle key leakage.
* **Draft Generation Only:** Generates structured drafts for human review. No autonomous writes to Jira, GitHub, or production systems.
* **Request Hardening & Cancellation:** Native `AbortController` cancellation support with live elapsed timer, 1MB body size limit (413), and strict `application/json` enforcement (415).

---

## 🛠️ Technology Stack

* **Framework:** [Next.js](https://nextjs.org/) (App Router) + TypeScript (Strict Mode)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/) (Developer Dark Mode default with Light Mode support)
* **Icons:** [Lucide React](https://lucide.dev/)
* **AI Provider:** [OpenAI SDK](https://github.com/openai/openai-node) (Server-side route handler with built-in Mock Provider fallback)
* **Validation:** [Zod](https://zod.dev/)
* **Markdown Rendering:** `react-markdown` with `remark-gfm`
* **Testing:** Vitest with V8 coverage (Unit Tests) & Playwright (E2E Tests)

---

## 🚀 Getting Started Locally

### Prerequisites
* Node.js 18.17+ or 20+
* npm or pnpm

### 1. Clone & Install
```bash
git clone https://github.com/MS-Ali2009/devqa-copilot.git
cd devqa-copilot
npm install
```

### 2. Configure Environment Variables
Copy the template environment file:
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
# Server-side ONLY. Do not use NEXT_PUBLIC_
OPENAI_API_KEY=your_openai_api_key_here

# Optional model selection (default: gpt-4o-mini)
OPENAI_MODEL=gpt-4o-mini

# Optional: Force Mock Provider (true | false)
FORCE_MOCK_PROVIDER=false

# Server-side rate limit per minute per IP (default: 20)
RATE_LIMIT_PER_MINUTE=20
```

> 💡 **Offline / Free Testing Mode:** If `OPENAI_API_KEY` is omitted or `FORCE_MOCK_PROVIDER=true` is set, DevQA Copilot automatically runs in **Mock Provider** mode. You can test all 15 output modes locally without spending OpenAI API credits!

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Quality Gates

### TypeScript Typecheck
```bash
npm run typecheck
```

### Run Unit Tests & Coverage Gate (Vitest)
```bash
npm run test:coverage
```

### Run End-to-End Tests (Playwright)
```bash
npm run test:e2e
```

---

## 🛡️ Security, Privacy & Secret Isolation

1. **Server-Side Route Isolation:** All AI calls execute through `/api/generate`. The OpenAI API key is NEVER bundled in client-side JavaScript or accessible to the browser.
2. **Secret Redaction in Server Logs:** The application filters and redacts API keys, JWTs, and passwords before logging.
3. **Secret-Aware History Storage:** If high-confidence credentials are found in user input, saving to local history is skipped to prevent leaving plaintext secrets in the browser.
4. **Permanent Draft Disclaimer:** All generated outputs clearly state that content represents a preliminary draft requiring human review.
5. **Security Headers Enforced:** Modern headers configured via `vercel.json` including CSP, HSTS, X-Frame-Options DENY, COOP, and CORP.
6. **Detailed Deployment Security Runbook:** See [docs/deployment-security.md](docs/deployment-security.md) for the mandatory Vercel Dashboard protection checklist.

---

## 🚢 Deploying to Vercel

> [!IMPORTANT]
> Follow the complete security guide in [docs/deployment-security.md](docs/deployment-security.md).

### Quick Summary:
1. **GitHub Repository**: Maintain repository visibility as **Private**.
2. **Production Environment**: Set `OPENAI_API_KEY` in Vercel Production Environment Variables.
3. **Preview Environment**: Set `FORCE_MOCK_PROVIDER=true` for Preview environments so pull request previews never invoke live billable models.
4. **Deployment Protection**: In Vercel Project Settings &rarr; **Deployment Protection**, enable **Vercel Authentication** or **Password Protection** to prevent anonymous public access to your personal app.

---

## 📄 License
MIT © 2026 MS-Ali2009
