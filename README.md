# HeuresSup - Additional Hours Management System

## 1CS Project

A comprehensive application for managing additional teaching hours, schedules, grades, and teacher salary calculations for educational institutions.

> **Note on authorship:** This repository is a copy of an existing project, kept for study and reference.
> All original code was written by the authors listed under [Credits](#-credits) below.
> The commit history retains the original authors and dates. This copy does not claim authorship of that work.

## 🚀 Features

- **Authentication System**: Secure login for different user roles
- **Grade Management**: Track and manage student grades and grading sessions
- **Schedule Management**: Organize teaching sessions and handle scheduling
- **Absence Tracking**: Record and manage teacher and student absences
- **Holiday Management**: Configure holidays and non-working days
- **Additional Hours (HeuresSup) Calculation**: Automatically calculate additional teaching hours
- **Salary Management**: Calculate teacher salaries based on teaching workload
- **External Session Support**: Integration with external teaching sessions
- **Promotion Management**: Handle student promotions and specialities

## 📋 Technologies

- **Backend**: Node.js with Express.js
- **Database**: SQL with Drizzle ORM

## 🛠️ Project Structure

```
.
├── src/                      # Source code
│   ├── app.js                # Express application setup
│   ├── controller/           # Controller logic
│   ├── db/                   # Database models and connections
│   ├── middlewares/          # Express middlewares
│   ├── public/               # Static files
│   └── routes/               # API routes
├── drizzle/                  # Database migrations
├── config/                   # Configuration files
├── server.js                 # Entry point
└── drizzle.config.js         # Drizzle ORM configuration
```

## 🚦 API Endpoints

The API provides the following endpoints:

- `/api/auth`: Authentication operations
- `/api/grade`: Grade management
- `/api/teacher`: Teacher information
- `/api/schedule`: Schedule management
- `/api/speciality`: Speciality management
- `/api/promotion`: Student promotion management
- `/api/seanceTypeCoefficient`: Session type coefficient settings
- `/api/absence`: Absence tracking
- `/api/holiday`: Holiday management
- `/api/heureSup`: Additional hours calculation
- `/api/salary`: Salary management
- `/api/external-seance`: External session management

## ⚙️ Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/heureSup.git
   cd heureSup
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create your environment file from the template and fill in real values:
   ```bash
   cp .env.example .env
   ```
   The connection string variable is `DB_CONNECTION_STRING` (not `DATABASE_URL`), and
   `JWT_SECRET` must be a long random string — the server will accept any value, so pick a
   real one. Generate it with:
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```

4. Create the database schema:
   ```bash
   npx drizzle-kit push
   ```
   > The checked-in files under `drizzle/` cannot be applied in order: `0000` uses the
   > `grade_name` type that `0001` creates. Use `drizzle-kit push` (schema-first) until the
   > migration history is regenerated.

5. Start the server:
   ```bash
   npm start
   ```

## 🐳 Quick start with Docker

Runs the API and a PostgreSQL instance together:

```bash
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))") \
  docker compose up --build
```

The API is then on <http://localhost:3000> and PostgreSQL on `localhost:5432`
(database `heuresup`, user/password `postgres`/`postgres`). Apply the schema once the
database is healthy:

```bash
docker compose exec api npx drizzle-kit push
```

## 🧪 Tests

```bash
npm test
npm run test:watch
```

The suite uses the built-in `node:test` runner and needs no database: the overtime
calculation lives in `src/lib/heureSup.js`, which is free of database access.

## 💻 Development

- Run in development mode:
  ```bash
  npm run dev
  ```

- Generate new database migration:
  ```bash
  npm run generate
  ```

## 🔎 Pagination and filtering

List endpoints accept optional query parameters. A request **without** any of them behaves
exactly as before, so existing clients keep working.

| Parameter | Applies to | Meaning |
|---|---|---|
| `page`, `limit`, `offset` | all list endpoints below | `limit` defaults to 25, caps at 100; `offset` wins over `page` |
| `gradeId`, `teacherType`, `search` | `GET /api/teacher/get` | `search` matches first name, last name or email (case-insensitive) |
| `educationalYear`, `semester`, `promotionId` | `GET /api/schedule` | exact match |
| `day`, `type`, `teacherId`, `module` | `GET /api/schedule/:scheduleId/seances` | `module` is a case-insensitive partial match |

A paginated or filtered request returns the rows plus a `pagination` block:

```jsonc
{
  "teachers": [ /* ... */ ],
  "pagination": { "page": 1, "limit": 25, "total": 42, "totalPages": 2, "hasNextPage": true }
}
```

An unknown `teacherType`, `semester`, `day` or `type` value returns `400` listing the
accepted values.

## 📝 License

No `LICENSE` file is included in the original project. The original authors have not granted an
explicit license, so the code remains under their copyright (all rights reserved) by default.
The "MIT License" statement previously in this README was inaccurate. If you intend to reuse,
redistribute or build on this code, contact the original authors for permission.

## 👥 Credits

Original project: **[amdjadmoh/heureSup](https://github.com/amdjadmoh/heureSup)**

Written by:

- [Mehdi Mohamed Amdjad](https://github.com/amdjadmoh) — 33 commits
- [Chikhaoui Youcef Chihab Eddine](https://github.com/Chihab0) — 12 commits

This copy is hosted by [Mustapha Derrah](https://github.com/derrah-mustapha) for reference only.
The original commit authors and dates are preserved in the history; no authorship is claimed over them.

## 📊 External API Integration

The system includes integration with external session APIs. A Postman collection is provided for testing the API endpoints.

## 🌟 About

This project is developed to streamline the management of additional teaching hours and related processes in educational institutions. Initially developed as a 1CS project.
