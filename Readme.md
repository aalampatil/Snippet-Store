# Snippet Store

A personal snippet manager for code, commands, project configuration, and technical notes.

The project is split into two apps:

- `server`: Express + Drizzle + PostgreSQL API
- `snippetstore`: Expo Router mobile app

There is no authentication by design. This is intended for private/local use or deployment behind a private network/VPN/reverse proxy.

## Features

- Store code snippets, command snippets, config blocks, and notes.
- Assign snippets to categories.
- Add a title, note, language, project name, and snippet body.
- Search snippets by title, note, content, language, and project.
- Filter snippets by category.
- Create, edit, delete, share, and copy snippets.
- Dark/light theme toggle with persisted preference.
- Minimal UI with the configured dark/electric-lime palette.

## Tech Stack

Backend:

- Node.js
- Express
- PostgreSQL
- Drizzle ORM
- Zod validation
- Docker Compose for local Postgres

Frontend:

- Expo
- React Native
- Expo Router file-based navigation
- Axios
- AsyncStorage
- Expo Clipboard

## Project Structure

```text
.
├── server
│   ├── drizzle
│   ├── src
│   │   ├── config
│   │   ├── db
│   │   ├── middlewares
│   │   ├── modules
│   │   │   ├── categories
│   │   │   └── snippets
│   │   └── utils
│   ├── docker-compose.yaml
│   └── package.json
└── snippetstore
    ├── config
    ├── src
    │   ├── app
    │   ├── components
    │   ├── constants
    │   ├── contexts
    │   ├── screens
    │   ├── services
    │   ├── types
    │   └── utils
    └── package.json
```

## Requirements

- Node.js
- npm
- Docker Desktop
- Expo CLI through `npx expo`
- Android emulator, iOS simulator, Expo Go, or a development build

## Environment Variables

Backend env file:

Create `server/.env` from `server/.env.example`.

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://ADMIN:ADMIN@localhost:5432/snippetstore
CORS_ORIGIN=*
```

Frontend env file:

Create `snippetstore/.env` from `snippetstore/.env.example`.

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

Use your computer LAN IP instead of `localhost` when testing on a physical phone:

```env
EXPO_PUBLIC_API_URL=http://192.168.x.x:3000
```

## Local Development

Install backend dependencies:

```powershell
cd server
npm install
```

Install frontend dependencies:

```powershell
cd snippetstore
npm install
```

Start Postgres:

```powershell
cd server
docker compose up -d
```

If the Docker volume exists but the database does not, create it once:

```powershell
docker compose exec postgres createdb -U ADMIN snippetstore
```

Apply migrations:

```powershell
npm run db:migrate
```

Start the backend:

```powershell
npm run dev
```

Start the Expo app in another terminal:

```powershell
cd snippetstore
npm run start
```

If native config or env values are not updating, restart Expo with cache clear:

```powershell
npm run start -- --clear
```

## Backend Scripts

Run from `server`.

```powershell
npm run dev
npm run build
npm run start
npm run db:generate
npm run db:migrate
npm run db:studio
```

## Frontend Scripts

Run from `snippetstore`.

```powershell
npm run start
npm run android
npm run ios
npm run web
npx tsc --noEmit
```

## Database Schema

Categories:

- `id`
- `name`
- `slug`
- `description`
- `color`
- `createdAt`
- `updatedAt`

Snippets:

- `id`
- `title`
- `note`
- `content`
- `language`
- `project`
- `categoryId`
- `createdAt`
- `updatedAt`

Default categories are seeded on backend startup when the categories table is empty:

- Code Snippet
- Command Snippet
- Config
- Note

## API

Base URL:

```text
http://localhost:3000
```

Health:

```text
GET /health
```

Categories:

```text
GET    /api/categories
POST   /api/categories
DELETE /api/categories/:id
```

Create category body:

```json
{
  "name": "API",
  "description": "Request examples and API notes",
  "color": "#d4ff00"
}
```

Snippets:

```text
GET    /api/snippets
GET    /api/snippets/:id
POST   /api/snippets
PUT    /api/snippets/:id
DELETE /api/snippets/:id
```

List snippets query params:

```text
search=postgres
categoryId=1
page=1
limit=30
```

Create/update snippet body:

```json
{
  "title": "Postgres Docker",
  "note": "Local database container",
  "content": "docker compose up -d",
  "language": "bash",
  "project": "Snippet Store",
  "categoryId": 2
}
```

List response shape:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 30,
    "total": 0
  }
}
```

## Production Notes

Backend:

- Set `NODE_ENV=production`.
- Set a production `DATABASE_URL`.
- Set `CORS_ORIGIN` to the frontend origin instead of `*` if exposing the API.
- Run `npm run build`.
- Run migrations before starting the server.
- Start with `npm run start`.
- Do not expose this unauthenticated API publicly unless it is protected by a private network, VPN, firewall, or reverse proxy auth.

Frontend:

- Set `EXPO_PUBLIC_API_URL` to the deployed API URL before building.
- For reliable Android edge-to-edge behavior, use a development build or production build. Expo Go can differ because some native config is controlled by Expo Go itself.
- Test on the actual device you plan to use.

## Verification

Backend:

```powershell
cd server
npm run build
npm run db:migrate
```

Frontend:

```powershell
cd snippetstore
npx tsc --noEmit
npx expo config --type public
```

Dependency audit:

```powershell
cd server
npm audit --audit-level=moderate

cd ../snippetstore
npm audit --audit-level=moderate
```

Current audit note: npm reports moderate advisories in development tooling dependency chains. The suggested automatic fix requires `npm audit fix --force` and would install breaking/downgraded tooling versions, so it should not be applied blindly. Re-check after Expo and Drizzle release compatible patched dependency trees.

Manual API check:

```powershell
Invoke-RestMethod http://localhost:3000/health
Invoke-RestMethod http://localhost:3000/api/categories
Invoke-RestMethod http://localhost:3000/api/snippets
```

## Troubleshooting

Docker is running but migration says the database does not exist:

```powershell
cd server
docker compose exec postgres createdb -U ADMIN snippetstore
npm run db:migrate
```

Phone cannot reach the backend:

- Make sure the phone and computer are on the same network.
- Use the computer LAN IP in `EXPO_PUBLIC_API_URL`.
- Make sure Windows firewall allows port `3000`.
- Confirm the backend is listening with `http://localhost:3000/health`.

Theme/status bar changes do not show immediately:

```powershell
cd snippetstore
npm run start -- --clear
```

Then fully close and reopen the app on the device.
