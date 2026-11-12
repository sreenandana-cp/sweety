# Sweety – Blood Glucose Tracker

A small web app where a diabetes patient records up to 4 blood glucose readings a day and views daily, month-to-date and monthly reports.

**Stack:** React (Vite) · Node.js + Express · PostgreSQL

## Features
- Sign up / log in (passwords hashed with bcrypt, JWT login token)
- Add, view, edit and delete readings (users only see their own)
- Validation with clear messages (required, 40–600 mg/dl, one per slot per day, max 4 per day, no future dates)
- Reports: highest, lowest, average (1 decimal) and count for Daily, Month-to-date and Previous month, with an empty state

## Requirements
- Node.js 18+
- PostgreSQL 14+

## Setup

### 1. Install dependencies
```bash
cd server && npm install
cd ../client && npm install
```

### 2. Set up the database
```bash
createdb sweety
psql sweety -f server/db/schema.sql
```

### 3. Environment variables
```bash
cd server
cp .env.example .env
```
Edit `.env` and set `DATABASE_URL` (for example `postgres://YOUR_USER@localhost:5432/sweety`) and a long random `JWT_SECRET`.

| Variable | Meaning |
|---|---|
| `PORT` | API port (default 5001) |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret used to sign login tokens |

### 4. Seed demo data (optional)
```bash
cd server
npm run seed
```
Creates a demo user with about 45 days of sample readings:
**demo@sweety.com / demo1234**

## Run

**Server** (http://localhost:5001)
```bash
cd server
npm run dev
```

**Client** (http://localhost:5173)
```bash
cd client
npm run dev
```

## Tests
```bash
cd server
npm test
```
Runs 7 API tests (auth, all validation rules, report calculations). The database must be running.

## API
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/signup` | Register |
| POST | `/auth/login` | Log in, returns token |
| GET | `/readings?date=YYYY-MM-DD` | List own readings |
| POST | `/readings` | Add a reading |
| PUT | `/readings/:id` | Edit a reading |
| DELETE | `/readings/:id` | Delete a reading |
| GET | `/reports?date=YYYY-MM-DD` | Daily, month-to-date and previous month reports |

## Notes

### Assumptions
- Slots are fixed: Morning (fasting), After breakfast, After lunch, After dinner. Because there are exactly 4 slots, the "max 4 per day" rule is also enforced separately in code.
- Dates are plain calendar dates (no time zone). "Today" is the server's local date.
- Month-to-date runs from the 1st of the selected date's month up to the selected date. Previous month is the whole calendar month before it.
- Average is rounded to 1 decimal place by the database.
- The API address in the client is set in `client/src/api.js`.

### What I would improve with more time
- Pagination on `GET /readings`
- Charts of readings over the month
- Docker Compose for PostgreSQL
- Frontend tests with React Testing Library
- Proper date handling per user time zone
- Token refresh and a better logout flow
- Move the API URL to an environment variable