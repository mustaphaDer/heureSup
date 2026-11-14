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

3. Create a `.env` file with your configuration:
   ```
   PORT=3000
   DATABASE_URL=your_database_connection_string
   JWT_SECRET=your_jwt_secret
   ```

4. Run database migrations:
   ```bash
   npm run migrate
   ```

5. Start the server:
   ```bash
   npm start
   ```

## 💻 Development

- Run in development mode:
  ```bash
  npm run dev
  ```

- Generate new database migration:
  ```bash
  npm run generate
  ```

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
