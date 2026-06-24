<div align="center">
  <img src="./apps/web/public/ITSA_logo.png" alt="ITSA Logo" width="120" />
  <h1>ITSA Platform</h1>
  <p>The official web platform for the Information Technology Students' Association (ITSA). An integrated portal for event registrations, announcements, media gallery, and administrative management.</p>

  <p>
    <a href="https://reactjs.org/"><img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" /></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" /></a>
    <a href="https://expressjs.com/"><img src="https://img.shields.io/badge/Express.js-404D59?style=for-the-badge" alt="Express.js" /></a>
    <a href="https://www.postgresql.org/"><img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" /></a>
    <a href="https://turbo.build/repo"><img src="https://img.shields.io/badge/Turborepo-EF4444?style=for-the-badge&logo=turborepo&logoColor=white" alt="Turborepo" /></a>
  </p>
</div>

---

## ✨ Key Features

### For Students
- **Event Discovery & Registration:** Browse upcoming events, workshops, and placement drives. Register as an individual or form a team (with constraints enforced automatically).
- **Public Gallery:** View high-quality photos from past events without needing an account.
- **Announcements:** Stay up to date with the latest club news, notices, and updates.
- **Dashboard:** Track your event registrations, download tickets/QR codes, and manage your profile.

### For Administrators (Role-Based Access Control)
The platform uses a strict, hierarchical **Role-Based Access Control (RBAC)** system:
- **`SUPER_ADMIN`**: Full system access. Can modify system settings, access database backups, manage security, and promote/demote other Admins and Super Admins.
- **`ADMIN`**: Can create events, manage users, approve/reject registrations, and oversee the entire platform.
- **`EVENT_COORDINATOR`**: Has isolated access. Can only view and manage registrations/data for the specific events they are assigned to.
- **`ITSA_MEMBER`**: Marketing and content team. Can create gallery albums, upload media, draft announcements, and view basic event data.

### Technical Highlights
- **Monorepo Architecture:** Powered by Turborepo for seamless code sharing between the frontend and backend.
- **Robust Security:** JWT-based authentication, real-time database role verification, and comprehensive audit logging for sensitive actions.
- **Type Safety:** 100% TypeScript with shared types across the API and Web clients. Zod validation for all incoming API requests.
- **Dynamic Filtering:** Advanced database queries (Prisma) to ensure coordinators only see data they are permitted to see.

---

## 🏗️ Architecture

This project is built as a monorepo using **Turborepo** and npm workspaces.

```text
ITSA_Website/
├── apps/
│   ├── api/        # Express.js REST API backend
│   └── web/        # React.js (Vite) frontend application
├── packages/
│   └── shared/     # Shared TypeScript types, Zod schemas, and constants
└── package.json    # Root configuration
```

---

## 🚀 Getting Started

To get a local copy up and running, follow these steps.

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [PostgreSQL](https://www.postgresql.org/) (Local installation or a cloud instance like Supabase/Neon)
- [Redis](https://redis.io/) (For caching and rate-limiting)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/ITSA_Website.git
   cd ITSA_Website
   ```

2. **Install dependencies** (This will install dependencies for all workspaces)
   ```bash
   npm install
   ```

3. **Set up Environment Variables**
   - Copy the `.env.example` file in the `apps/api` directory to `.env` and fill in your database credentials and JWT secrets.
   - Copy the `.env.example` file in the `apps/web` directory to `.env` and set your API URL.

4. **Database Setup (Prisma)**
   ```bash
   cd apps/api
   npx prisma generate
   npx prisma db push
   ```
   *(Optional)* Run the seed script to create the initial Super Admin account:
   ```bash
   npm run seed
   ```

5. **Start the Development Server**
   From the root directory, run:
   ```bash
   npm run dev
   ```
   This command uses Turborepo to simultaneously start the backend API (usually `localhost:5000`) and the frontend Vite server (usually `localhost:5173`).

---

## 🤝 Contributing

We welcome contributions from ITSA members and the open-source community! Whether you want to fix a bug, improve the UI, or build a new feature, your help is appreciated.

### How to Contribute
1. **Fork** the repository and clone it locally.
2. **Create a branch** for your feature (`git checkout -b feature/AmazingFeature`).
3. **Commit your changes** (`git commit -m 'Add some AmazingFeature'`).
4. **Push to the branch** (`git push origin feature/AmazingFeature`).
5. **Open a Pull Request** against the `main` branch.

### Code Guidelines
- **Type Checking:** Before submitting a PR, ensure there are no TypeScript errors by running `npm run type-check` in the root directory.
- **Shared Package:** If you are modifying API request payloads or database models, update the types in `packages/shared` and run `npm run build` inside the shared package so the API and Web apps can pick up the changes.
- **Backend Security:** If you create a new endpoint, always consider what roles should have access to it. Use the `authenticate`, `requireRole`, and `requirePermission` middlewares found in `apps/api/src/middleware/auth.middleware.ts`.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

<div align="center">
  <p>Built with ❤️ by Sarvesh Avhad</p>
</div>
