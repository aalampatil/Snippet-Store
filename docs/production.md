# Production release

The API is prepared for Render, and the Expo app targets Android and iOS. A purchased domain is optional: Render gives the API an HTTPS `onrender.com` address. Email confirmation and recovery pages live on that API URL.

## What you need to supply

| Item                                                           | Needed for                                                |
| -------------------------------------------------------------- | --------------------------------------------------------- |
| Render account connected to this GitHub repository             | Hosting the API and PostgreSQL                            |
| Approval of the compute plans in `render.yaml`                 | The template creates a paid API and paid database         |
| Resend API key and approved sender address                     | Sign-in codes, verification, recovery, and deletion codes |
| Expo account with access to the existing EAS project           | Signed Android/iOS builds                                 |
| Apple Developer and Google Play developer accounts             | Distribution through both stores                          |
| Support contact, privacy policy URL, and store listing details | Release metadata and user support                         |

Set credentials in Render/EAS settings, not Git or chat. Local development uses
Mailtrap Email Sandbox through SMTP. Production uses Resend's HTTPS email API.
Use a sender approved in the Resend account; real external recipients normally
require a verified sending domain.

## Render deployment

The Blueprint is configured for one API instance and PostgreSQL in Singapore. Review both resource names and regions before applying it. If a resource with the same name already exists, inspect it before attaching the Blueprint. If you already have production services or a database, reuse their configuration deliberately rather than creating a parallel stack.

1. Commit and push the release changes, including `render.yaml`, to the intended Git branch.
2. In Render, create a Blueprint from this repository. Review the paid compute plans before applying.
3. Enter `RESEND_API_KEY` and `EMAIL_FROM` when prompted. For an existing service,
   add these directly to its environment; Blueprint `sync: false` placeholders
   prompt only when creating a service. Set `EMAIL_PROVIDER=resend`.
4. Apply the Blueprint and wait for the deployment to finish.
5. Confirm `GET https://<actual-api-host>/ready` returns 200.
6. Enter an email from a device and verify real code delivery. Complete signup,
   repeat sign-in, snippet creation, logout, and code-confirmed account deletion.
   Check password fallback/recovery for existing password accounts too.

The Blueprint uses:

| Setting          | Value                                                    |
| ---------------- | -------------------------------------------------------- |
| Runtime          | Node.js 22                                               |
| Root directory   | `server`                                                 |
| Build            | `npm ci --include=dev && npm run build`                  |
| Pre-deploy       | `npm run db:migrate`                                     |
| Start            | `npm start`                                              |
| Health check     | `/ready`                                                 |
| Database         | Private Render PostgreSQL connection from `fromDatabase` |
| Public API URL   | Automatically uses Render's `RENDER_EXTERNAL_URL`        |
| Automatic deploy | Disabled until release checks are complete               |

For a custom API hostname, set `PUBLIC_API_URL` to its HTTPS URL.

Required server settings:

```dotenv
NODE_ENV=production
DATABASE_URL=<Render internal PostgreSQL connection string>
TRUST_PROXY_HOPS=1
CORS_ORIGIN=
REQUIRE_EMAIL_VERIFICATION=true
SESSION_DAYS=7
EMAIL_PROVIDER=resend
RESEND_API_KEY=<Resend API key>
EMAIL_FROM=Snippet Store <verified-sender@example.com>
```

Production startup rejects missing provider credentials and insecure public URLs.
`RESEND_API_KEY` selects Resend automatically in production unless an explicit
`EMAIL_PROVIDER` is set. SMTP remains supported with `EMAIL_PROVIDER=smtp`,
`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM`; production
SMTP requires TLS (587 with STARTTLS or 465 with implicit TLS).

The server loads `.env` by default. A local `.env.production` is not uploaded to
Render or automatically loaded by `npm start`; production settings must be present
in the deployed service environment.

Leave `CORS_ORIGIN` empty for native-only use. Browser support requires exact HTTPS origins separated by commas and a deployment where SameSite=Lax cookies work (same origin or same site). A separate arbitrary web domain requires a reviewed cookie/CSRF deployment setup.

IP rate limits use process memory and the Blueprint fixes the API at one instance.
Add a shared IP rate-limit store before scaling horizontally. OTP cooldowns,
per-email hourly limits, and incorrect-attempt counters are stored in PostgreSQL.
Codes expire after 10 minutes, can be used once, and allow five attempts. Resends
wait 60 seconds and are limited to five per address and purpose per hour.

The requesting app holds a random challenge secret in memory; the server stores
its hash and an HMAC of the email, purpose, and code keyed by that secret. Plaintext
codes are not stored in the database. Login codes cannot authorize account deletion.
Seven-day sessions and legacy email links are also stored as hashes. Password
resets revoke all sessions; logout revokes the current session, including copied credentials.

## Existing database precautions

Back up the database and confirm restoration before applying the authentication migration. Do not drop or recreate a production database.

Migration `0003` adds revocable sessions and email verification, then clones formerly shared categories into the accounts that already reference them. Existing users must verify their email using “Resend verification email.” Existing JWTs are invalidated and removed from app storage.

Migration `0004_email_otp` adds email challenges and allows accounts without a
password. It preserves existing users, snippets, categories, and password hashes.
Successful OTP verification creates an account only after mailbox ownership is
proven. Existing verified passwords continue to work. For a previously unverified
password account, OTP verification clears that unverified password and old
credentials to prevent pre-registration account takeover. A password can be set
later through the existing password recovery flow.

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
- Resend can deliver sign-in/deletion codes and verification/recovery mail to real addresses.
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

Email references: [Mailtrap sandbox SMTP](https://docs.mailtrap.io/email-sandbox/setup/sandbox-smtp-integration),
[Resend send-email API](https://resend.com/docs/api-reference/emails/send-email),
[Resend simulated delivery](https://resend.com/docs/dashboard/emails/send-test-emails).
