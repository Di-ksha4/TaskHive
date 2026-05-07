# TaskHive

A small team task manager. Admins create projects, add team members, and assign tasks. Members see the tasks assigned to them and update their status — those updates are visible to the admin on refresh.

Built as a final-year full-stack project. The goal is a clean, working app — not a kitchen sink of features.

## Tech stack

**Frontend**
- React 18 + Vite
- Tailwind CSS
- Zustand (auth store)
- React Router, React Hook Form, React Hot Toast
- Recharts (dashboard charts)
- Axios

**Backend**
- Node.js + Express
- MongoDB + Mongoose
- JWT for auth, bcryptjs for password hashing
- express-validator, express-rate-limit, morgan, cors

## Features

- Email + password signup and login (JWT, password hashing).
- Two roles: **admin** and **member**. New signups are members; admins are seeded.
- Admin can:
  - Create / delete projects and pick which members belong.
  - Add or remove members on existing projects.
  - Create tasks inside a project, choose the assignee from that project's members, set priority and due date.
  - See an analytics dashboard (totals, status / priority breakdowns, member workload).
  - See and delete any task.
- Member can:
  - See only the tasks assigned to them.
  - Update task status (todo / in-progress / completed).
  - Add comments on their own tasks.
- Notifications:
  - Member gets a notification when an admin assigns them a task.
  - Admin gets a notification when a member updates a task's status.
  - Notification bell in the navbar with a dropdown and "mark all read".
- Polling (every 15–20s) keeps the UI in sync without WebSockets.

## Priority suggestion

When creating a task, if the admin doesn't pick a priority, the backend picks one based on:
- urgency keywords in the title/description (`urgent`, `asap`, `critical`, `bug`, `fix`, `blocker`)
- whether the due date is within 48 hours

It's a small rule-based default — the admin can always override it.

## Project structure

```
TaskHive/
├── client/                 # React app (Vite)
│   └── src/
│       ├── pages/          # Login, SignUp, Dashboard, Projects, Tasks, Profile
│       ├── components/     # Navbar, ProtectedRoute
│       ├── api.js          # Axios client
│       ├── store.js        # Zustand auth store
│       └── App.jsx
└── server/                 # Express API
    └── src/
        ├── models/         # User, Project, Task, Notification
        ├── routes/         # auth, users, projects, tasks, notifications, analytics
        ├── middleware/     # auth (JWT), errorHandler
        ├── config/db.js
        └── index.js
```

## Running locally

You'll need Node.js 18+ and a running MongoDB (local or Atlas).

### 1. Backend

```bash
cd server
cp .env.example .env       # then edit if needed
npm install
npm run seed               # creates demo accounts and sample data
npm run dev
```

Server runs on `http://localhost:5000`.

### 2. Frontend

```bash
cd client
npm install
npm run dev
```

App runs on `http://localhost:5173` and proxies `/api/*` to the backend.

### Demo accounts (after seeding)

| Role   | Email                  | Password   |
|--------|------------------------|------------|
| Admin  | admin@taskhive.com     | admin123   |
| Member | john@taskhive.com      | member123  |
| Member | jane@taskhive.com      | member123  |

## Environment variables

`server/.env`

| Variable        | Required | Default                                     |
|-----------------|----------|---------------------------------------------|
| `PORT`          | no       | `5000`                                      |
| `MONGODB_URI`   | no       | `mongodb://127.0.0.1:27017/taskhive`        |
| `JWT_SECRET`    | yes (prod) | falls back to `your_secret` in dev only   |
| `JWT_EXPIRES_IN`| no       | `7d`                                        |
| `CLIENT_URL`    | no       | `http://localhost:5173` (used for CORS)     |

In production the server refuses to start without a `JWT_SECRET`.

## API

All endpoints live under `/api`. Authenticated routes need an `Authorization: Bearer <token>` header.

### Auth
| Method | Path                | Who    | Notes                          |
|--------|---------------------|--------|--------------------------------|
| POST   | `/auth/signup`      | public | Creates a member account.      |
| POST   | `/auth/login`       | public | Returns `{ token, user }`.     |
| GET    | `/auth/profile`     | auth   | Returns the current user.      |

### Users
| Method | Path             | Who    | Notes                                   |
|--------|------------------|--------|-----------------------------------------|
| GET    | `/users`         | admin  | Optional `?role=member` filter.         |

### Projects
| Method | Path                                  | Who    |
|--------|---------------------------------------|--------|
| GET    | `/projects`                           | auth (admin sees all, member sees own) |
| POST   | `/projects`                           | admin  |
| GET    | `/projects/:id`                       | auth (members of project) |
| PUT    | `/projects/:id`                       | admin  |
| DELETE | `/projects/:id`                       | admin  |
| POST   | `/projects/:id/members`               | admin  |
| DELETE | `/projects/:id/members/:memberId`     | admin  |

### Tasks
| Method | Path                          | Who    |
|--------|-------------------------------|--------|
| GET    | `/tasks`                      | auth (admin: all; member: own) |
| POST   | `/tasks`                      | admin  |
| GET    | `/tasks/:id`                  | auth (admin or assignee) |
| PUT    | `/tasks/:id`                  | auth (admin: anything; member: status only) |
| DELETE | `/tasks/:id`                  | admin  |
| POST   | `/tasks/:id/comments`         | auth (admin or assignee) |

### Notifications
| Method | Path                                | Who  |
|--------|-------------------------------------|------|
| GET    | `/notifications`                    | auth |
| PATCH  | `/notifications/read-all`           | auth |
| PATCH  | `/notifications/:id/read`           | auth |

### Analytics
| Method | Path                          | Who   |
|--------|-------------------------------|-------|
| GET    | `/analytics/dashboard`        | admin |
| GET    | `/analytics/overdue-tasks`    | admin |

## Data model

```
User       { name, email, password, role: 'admin'|'member', createdAt }
Project    { title, description, createdBy: User, members: [User], deadline?, createdAt }
Task       { title, description, assignedTo: User, projectId: Project,
             priority: low|medium|high, status: todo|in-progress|completed,
             dueDate?, comments: [{ userId, text, createdAt }], createdAt }
Notification { userId: User, type, message, relatedTaskId?, relatedProjectId?,
               isRead, createdAt (TTL 30d) }
```

## Notes

- The frontend polls list endpoints every 15–20 seconds. That's good enough for a small team app and avoids the complexity of WebSockets.
- Member sign-ups become members. To create another admin, edit the seed script or update the user's `role` directly in MongoDB.
- This is a learning project — don't expose it publicly without rotating `JWT_SECRET` and tightening CORS.
