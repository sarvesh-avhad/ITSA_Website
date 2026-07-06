<div align="center">
  <img src="./apps/web/public/ITSA_logo.png" alt="ITSA Logo" width="150" />
  <h1>🌟 ITSA Enterprise Platform</h1>
  <p><strong>The official, all-in-one web platform for the Information Technology Students' Association (ITSA)</strong></p>
  
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

## 📖 Overview

The **ITSA Platform** is a modern, integrated web portal designed to streamline the operations of the Information Technology Students' Association. From event registrations and public announcements to an interactive media gallery and robust administrative control, this platform bridges the gap between the student community and club administrators.

Built with performance, security, and scalability in mind, it leverages a cutting-edge **Turborepo** monorepo architecture, ensuring seamless synchronization between the frontend and backend.

---

## ✨ Core Features

### 🎓 For Students
- **🎟️ Event Discovery & Registration:** Browse upcoming events, workshops, and placement drives. Register instantly as an individual or form a team.
- **📸 Public Media Gallery:** View high-quality photo albums from past events and workshops—no account required!
- **📢 Live Announcements:** Stay up to date with the latest club news, important notices, and real-time updates.
- **📊 Personalized Dashboard:** Track your event registrations, download your tickets and QR codes, and easily manage your student profile.

### 🛡️ For Administrators
- **👥 Role-Based Access Control (RBAC):** Strict security ensuring users only have access to what they need.
- **📈 Comprehensive Management:** Create new events, oversee user registrations, approve/reject team formations, and broadcast announcements.
- **🖼️ Content Management:** Create and manage gallery albums, uploading photos to showcase ITSA's impact.
- **🔐 Audit & Security:** All sensitive actions are logged, with JWT-based authentication protecting the entire platform.

---

## 🔐 Role-Based Access Control (RBAC)

Security and organization are paramount. The platform enforces a strict, hierarchical permission system:

| Role | Access Level | Responsibilities & Capabilities |
| :--- | :--- | :--- |
| 👑 **`SUPER_ADMIN`** | **Full System Access** | The ultimate authority. Can modify system settings, access database backups, manage security protocols, and promote/demote other Admins. |
| 🛠️ **`ADMIN`** | **High-Level Management** | Core club administrators. Can create events, manage all users, approve/reject event registrations, and oversee platform operations. |
| 📝 **`ITSA_MEMBER`** | **Content & Marketing** | The creative team. Can create gallery albums, upload media, draft announcements, and view basic event data. |
| 🎓 **`USER`** | **Standard Access** | Normal students and participants. Can browse events, register for activities, view the gallery, and manage their personal dashboard. |

---

## 💻 Tech Stack

We believe in using the best tools for the job. Our stack is modern, type-safe, and incredibly fast.

### Frontend
- **Framework:** React.js (Vite)
- **Styling:** Tailwind CSS
- **State/Data:** React Query, Axios

### Backend
- **Framework:** Node.js & Express.js
- **Database:** PostgreSQL (with Prisma ORM)
- **Caching:** Redis (Rate-limiting & caching)
- **Security:** JSON Web Tokens (JWT), Zod Validation

### Architecture
- **Monorepo:** Turborepo
- **Language:** 100% TypeScript across the entire stack
- **Shared Code:** Shared types, constants, and Zod schemas between API and Web clients

---

## 🏗️ Project Structure

This project utilizes a **Monorepo** architecture to maximize code reuse and development speed.

```text
ITSA_Website/
├── apps/
│   ├── api/          # ⚙️ Express.js REST API backend
│   └── web/          # 🌐 React.js (Vite) frontend application
├── packages/
│   └── shared/       # 🧩 Shared TypeScript types, Zod schemas, and constants
├── turbo.json        # 🚀 Turborepo configuration
└── package.json      # 📦 Root dependencies and workspace setup
```

---

## 🚀 Getting Started

Want to run the platform locally? Follow these simple steps.

### Prerequisites
- [Node.js](https://nodejs.org/) (v20 or higher recommended)
- [PostgreSQL](https://www.postgresql.org/) (Local installation or cloud instance like Supabase)
- [Redis](https://redis.io/) (Required for backend caching)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/ITSA_Website.git
   cd ITSA_Website
   ```

2. **Install dependencies** (Installs for all workspaces automatically)
   ```bash
   npm install
   ```

3. **Set up Environment Variables**
   - Copy `apps/api/.env.example` to `apps/api/.env` and fill in your Database URL, Redis URL, and JWT secrets.
   - Copy `apps/web/.env.example` to `apps/web/.env` and set your API base URL.

4. **Database Setup (Prisma)**
   ```bash
   cd apps/api
   npm run db:generate
   npm run db:push
   ```
   *(Optional)* Seed the database with a default Super Admin:
   ```bash
   npm run db:seed
   ```

5. **Start the Development Server**
   From the root directory, run:
   ```bash
   npm run dev
   ```
   *Turborepo will effortlessly spin up both the API (localhost:5000) and Web app (localhost:5173) in parallel.*

---

## 🤝 Contributing

We absolutely love community contributions! Whether it's fixing a bug, designing a new UI component, or optimizing a database query—your help makes ITSA better.

Please read our [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines on how to submit a Pull Request, code style rules, and development tips.

---

## 📜 License

This project is distributed under the MIT License. See `LICENSE` for more information.

<div align="center">
  <br/>
  <p>Built with ❤️ by Sarvesh Avhad </p>
</div>
