# PlainPath — Rollback and Hotfix Operational Flow

Use this document when a production issue requires an immediate response.

---

## Severity Classification

| Severity | Definition | Response time |
|---|---|---|
| P0 — Outage | All users cannot use any tool, or subscription purchases are failing for all users | Immediate (< 30 min) |
| P1 — Critical | A core tool (Analyze, Contract Review) is broken for > 50% of users | < 2 hours |
| P2 — High | A specific feature is broken for some users; subscription flow works | < 24 hours |
| P3 — Medium | A cosmetic issue or minor UX problem | Next release |

---

## P0 Response: Full Outage

### Step 1 — Identify scope (< 5 min)
- Check API deployment logs for error rate spike
- Check RevenueCat for purchase failures
- Check Clerk dashboard for auth failures
- Identify: is the problem in the API server, the frontend, or a third-party service?

### Step 2 — Communicate (< 10 min)
- Post internal status note so all team members know an incident is active
- Do not post public communications until root cause is known

### Step 3 — Attempt fast fix (< 20 min)
If the issue is a configuration error (wrong env var, allowlist misconfiguration, feature flag):
- Fix the environment variable or configuration in the deployment environment
- Restart the API server
- Re-run Block 1 of the smoke test checklist

If the issue is a code regression:
- Identify the commit that introduced the regression using `git log --oneline`
- Proceed to Step 4 (rollback) or Step 5 (hotfix)

### Step 4 — Rollback (if safe)
A rollback reverts the production deployment to the last known-good state.

```
# Find the last known-good commit
git --no-optional-locks log --oneline origin/main | head -20

# In the deployment environment: redeploy from the known-good commit
# (Platform-specific — use the Replit deployment rollback, or push the prior commit as a new commit)
```

Note: Never use `git reset --hard` on origin/main without coordination. Instead, create a revert commit:

This is a destructive git operation — create a Project Task to perform it if needed.

### Step 5 — Hotfix
If a rollback is not appropriate (e.g., the prior version had a worse problem):

1. Create a fix in the current codebase
2. Test locally
3. Push to GitHub origin/main
4. Verify CI build succeeds (check `.github/workflows/ios-testflight.yml` run)
5. Deploy the new build
6. Run the relevant section of the smoke test checklist

### Step 6 — Confirm resolution
- Run the full smoke test (document 05) after the fix is deployed
- Confirm resolution in RevenueCat, Clerk, and deployment logs
- Log the incident in `99-rejection-log.md` with: time, root cause, fix, time-to-resolution

---

## App Store Rollback (Binary)

Apple does not allow rolling back a live app to a prior binary once a version is released. The options are:

| Scenario | Action |
|---|---|
| Bug in latest version; prior version is acceptable | Submit the prior version's source code as a new version with a higher version number |
| Bug introduced in a config/API change, not the binary | Rollback the API server or configuration; no new binary required |
| Crash that Apple detects via their automated systems | App may be pulled; submit a fixed binary immediately |

**Important:** If Apple pulls the app due to crashes or policy violations, you will receive an email. Respond within 24 hours with a plan.

---

## API Server Rollback

The API server runs as a deployed Replit service. To rollback:
1. Use the Replit deployment history to redeploy a prior version
2. Or: revert the offending commit and push to trigger a new deployment

---

## Database Rollback

Database schema changes cannot be automatically rolled back. Before any schema change during stabilization (which requires special approval per Rule 4 in document 04):
- Create a migration script that can undo the change
- Test the rollback script in a non-production environment first

No schema changes are permitted during stabilization unless they are a fix for a verified production data issue.

---

## Third-Party Service Failures

| Service | Symptom | Action |
|---|---|---|
| OpenAI API down | Document analysis returns "analysis unavailable" error | Display user-friendly error; poll OpenAI status page; no code change needed |
| RevenueCat down | Purchase sheet does not appear or entitlements not syncing | Display "Please try again in a moment"; check dashboard.revenuecat.com/status |
| Clerk down | Sign-in fails | Display "Authentication is temporarily unavailable"; check status.clerk.com |
| Stripe down | Web purchase flow fails | Display "Payment processing is temporarily unavailable"; check status.stripe.com |

None of these scenarios require a code change or rollback. They resolve when the third-party service recovers.

---

*Document: 06 | Phase: Stabilization | Last updated: May 2026*
