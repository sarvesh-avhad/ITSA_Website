<div align="center">
  <h1>🤝 Contributing to the ITSA Platform</h1>
  <p>First off, thank you for considering contributing to the Information Technology Students' Association (ITSA) platform! It's people like you that make ITSA such a great community.</p>
</div>

---

## 🌟 Why Contribute?

By contributing to this repository, you'll get hands-on experience with a modern, production-ready tech stack (React, TypeScript, Turborepo, Express, PostgreSQL, Prisma) while building features that will be used by hundreds of students and faculty members.

---

## 🚀 Quick Start (Local Development)

We've made setting up the environment as frictionless as possible.

### 1. Prerequisites
Ensure you have the following installed on your machine:
- **Node.js** (v20+ recommended)
- **PostgreSQL** (Running locally, or a cloud instance like Neon/Supabase)
- **Redis** (Required for caching and rate-limiting)

### 2. Fork & Clone
```bash
# 1. Fork the repo on GitHub, then clone your fork
git clone https://github.com/<your-username>/ITSA_Website.git
cd ITSA_Website

# 2. Add the upstream repository (optional but recommended)
git remote add upstream https://github.com/your-org/ITSA_Website.git
```

### 3. Install Dependencies
Because we use **Turborepo**, installing dependencies from the root will set up all apps and packages automatically.
```bash
npm install
```

### 4. Setup Environment Variables
You need configuration files for both the API and Web apps.

**Backend (`apps/api/.env`):**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/itsa_db?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="super-secret-local-key"
```

**Frontend (`apps/web/.env`):**
```env
VITE_API_URL="http://localhost:5000/api"
```

### 5. Initialize the Database
```bash
cd apps/api
npm run db:generate
npm run db:push
npm run db:seed  # Optional: Creates default roles and test data
```
> 💡 **Tip:** The very first user account created on a fresh database is automatically granted the `SUPER_ADMIN` role!

### 6. Start the Magic 🪄
Run everything simultaneously from the root directory:
```bash
npm run dev
```
- 🌐 **Frontend:** `http://localhost:5173`
- ⚙️ **Backend:** `http://localhost:5000`

---

## 🏗️ Architecture Crash Course

We use a **Monorepo** structure powered by Turborepo to share code seamlessly between the frontend and backend.

```text
📦 ITSA_Website
 ┣ 📂 apps/
 ┃ ┣ 📂 api/       # Express.js REST API (Controllers, Routes, Prisma)
 ┃ ┗ 📂 web/       # React.js Vite Frontend (Tailwind, React Query)
 ┣ 📂 packages/
 ┃ ┗ 📂 shared/    # Shared TypeScript types, Zod schemas, constants!
 ┗ 📜 turbo.json
```
> ⚠️ **Important:** If you update a Zod schema or TypeScript interface in `packages/shared`, you must run `npm run build` inside `packages/shared` so both the API and Web apps can detect the changes!

---

## 🛠️ Open Tasks & Roadmap

Looking for a place to start? Here are some highly requested features we need help building:

- [ ] **📱 Event Attendance Scanner:** Develop a mobile-friendly QR code scanner page within the admin dashboard to quickly scan student tickets at the door and mark them as "Attended".
- [ ] **📜 Dynamic Bulk Certificates:** Create a dynamic certificate builder where administrators can upload custom templates and map variables (Name, Event, Date) to X/Y coordinates for bulk PDF generation.
- [ ] **💳 Payment Gateway Integration:** Integrate a secure payment gateway (like Razorpay or Stripe) to handle paid event registrations directly on the platform.
- [ ] **📢 Admin Broadcast Dashboard:** Build a UI in the Admin panel that hooks into our notification template, allowing admins to send custom alerts to specific roles (e.g., all Students or all ITSA Members).

---

## 🔄 The Pull Request Workflow

1. **Branch out:** Create a branch for your feature or bugfix.
   ```bash
   git checkout -b feature/amazing-new-scanner
   ```
2. **Code & Test:** Write clean, modular code. Make sure your code passes type-checking:
   ```bash
   npm run type-check
   ```
3. **Commit:** Write clear, descriptive commit messages.
   ```bash
   git commit -m "feat(admin): add QR code scanning UI for events"
   ```
4. **Push:** Push to your fork.
   ```bash
   git push origin feature/amazing-new-scanner
   ```
5. **Open a PR:** Go to the main repository and open a Pull Request. Provide screenshots if you changed the UI!

---

## 💅 Style Guidelines

- **Formatting:** We use Prettier. Ensure your editor is set to format on save.
- **TypeScript:** Avoid using `any`. Define proper types in `packages/shared` if they don't exist.
- **Tailwind:** Keep class names organized. For complex conditional classes, use the `cn()` utility function provided in `apps/web/src/lib/utils.ts`.

Thank you for contributing to the ITSA community! 🎉
