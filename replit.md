# PlainPath

A polished full-stack web app that turns confusing paperwork (PDFs, pasted text) into structured, actionable plans.

## Architecture

**Monorepo** managed by pnpm workspaces.

### Artifacts
- `artifacts/plainpath` — React + Vite frontend (port `$PORT`, preview path `/`)
- `artifacts/api-server` — Express 5 backend API (port `8080`)

### Shared Packages
- `lib/api-spec` — OpenAPI spec + orval codegen config
- `lib/api-client-react` — Auto-generated React Query hooks from OpenAPI spec
- `lib/api-zod` — Auto-generated Zod schemas from OpenAPI spec
- `lib/db` — Drizzle ORM + PostgreSQL schema
- `lib/integrations-openai-ai-server` — OpenAI AI integration (Replit-managed, no API key needed)

## Features

- **Landing page** — Hero section, feature grid, 3 demo document cards
- **Import page** — Paste text, PDF upload (simulated), 3 built-in demos
- **Analysis results** — Tabbed view: Summary, Checklist, Required Docs, Deadlines, Risks & Notes
- **Interactive checklist** — Check off action steps and required documents with progress bar
- **AI extraction** — Uses `gpt-5.2` to extract action steps, required documents, deadlines, risks, and follow-up questions
- **Confidence badges** — High/Medium/Low on every extracted item
- **Source evidence** — Tooltips showing the exact document excerpt that supports each extracted item
- **Priority badges** — High/Medium/Low on action steps
- **Print export** — `window.print()` for clean printable output
- **3 built-in demos** — event-permit, school-enrollment, grant-application with rich pre-analyzed data

## API Endpoints

All routes under `/api`:
- `GET /api/healthz` — Health check
- `POST /api/documents/analyze` — AI document analysis (body: `{ text, title? }`)
- `GET /api/documents/demo/:demoId` — Pre-analyzed demo (event-permit | school-enrollment | grant-application)
- `POST /api/documents/checklist` — Update checklist item status

## Key Files

- `lib/api-spec/openapi.yaml` — Full OpenAPI contract
- `artifacts/plainpath/src/App.tsx` — Frontend entry with routing
- `artifacts/plainpath/src/context/AnalysisContext.tsx` — Global analysis state
- `artifacts/plainpath/src/pages/Home.tsx` — Landing page
- `artifacts/plainpath/src/pages/Import.tsx` — Document import page
- `artifacts/plainpath/src/pages/Analyze.tsx` — Results page with all tabs
- `artifacts/api-server/src/routes/documents/index.ts` — Document analysis routes
- `artifacts/api-server/src/lib/demoData.ts` — 3 rich demo document analyses
- `artifacts/api-server/src/lib/types.ts` — TypeScript interfaces
- `lib/db/src/schema/documents.ts` — Drizzle schema for documents table

## Design

- Off-white backgrounds (`#F8F7F4`)
- Charcoal text (`#1C1C1C`)
- Slate-blue primary (`#4F7CAC`)
- Premium SaaS style with warm tones and high whitespace
- Framer Motion animations, Radix UI primitives, Tailwind CSS

## AI Integration

Uses Replit AI Integrations for OpenAI access (no API key required, billed to credits):
- Env vars auto-provisioned: `AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY`
- Model: `gpt-5.2`
- Returns structured JSON with all extraction fields

## Development

```bash
# Install packages
pnpm install

# Push DB schema
pnpm --filter @workspace/db run push

# Regenerate API client after openapi.yaml changes
pnpm --filter @workspace/api-spec run codegen
```

Workflows started automatically by Replit for `api-server` and `plainpath`.
