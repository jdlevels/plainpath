# PlainPath — Current Editing Targets

## Source of Truth

Both artifacts serve the same deployed domain (plainpathapp.com) under different path prefixes. They are **separate codebases** and must be edited independently.

---

## Artifact Map

| What | Artifact | Path prefix | File root |
|---|---|---|---|
| **Marketing homepage** | `artifacts/plainpath-marketing` | `/` | `src/pages/Home.tsx` |
| **Product web app + tools** | `artifacts/plainpath` | `/app/` | `src/pages/` |

---

## Rule: What belongs where

### `artifacts/plainpath-marketing` ONLY
- Marketing homepage (hero, sections, CTAs)
- Tool pill grid on the landing page
- Features / How It Works / Trust / Pricing sections
- Coming Soon cards on the marketing page
- Marketing copy changes
- Support / footer links on the marketing site
- App Store / waitlist badges

### `artifacts/plainpath` ONLY
- All tool routes: `/app/analyze`, `/app/redact`, `/app/trust-check`, `/app/contract-review`, `/app/build-contract`
- App-internal homepage (`/app/`)
- Auth / Sign In / Subscribe pages
- App navigation (Tools dropdown, My Analyses)
- Tool UI flows (upload, scan, review, redact, export)
- API integrations and tool logic

---

## User-visible URL structure

```
plainpathapp.com/           → artifacts/plainpath-marketing  (Home.tsx)
plainpathapp.com/app/       → artifacts/plainpath            (Home.tsx)
plainpathapp.com/app/redact → artifacts/plainpath            (pages/Redact.tsx)
plainpathapp.com/app/analyze → artifacts/plainpath           (pages/Analyze.tsx)
```

---

## Before every edit: state the target

Before editing any file, confirm:
1. Which artifact is the target
2. Which file path is being changed
3. Which deployed route is affected

---

## Non-target artifact warning

If a task is about the **marketing homepage**, **never edit** `artifacts/plainpath/src/pages/Home.tsx`.
If a task is about a **product tool**, **never edit** `artifacts/plainpath-marketing/src/pages/Home.tsx`.
