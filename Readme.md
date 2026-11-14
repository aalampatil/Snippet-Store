# Snippet Store

A personal code snippet manager for Android and iOS, built with Expo, React Native,
TypeScript, Express, and PostgreSQL. Save, search, and organize private snippets by
category across your devices.

- Email/password signup with email verification, sign-in, and password recovery.
- Private snippets and categories scoped to each account.
- Revocable seven-day sessions; native tokens stored with Expo SecureStore.
- In-app and browser account deletion.
- Search, categories, editing, clipboard, sharing, and dark/light themes.
- Render deployment configuration and CI checks.

There is no Google sign-in integration.

## Source layout

```text
server/
  src/app.ts                  Express app and middleware composition
  src/index.ts                Server lifecycle and cleanup
  src/config/                 Validated environment configuration
  src/db/                     PostgreSQL connection and Drizzle schema
  src/middlewares/            Authentication, errors, async handlers
  src/modules/auth/           API routes, browser pages, schemas, limits, services
  src/modules/categories/     Account-scoped category routes and service
  src/modules/snippets/       Account-scoped snippet routes and service
  src/utils/                  Shared validation utilities
  drizzle/                    Versioned SQL migrations and generated metadata
  test/                       Database integration and configuration tests
snippetstore/
  src/app/                    Expo route entry points and root layout
  src/screens/                Screen UI
  src/components/             Reusable UI and shared authentication form
  src/contexts/               Authentication and theme state
  src/services/               API client, secure session storage, data requests
  src/types/                  Shared domain types
  src/utils/                  Error handling and route helpers
  patches/                    Versioned dependency compatibility patches
  test/                       Dependency security regression tests
docs/                         Deployment and verification notes
render.yaml                   Render production infrastructure
.github/workflows/            CI checks
```

## Develop locally

Use Node.js 22.12 or later and Docker Desktop.

1. Copy `server/.env.example` to `server/.env`. Keep `CORS_ORIGIN=` empty for native apps. Local verification can be disabled with `REQUIRE_EMAIL_VERIFICATION=false`.
2. Copy `snippetstore/.env.example` to `snippetstore/.env`. Set `EXPO_PUBLIC_API_URL` to your computer's LAN URL for physical devices.
3. Start the database and API:

```powershell
cd server
npm ci
docker compose up -d
npm run db:migrate
npm run dev
```

4. Start Expo in another terminal:

```powershell
cd snippetstore
npm ci
npm start
```

SecureStore adds native code. Rebuild a development client after this change. For browser development, add the exact Expo origin (for example `http://localhost:8081`) to `CORS_ORIGIN` and use the same hostname for app and API.

To test verification/recovery locally, configure SMTP and set `REQUIRE_EMAIL_VERIFICATION=true`. `PUBLIC_API_URL` must be reachable by the browser opening the email.

## Verify

API, from `server`:

```powershell
npm run build
# Use a dedicated test database, never your application database.
$env:TEST_DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/snippetstore_test"
npm test
npm audit --omit=dev --audit-level=high
```

The integration suite applies migrations, sends email through a local test SMTP receiver, and checks verification, recovery, revocation, authorization, isolation, deletion, and rate limits. The test database name must end in `_test`.

App, from `snippetstore`:

```powershell
npx expo customize tsconfig.json
npx tsc --noEmit
npm run test:dependencies
npx expo install --check
npx expo export --platform android --platform ios
```

The URL-decoder dependency override and one-line CommonJS compatibility patch are intentional. `npm ci` applies the patch automatically; `test:dependencies` checks normal route queries and malformed encoding. Do not remove it until Expo Router includes the upstream decoder fix.

## API

Public:

| Endpoint | Purpose |
| --- | --- |
| `GET /health` | Process health |
| `GET /ready` | Database readiness |
| `POST /api/auth/register` | Create account; production returns 202 pending email verification |
| `POST /api/auth/login` | Sign in |
| `POST /api/auth/logout` | Revoke the current session |
| `POST /api/auth/forgot-password` | Request a password-reset email |
| `POST /api/auth/resend-verification` | Request a verification email |
| `GET/POST /api/auth/verify` | Browser confirmation page |
| `GET/POST /api/auth/reset` | Browser password-reset page |
| `GET/POST /api/auth/delete-account` | Browser account deletion with password confirmation |

Authenticated:

| Endpoint | Purpose |
| --- | --- |
| `GET /api/auth/me` | Current user |
| `DELETE /api/auth/account` | Delete account; body: `{ "password": "..." }` |
| `GET/POST /api/categories` | List/create own categories |
| `DELETE /api/categories/:id` | Delete own category |
| `GET/POST /api/snippets` | List/create own snippets |
| `GET/PUT/DELETE /api/snippets/:id` | Read/update/delete own snippet |

Native clients send `X-Client-Platform: native` on login and use `Authorization: Bearer <token>`. Browsers receive an HttpOnly cookie; credentials are never stored in browser local storage.

New passwords require 8–128 characters. Existing bcrypt passwords remain usable and are rehashed with scrypt on successful login.

## Production

Follow [production guide](docs/production.md) for Render configuration, required secrets, database migration precautions, Expo builds, and launch checks.

Production deployment, external email delivery, signed device builds, and store submissions require your accounts and configuration. Local tests and exported bundles do not replace those checks.

See [verification notes](docs/verification.md) for the completed checks and remaining dependency advisories.

## Community

Contributions to the app, API, documentation, and accessibility are welcome. Read
the [contributing guidelines](CONTRIBUTING.md) for setup, testing, and the pull
request process. All participants must follow the [code of conduct](CODE_OF_CONDUCT.md).

- [Report a bug or request a feature](https://github.com/aalampatil/Snippet-Store/issues/new/choose).
- [Report a security vulnerability privately](SECURITY.md).
- For setup and usage questions, read this README and the [production guide](docs/production.md),
  then open an issue with your environment and a sanitized description of the problem.

## License

Snippet Store is available under the [ISC License](LICENSE).
