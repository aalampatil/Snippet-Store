# UI redesign verification — 2026-11-15

The Expo app now has a shared responsive workspace, refreshed authentication,
library, editor, detail, category, and account screens, coordinated dark/light
themes, and matching app icons. The API and authentication contracts are unchanged.

Checks completed for this change:

- App TypeScript check and both existing dependency regression tests passed.
- Web static export and Android/iOS Hermes production exports passed.
- Headless Chrome completed 19 UI checks with zero page errors. These used an
  intercepted, in-memory API to isolate the interface; they do not verify live
  email delivery, database persistence, or production authentication.
- Browser coverage included email validation, signup/verification feedback,
  password recovery, password visibility, sign-in/out, session restoration,
  both themes, grid/list views, search and empty results, category filtering,
  pagination beyond 30 snippets, snippet creation/editing/copying/deletion,
  category creation/colors/deletion, guarded account deletion, and API error/retry.
- Screenshots were reviewed at 320, 390, 768, and 1440 pixels. The responsive
  library had no document-level horizontal overflow at those widths.

Native production exports confirm that both platforms bundle successfully;
physical-device interaction, keyboard behavior, and accessibility still need
device testing. This change does not include a production deployment.

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
