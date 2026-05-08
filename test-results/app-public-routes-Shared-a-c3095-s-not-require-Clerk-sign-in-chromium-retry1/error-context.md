# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app-public-routes.spec.ts >> Shared analysis link (/app/shared/:token) >> invalid token — page does not require Clerk sign-in
- Location: e2e/app-public-routes.spec.ts:102:7

# Error details

```
Test timeout of 30000ms exceeded while setting up "page".
```

```
Error: apiRequestContext._wrapApiCall: ENOENT: no such file or directory, copyfile '/home/runner/workspace/test-results/.playwright-artifacts-10/traces/9fc3fed25051b4d7edde-b3912a6971b06c3ac2da-retry1.network' -> '/home/runner/workspace/test-results/.playwright-artifacts-10/traces/9fc3fed25051b4d7edde-b3912a6971b06c3ac2da-retry1-pwnetcopy-1.network'
```