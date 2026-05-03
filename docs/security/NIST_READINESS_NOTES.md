# PlainPath — Internal Security & Privacy Readiness Notes
### Using NIST Frameworks as a Design Reference (Not a Compliance Claim)

**Document status:** Internal use only — pre-launch reference  
**Last updated:** May 2026  
**Owner:** Founders / Engineering  

> This document uses NIST frameworks as a structured design checklist. PlainPath does not claim NIST certification or compliance of any kind. These notes are intended to guide engineering decisions and surface gaps before and after launch.

---

## 1. NIST Cybersecurity Framework (CSF 2.0) Alignment

The NIST CSF organizes controls into six functions: Govern, Identify, Protect, Detect, Respond, Recover.

### Govern
| Control area | Current state | Notes |
|---|---|---|
| Security policy documented | Partial | This document covers intent; a formal policy doc should follow |
| Roles and responsibilities defined | Partial | Founders own all access; needs a formal RACI as team grows |
| Third-party risk inventory | Partial | Clerk (auth), Stripe (payments), OpenAI/Anthropic (AI), Supabase/Replit PG (data), Replit (infra) — inventory exists informally |
| Acceptable use defined | Not started | Add to internal handbook before first employee or contractor |

### Identify
| Control area | Current state | Notes |
|---|---|---|
| Asset inventory | Partial | Replit project, Supabase DB, object storage bucket, Clerk tenant, Stripe account |
| Data classification | Partial | User documents are sensitive; results are derived data; PII is minimal (name, email via Clerk) |
| Dependency mapping | Partial | AI model calls are the primary external dependency for document content |
| Vulnerability identification | Not started | No formal dependency audit scheduled; add pre-launch |

### Protect
| Control area | Current state | Notes |
|---|---|---|
| Encryption in transit | Yes | All traffic via TLS (Replit proxy, Clerk, Stripe, AI APIs) |
| Encryption at rest | Partial | Replit/Supabase provide at-rest encryption; verify object storage bucket encryption setting |
| Authentication | Yes | Clerk handles auth with session tokens; no passwords stored by PlainPath |
| Authorization / access control | Yes | Entitlement checks on API routes; admin flag gated separately in DB |
| MFA for admin accounts | Partial | Enforce MFA on Clerk dashboard, Replit, Supabase, and Stripe for all owner accounts |
| Least privilege | Partial | API server uses one DB connection string; separate read/write roles not yet implemented |
| Secrets management | Yes | Secrets stored in Replit environment variables; not committed to source |
| Input validation | Partial | File type and size checked on upload; text length capped; further sanitization should be audited |
| Dependency updates | Not started | No automated dependency audit (Dependabot or equivalent) configured |

### Detect
| Control area | Current state | Notes |
|---|---|---|
| Error monitoring | Partial | Vite/server logs in Replit; no external error tracking (Sentry etc.) yet |
| Anomaly detection | Not started | No alerting on unusual API call volume or failed auth spikes |
| Audit logging | Partial | Analysis runs stored with user ID and timestamp; no separate security audit log |
| AI output monitoring | Not started | No pipeline to flag unusual or harmful AI outputs at scale |

### Respond
| Control area | Current state | Notes |
|---|---|---|
| Incident response plan | Partial | See Section 9 below for initial plan |
| Communication plan | Not started | No template for notifying users in the event of a breach |
| Breach notification obligations | Not started | Must comply with applicable state/federal requirements (e.g., state data breach notification laws) |

### Recover
| Control area | Current state | Notes |
|---|---|---|
| Database backups | Partial | Replit provides automated DB snapshots; verify retention period |
| Recovery runbook | Not started | Document how to restore from snapshot and re-deploy |
| Post-incident review process | Not started | Add to incident response plan |

---

## 2. NIST Privacy Framework (PF 1.0) Alignment

The NIST Privacy Framework organizes controls into: Identify-P, Govern-P, Control-P, Communicate-P, Protect-P.

### Identify-P — Know what data you have and why
| Area | Current state | Notes |
|---|---|---|
| Data inventory | Partial | User email and name (Clerk), subscription status (Stripe), document analysis results (DB), uploaded files (temporary object storage) |
| Purpose limitation | Yes | Documents are processed for analysis only; purpose is stated in Privacy Policy |
| Sensitive data categories | Partial | Users may upload documents containing medical, financial, or legal PII; this is user-controlled |
| Data flow mapping | Not started | Formal diagram of how document content flows: browser → API → AI provider → response → DB (results only) → user |

### Govern-P — Policies and accountability
| Area | Current state | Notes |
|---|---|---|
| Privacy policy published | Yes | Privacy policy live in both app and marketing site |
| Privacy policy covers AI processing | Partial | Confirm the AI provider clause explicitly states documents are not used for training |
| Internal privacy owner defined | Not started | Designate a responsible person before first external user |
| Vendor DPA / data agreements | Partial | Verify OpenAI/Anthropic DPAs are signed or terms confirm no-training policy |

### Control-P — Give users agency
| Area | Current state | Notes |
|---|---|---|
| Account deletion | Partial | Clerk account deletion available; verify cascading deletion of DB records and stored results |
| Data export | Not started | No self-serve export of user's analysis history; add to post-launch roadmap |
| Deletion request workflow | Partial | Support contact exists; manual deletion workflow needs to be documented and tested |
| Opt-out of data processing | Not applicable (core function) | Processing is the product; users opt in by using the service |

### Communicate-P — Be transparent
| Area | Current state | Notes |
|---|---|---|
| Privacy policy plain-language summary | Not started | Consider adding a short "what we collect / what we don't" plain summary above the full policy |
| AI output disclaimer | Yes | Legal-advice disclaimer shown in app UI |
| No-training claim accuracy | Partial | Verify with each AI provider that the current API usage tier does not feed training data |

### Protect-P — Security for privacy
(Covered under CSF Protect section above — the frameworks overlap here.)

---

## 3. NIST AI Risk Management Framework (AI RMF 1.0) Alignment

The NIST AI RMF organizes AI risk into four functions: Map, Measure, Manage, Govern.

### Map — Understand AI context and risk
| Area | Current state | Notes |
|---|---|---|
| AI use case documented | Yes | Document analysis, contract review — both clearly scoped |
| Intended users identified | Yes | Non-lawyers seeking plain-English explanations of documents |
| Known limitations documented | Partial | Legal-advice disclaimer in UI; hallucination risk is not explicitly surfaced to users |
| Prohibited uses defined | Not started | Add acceptable use section to Terms of Service (e.g., no using PlainPath output as a substitute for legal counsel in high-stakes situations) |
| AI provider selection rationale | Not started | Document why each AI provider was chosen and what alternatives were considered |

### Measure — Assess AI risk
| Area | Current state | Notes |
|---|---|---|
| Output accuracy monitoring | Not started | No systematic process to sample and review AI outputs for correctness |
| Hallucination / error rate baseline | Not started | No baseline established; high priority before broad marketing |
| Bias assessment | Not started | No review of whether analysis quality differs by document language, origin, or author |
| User feedback mechanism | Partial | No in-app "flag this result" or thumbs-down workflow |

### Manage — Reduce and respond to AI risk
| Area | Current state | Notes |
|---|---|---|
| Legal-advice disclaimer | Yes | Displayed in analysis results UI |
| Human review recommendation | Partial | Disclaimer encourages consulting a professional; could be more prominent |
| AI output confidence indicators | Not started | No confidence score or "review carefully" signal on uncertain outputs |
| Model version pinning | Partial | API calls use versioned model endpoints where possible; document which versions are in use |
| Fallback behavior on AI failure | Partial | Error states handled; no graceful degradation messaging for partial failures |

### Govern — AI governance and accountability
| Area | Current state | Notes |
|---|---|---|
| AI policy for the product | Not started | Write a brief internal AI use policy (model selection, output review, prohibited uses) |
| Change management for model updates | Not started | Document process for evaluating impact when upgrading or switching AI models |
| Incident process for harmful AI output | Not started | Define what constitutes a harmful output and what the response is |
| Third-party AI provider audit rights | Not started | Review provider terms for audit or transparency provisions |

---

## 4. Launch-Ready Controls

These are the minimum controls that should be verified before public launch or Apple App Store submission.

- [x] TLS enforced on all endpoints
- [x] Authentication required for all analysis endpoints
- [x] Entitlement / subscription gating enforced server-side
- [x] Admin access gated by separate flag (not just subscription tier)
- [x] Legal-advice disclaimer shown on all AI output pages
- [x] Privacy policy live and accessible from app and marketing site
- [x] Secrets stored in environment variables, not source code
- [x] File upload type and size validation in place
- [ ] MFA enforced on all owner accounts (Replit, Clerk, Supabase, Stripe)
- [ ] Object storage bucket encryption at rest verified
- [ ] AI provider DPA or no-training confirmation documented
- [ ] Account deletion cascade (Clerk → DB records → stored files) tested end-to-end
- [ ] Incident response contact / process documented (see Section 9)
- [ ] Privacy policy reviewed against current data flows (especially AI provider clause)

---

## 5. Post-Launch Controls

Add these after launch, ordered by priority.

### High priority (within 30 days of launch)
- External error tracking (e.g., Sentry) with PII scrubbing configured
- Automated dependency vulnerability scanning
- Formal deletion request workflow tested with a real account
- In-app "flag this result" feedback mechanism
- Database role separation (read vs. write connections)

### Medium priority (within 90 days)
- Data flow diagram (browser → API → AI provider → DB)
- Plain-language privacy summary on Privacy page
- AI output accuracy sampling process (review 10–20 outputs per week)
- User-facing data export (analysis history download)
- Anomaly alerting on unusual API volume or auth failures
- Vendor DPA documentation folder

### Lower priority (within 6 months)
- Formal written security policy
- Internal acceptable use policy for employees and contractors
- Penetration test or third-party security review
- AI policy document (model selection, change process, incident definition)
- Business continuity / disaster recovery runbook
- Tabletop incident response exercise

---

## 6. Incident Response Plan (Initial)

This is a minimal first-version plan. Expand before onboarding employees.

**What counts as a security incident:**
- Unauthorized access to user data (documents, results, account info)
- Exposure of environment secrets or API keys
- Breach of a third-party provider holding PlainPath user data
- AI model returning harmful, defamatory, or grossly incorrect output at scale
- Data loss (accidental deletion of user records or stored files)

**Immediate response steps:**
1. Contain — revoke exposed credentials, disable affected functionality if needed
2. Assess — determine scope: which users affected, what data, for how long
3. Preserve — capture logs before they rotate; do not alter evidence
4. Notify — if user data was exposed, prepare notification; review applicable breach notification laws (many US states require notice within 30–72 hours)
5. Remediate — patch the vulnerability, rotate all potentially affected secrets
6. Review — post-incident write-up: timeline, root cause, fixes applied, process changes

**Contact chain:**
- Primary: Founders (both)
- If AI provider involved: Contact provider's trust & safety / incident team
- If Clerk/Stripe/Supabase involved: Contact provider security team via their published channels
- Legal counsel: Engage before public notification if breach is significant

---

## 7. Public Claims We Should Avoid Until Verified

The following statements should not appear in marketing copy, App Store descriptions, press releases, or investor materials until the underlying controls are fully implemented and, where applicable, independently verified.

| Claim to avoid | Why |
|---|---|
| "NIST compliant" or "NIST certified" | NIST does not certify products; this claim has no meaning and could be misleading |
| "SOC 2 compliant" | Requires a formal audit by an accredited CPA firm; not currently in scope |
| "Bank-level security" | Vague and unverifiable; avoid unless specific controls are documented |
| "HIPAA compliant" | Not assessed; users may upload medical documents but no BAA is in place |
| "GDPR compliant" | Partial alignment only; formal DPA, data residency, and right-to-erasure workflows not fully implemented |
| "We never store your documents" | Documents may pass through object storage temporarily; this claim requires precise technical accuracy |
| "AI-powered with zero data retention" | AI providers may have their own retention windows; verify before making this claim |
| "Your data is never used to train AI" | Accurate only if confirmed by current provider tier/terms; must be verified per provider |
| "Enterprise-grade security" | Undefined term; do not use without a specific list of enterprise controls in place |
| "Audited" or "independently reviewed" | No third-party audit has been conducted |

---

## Appendix: Third-Party Providers and Data Exposure Summary

| Provider | What they receive | Data agreement status |
|---|---|---|
| Clerk | User email, name, auth sessions | Standard terms; review for DPA |
| Stripe | Payment info, subscription status | PCI DSS compliant; Stripe holds card data, not PlainPath |
| OpenAI / Anthropic | Document text submitted for analysis | Verify current API tier excludes training use |
| Replit | All source code, environment variables, DB | Infrastructure provider; review data handling terms |
| Supabase (or Replit PG) | All structured user data and analysis results | Verify at-rest encryption and backup policy |
| Object Storage (Replit) | Uploaded files (temporary) | Verify encryption and retention/deletion policy |

---

*This document should be reviewed and updated quarterly, or any time a significant change is made to data flows, AI providers, or authentication infrastructure.*
