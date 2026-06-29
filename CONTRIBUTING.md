# Contributing to ITSA Website

Welcome! We're excited that you're interested in contributing to the ITSA (Information Technology Students' Association) Website. This guide will help you get started with our tech stack, understand the project structure, and run the platform locally on your machine.

---

## 🌟 Project Features

The ITSA platform is a comprehensive hub for students and administrators, boasting the following features:

- **🔐 Robust Authentication**: Secure JWT-based authentication with role-based access control (Student, ITSA Member, Admin, Super Admin).
- **🎟️ Event Management & Registration**: Admins can create and manage events. Students can browse, register (Individually or as a Team), and track their registration statuses.
- **🏅 Automated Certificates**: Admins can issue certificates in bulk, and students can download/verify their authenticity instantly.
- **📸 Dynamic Gallery**: A visually stunning photo gallery to showcase past events and memories.
- **📢 Real-time Announcements**: A dedicated space for important news, updates, and broadcasts.
- **🔔 Smart Notification System**: A streamlined notification center that alerts users to important events like registration approvals, role changes, and certificate generation, without alert fatigue.
- **🧑‍💼 Committee Management**: Displays the current ITSA core committee and faculty advisors with beautiful profile cards.
- **🛡️ Audit Logging**: Complete traceability of all system actions for administrators.

---

## 📁 Project Structure

This project is built using a **Monorepo** architecture using Turborepo.

```text
📦 ITSA Website
 ┣ 📂 apps/
 ┃ ┣ 📂 api/       # Express + Prisma Backend
 ┃ ┗ 📂 web/       # React + Vite Frontend (Tailwind CSS)
 ┣ 📂 packages/
 ┃ ┣ 📂 shared/    # Shared TypeScript types, schemas, and utilities
 ┃ ┣ 📂 eslint-config/
 ┃ ┗ 📂 typescript-config/
 ┣ 📜 package.json
 ┗ 📜 turbo.json
```

---

## 🚀 Getting Started (Local Development)

Follow these steps to get the project running on your local machine:

### 1. Prerequisites
Make sure you have the following installed:
- **Node.js** (v18 or higher recommended)
- **npm** (comes with Node.js)
- **PostgreSQL** (Running locally or via Docker)

### 2. Clone the Repository
```bash
git clone <your-repository-url>
cd "ITSA Website"
```

### 3. Install Dependencies
Install all dependencies across the monorepo from the root directory:
```bash
npm install
```

### 4. Setup Environment Variables
You will need `.env` files for both the API and the Web app. 

**For the Backend (`apps/api/.env`):**
Create a `.env` file inside `apps/api` and configure your database and secrets:
```env
# Example configuration
DATABASE_URL="postgresql://user:password@localhost:5432/itsa_db?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
CLOUDINARY_URL="cloudinary://api_key:api_secret@cloud_name"
# Add your Google/Email SMTP credentials here if needed
```

**For the Frontend (`apps/web/.env`):**
Create a `.env` file inside `apps/web`:
```env
VITE_API_URL="http://localhost:3000/api"
```

### 5. Setup the Database
Navigate to the API folder and push the schema to your PostgreSQL database:
```bash
cd apps/api
npx prisma db push
```
> **Tip:** The very first user account you create on the platform will automatically be granted the `SUPER_ADMIN` role! 

### 6. Run the Application
Start both the frontend and backend simultaneously from the root directory using Turborepo:
```bash
npm run dev
```
- The **Frontend** will typically run on `http://localhost:5173`
- The **Backend API** will typically run on `http://localhost:3000`

---

## 🛠️ Things You Can Work On (Open Tasks)

Looking for a place to start? We have several exciting features on our roadmap that need implementation. Feel free to pick one up!

- **Dynamic Bulk Certification Creation**: 
  Currently, certificates are somewhat rigid. We need a dynamic builder where administrators can upload custom templates and map variables (like Name, Event, Date) to X/Y coordinates for bulk PDF generation.
  
- **Payment Gateway Integration**:
  Integrate a secure payment gateway (like Razorpay or Stripe) to handle paid event registrations directly on the platform instead of relying on external manual verification.
  
- **Admin Broadcast Dashboard**:
  Build the UI in the Admin panel that hooks into our `BROADCAST_MESSAGE` notification template, allowing admins to send custom alerts to specific roles (e.g., all Students or all ITSA Members).

- **Event Attendance Scanner**:
  Develop a mobile-friendly QR code scanner page within the admin dashboard to quickly scan student tickets at the door and mark them as "Attended".

---

## 🤝 How to Contribute

If you'd like to fix a bug or add a new feature, follow these steps:

1. **Fork the Repository**: Click the "Fork" button on GitHub to create your own copy.
2. **Create a Branch**: `git checkout -b feature/your-amazing-feature`
3. **Make your Changes**: Write clean, modular code. Don't forget to test!
4. **Commit your Changes**: `git commit -m "feat: Add amazing new feature"`
5. **Push to your Fork**: `git push origin feature/your-amazing-feature`
6. **Open a Pull Request (PR)**: Go back to the original repository on GitHub and click "New Pull Request". Provide a clear description of what you changed.

### Code Review Process
Once you submit your PR, repository maintainers will review your code. They might suggest some tweaks. Once everything looks good, your PR will be merged into the main branch!

Thank you for contributing to the ITSA community! 🎉
