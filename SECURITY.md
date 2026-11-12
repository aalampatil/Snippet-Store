# Security Policy

## Supported versions

Security fixes target the latest code on the `main` branch. Older commits,
releases, and forks do not receive separate security maintenance. Use the latest
code and review dependency advisories before deploying.

## Report a vulnerability privately

Email the maintainer at [aalam.workacc@gmail.com](mailto:aalam.workacc@gmail.com)
with the subject `Snippet Store security report`. Do not open a public issue or
pull request containing vulnerability details, credentials, or exploit code.

Include:

- Affected commit or version, component, and environment.
- Reproduction steps or a minimal proof of concept using test accounts and data.
- Expected and observed behavior, potential impact, and any suggested fix.
- A way to contact you and whether you want credit in a disclosure.

Relevant areas include authentication, session handling, account isolation,
password recovery, account deletion, unsafe snippet handling, and exploitable
dependencies. Report uncertain findings privately too. Test only systems you own
or have permission to assess; use synthetic data and avoid affecting other users.

## Response and disclosure

The maintainer will review reports, request any missing details, and coordinate
fixes and disclosure with the reporter. This is a volunteer project with no
guaranteed response or resolution time. If you have not received an acknowledgment
within seven days, follow up through the same email thread.

Please coordinate public disclosure until a fix or mitigation is available.
Credit will be given with the reporter's permission. There is no paid bug bounty.

## Deployment and known advisories

Follow the [production guide](docs/production.md) for secrets, email verification,
HTTPS, database access, and release checks. Never include `.env` files, session
tokens, passwords, database dumps, or real user snippets in reports or commits.

[Verification notes](docs/verification.md) record dependency findings at a specific
date; they are not a guarantee that current dependencies are free of advisories.
Recheck dependencies before each release.
