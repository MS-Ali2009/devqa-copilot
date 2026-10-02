# DevQA Copilot 🚀

> **Personal AI Assistant for Developers & QA Automation Engineers**  
> Turn unstructured Jira tickets, user stories, bug notes, API specs, and PR summaries into structured, actionable engineering and QA artifacts with strict security and local-first privacy.

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
* **Security & Secret Scanner:** Automatic pre-flight heuristics warn if API keys, tokens, or credentials are typed into prompts.
* **Prompt Injection Defense:** Strict XML boundaries (`<UNTRUSTED_USER_INPUT>`) ensuring pasted instructions cannot override agent system rules.
* **Local-First Privacy:** All prompt history is persisted strictly in browser `localStorage` (`devqa_copilot_history_v1`). Zero server-side databases.
* **Server-Side LLM Execution:** OpenAI API keys are isolated to the server route (`/api/generate`). Zero client bundle key leakage.
* **Zero Autonomous Writes (MVP):** Generates structured drafts only. No automated external writes to Jira, GitHub, or databases without human review.

---

## 🛠️ Technology Stack

* **Framework:** [Next.js](https://nextjs.org/) (App Router) + TypeScript (Strict Mode)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/) (Developer Dark Mode default with Light Mode support)
* **Icons:** [Lucide React](https://lucide.dev/)
* **AI Provider:** [OpenAI SDK](https://github.com/openai/openai-node) (Server-side route handler with built-in Mock Provider fallback)
* **Validation:** [Zod](https://zod.dev/)
* **Markdown Rendering:** `react-markdown` with `remark-gfm`
* **Testing:** Vitest (Unit Tests) & Playwright (E2E Tests)

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

# Server-side rate limit per minute per IP (default: 20)
RATE_LIMIT_PER_MINUTE=20
```

> 💡 **Offline / Free Testing Mode:** If `OPENAI_API_KEY` is left blank, DevQA Copilot automatically runs in **Mock Provider** mode. You can test all 15 output modes locally without spending OpenAI API credits!

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing

### Run Unit Tests (Vitest)
```bash
npm test
```

### Run End-to-End Tests (Playwright)
```bash
npm run test:e2e
```

---

## 🛡️ Security, Privacy & Secret Isolation

1. **Server-Side Route Isolation:** All AI calls go through `/api/generate`. The OpenAI API key is NEVER bundled in client-side JavaScript.
2. **Secret Redaction in Server Logs:** The application filters and redacts API keys, JWTs, and passwords from server console logs.
3. **In-Memory Rate Limiting:** IP-based sliding window rate limiter protects the generation endpoint from accidental loops or abuse.
4. **No Database Persistence:** User inputs are processed in-flight and not stored on the server. History is kept locally in browser `localStorage`.
5. **No NEXT_PUBLIC_ Keys:** Never prefix `OPENAI_API_KEY` with `NEXT_PUBLIC_`.

---

## 🚢 Deploying to Vercel

### Step 1: Push to Private GitHub Repository
```bash
git push -u origin main
```

### Step 2: Import into Vercel
1. Go to [Vercel Dashboard](https://vercel.com/new).
2. Click **Import** next to `MS-Ali2009/devqa-copilot`.
3. Keep Framework Preset as **Next.js**.

### Step 3: Configure Environment Variables in Vercel
Under **Environment Variables**:
* Key: `OPENAI_API_KEY`
* Value: `sk-proj-...`
* Environments: Select **Production**, **Preview**, and **Development**.

### Step 4: Enable Deployment Protection
1. In Vercel Project Settings &rarr; **Deployment Protection**.
2. Enable **Vercel Authentication** or **Password Protection** for Preview & Production deployments to prevent unauthorized public access to `/api/generate`.

---

## 📄 License
MIT © 2026 MS-Ali2009
