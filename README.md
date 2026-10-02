# DevQA Copilot 🚀

> **Personal AI Assistant for Developers & QA Automation Engineers**  
> Turn unstructured Jira tickets, user stories, bug notes, API specs, and PR summaries into structured, actionable engineering and QA drafts with strong prompt injection defenses, cloud database synchronization, and local history fallback.

---

## 🌟 100% Free Modern Stack

DevQA Copilot is engineered to run on an entirely **free-tier, zero-cost production stack**:

| Layer | Provider | Free Tier Allowance | Card Needed? |
| :--- | :--- | :--- | :--- |
| **AI Inference** | [Groq Cloud](https://console.groq.com/) | 30 requests/min, 14,400 requests/day (`llama-3.3-70b-versatile`) | ❌ No |
| **Database** | [Supabase](https://supabase.com/) | 500MB PostgreSQL, 50,000 Monthly Active Users | ❌ No |
| **Hosting & CI** | [Vercel](https://vercel.com/) + GitHub Actions | Vercel Hobby (Unlimited personal traffic) + 2,000 CI mins/mo | ❌ No |
| **Authentication** | Built-in (bcryptjs + signed JWT in httpOnly cookie) | 7-day persistent session & role authorization | ❌ No |

---

## 🌟 Key Features

* **15 Specialized Output Modes:** Full DevQA Analysis, QA Test Cases, Acceptance Criteria, Developer Checklist, Bug Reports, Regression Plans, API Test Matrices, Gherkin Scenarios, Jira Drafts, PR Review Checklists, Release Risk, QA Test Summaries, Code Review Audits, Daily Standup Summaries, and Edge-Case Analyzers.
* **9 Source Input Types:** From raw Jira stories and bug notes to PR diff summaries and error logs.
* **100% Free AI with Groq:** Instant, ultra-low latency generation using Meta's flagship open model `llama-3.3-70b-versatile` via Groq SDK.
* **Cloud Database with Offline Fallback:** History syncs seamlessly to Supabase PostgreSQL when logged in, with automatic fallback to browser `localStorage` if offline or logged out.
* **Email & Password Authentication:** Built-in credentials authentication with bcrypt hashing (cost factor 10) and signed JWT tokens in secure `httpOnly` cookies.
* **Security & Secret Scanner:** Automatic pre-flight heuristics detect and warn if API keys, tokens, or credentials are typed into prompts, automatically skipping persistence to protect credentials.
* **Prompt Injection Defense:** Strict XML boundaries (`<UNTRUSTED_USER_INPUT>`) and explicit instruction-override defense phrases ensure pasted untrusted content cannot hijack system prompts.
* **Request Hardening & Cancellation:** Native `AbortController` cancellation support with live elapsed timer, 1MB body size limit (413), and strict `application/json` enforcement (415).

---

## 🛠️ Technology Stack

* **Framework:** [Next.js](https://nextjs.org/) 14 (App Router) + TypeScript (Strict Mode)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/) (Developer Dark Mode default with Light Mode support)
* **Database:** [Supabase](https://supabase.com/) (`@supabase/supabase-js`)
* **AI Provider:** [Groq SDK](https://console.groq.com/) (`groq-sdk`) with OpenAI SDK fallback option
* **Authentication:** `bcryptjs` + `jose` (Signed JWT session cookies)
* **Validation:** [Zod](https://zod.dev/)
* **Markdown Rendering:** `react-markdown` with `remark-gfm`
* **Testing:** Vitest with V8 coverage (46 Unit Tests) & Playwright (E2E Tests)

---

## 🚀 Step-by-Step Setup Guide

### 1. Prerequisites
* Node.js 18.17+ or 20+
* Free account at [Groq Console](https://console.groq.com/)
* Free account at [Supabase](https://supabase.com/)

---

### 2. Clone & Install
```bash
git clone https://github.com/MS-Ali2009/devqa-copilot.git
cd devqa-copilot
npm install
```

---

### 3. Setup Supabase Database
1. Go to [Supabase Dashboard](https://supabase.com/dashboard) and create a **New Project** (Free Tier).
2. Once created, click on **SQL Editor** in the left sidebar.
3. Click **New Query**, paste the contents of [`supabase/migrations/001_init.sql`](supabase/migrations/001_init.sql), and click **Run**:

```sql
create table if not exists devqa_history (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  input_text text not null,
  output_text text not null,
  input_type text,
  output_mode text,
  platform text,
  environment text,
  language text,
  created_at timestamptz default now()
);

create index if not exists idx_devqa_history_user_created
  on devqa_history (user_id, created_at desc);

create table if not exists devqa_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  role text default 'user',
  created_at timestamptz default now()
);

create index if not exists idx_devqa_users_email
  on devqa_users (email);
```

4. Go to **Project Settings** &rarr; **API**:
   - Copy **Project URL** (this is your `NEXT_PUBLIC_SUPABASE_URL`).
   - Under **Project API Keys**, copy the `service_role` key (this is your `SUPABASE_SERVICE_ROLE_KEY`).

---

### 4. Setup Groq API Key
1. Go to [Groq Console Keys](https://console.groq.com/keys).
2. Click **Create API Key**, name it `devqa-copilot`, and copy the generated key (`gsk_...`).

---

### 5. Generate Session Secret
Run this in your terminal to generate a secure 64-character random string:
```bash
openssl rand -base64 48
```

---

### 6. Configure Environment Variables
Copy the template file:
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
# AI Provider (100% Free Groq)
AI_PROVIDER=groq
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
FORCE_MOCK_PROVIDER=false

# Supabase Free Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Auth & Session
SESSION_SECRET=paste-your-generated-openssl-base64-secret-here
OWNER_EMAIL=your-primary-email@example.com

# Rate Limiter
RATE_LIMIT_PER_MINUTE=20
```

---

### 7. Run Locally
```bash
npm run dev
```
1. Open [http://localhost:3000](http://localhost:3000).
2. You will be redirected to `/login`.
3. Click **Create an account** or navigate to `/signup`.
4. Sign up using your `OWNER_EMAIL`. The first user account automatically receives the **Owner** role (`role='owner'`).
5. You are logged in and ready to generate artifacts!

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

## 🚢 Deploying to Vercel (100% Free)

1. Push your repository to your private GitHub:
   ```bash
   git push origin main
   ```
2. In the [Vercel Dashboard](https://vercel.com/), import `MS-Ali2009/devqa-copilot`.
3. Add the following **Environment Variables** in Vercel:

| Variable Name | Production Value | Preview Value | Purpose |
| :--- | :--- | :--- | :--- |
| `AI_PROVIDER` | `groq` | `groq` | Selects Groq AI engine |
| `GROQ_API_KEY` | `gsk_...` | *(omit or mock)* | Server-side Groq API key |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` | `llama-3.3-70b-versatile` | Model name |
| `FORCE_MOCK_PROVIDER` | `false` | `true` | Forces free mock output in PR preview builds |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xyz.supabase.co` | `https://xyz.supabase.co` | Supabase API endpoint |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | `eyJ...` | Server-side service key |
| `SESSION_SECRET` | *(64-char secret)* | *(64-char secret)* | Secret for signing JWT cookies |
| `OWNER_EMAIL` | `your-email@example.com` | `your-email@example.com` | Designates primary admin |

4. Deploy! Your app is now live, password/auth protected, and running on a 100% free stack.

---

## 📄 License
MIT © 2026 MS-Ali2009
