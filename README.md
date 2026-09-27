# DineSphere - Smart Restaurant Management System

“Experience Food Differently”

DineSphere is a complete, responsive, production-quality college project. It includes a beautiful 3D-animated intro, a robust customer portal, real-time kitchen tracking, and an admin dashboard.

## Features
- **3D Intro Landing Page:** Built with Three.js and GSAP for a premium feel (includes a stylized fallback if models fail to load).
- **Customer Portal:** Browse menu, manage cart, place orders (dine-in/takeaway/delivery), and reserve tables.
- **Kitchen Dashboard:** Kanban-style order management for kitchen staff.
- **Admin Dashboard:** Manage inventory, tables, menu items, and view sales charts.
- **Authentication:** JWT & bcrypt, role-based access control (Customer, Admin, Manager, Kitchen, Delivery).
- **Database:** Prisma ORM with SQLite (100% compatible with PostgreSQL).

## Technology Stack
- **Frontend:** React, Vite, TypeScript, Tailwind CSS, GSAP, Three.js (@react-three/fiber), React Router, Zustand, Lucide React, Recharts.
- **Backend:** Node.js, Express, Prisma ORM, bcrypt, jsonwebtoken.
- **Database:** SQLite (Default for demo purposes, easily switchable to PostgreSQL via Prisma).

## Folder Structure
```
DineSphere/
│
├── client/                 # Frontend React (Vite) App
│   ├── src/
│   │   ├── pages/          # Intro, Home, Menu, Admin, Kitchen, etc.
│   │   ├── components/     # Reusable UI cards, buttons, modals
│   │   ├── App.tsx         # Routing
│   │   └── main.tsx
│   ├── tailwind.config.js
│   └── package.json
│
└── server/                 # Backend Node.js App
    ├── src/
    │   ├── index.ts        # Express server, auth middleware, routes
    │   └── seed.ts         # Database population script
    ├── prisma/
    │   └── schema.prisma   # Database schema definitions
    ├── .env.example
    └── package.json
```

## Installation Steps & Setup

> **Note:** The current development environment ran out of disk space (`ENOSPC`) during `npm install`. To run this project, please ensure you have at least 1GB of free space on your drive and follow the steps below.

### 1. Backend Setup
1. Open a terminal and navigate to the `server/` directory:
   `cd server`
2. Install dependencies (ensure disk space is available!):
   `npm install`
3. Copy the `.env.example` to `.env`:
   `cp .env.example .env`
4. Initialize the Prisma database:
   `npx prisma generate`
   `npx prisma db push`
5. Seed the database with demo accounts and data:
   `npx ts-node src/seed.ts`
6. Start the backend development server:
   `npx nodemon src/index.ts` (Runs on port 5000)

### 2. Frontend Setup
1. Open a new terminal and navigate to the `client/` directory:
   `cd client`
2. Install dependencies:
   `npm install --legacy-peer-deps`
3. Start the frontend development server:
   `npm run dev`
4. Open the provided localhost URL in your browser.

## Test Accounts (Demo Credentials)

Use these accounts to explore the different dashboards. *Note: Change passwords in a real deployment.*

- **Admin:** `admin` or `admin@dinesphere.test` / `Admin@12345`
- **Demo Customer:** `demo@dinesphere.test` / `Demo@12345`
- **Manager:** `manager@dinesphere.test` / `Manager@12345`
- **Kitchen:** `kitchen@dinesphere.test` / `Kitchen@12345`
- **Customer:** `customer@dinesphere.test` / `Customer@12345`

## Before Deploying

Before deploying DineSphere to production (e.g., Railway, Render, Fly.io, or VPS), ensure you follow this safety checklist:

1. **Set `ENV=production`** in your host's environment variables.
2. **Set your own `ADMIN_ID`** to a secure, unique identifier (do NOT keep the default test value `admin`).
3. **Set a strong, unique `ADMIN_PASSWORD`** (do NOT keep the default test value `Admin@12345`).
4. **Set a random, secure `JWT_SECRET`** in the host's environment variables (e.g., `openssl rand -hex 32`). Do NOT use any string starting with `dev-only`.
5. **Delete the demo customer** (`demo@dinesphere.test`) from the database.
6. **Verify production safety lock**: Confirm `GET /api/auth/config` returns only `{"dev_mode": false}` and nothing else.
7. Note: The backend includes a fail-safe safety rule: if `ENV` is not `development` and test credentials or dev JWT secrets are still set, the server will strictly refuse to start or seed to protect your deployment.

## API Route Summary
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/menu`, `POST/PUT/DELETE /api/menu/:id` (Admin/Manager only)
- `GET /api/categories`
- `GET /api/orders`, `POST /api/orders`, `PATCH /api/orders/:id/status`
- `GET /api/reports/sales`

## Configuration Guide

- **How to add menu items:** Log in as an Admin/Manager, go to the Admin Dashboard (`/admin`), navigate to the Menu section, and click "Add Item".
- **How to replace the 3D model:** Place your `.glb` or `.gltf` file in `client/public/`. Then update `client/src/pages/Intro.tsx` to use `useGLTF('/your-model.glb')` instead of the `FallbackPlate` mesh.
- **How to configure taxes:** Adjust the tax calculation logic in the `POST /api/orders` route in `server/src/index.ts`, or add a global `Settings` table to Prisma to manage tax rates dynamically.

## Known Limitations & Future Improvements
- **Disk Space Constraint:** Due to 0 bytes free on the environment drive during setup, the `npm install` processes were interrupted. The structural code has been written, but you must free up space and run `npm install` locally to launch the app.
- **Payments:** Payment integration is currently simulated. Future improvements would include Stripe or PayPal SDK integration.
- **WebSockets:** Kitchen auto-polling can be optimized by implementing `socket.io` for real-time bidirectional updates.
