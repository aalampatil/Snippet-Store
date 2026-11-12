# Release verification — 2026-11-12

The authentication implementation is verified locally. Production hosting, real external email delivery, signed mobile builds, and store submission still require account configuration.

## Checks completed

| Check | Result |
| --- | --- |
| API TypeScript build | Passed |
| PostgreSQL authentication and environment tests | 15 passed |
| App TypeScript check | Passed |
| Clean app lockfile install and postinstall patch | Passed |
| URL decoder regression tests | 2 passed |
| Expo SDK dependency compatibility check | Passed |
| Android Hermes production bundle export | Passed |
| iOS Hermes production bundle export | Passed |
| Web static export | Passed |
| HTTPS browser authentication flow in headless Chrome | Passed |
| Render Blueprint public JSON Schema validation | Passed |
| Server production dependency audit | 0 vulnerabilities |

The API tests use a separate PostgreSQL 17 database and an SMTP test receiver. They cover anonymous rejection, password validation, actual SMTP message generation, verification without GET consumption, token replay/expiry, cookie sessions, origin restrictions, per-account category/snippet isolation, logout revocation, recovery, deletion cascades, rate limits, and fail-closed production configuration.

The browser check used the exported app, the API, PostgreSQL, and an SMTP receiver over local HTTPS. It exercised signup, email verification, sign-in, session restoration after reload, private snippet creation/listing, logout, password recovery, and browser account deletion. No browser page errors were recorded. It caught and resolved a form-origin issue caused by the original referrer policy.

## Dependency audit findings

- Server runtime dependencies: no reported vulnerabilities.
- Server full dependency tree: four moderate findings in the Drizzle development-tool chain through an older esbuild dependency. Do not expose Drizzle Studio or development servers publicly.
- Expo full dependency tree: 13 findings (one low, ten moderate, two high) in build/configuration tooling. The high findings are Zod in the Expo CLI and its dependent CLI entry. They require a reviewed SDK/tooling upgrade; forcing npm's proposed major upgrades would mix incompatible Expo package versions.
- The vulnerable decoder used by Expo Router has been updated to upstream `decode-uri-component@0.5.1`. A one-line `query-string` patch preserves its CommonJS interface. Normal queries and malformed percent encoding are covered by regression tests. Keep the override, patch, and postinstall script together.

Audit counts describe the installed dependency trees on this date. Recheck at release time and review changes to the selected Expo SDK.

## Checks still required before launch

- Render platform-aware Blueprint validation and a healthy live deployment.
- Production database backup/restore verification and migration review for existing data.
- External email delivery through the real SMTP provider.
- Signed Android and iOS builds tested on physical devices, including SecureStore persistence and in-app deletion confirmation.
- Store privacy/support metadata, signing credentials, and review/submission.
- Review of the remaining Expo tooling advisories.

The GitHub Actions workflow is committed but has not run remotely in this session. It repeats the API tests, app type check, dependency regression tests, and native bundle exports on Node.js 22. The local environment used Windows with Node.js 25.9.

See [the production guide](production.md) for configuration and release steps.
