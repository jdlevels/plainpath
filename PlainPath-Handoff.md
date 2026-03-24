# PlainPath — Complete Project Handoff

**Date:** March 24, 2026  
**Project URL:** https://replit.com/@jdlevels/workspace  
**Status:** Feature-complete, tested, ready for deployment

---

## 1. What PlainPath Does

PlainPath turns confusing paperwork — PDFs, Word docs, or pasted text — into a structured, interactive action plan. Users upload or paste a document, the AI extracts every requirement, deadline, risk, and needed document, and the results are presented across six organized tabs with progress tracking.

**Core value proposition:** "PlainPath reads only — it never files, advises, or submits." It makes paperwork understandable without pretending to give legal or professional advice.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, Wouter routing, TailwindCSS, Radix UI, Framer Motion |
| Backend | Express 5, TypeScript |
| Database | PostgreSQL + Drizzle ORM |
| AI | OpenAI `gpt-5.2` via Replit AI Integrations (`@workspace/integrations-openai-ai-server`) |
| Monorepo | pnpm workspaces |
| File parsing | `pdf-parse` (text-based PDFs), `mammoth` (DOCX) |
| State | React Context (`AnalysisContext`) + TanStack Query |

---

## 3. Repository Structure

```
workspace/
├── artifacts/
│   ├── plainpath/                  ← React + Vite frontend
│   │   └── src/
│   │       ├── App.tsx             ← Router, providers, layout shell
│   │       ├── main.tsx            ← Entry point
│   │       ├── index.css           ← Global CSS, theme vars, print styles
│   │       ├── pages/
│   │       │   ├── Home.tsx        ← Landing page (FROZEN)
│   │       │   ├── Import.tsx      ← Upload/paste/demo page
│   │       │   ├── Analyze.tsx     ← 6-tab results page
│   │       │   └── not-found.tsx
│   │       ├── components/
│   │       │   ├── layout/
│   │       │   │   ├── Navbar.tsx
│   │       │   │   └── Footer.tsx
│   │       │   ├── shared/
│   │       │   │   ├── EvidenceTooltip.tsx
│   │       │   │   ├── ConfidenceBadge.tsx
│   │       │   │   └── PriorityBadge.tsx
│   │       │   └── ui/             ← shadcn/ui components
│   │       └── context/
│   │           └── AnalysisContext.tsx
│   │
│   └── api-server/                 ← Express 5 backend
│       └── src/
│           ├── index.ts            ← Server entry
│           ├── routes/
│           │   ├── index.ts        ← Route registration
│           │   └── documents/
│           │       └── index.ts    ← All document routes + runAnalysis()
│           └── lib/
│               ├── demoData.ts     ← 3 pre-analyzed demo documents
│               ├── types.ts        ← Shared TypeScript types
│               └── db.ts           ← Drizzle DB connection
```

---

## 4. Frontend Routes

| Path | Page | Notes |
|---|---|---|
| `/` | Home | Landing page — FROZEN. Do not change routing/structure/IA. |
| `/import` | Import | Upload, paste, or pick a demo |
| `/analyze` | Analyze | Results from user upload (reads from AnalysisContext) |
| `/analyze?demo=<id>` | Analyze | Results from pre-built demo (fetches from API) |

Demo IDs: `event-permit`, `school-enrollment`, `grant-application`

---

## 5. API Endpoints

All routes under `/api/documents/`:

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/documents/analyze` | Analyze pasted text body |
| `POST` | `/api/documents/upload` | Analyze uploaded file (PDF/DOCX/TXT, max 20 MB) |
| `GET` | `/api/documents/demo/:id` | Fetch pre-analyzed demo document |
| `POST` | `/api/documents/checklist` | Save checklist toggle (itemId, itemType, completed) |

### Request/Response — `POST /api/documents/analyze`
```json
// Request body
{ "text": "...", "title": "Optional title" }

// Response
{ "analysis": { ...DocumentAnalysis } }
```

### Request/Response — `POST /api/documents/upload`
```
Content-Type: multipart/form-data
Field: "document" (file)
```

---

## 6. Data Model — `DocumentAnalysis`

```typescript
interface DocumentAnalysis {
  id: string;
  title: string;
  summary: string;                  // 2-4 sentence plain-English summary
  documentType: string;
  overallConfidence: "high" | "medium" | "low";
  processedAt: string;              // ISO timestamp
  actionSteps: ActionStep[];
  requiredDocuments: RequiredDocument[];
  deadlines: Deadline[];
  followUpQuestions: FollowUpQuestion[];
  risks: Risk[];
}

interface ActionStep {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  category: string;
  completed: boolean;
  sourceEvidence: string;
  confidence: "high" | "medium" | "low";
}

interface RequiredDocument {
  id: string;
  name: string;
  description: string;
  required: boolean;
  obtained: boolean;
  sourceEvidence: string;
  confidence: "high" | "medium" | "low";
}

interface Deadline {
  id: string;
  title: string;
  date: string;
  description: string;
  isHard: boolean;                  // true = rejection/legal consequence
  sourceEvidence: string;
  confidence: "high" | "medium" | "low";
}

interface FollowUpQuestion {
  id: string;
  question: string;
  context: string;
  answered: boolean;
}

interface Risk {
  id: string;
  title: string;
  description: string;
  severity: "high" | "medium" | "low";
  sourceEvidence: string;
}
```

---

## 7. AI Integration

**File:** `artifacts/api-server/src/routes/documents/index.ts`

```typescript
const response = await openai.chat.completions.create({
  model: "gpt-5.2",
  max_completion_tokens: 8192,
  messages: [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user",   content: `Analyze the following document...\n\n${userMessage}` },
  ],
});
```

The system prompt instructs the model to return **only raw JSON** — no markdown, no code fences. The response is parsed with `JSON.parse()`. The model is told to extract 4–10 action steps, all required documents, every deadline (hard and soft), 2–5 follow-up questions, and 2–4 risks.

**Confidence scoring:**
- `high` — document explicitly states it
- `medium` — inferred from context
- `low` — uncertain or ambiguous

---

## 8. Analyze Page — 6 Tabs

**File:** `artifacts/plainpath/src/pages/Analyze.tsx`

| Tab ID | Label | Counts |
|---|---|---|
| `summary` | Overview | — |
| `missing` | What's Missing | Red badge: incomplete high-priority steps + missing required docs |
| `checklist` | Checklist | Total action steps |
| `documents` | Required Docs | Total required documents |
| `deadlines` | Deadlines | Total deadlines |
| `risks` | Risks & Notes | — |

**Checklist tab** is the default active tab on load.

**What's Missing tab** includes:
- "Next Best Action" spotlight card — the first incomplete high-priority action step
- Blocking action steps section
- Missing required documents section
- Hard deadlines section
- High-severity risks section
- Medium-priority pending items section

**Progress bar** = `(completed action steps + obtained docs) / (all action steps + all docs)`

---

## 9. Shared UI Components

### `EvidenceTooltip`
Shows an inline truncated italic quote with a Quote icon. On hover, a tooltip reveals the full source evidence text pulled from the original document.

### `ConfidenceBadge`
Displays a colored dot + label:
- Green dot + "Confirmed" → `confidence: "high"`
- Amber dot + "Needs review" → `confidence: "medium"`
- Red dot + "Uncertain" → `confidence: "low"`

### `PriorityBadge`
Bold uppercase pill with a colored border:
- Red border → `priority: "high"`
- Amber border → `priority: "medium"`
- Light border → `priority: "low"`

---

## 10. CSS Architecture

**File:** `artifacts/plainpath/src/index.css`

**Theme variables** (CSS custom properties):
```css
--background: #F8F7F4      /* off-white */
--foreground: #1C1C1C      /* charcoal */
--primary:    #4F7CAC      /* slate-blue */
```

**Priority bar utilities** (in `@layer utilities`):
```css
.priority-bar-high { border-left: 4px solid hsl(var(--destructive)); }
.priority-bar-med  { border-left: 4px solid #d97706; }
.priority-bar-low  { border-left: 4px solid hsl(var(--border)); }
```

**Print stylesheet** (`@media print`):
- `.no-print` hides navbar, tab bar, stat pills, and back buttons
- All tab panels are forced visible (`display: block !important`)
- Page breaks inserted between major sections
- Colors forced to print-friendly values

---

## 11. State Management

**`AnalysisContext`** (`artifacts/plainpath/src/context/AnalysisContext.tsx`) is the single source of truth for the current analysis result. It wraps the entire app.

Key methods:
- `setAnalysis(analysis)` — stores a fresh result (called after upload/paste or demo load)
- `updateActionStep(id, completed)` — toggles a checklist item
- `updateRequiredDoc(id, obtained)` — toggles a document as obtained
- `clearAnalysis()` — resets (called when navigating back to Import)

Checklist toggles are also fire-and-forget saved to the backend via `useUpdateChecklist()` (TanStack Query mutation).

---

## 12. Demo Documents

**File:** `artifacts/api-server/src/lib/demoData.ts`

Three pre-analyzed documents are baked in as static data (no AI call needed):

| ID | Title | Type |
|---|---|---|
| `event-permit` | City Event Permit Application | Government Permit |
| `school-enrollment` | Elementary School Enrollment Packet | School Enrollment |
| `grant-application` | Small Business Community Grant Application | Grant Application |

Each demo has: full `DocumentAnalysis` object with realistic action steps, required documents, deadlines, follow-up questions, and risks — all with `sourceEvidence` and `confidence` values.

---

## 13. File Upload Handling

- **Max file size:** 20 MB (enforced by multer)
- **Supported formats:** PDF (text-based only), DOCX, TXT
- **PDF parsing:** `pdf-parse` — extracts raw text. Scanned PDFs will produce empty or garbled text; the Import page shows an amber warning about this.
- **DOCX parsing:** `mammoth.extractRawText()` — strips formatting, extracts clean text.
- **TXT:** Read directly as UTF-8.

If extraction produces fewer than 50 characters of text, the API returns a 400 error with a clear message.

---

## 14. Design Guidelines

| Rule | Value |
|---|---|
| Background | `#F8F7F4` off-white |
| Text | `#1C1C1C` charcoal |
| Primary | `#4F7CAC` slate-blue |
| Font (headings) | `font-display` (Inter or system) |
| Tone | Premium calm SaaS — no hype, no emojis |
| AI naming | Never say "GPT", "AI-Powered", or "AI assistant" — say "PlainPath" |
| Advice disclaimer | "PlainPath reads only — it never files, advises, or submits" |
| Document families | 5 categories on Home page — FIXED, do not change |
| Demo cards | 3 on Home page — FIXED, do not change |

---

## 15. Frozen / Do-Not-Touch Rules

- **`Home.tsx`** — structure, routing, IA, document family cards, and demo shortcuts are frozen. Visual polish is fine; restructuring is not.
- **Route paths** — `/`, `/import`, `/analyze`, `/analyze?demo=<id>` are fixed.
- **Demo IDs** — `event-permit`, `school-enrollment`, `grant-application` are fixed.
- **Tab structure on Analyze** — 6 tabs in the specified order are fixed.

---

## 16. Running Locally

```bash
# Install dependencies
pnpm install

# Start all services (they run concurrently via Replit workflows)
# Frontend:  pnpm --filter @workspace/plainpath run dev
# Backend:   pnpm --filter @workspace/api-server run dev

# The frontend proxies /api/* requests to the API server automatically.
```

Environment variables required:
- `DATABASE_URL` — PostgreSQL connection string (set by Replit automatically)
- `OPENAI_API_KEY` — managed by Replit AI Integrations (set automatically when integration is active)
- `PORT` — set by Replit per artifact to avoid collisions

---

## 17. Deployment

The app is ready to publish via Replit's deployment system. Both the frontend (PlainPath web artifact) and API server run as separate services. The frontend's `BASE_URL` is set by the artifact config and used in Wouter's router base and all API calls.

To deploy: click **Publish** in the Replit workspace. The app will be available at a `.replit.app` domain.

---

## 18. Known Limitations / Future Work

| Item | Detail |
|---|---|
| Scanned PDFs | `pdf-parse` cannot OCR scanned images. The Import page warns users, but scanned files will fail gracefully with a 400 error. Future: integrate an OCR service. |
| Session persistence | Analysis results live in React Context — a page refresh loses them. Future: persist to PostgreSQL with a session token. |
| Follow-up questions | The UI shows questions but doesn't let users answer and re-analyze. Future: allow answers to refine the analysis. |
| Checklist sync | Checklist state is saved to the backend but not loaded back on refresh (because session isn't persisted). Future: connect to user accounts. |
| Auth | No authentication currently. Future: add Replit Auth for saved documents and history. |

---

*PlainPath — Making paperwork clear, actionable, and less stressful.*
