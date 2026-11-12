# Contributing to Snippet Store

Contributions to features, fixes, accessibility, tests, and documentation are
welcome. Follow the [code of conduct](CODE_OF_CONDUCT.md). Report vulnerabilities
through the private process in [SECURITY.md](SECURITY.md).

## Before you start

Search existing [issues](https://github.com/aalampatil/Snippet-Store/issues) and
[pull requests](https://github.com/aalampatil/Snippet-Store/pulls) to avoid duplicate
work. Use the bug or feature template when opening an issue. Discuss substantial
features, schema changes, or dependency upgrades before implementing them; small
fixes and documentation improvements can go straight to a pull request.

## Set up locally

1. Fork the repository and clone your fork.
2. Create a branch, for example `git switch -c fix/snippet-search`.
3. Install Node.js 22.12 or later (Node.js 22 matches CI) and Docker Desktop or
   Docker Engine with Compose.
4. Follow [Develop locally](Readme.md#develop-locally) to copy both `.env.example`
   files, run `npm ci` in each package, start PostgreSQL, apply migrations, and
   start the API and Expo app.

There is no root npm package. Run commands from `server/` or `snippetstore/` as
shown below. For a physical device, use the computer's LAN address for the API.
For browser testing, configure the exact app origin in `CORS_ORIGIN`.

## Make changes

- Use TypeScript and follow the surrounding code and root Prettier configuration.
- Keep changes focused; include relevant documentation and meaningful regression
  coverage for behavior changes.
- Keep API routes thin and put business logic in the module services. Validate
  inputs and preserve account ownership checks.
- Change database schemas through Drizzle. Run `npm run db:generate` from
  `server/`, review the generated SQL, and commit the migration and metadata.
  Do not rewrite migrations that may already have been applied.
- Keep package manifests and lockfiles in sync. Review dependency upgrades for
  compatibility with the selected Expo SDK.
- Preserve the `query-string` patch, decoder override, and postinstall hook
  together until an upstream fix replaces them; see the [verification notes](docs/verification.md).
- Keep secrets, local `.env` files, generated bundles, and private user data out
  of commits and screenshots.

## Check your work

For API changes, run from `server/`:

```powershell
npm run build
# Create an empty, dedicated local PostgreSQL database first.
$env:TEST_DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/snippetstore_test"
npm test
npm audit --omit=dev --audit-level=high
```

On macOS/Linux, set the variable with
`export TEST_DATABASE_URL='postgresql://USER:PASSWORD@localhost:5432/snippetstore_test'`
before `npm test`. The database name must end in `_test`. The integration suite
applies migrations and writes test records; never point it at an application or
production database. PostgreSQL must be running; test email is handled by the suite.

For app changes, run from `snippetstore/`:

```powershell
npx expo customize tsconfig.json
npx tsc --noEmit
npm run test:dependencies
npx expo install --check
npx expo export --platform android --platform ios
```

Manually exercise affected screens and flows on the relevant platforms. Include
screenshots for visual changes and reproduction steps for fixes. Documentation
changes need link, spelling, and command review; app builds are not required for
documentation-only changes.

The [CI workflow](.github/workflows/ci.yml) builds and tests the API, audits its
production dependencies, checks app types and the decoder regression, and exports
Android and iOS bundles. CI must pass before merge. If a check cannot run locally,
explain why in the pull request instead of marking it as passed.

## Open a pull request

Push your branch to your fork and open a pull request against `main`. Complete the
template with the problem, resulting behavior, linked issues (for example,
`Closes #123`), verification results, and any migration or configuration changes.
Use a descriptive title and keep unrelated work in separate pull requests.

Respond to review feedback and update your branch as needed. Maintainers review
scope, correctness, security, and maintainability; review timing depends on
availability. By submitting a contribution, you agree that it will be distributed
under the project's [ISC License](LICENSE).
