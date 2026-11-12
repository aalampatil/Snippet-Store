# Production release

The API is prepared for Render, and the Expo app targets Android and iOS. A purchased domain is optional: Render gives the API an HTTPS `onrender.com` address. Email confirmation and recovery pages live on that API URL.

## What you need to supply

| Item | Needed for |
| --- | --- |
| Render account connected to this GitHub repository | Hosting the API and PostgreSQL |
| Approval of the compute plans in `render.yaml` | The template creates a paid API and paid database |
| SMTP host, port, username, password, and verified sender address | Verification and password recovery |
| Expo account with access to the existing EAS project | Signed Android/iOS builds |
| Apple Developer and Google Play developer accounts | Distribution through both stores |
| Support contact, privacy policy URL, and store listing details | Release metadata and user support |

Set credentials in Render/EAS settings, not Git or chat. An SMTP provider may require a domain to verify a sender even though the API itself does not require a custom domain.

## Render deployment

The Blueprint is configured for one API instance and PostgreSQL in Singapore. Review both resource names and regions before applying it. If a resource with the same name already exists, inspect it before attaching the Blueprint. If you already have production services or a database, reuse their configuration deliberately rather than creating a parallel stack.

1. Commit and push the release changes, including `render.yaml`, to the intended Git branch.
2. In Render, create a Blueprint from this repository. Review the paid compute plans before applying.
3. Enter the SMTP secrets when prompted.
4. Apply the Blueprint and wait for the deployment to finish.
5. Confirm `GET https://<actual-api-host>/ready` returns 200.
6. Create a new account from a device and verify delivery through the real SMTP provider. Complete sign-in, snippet creation, recovery, logout, and account deletion.

The Blueprint uses:

| Setting | Value |
| --- | --- |
| Runtime | Node.js 22 |
| Root directory | `server` |
| Build | `npm ci --include=dev && npm run build` |
| Pre-deploy | `npm run db:migrate` |
| Start | `npm start` |
| Health check | `/ready` |
| Database | Private Render PostgreSQL connection from `fromDatabase` |
| Public API URL | Automatically uses Render's `RENDER_EXTERNAL_URL` |
| Automatic deploy | Disabled until release checks are complete |

For a custom API hostname, set `PUBLIC_API_URL` to its HTTPS URL.

Required server settings:

```dotenv
NODE_ENV=production
DATABASE_URL=<Render internal PostgreSQL connection string>
TRUST_PROXY_HOPS=1
CORS_ORIGIN=
REQUIRE_EMAIL_VERIFICATION=true
SESSION_DAYS=7
SMTP_HOST=<SMTP server>
SMTP_PORT=587
SMTP_USER=<SMTP username>
SMTP_PASSWORD=<SMTP password>
SMTP_FROM=Snippet Store <verified-sender@example.com>
```

Use port 465 for implicit TLS if your SMTP service requires it. Production requires TLS and verified email; startup rejects missing SMTP configuration and insecure public URLs. SMTP credentials must be tested through the chosen provider.

Leave `CORS_ORIGIN` empty for native-only use. Browser support requires exact HTTPS origins separated by commas and a deployment where SameSite=Lax cookies work (same origin or same site). A separate arbitrary web domain requires a reviewed cookie/CSRF deployment setup.

Rate limits currently use process memory and the Blueprint fixes the API at one instance. Add a shared rate-limit store before scaling horizontally. Seven-day sessions and email tokens are stored as hashes in PostgreSQL; password resets revoke all sessions. Logout revokes the current token, including copied credentials.

## Existing database precautions

Back up the database and confirm restoration before applying the authentication migration. Do not drop or recreate a production database.

Migration `0003` adds revocable sessions and email verification, then clones formerly shared categories into the accounts that already reference them. Existing users must verify their email using “Resend verification email.” Existing JWTs are invalidated and removed from app storage.

Rows without an owner remain in the database and are hidden from public accounts. They are never assigned to the first signup. If you need historical unowned snippets imported, select the intended account explicitly and perform a reviewed admin migration.

Database backups can retain deleted data until their retention window ends. Set and document your backup retention and restoration process before launch.

## Android and iOS builds

The existing EAS project is preserved. Android package and iOS bundle ID are both `com.aalampatil.snippetstore`; confirm these belong to your store accounts before the first submission.

1. Set `EXPO_PUBLIC_API_URL=https://<actual-api-host>` in EAS for the `production` environment. Set it separately in `preview` for internal testing.
2. Build and test an internal release on physical devices.
3. Build the store binaries:

```powershell
cd snippetstore
npx eas-cli build --profile production --platform all
```

4. Submit after testing and completing store metadata:

```powershell
npx eas-cli submit --platform android
npx eas-cli submit --platform ios
```

Only the public API URL belongs in `EXPO_PUBLIC_*` variables. Never put SMTP or database credentials there.

Use the in-app Account screen for account deletion. The browser deletion URL for release metadata is `https://<actual-api-host>/api/auth/delete-account`.

## Release gate

- Render deployment is healthy and production migrations succeeded.
- SMTP can send verification and recovery mail to real external addresses.
- Two accounts cannot view or change each other's snippets or categories.
- App restart restores the session; invalid sessions return to sign-in.
- Logout and password reset invalidate previous sessions.
- Account deletion succeeds from both the app and browser.
- Preview and store builds work on actual Android and iOS devices.
- Privacy/support URLs, store data disclosures, screenshots, app identifiers, and signing credentials are complete.
- Dependency advisories in the selected Expo SDK have been reviewed. See [verification notes](verification.md) for the current audit results.
- Monitoring and backup/restore procedures are configured.

The Render file has been checked against the public JSON Schema. Platform-aware validation is also available with `render blueprints validate render.yaml` once the Render CLI is installed. Schema validation does not create or deploy resources.

References: [Render Blueprints](https://render.com/docs/blueprint-spec), [Render web services](https://render.com/docs/web-services), [Expo store submission](https://docs.expo.dev/deploy/submit-to-app-stores/), [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/).
