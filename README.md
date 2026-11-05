# SmartSpend — Smart Money & Expense Tracker (MERN)

A full-stack personal finance app: track income and expenses, set monthly budgets, follow savings goals, and get rule-based insights and reports. Data is stored per user in MongoDB; every API query is scoped to the authenticated user.

## Tech stack
**Frontend:** React 18 + Vite, React Router, Tailwind CSS (light/dark), Recharts, Axios, Context API, Lucide icons, React Hook Form + Zod, react-hot-toast.
**Backend:** Node.js (ESM), Express 4, MongoDB + Mongoose, JWT in an httpOnly cookie, bcryptjs, Zod validation, Helmet, CORS, rate limiting.
**Tests:** Vitest (+ Supertest and mongodb-memory-server on the backend).

## Prerequisites
Node.js 18+ (20/22 recommended), npm, and MongoDB (local install **or** a free MongoDB Atlas cluster).

## Folder structure
```
SmartSpend-MERN/
├── package.json            # root scripts (install:all, dev, build, test, lint, seed)
├── backend/
│   ├── src/{config,controllers,middleware,models,routes,services,utils,validators}
│   ├── src/app.js, server.js
│   ├── tests/              # api.test.js (integration), unit.test.js
│   └── .env.example
└── frontend/
    ├── src/{api,components,context,hooks,layouts,pages,routes,utils}
    ├── src/App.jsx, main.jsx, index.css
    └── .env.example
```

## Quick start
```bash
npm run install:all                      # installs root, backend and frontend deps
cp backend/.env.example backend/.env     # then edit MONGODB_URI and JWT_SECRET
npm run dev                              # API on :5000, web on :5173
```
Open http://localhost:5173 and register an account.

Generate a JWT secret: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

### MongoDB setup
- **Local:** install MongoDB Community, start `mongod`, use `MONGODB_URI=mongodb://127.0.0.1:27017/smartspend`.
- **Atlas:** create a free cluster, add a database user, allow your IP under *Network Access*, and paste the `mongodb+srv://…` string (append `/smartspend` as the database name) into `MONGODB_URI`.

### Environment variables
| File | Variable | Purpose |
|---|---|---|
| backend/.env | `PORT`, `NODE_ENV` | Server port / environment |
| | `MONGODB_URI` | Mongo connection string (required) |
| | `JWT_SECRET` | ≥ 32 chars (required) |
| | `JWT_EXPIRES_IN` | Token lifetime (default `7d`) |
| | `FRONTEND_URL` | Exact allowed CORS origin |
| | `COOKIE_SECURE`, `COOKIE_SAMESITE` | Cookie flags (`true` + HTTPS in production) |
| | `TRUST_PROXY` | `1` behind a reverse proxy |
| frontend/.env | `VITE_API_URL` | API base URL (default `/api`, proxied in dev) |
| | `VITE_DEV_PROXY_TARGET` | Dev proxy target (default `http://localhost:5000`) |

## Demo data (optional, development only)
```bash
npm run seed
```
Creates `demo@smartspend.local` / `Demo@12345` with ~6 months of transactions, budgets and goals. It **refuses to run when `NODE_ENV=production`**, is never run automatically, and new accounts always start empty.

## Tests, lint, build
```bash
npm test         # backend (Vitest + Supertest + in-memory MongoDB) and frontend utils
npm run lint
npm run build    # production build -> frontend/dist
```
Backend integration tests use `mongodb-memory-server`, which downloads a MongoDB binary on first run (needs internet). To use a real server instead, set `TEST_MONGODB_URI` to a **dedicated** database whose name contains `test` (it is dropped after the run).

## Design decisions
- **Money** is stored as integer minor units (paise/cents) and converted at the API boundary — no floating point drift. Amounts accept at most 2 decimals.
- **Dates** are calendar dates stored at UTC midnight; ranges are inclusive `YYYY-MM-DD`. The client sends local calendar dates, so month boundaries never shift with timezone.
- **Balance** = opening balance + all income − all expenses dated up to today. **Savings** (per period) = income − expenses; savings rate = savings ÷ income (shown as "—" when there is no income).
- **Previous-period comparison** uses the immediately preceding period of equal length; shown as "—" when the previous value is 0.
- **Budgets**: one per user per month (`YYYY-MM`, unique index). Spent amounts come from real expense transactions; the overall figure is *all* expenses in the month (not a sum of category lines), so nothing is double counted. A new month simply has no budget until created; history is untouched.
- **Savings goals**: contributions are embedded in the goal and applied atomically (cannot exceed the target). They are earmarked savings, **not** income/expense transactions, so they never alter cash-flow totals or the balance.
- **Currency** is a display preference (default INR ₹). Values are never converted.
- **Insights** are deterministic rules computed from your own data, each with an explanation of the comparison period. Recurring detection is labeled *estimated*. No external AI/API is used or required. Not financial advice.
- **Auth**: bcrypt hashes, JWT in an httpOnly, SameSite cookie, `tokenVersion` so a password change signs out other sessions. Ownership is enforced in every query via `req.user._id`; zod `.strict()` schemas reject unknown fields (no mass assignment) and non-string query values (no NoSQL operator injection).

## API reference
All routes are under `/api`. Responses: `{ success, data, meta? }` or `{ success:false, message, errors? }`. All routes except `health`, `auth/register`, `auth/login`, `auth/logout` require the auth cookie.

| Method & path | Description |
|---|---|
| GET `/health` | Health check |
| POST `/auth/register` · `/auth/login` · `/auth/logout` | Auth; GET `/auth/me` current user |
| PUT `/users/me` | Update name, openingBalance, preferences (currency, theme, dateFormat) |
| PUT `/users/me/password` | Change password (`currentPassword`, `newPassword`) |
| DELETE `/users/me` | Delete account + all data (`password`) |
| GET `/transactions` | List: `page, limit, search, type, category, from, to, minAmount, maxAmount, sort(date\|amount), order` |
| GET `/transactions/export` | CSV of filtered transactions |
| POST `/transactions` · GET/PUT/DELETE `/transactions/:id` | CRUD |
| GET `/dashboard?from&to` | Cards, series, categories, budget, goals, recent |
| GET `/insights?from&to` | Rule-based insights |
| GET `/reports?from&to` | Monthly + category reports |
| GET `/budgets` · GET `/budgets/status?month=YYYY-MM` | List / status with spend |
| POST `/budgets` · PUT/DELETE `/budgets/:id` | Budget CRUD |
| GET/POST `/goals` · PUT/DELETE `/goals/:id` | Goal CRUD |
| POST `/goals/:id/contributions` · DELETE `/goals/:id/contributions/:cid` | Contributions |

## Troubleshooting
- **`Missing required environment variables`** — create `backend/.env` from the example.
- **`MongoServerSelectionError`** — MongoDB isn't running, or (Atlas) your IP isn't allow-listed / URI is wrong.
- **CORS or cookie not sent** — `FRONTEND_URL` must exactly match the browser origin. In dev keep `VITE_API_URL=/api` so the Vite proxy keeps cookies same-origin.
- **Logged out immediately in production** — set `COOKIE_SECURE=true` (HTTPS), and for cross-site frontends `COOKIE_SAMESITE=none`; set `TRUST_PROXY=1` behind a proxy.
- **Port in use** — change `PORT` (and `VITE_DEV_PROXY_TARGET`).

## Production deployment notes
1. `NODE_ENV=production`, strong `JWT_SECRET`, Atlas URI, `FRONTEND_URL` = your site origin, `COOKIE_SECURE=true`.
2. Build the frontend (`npm run build`) and host `frontend/dist` on any static host; set `VITE_API_URL` to the full API URL **at build time**. Easiest cookie setup: serve web and API under the same site (e.g. `app.example.com` and `api.example.com`, or a reverse proxy routing `/api`).
3. Run the API with `npm start` behind HTTPS and a process manager. Never run the seed script in production.
