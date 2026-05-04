# PlainPath — Analyze Completion Flow: Final QA Checklist

**Phase 3I — Production Enablement and Real-Browser Verification**
**Build:** 2745 modules, 0 errors
**Parser QA:** 55/55 passing
**Flag:** `VITE_ANALYZE_COMPLETION_FLOW_ENABLED=true` (shared environment — dev + production)

---

## Environment Status

| Environment | Flag value | Flow enabled? |
|---|---|---|
| Local dev (Vite) | `true` (shared) | ✓ ON |
| Production build | `true` (shared) | ✓ ON |
| Replit deployment | `true` (shared) | ✓ ON |

Flag logic in `completionFlowConfig.ts`:
- Production: enabled only if `VITE_ANALYZE_COMPLETION_FLOW_ENABLED === "true"`
- Development: enabled unless `VITE_ANALYZE_COMPLETION_FLOW_ENABLED === "false"`
- Flag OFF → old Analyze UI, no persistence, no badges, no flash

---

## A. Sign-in / Access

- [ ] Sign in as a Pro or admin account (`yelevels@gmail.com` or `support@plainpathapp.com`)
- [ ] Confirm Analyze opens without a paywall modal or upgrade prompt
- [ ] Confirm Contract Review still opens without a paywall modal
- [ ] Confirm pricing page shows "PlainPath Pro" only — no Starter, Team, or annual tier references
- [ ] Confirm access mode (`ACCESS_MODE=internal_only`) does not block the test account

---

## B. Upload / Analyze

- [ ] Upload a real test document (PDF or DOCX, at least 3–5 pages for a meaningful packet)
- [ ] Confirm the document viewer loads and shows the document
- [ ] Confirm the Analyze result loads (all four mode tabs appear: Understand, Plan, Complete, Packet)
- [ ] Confirm the page header stays stationary while switching between modes (no scroll jump)
- [ ] Open the export dropdown (if present) — confirm no removed tools appear (no Document Builder, Template Builder, or similar deprecated tool names)

---

## C. Understand Mode

- [ ] Click the **Understand** mode tab — confirm it activates
- [ ] Open **Plain English** sub-tab — confirm plain-language summary loads
- [ ] Open **Source Sections** sub-tab — confirm the source breakdown panel loads consistently (no spinner stuck)
- [ ] Open **Overview** sub-tab — confirm content renders
- [ ] Open **Key Terms** sub-tab — confirm terms list renders
- [ ] Switch between sub-tabs rapidly — confirm no content flash or double-fetch

---

## D. Plan Mode

- [ ] Click the **Plan** mode tab — confirm it activates
- [ ] Confirm the Plan summary card appears above the sub-tabs with item counts
- [ ] Confirm sections include: Actions, Docs / Signatures, Deadlines, Risks, Questions
- [ ] Click **Details** on a plan card — confirm the drawer opens with full item detail
- [ ] In the drawer, confirm **Source Evidence** shows either a source-backed quote or a "manual review" fallback state (not blank)
- [ ] Click **Mark done** on a plan card — confirm the item updates immediately
- [ ] Confirm the progress count in the Complete mode badge updates after marking done

---

## E. Complete Mode

- [ ] Click the **Complete** mode tab — confirm it activates
- [ ] Confirm the **progress badge** (`done/total`) appears on the Complete tab button in the mode nav
- [ ] Confirm the badge is muted gray when progress < 100% and turns emerald when 100% complete
- [ ] Toggle several checkboxes — confirm progress updates immediately (no lag)
- [ ] Confirm **"Saved"** flash appears in emerald text for ~1.7 seconds after each toggle
- [ ] Confirm the label returns to the passive muted **"Progress saved on this device"** after the flash
- [ ] Click **Reset progress** — confirm a native confirmation dialog appears
  - Cancel — confirm no items are cleared
  - Confirm — confirm all items uncheck, progress returns to 0/total, saved label remains visible
- [ ] Confirm the reset does **not** trigger a "Saved" flash

---

## F. Packet Mode

- [ ] Click the **Packet** mode tab — confirm it activates
- [ ] Confirm the **progress badge** (`done/total`) appears on the Packet tab button — same count as Complete
- [ ] Confirm **Section C (Completed Items)** lists only checked items
- [ ] Confirm **Section D (Open Items)** lists only unchecked items
- [ ] Confirm the packet contains all major sections (cover, plain-English summary, actions, docs, deadlines, risks, questions, completed, open)
- [ ] Click **Details** on a packet row — confirm the drawer opens from Packet mode
- [ ] Click **Print / Save as PDF** — confirm the browser print preview opens

---

## G. Persistence (Cross-Session)

- [ ] Check 3–5 items in Complete mode
- [ ] Refresh the page (Cmd+R / F5)
- [ ] Confirm the previously checked items are still checked after refresh
- [ ] Confirm progress badge reflects the restored count
- [ ] Open a **different** document — confirm its progress starts at 0 (no carry-over from the first document)
- [ ] Navigate back to the **first document** — confirm its previous progress is restored
- [ ] Verify `localStorage` key format: open browser DevTools → Application → Local Storage → confirm keys use the pattern `plainpath_completion_<analysis-id>`
- [ ] Confirm no document text, source quotes, or uploaded file content is stored — only `Record<string, boolean>` values

---

## H. PDF / Print Output

- [ ] In Packet mode, click **Print / Save as PDF**
- [ ] Confirm the print preview opens with correct content
- [ ] Confirm the packet spans **more than one page** for a multi-section document
- [ ] Confirm the following do **NOT** appear in the print preview:
  - Mode nav buttons (Understand / Plan / Complete / Packet tabs)
  - Progress badges
  - "Saved" flash or saved-state label
  - "Reset progress" button
  - Item detail drawer
  - Page action buttons (Go to Complete, Go to Plan, Print button itself)
- [ ] Confirm the **packet header** (document title, date) appears once at the top
- [ ] Confirm section spacing and margins look clean (letter size, 0.75 in margins)
- [ ] Note: browser-injected URL and page number headers/footers are controlled by the OS print dialog — these can be disabled in the "More settings" or "Headers and footers" checkbox in the browser print dialog

---

## I. iOS / Native Caution

> These checks require an iOS device or simulator with the deployed app.

- [ ] On iOS Safari or WKWebView (Capacitor), open Complete mode and click **Reset progress**
- [ ] Confirm the native `confirm()` dialog appears with the expected message
- [ ] If `confirm()` does **not** appear or returns `true` silently: log this as a blocker → follow-up Phase 3J will replace `window.confirm()` with an inline two-button confirmation UI
- [ ] Confirm the "Saved" flash appears after toggling on iOS (no timing issue with `setTimeout`)
- [ ] Confirm `localStorage` persistence works across app backgrounding and foreground restore (not just page refresh)

---

## Code Verification (Automated)

| Check | Command | Expected |
|---|---|---|
| Vite production build | `cd artifacts/plainpath && pnpm build` | 2745 modules, 0 errors |
| Parser QA | `npx tsx src/lib/__tests__/completionParserQA.ts` | 55/55 passing |
| Removed-tool refs | `grep -rn "DocumentDraft\|TemplateBuilder\|ContractBuilder" src/pages/Analyze.tsx src/components/analyze/` | 0 results |
| Stale pricing strings | `grep -rn "Starter\|Team plan\|annual" src/pages/Analyze.tsx src/components/analyze/` | 0 results |

All four checks are currently passing as of Phase 3I.

---

## Protected Files — Confirmed Untouched

- Billing: no changes
- RevenueCat: no changes
- Stripe: no changes
- Native billing: no changes
- Auth: no changes
- Contract Review: no changes
- Homepage / Marketing: no changes
- Routes: no changes
- Database schema: no changes
- Parser logic (`completionParser.ts`): no changes
- Print CSS (`index.css` packet rules): no changes
- Removed-tool redirects: no changes

---

## Items Requiring Manual Testing in Real Browser

The following **cannot be verified by automated build or QA** and must be tested by Jeff:

1. **Sign-in and paywall** (Section A) — requires a Pro account and real auth session
2. **Document upload and analysis** (Section B) — requires the API server and AI analysis pipeline
3. **Source Sections panel** (Section C) — has historically had intermittent loading issues; confirm consistent
4. **"Saved" flash timing** (Section E) — visual timing, confirm ~1.7 s feels right and not too long
5. **Reset confirmation dialog on iOS** (Section I) — `window.confirm()` reliability in WKWebView is the primary iOS risk
6. **PDF print output** (Section H) — must be verified visually in the browser print dialog
7. **Persistence across app backgrounding** (Section G/I) — `localStorage` survives page refresh in browser, but native iOS app backgrounding behavior should be confirmed in the Capacitor shell

---

## Known Limitations

- `window.confirm()` in `handleResetProgress` may be suppressed in some WKWebView configurations on iOS. If this is confirmed as an issue, Phase 3J can replace it with an inline two-button confirmation row (no modal library needed, no layout change).
- The "Saved" flash timer is not cleared on component unmount. In practice Analyze is not unmounted while a timer could be pending, but a `useEffect` cleanup could be added for strict correctness.
- Demo documents (if any use `analysis.id = "demo-${demoId}"`) store progress under `plainpath_completion_demo-${demoId}`. This is correct behavior — demo progress persists across refreshes. If demos should not persist, a guard can be added to storage calls.
- Browser-injected print headers/footers (URL, date, page number) are controlled by the OS — not suppressible via CSS. Users can disable them in the browser print dialog.

---

## Recommendation

All automated checks pass. The completion flow is now enabled in all environments.

**Proceed to manual QA in the deployed browser**, then — if no blockers are found — proceed to App Store prep.

If `window.confirm()` fails on iOS, pause and run **Phase 3J** (inline reset confirmation UI) before submitting to App Store.
