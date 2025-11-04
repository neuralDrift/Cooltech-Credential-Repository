# Four-ThirtyFive — Client + Server

A React (Vite) client and Express/MongoDB server for managing users, organisational units (OUs), divisions, and credential access. Includes case-insensitive uniqueness enforcement for OUs/divisions and admin tools to add/remove memberships.

## Tech Stack

- Client: React, React Router, Bootstrap, Vite
- Server: Express, Mongoose, Helmet, CORS, JWT auth
- Database: MongoDB

## Key Features

- Case-insensitive uniqueness for `OU` and `Division` by `normalizedName`
- Admin UI to assign roles and manage memberships (divisions, OU manager/member)
- Access middleware that loads user memberships and enforces role-based gates
- Duplicate OU merge script to consolidate case-duplicate records safely

## Project Structure

```
Four-ThirtyFive/
├── client/                # React app (Vite)
│   ├── src/
│   │   ├── components/    # UserManagement admin UI
│   │   ├── pages/         # Auth, Dashboard
│   │   └── api/axiosConfig.js  # API base URL + token attach
│   └── package.json       # dev/build scripts
└── server/                # Express API server
    ├── controllers/       # Divisions, OUs, memberships, users, credentials
    ├── middleware/        # auth (JWT), access (membership-based)
    ├── models/            # OU, Division, Membership, User, Credential
    ├── routes/            # HTTP routes mounted under /api
    ├── merge-duplicate-ous.js    # Data fix script for case-duplicate OUs
    └── server.js          # Express entry
```

## Setup

1. Prerequisites

- Node.js 18+ recommended
- MongoDB connection string

2. Install dependencies

```
cd server && npm install
cd ../client && npm install
```

3. Server environment
   Create `server/.env` with:

```
MONGO_URI=mongodb://localhost:27017/yourdb
PORT=5000
JWT_SECRET=your_jwt_secret_here
```

## Running in Development

Server (auto-restart):

```
cd server
npm run dev
```

Client (Vite dev):

```
cd client
npm run dev
```

Create a user, then assign admin rights through database to create first admin user

Client expects the API at `http://localhost:5000/api` (see `client/src/api/axiosConfig.js`). If you change `PORT`, update this base URL accordingly.

### Windows PowerShell note

If you see "running scripts is disabled" when using `npm`, you can either:

- Start Vite without npm: `node ./node_modules/vite/bin/vite.js`
- Temporarily allow local scripts: `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`
  Use whichever matches your policy; you mentioned you will handle restarts/skip.

## Build & Preview

```
cd client
npm run build
npm run preview
```

## Authentication & Roles

- JWT-based auth: client stores token in `localStorage` and attaches via Axios interceptor
- Roles: `user`, `manager`, `admin`
  - `admin`: full access with user assignments
  - `manager`: can view and edit credentials
  - `user`: view and add only credentials they have access to

## API Overview

Base URL: `http://localhost:5000/api`

- Users: `GET /users`, `PUT /users/role`
- OUs: `GET /ous`, `POST /ous`, normalizes name for uniqueness
- Divisions: `GET /divisions`, `POST /divisions`, unique per OU by normalized name
- Membership:
  - Division: `POST /membership/division/add`, `POST /membership/division/remove`
  - OU manager: `POST /membership/ou/add`, `POST /membership/ou/remove`
  - OU member only: `POST /membership/ou/member/add`, `POST /membership/ou/member/remove`

Controllers use upsert patterns to avoid duplicate memberships and return helpful errors for duplicates.

## Uniqueness & Data Model

- OU model: sets `normalizedName = name.trim().toLowerCase()`; unique across all OUs
- Division model: compound unique index on `{ ouId, normalizedName }`
- This prevents case-based duplicates (e.g., "News Management" vs "news management").

## Admin UI

- `UserManagement.jsx` provides:
  - Role assignment buttons (user/manager/admin)
  - Division selector to add division memberships; remove via inline actions
  - OU manager/member controls
  - Bootstrap toast notifications (non-blocking) for add/remove and errors

## Access Middleware

- Loads memberships for `req.user` and sets `req.userDivisionIds`/`req.userOuIds`
- Admins pass automatically; managers must manage divisions/OUs; regular users need memberships
- Used by controllers like credentials to filter data per user’s access

## Data Maintenance Scripts

- `server/merge-duplicate-ous.js`

  - Identifies OUs with case-insensitive matching names
  - Selects a canonical OU, merges divisions and memberships, removes duplicates
  - Handles division name collisions by merging memberships safely
  - Usage (example):

    ```
    cd server
    node merge-duplicate-ous.js "News Management"
    ```

- `server/fix-membership.js`
  - Utility to reconcile membership inconsistencies (if present)

## Troubleshooting

- Division removal fails:
  - Ensure client calls `POST /membership/division/remove` with `{ userId, divisionId }`
- Not seeing division-linked materials:
  - Verify memberships exist and access middleware is attached on routes
- Duplicate key errors when merging:
  - Script merges division memberships on collision and deletes duplicates
- CORS issues:
  - Server enables CORS globally; adjust origins if needed

## Deployment

- Server: set `MONGO_URI`, `JWT_SECRET`, `PORT`; start with a process manager
- Client: build with `npm run build`; serve `client/dist` from a static host
- Optionally proxy client → server or configure `axiosConfig` base URL accordingly
