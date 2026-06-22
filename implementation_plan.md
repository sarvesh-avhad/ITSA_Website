# ITSA Enterprise Platform — Complete System Architecture & Implementation Plan

> [!IMPORTANT]
> This document contains the **complete architectural design** across 8 pillars. No code will be generated until you approve this architecture. Review each section carefully and provide feedback.

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Database Schema Design](#2-database-schema-design)
3. [API Contract](#3-api-contract)
4. [Folder Structure](#4-folder-structure)
5. [Deployment Architecture](#5-deployment-architecture)
6. [Security Architecture](#6-security-architecture)
7. [Scalability Strategy](#7-scalability-strategy)
8. [Monitoring & Observability](#8-monitoring--observability)
9. [Implementation Roadmap](#9-implementation-roadmap)
10. [Open Questions](#10-open-questions)

---

## 1. System Architecture

### 1.1 High-Level Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        WEB["React 19 SPA<br/>(Vite + TypeScript)"]
        MOBILE["Mobile Browser<br/>(Responsive PWA)"]
    end

    subgraph "CDN / Edge"
        VERCEL["Vercel Edge Network<br/>(Frontend Hosting)"]
        CF_CDN["Cloudinary CDN<br/>(Image Delivery)"]
        S3_CDN["AWS CloudFront<br/>(Video/File Delivery)"]
    end

    subgraph "API Gateway Layer"
        RAILWAY["Railway<br/>(Backend Hosting)"]
        NGINX["Reverse Proxy<br/>(Rate Limiting + CORS)"]
    end

    subgraph "Application Layer"
        API["Express.js API Server<br/>(TypeScript)"]
        WORKER["Background Worker<br/>(BullMQ)"]
    end

    subgraph "Caching Layer"
        REDIS["Redis<br/>(Cache + Sessions + Queue)"]
    end

    subgraph "Data Layer"
        PG["PostgreSQL<br/>(Primary Database)"]
        PRISMA["Prisma ORM<br/>(Data Access)"]
    end

    subgraph "External Services"
        GOOGLE["Google OAuth"]
        RESEND["Resend<br/>(Email)"]
        CLOUDINARY["Cloudinary<br/>(Image Storage)"]
        S3["AWS S3<br/>(Video/File Storage)"]
        SENTRY["Sentry<br/>(Error Tracking)"]
        GA["Google Analytics 4"]
    end

    WEB --> VERCEL
    MOBILE --> VERCEL
    VERCEL --> RAILWAY
    RAILWAY --> NGINX
    NGINX --> API
    API --> REDIS
    API --> PRISMA
    PRISMA --> PG
    API --> WORKER
    WORKER --> REDIS
    WORKER --> RESEND
    WORKER --> CLOUDINARY
    WORKER --> S3
    API --> GOOGLE
    API --> SENTRY
    WEB --> GA
    WEB --> CF_CDN
    WEB --> S3_CDN
```

### 1.2 Architecture Principles

| Principle | Implementation |
|:---|:---|
| **Separation of Concerns** | Layered architecture: Transport → Service → Repository → Data |
| **Domain-Driven Grouping** | Code organized by feature domain, not file type |
| **Type Safety End-to-End** | Shared TypeScript types between frontend and backend via `packages/shared` |
| **Immutable Infrastructure** | Docker containers, no server state mutations |
| **Fail-Safe Defaults** | All security controls default to deny; explicit allowlisting |
| **Event-Driven Processing** | Heavy work (email, PDF, image processing) offloaded to BullMQ workers |
| **Cache-First Reads** | Redis caching layer for public endpoints with TTL-based invalidation |

### 1.3 Monorepo Structure (Turborepo + pnpm)

```
itsa-platform/
├── apps/
│   ├── web/          # React 19 frontend (Vite)
│   └── api/          # Express.js backend
├── packages/
│   ├── shared/       # Shared types, constants, validators
│   ├── ui/           # shadcn/ui component library (if extracted)
│   └── config/       # Shared ESLint, Prettier, TSConfig
├── docker/
│   ├── Dockerfile.api
│   ├── Dockerfile.web
│   └── docker-compose.yml
├── .github/
│   └── workflows/
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

---

## 2. Database Schema Design

### 2.1 Entity-Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Registration : "registers for"
    User ||--o{ Team : "leads"
    User ||--o{ TeamMember : "member of"
    User ||--o{ RefreshToken : "has"
    User ||--o{ AuditLog : "creates"
    User ||--o{ BlogPost : "authors"
    User ||--o{ Certificate : "receives"
    User }o--|| Role : "has"

    Role ||--o{ RolePermission : "has"
    Permission ||--o{ RolePermission : "granted to"

    Event ||--o{ Registration : "receives"
    Event ||--o{ Team : "has teams"
    Event ||--o{ GalleryAlbum : "has albums"
    Event ||--o{ Certificate : "issues"
    Event }o--o| EventCategory : "belongs to"

    Registration }o--o| Team : "belongs to"

    GalleryAlbum ||--o{ GalleryMedia : "contains"

    Sponsor ||--o{ SponsorEvent : "sponsors"
    Event ||--o{ SponsorEvent : "sponsored by"

    BlogPost }o--o| BlogCategory : "categorized in"

    Contact |o--o| User : "submitted by"
```

### 2.2 Complete Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["fullTextSearch", "fullTextIndex"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================
// ENUMS
// ============================================================

enum UserRole {
  VISITOR
  STUDENT
  COORDINATOR
  ADMIN
  SUPER_ADMIN
}

enum EventStatus {
  DRAFT
  UPCOMING
  ONGOING
  COMPLETED
  CANCELLED
}

enum EventType {
  INDIVIDUAL
  TEAM
  BOTH
}

enum RegistrationStatus {
  PENDING
  APPROVED
  REJECTED
  WAITLISTED
  CANCELLED
}

enum MediaType {
  IMAGE
  VIDEO
}

enum SponsorTier {
  GOLD
  SILVER
  BRONZE
  TITLE
  ASSOCIATE
}

enum PostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum AnnouncementCategory {
  NOTICE
  CLUB_UPDATE
  PLACEMENT_DRIVE
  WORKSHOP
  GENERAL
}

enum ContactStatus {
  NEW
  IN_PROGRESS
  RESOLVED
  CLOSED
}

enum AuditAction {
  CREATE
  UPDATE
  DELETE
  LOGIN
  LOGOUT
  EXPORT
  APPROVE
  REJECT
  UPLOAD
  DOWNLOAD
}

// ============================================================
// MODELS
// ============================================================

model User {
  id             String    @id @default(cuid())
  email          String    @unique
  passwordHash   String?   // Null for OAuth-only users
  firstName      String
  lastName       String
  phone          String?
  prn            String?   @unique // College PRN
  branch         String?
  year           Int?
  avatarUrl      String?
  googleId       String?   @unique
  role           UserRole  @default(VISITOR)
  isActive       Boolean   @default(true)
  isEmailVerified Boolean  @default(false)
  lastLoginAt    DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  deletedAt      DateTime? // Soft delete

  // Relations
  registrations  Registration[]
  teamsLed       Team[]          @relation("TeamLeader")
  teamMembers    TeamMember[]
  refreshTokens  RefreshToken[]
  auditLogs      AuditLog[]
  blogPosts      BlogPost[]
  certificates   Certificate[]
  contacts       Contact[]

  @@index([email])
  @@index([prn])
  @@index([role])
  @@index([deletedAt])
  @@map("users")
}

model Role {
  id          String           @id @default(cuid())
  name        UserRole         @unique
  description String?
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  permissions RolePermission[]

  @@map("roles")
}

model Permission {
  id          String           @id @default(cuid())
  name        String           @unique // e.g., "events:create", "gallery:upload"
  description String?
  resource    String           // e.g., "events", "gallery", "users"
  action      String           // e.g., "create", "read", "update", "delete"
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  roles       RolePermission[]

  @@unique([resource, action])
  @@map("permissions")
}

model RolePermission {
  id           String     @id @default(cuid())
  roleId       String
  permissionId String
  createdAt    DateTime   @default(now())

  role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@unique([roleId, permissionId])
  @@map("role_permissions")
}

model Event {
  id               String       @id @default(cuid())
  title            String
  slug             String       @unique
  description      String       @db.Text
  shortDescription String?      @db.VarChar(300)
  rules            String?      @db.Text
  faqs             Json?        // Array of { question, answer }
  schedule         Json?        // Array of { time, title, description }
  bannerUrl        String?
  posterUrl        String?
  venue            String?
  startDate        DateTime
  endDate          DateTime
  registrationDeadline DateTime?
  maxParticipants  Int?
  currentCount     Int          @default(0)
  eventType        EventType    @default(INDIVIDUAL)
  status           EventStatus  @default(DRAFT)
  isFeatured       Boolean      @default(false)
  isPublished      Boolean      @default(false)
  categoryId       String?
  maxTeamSize      Int?         @default(4)
  minTeamSize      Int?         @default(2)
  createdBy        String
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt
  deletedAt        DateTime?

  // Relations
  category      EventCategory?  @relation(fields: [categoryId], references: [id])
  registrations Registration[]
  teams         Team[]
  albums        GalleryAlbum[]
  certificates  Certificate[]
  sponsors      SponsorEvent[]

  @@index([slug])
  @@index([status])
  @@index([startDate])
  @@index([categoryId])
  @@index([deletedAt])
  @@map("events")
}

model EventCategory {
  id          String   @id @default(cuid())
  name        String   @unique
  slug        String   @unique
  description String?
  color       String?  // Hex color for UI
  icon        String?  // Icon identifier
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  events      Event[]

  @@map("event_categories")
}

model Registration {
  id               String             @id @default(cuid())
  userId           String
  eventId          String
  teamId           String?
  status           RegistrationStatus @default(PENDING)
  qrCode           String?            @unique
  attendanceMarked Boolean            @default(false)
  attendanceAt     DateTime?
  formData         Json?              // Additional custom form fields
  createdAt        DateTime           @default(now())
  updatedAt        DateTime           @updatedAt
  deletedAt        DateTime?

  user  User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  event Event  @relation(fields: [eventId], references: [id], onDelete: Cascade)
  team  Team?  @relation(fields: [teamId], references: [id], onDelete: SetNull)

  @@unique([userId, eventId]) // Prevent duplicate registrations
  @@index([eventId])
  @@index([status])
  @@index([qrCode])
  @@index([deletedAt])
  @@map("registrations")
}

model Team {
  id        String   @id @default(cuid())
  name      String
  eventId   String
  leaderId  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  event         Event          @relation(fields: [eventId], references: [id], onDelete: Cascade)
  leader        User           @relation("TeamLeader", fields: [leaderId], references: [id])
  members       TeamMember[]
  registrations Registration[]

  @@unique([name, eventId]) // Unique team name per event
  @@index([eventId])
  @@map("teams")
}

model TeamMember {
  id        String   @id @default(cuid())
  teamId    String
  userId    String
  createdAt DateTime @default(now())

  team Team @relation(fields: [teamId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([teamId, userId])
  @@map("team_members")
}

model GalleryAlbum {
  id          String    @id @default(cuid())
  title       String
  slug        String    @unique
  description String?
  coverUrl    String?
  eventId     String?
  year        Int
  isPublished Boolean   @default(false)
  sortOrder   Int       @default(0)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?

  event Event?        @relation(fields: [eventId], references: [id], onDelete: SetNull)
  media GalleryMedia[]

  @@index([slug])
  @@index([eventId])
  @@index([year])
  @@index([deletedAt])
  @@map("gallery_albums")
}

model GalleryMedia {
  id          String    @id @default(cuid())
  albumId     String
  type        MediaType @default(IMAGE)
  url         String
  thumbnailUrl String?
  publicId    String?   // Cloudinary public ID or S3 key
  width       Int?
  height      Int?
  sizeBytes   Int?
  caption     String?
  sortOrder   Int       @default(0)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  album GalleryAlbum @relation(fields: [albumId], references: [id], onDelete: Cascade)

  @@index([albumId])
  @@index([type])
  @@map("gallery_media")
}

model Sponsor {
  id          String      @id @default(cuid())
  name        String
  slug        String      @unique
  logoUrl     String
  description String?     @db.Text
  websiteUrl  String?
  tier        SponsorTier
  isActive    Boolean     @default(true)
  startDate   DateTime?
  endDate     DateTime?
  clickCount  Int         @default(0)
  sortOrder   Int         @default(0)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  deletedAt   DateTime?

  events SponsorEvent[]

  @@index([tier])
  @@index([isActive])
  @@index([deletedAt])
  @@map("sponsors")
}

model SponsorEvent {
  id        String   @id @default(cuid())
  sponsorId String
  eventId   String
  year      Int
  createdAt DateTime @default(now())

  sponsor Sponsor @relation(fields: [sponsorId], references: [id], onDelete: Cascade)
  event   Event   @relation(fields: [eventId], references: [id], onDelete: Cascade)

  @@unique([sponsorId, eventId])
  @@map("sponsor_events")
}

model Announcement {
  id          String               @id @default(cuid())
  title       String
  slug        String               @unique
  content     String               @db.Text
  excerpt     String?              @db.VarChar(500)
  category    AnnouncementCategory @default(GENERAL)
  isPinned    Boolean              @default(false)
  isPublished Boolean              @default(false)
  publishedAt DateTime?
  authorId    String
  createdAt   DateTime             @default(now())
  updatedAt   DateTime             @updatedAt
  deletedAt   DateTime?

  @@index([slug])
  @@index([category])
  @@index([isPublished])
  @@index([deletedAt])
  @@map("announcements")
}

model BlogPost {
  id           String     @id @default(cuid())
  title        String
  slug         String     @unique
  content      String     @db.Text
  excerpt      String?    @db.VarChar(500)
  coverUrl     String?
  status       PostStatus @default(DRAFT)
  isFeatured   Boolean    @default(false)
  publishedAt  DateTime?
  authorId     String
  categoryId   String?
  metaTitle    String?
  metaDesc     String?    @db.VarChar(160)
  readTime     Int?       // Estimated read time in minutes
  viewCount    Int        @default(0)
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  deletedAt    DateTime?

  author   User          @relation(fields: [authorId], references: [id])
  category BlogCategory? @relation(fields: [categoryId], references: [id])

  @@index([slug])
  @@index([status])
  @@index([authorId])
  @@index([categoryId])
  @@index([deletedAt])
  @@map("blog_posts")
}

model BlogCategory {
  id          String   @id @default(cuid())
  name        String   @unique
  slug        String   @unique
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  posts BlogPost[]

  @@map("blog_categories")
}

model Contact {
  id        String        @id @default(cuid())
  name      String
  email     String
  phone     String?
  subject   String
  message   String        @db.Text
  status    ContactStatus @default(NEW)
  userId    String?
  repliedAt DateTime?
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt

  user User? @relation(fields: [userId], references: [id])

  @@index([status])
  @@index([email])
  @@map("contacts")
}

model Certificate {
  id             String   @id @default(cuid())
  certificateId  String   @unique // Human-readable ID: ITSA-2025-COF-001
  userId         String
  eventId        String
  templateId     String?
  studentName    String
  eventName      String
  date           DateTime
  position       String?  // e.g., "Winner", "Participant", "Runner-Up"
  pdfUrl         String?
  isDownloaded   Boolean  @default(false)
  downloadCount  Int      @default(0)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  user  User  @relation(fields: [userId], references: [id])
  event Event @relation(fields: [eventId], references: [id])

  @@index([certificateId])
  @@index([userId])
  @@index([eventId])
  @@map("certificates")
}

model CertificateTemplate {
  id            String   @id @default(cuid())
  name          String
  htmlTemplate  String   @db.Text
  cssStyles     String?  @db.Text
  placeholders  Json     // Array of placeholder names
  thumbnailUrl  String?
  isDefault     Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@map("certificate_templates")
}

model AuditLog {
  id         String      @id @default(cuid())
  userId     String?
  action     AuditAction
  resource   String      // e.g., "Event", "Registration"
  resourceId String?
  oldData    Json?
  newData    Json?
  ipAddress  String?
  userAgent  String?
  createdAt  DateTime    @default(now())

  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([action])
  @@index([resource])
  @@index([createdAt])
  @@map("audit_logs")
}

model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  expiresAt DateTime
  ipAddress String?
  userAgent String?
  isRevoked Boolean  @default(false)
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([userId])
  @@index([expiresAt])
  @@map("refresh_tokens")
}

model SiteConfig {
  id        String   @id @default(cuid())
  key       String   @unique // e.g., "hero_video_url", "about_content"
  value     Json     // Flexible JSON value
  section   String   // e.g., "homepage", "about"
  updatedBy String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([section])
  @@map("site_configs")
}
```

### 2.3 Key Design Decisions

| Decision | Rationale |
|:---|:---|
| **CUID IDs** | URL-safe, sortable, no enumeration attacks (unlike auto-increment) |
| **Soft Deletes** | All critical models have `deletedAt` for data recovery and audit compliance |
| **JSON Fields** | FAQs, schedules, form data use JSON for flexibility without extra tables |
| **Composite Indexes** | Unique constraints on `[userId, eventId]` prevent duplicate registrations |
| **SiteConfig Table** | CMS-like key-value store allows content edits without code changes |
| **Separate BlogCategory/EventCategory** | Independent evolution; events and blog posts have different taxonomies |
| **Certificate human-readable IDs** | Format `ITSA-YYYY-EVT-NNN` for easy verification and sharing |

---

## 3. API Contract

### 3.1 Response Format Standard

All API responses follow a consistent envelope:

```typescript
// Success Response
{
  success: true,
  data: T,
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
}

// Error Response
{
  success: false,
  error: {
    code: string;       // e.g., "VALIDATION_ERROR"
    message: string;    // Human-readable
    details?: any[];    // Zod validation errors
    requestId: string;  // For tracing
  }
}
```

### 3.2 Complete API Endpoints

#### Authentication (`/api/v1/auth`)

| Method | Endpoint | Auth | Role | Description |
|:---|:---|:---|:---|:---|
| `POST` | `/register` | ✗ | — | Register new user |
| `POST` | `/login` | ✗ | — | Login with email/password |
| `POST` | `/google` | ✗ | — | Google OAuth callback |
| `POST` | `/refresh` | ✗ | — | Refresh access token |
| `POST` | `/logout` | ✓ | Any | Revoke refresh token |
| `POST` | `/forgot-password` | ✗ | — | Send password reset email |
| `POST` | `/reset-password` | ✗ | — | Reset password with token |
| `GET`  | `/me` | ✓ | Any | Get current user profile |
| `PATCH`| `/me` | ✓ | Any | Update current user profile |

#### Events (`/api/v1/events`)

| Method | Endpoint | Auth | Role | Description |
|:---|:---|:---|:---|:---|
| `GET` | `/` | ✗ | — | List events (search, filter, paginate) |
| `GET` | `/:slug` | ✗ | — | Get event by slug |
| `POST` | `/` | ✓ | Admin+ | Create event |
| `PATCH` | `/:id` | ✓ | Admin+ | Update event |
| `DELETE` | `/:id` | ✓ | Admin+ | Soft-delete event |
| `GET` | `/:id/registrations` | ✓ | Coord+ | List registrations for event |
| `GET` | `/:id/registrations/export` | ✓ | Admin+ | Export registrations CSV |
| `PATCH` | `/:id/registrations/:regId` | ✓ | Coord+ | Approve/reject registration |
| `POST` | `/:id/attendance/:regId` | ✓ | Coord+ | Mark attendance via QR |
| `GET` | `/categories` | ✗ | — | List event categories |
| `POST` | `/categories` | ✓ | Admin+ | Create category |

#### Registrations (`/api/v1/registrations`)

| Method | Endpoint | Auth | Role | Description |
|:---|:---|:---|:---|:---|
| `POST` | `/individual` | ✓ | Student+ | Register individually |
| `POST` | `/team` | ✓ | Student+ | Register as team |
| `GET` | `/my` | ✓ | Student+ | Get my registrations |
| `GET` | `/:id` | ✓ | Student+ | Get registration detail |
| `DELETE` | `/:id` | ✓ | Student+ | Cancel my registration |
| `GET` | `/:id/qr` | ✓ | Student+ | Get registration QR code |

#### Gallery (`/api/v1/gallery`)

| Method | Endpoint | Auth | Role | Description |
|:---|:---|:---|:---|:---|
| `GET` | `/albums` | ✗ | — | List albums (search, filter, paginate) |
| `GET` | `/albums/:slug` | ✗ | — | Get album with media |
| `POST` | `/albums` | ✓ | Coord+ | Create album |
| `PATCH` | `/albums/:id` | ✓ | Coord+ | Update album |
| `DELETE` | `/albums/:id` | ✓ | Admin+ | Delete album |
| `POST` | `/albums/:id/media` | ✓ | Coord+ | Upload media (bulk) |
| `DELETE` | `/media/:id` | ✓ | Coord+ | Delete single media |
| `PATCH` | `/media/:id` | ✓ | Coord+ | Update media metadata |

#### Sponsors (`/api/v1/sponsors`)

| Method | Endpoint | Auth | Role | Description |
|:---|:---|:---|:---|:---|
| `GET` | `/` | ✗ | — | List active sponsors |
| `GET` | `/:slug` | ✗ | — | Get sponsor detail |
| `POST` | `/` | ✓ | Admin+ | Create sponsor |
| `PATCH` | `/:id` | ✓ | Admin+ | Update sponsor |
| `DELETE` | `/:id` | ✓ | Admin+ | Delete sponsor |
| `POST` | `/:id/click` | ✗ | — | Track sponsor click |

#### Announcements (`/api/v1/announcements`)

| Method | Endpoint | Auth | Role | Description |
|:---|:---|:---|:---|:---|
| `GET` | `/` | ✗ | — | List announcements |
| `GET` | `/:slug` | ✗ | — | Get announcement detail |
| `POST` | `/` | ✓ | Coord+ | Create announcement |
| `PATCH` | `/:id` | ✓ | Coord+ | Update announcement |
| `DELETE` | `/:id` | ✓ | Admin+ | Delete announcement |

#### Blog (`/api/v1/blog`)

| Method | Endpoint | Auth | Role | Description |
|:---|:---|:---|:---|:---|
| `GET` | `/posts` | ✗ | — | List published posts |
| `GET` | `/posts/:slug` | ✗ | — | Get post by slug |
| `POST` | `/posts` | ✓ | Coord+ | Create post |
| `PATCH` | `/posts/:id` | ✓ | Coord+ | Update post |
| `DELETE` | `/posts/:id` | ✓ | Admin+ | Delete post |
| `PATCH` | `/posts/:id/publish` | ✓ | Admin+ | Publish/unpublish post |
| `GET` | `/categories` | ✗ | — | List blog categories |

#### Certificates (`/api/v1/certificates`)

| Method | Endpoint | Auth | Role | Description |
|:---|:---|:---|:---|:---|
| `GET` | `/my` | ✓ | Student+ | Get my certificates |
| `GET` | `/verify/:certificateId` | ✗ | — | Public certificate verification |
| `GET` | `/:id/download` | ✓ | Student+ | Download certificate PDF |
| `POST` | `/generate` | ✓ | Admin+ | Bulk generate certificates |
| `POST` | `/templates` | ✓ | Admin+ | Create certificate template |
| `GET` | `/templates` | ✓ | Admin+ | List templates |

#### Users & Admin (`/api/v1/admin`)

| Method | Endpoint | Auth | Role | Description |
|:---|:---|:---|:---|:---|
| `GET` | `/users` | ✓ | Admin+ | List all users |
| `PATCH` | `/users/:id` | ✓ | Admin+ | Update user |
| `PATCH` | `/users/:id/role` | ✓ | SuperAdmin | Change user role |
| `PATCH` | `/users/:id/status` | ✓ | Admin+ | Activate/deactivate user |
| `GET` | `/analytics/dashboard` | ✓ | Coord+ | Dashboard KPIs |
| `GET` | `/analytics/registrations` | ✓ | Coord+ | Registration analytics |
| `GET` | `/analytics/traffic` | ✓ | Admin+ | Traffic analytics |
| `GET` | `/analytics/events` | ✓ | Coord+ | Event analytics |
| `GET` | `/audit-logs` | ✓ | SuperAdmin | View audit logs |

#### CMS (`/api/v1/cms`)

| Method | Endpoint | Auth | Role | Description |
|:---|:---|:---|:---|:---|
| `GET` | `/config/:section` | ✗ | — | Get section config |
| `PUT` | `/config/:section` | ✓ | Admin+ | Update section config |
| `GET` | `/config` | ✓ | Admin+ | Get all configs |

#### Contact (`/api/v1/contact`)

| Method | Endpoint | Auth | Role | Description |
|:---|:---|:---|:---|:---|
| `POST` | `/` | ✗ | — | Submit contact form |
| `GET` | `/` | ✓ | Admin+ | List contacts |
| `PATCH` | `/:id` | ✓ | Admin+ | Update contact status |

#### Search (`/api/v1/search`)

| Method | Endpoint | Auth | Role | Description |
|:---|:---|:---|:---|:---|
| `GET` | `/?q=...&type=...` | ✗ | — | Global search across entities |

#### Health (`/api/v1`)

| Method | Endpoint | Auth | Role | Description |
|:---|:---|:---|:---|:---|
| `GET` | `/health` | ✗ | — | Health check (DB + Redis) |
| `GET` | `/health/deep` | ✗ | — | Deep health check (all deps) |

### 3.3 Role Permission Matrix

| Permission | Visitor | Student | Coordinator | Admin | Super Admin |
|:---|:---:|:---:|:---:|:---:|:---:|
| View public pages | ✓ | ✓ | ✓ | ✓ | ✓ |
| Register for events | ✗ | ✓ | ✓ | ✓ | ✓ |
| View own registrations | ✗ | ✓ | ✓ | ✓ | ✓ |
| Download certificates | ✗ | ✓ | ✓ | ✓ | ✓ |
| Create/edit events | ✗ | ✗ | ✓ | ✓ | ✓ |
| Manage registrations | ✗ | ✗ | ✓ | ✓ | ✓ |
| Upload gallery | ✗ | ✗ | ✓ | ✓ | ✓ |
| Create announcements | ✗ | ✗ | ✓ | ✓ | ✓ |
| Write blog posts | ✗ | ✗ | ✓ | ✓ | ✓ |
| Manage sponsors | ✗ | ✗ | ✗ | ✓ | ✓ |
| Manage users | ✗ | ✗ | ✗ | ✓ | ✓ |
| Edit CMS content | ✗ | ✗ | ✗ | ✓ | ✓ |
| Generate certificates | ✗ | ✗ | ✗ | ✓ | ✓ |
| Export data | ✗ | ✗ | ✗ | ✓ | ✓ |
| View audit logs | ✗ | ✗ | ✗ | ✗ | ✓ |
| Change user roles | ✗ | ✗ | ✗ | ✗ | ✓ |
| System configuration | ✗ | ✗ | ✗ | ✗ | ✓ |

---

## 4. Folder Structure

### 4.1 Frontend (`apps/web`)

```
apps/web/
├── public/
│   ├── favicon.ico
│   ├── robots.txt
│   ├── sitemap.xml
│   └── videos/              # Hero background video
├── src/
│   ├── app/
│   │   ├── routes/           # React Router v7 route components
│   │   │   ├── _layout.tsx          # Root layout (nav + footer)
│   │   │   ├── _admin-layout.tsx    # Admin layout (sidebar)
│   │   │   ├── home.tsx
│   │   │   ├── about.tsx
│   │   │   ├── events/
│   │   │   │   ├── index.tsx        # Events listing
│   │   │   │   └── [slug].tsx       # Event detail
│   │   │   ├── gallery/
│   │   │   │   ├── index.tsx
│   │   │   │   └── [slug].tsx
│   │   │   ├── sponsors.tsx
│   │   │   ├── announcements/
│   │   │   │   ├── index.tsx
│   │   │   │   └── [slug].tsx
│   │   │   ├── blog/
│   │   │   │   ├── index.tsx
│   │   │   │   └── [slug].tsx
│   │   │   ├── contact.tsx
│   │   │   ├── certificates/
│   │   │   │   ├── verify.tsx       # Public verify page
│   │   │   │   └── my.tsx           # My certificates
│   │   │   ├── auth/
│   │   │   │   ├── login.tsx
│   │   │   │   ├── register.tsx
│   │   │   │   ├── forgot-password.tsx
│   │   │   │   └── reset-password.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── index.tsx        # Student dashboard
│   │   │   │   └── registrations.tsx
│   │   │   └── admin/
│   │   │       ├── index.tsx        # Admin dashboard
│   │   │       ├── events/
│   │   │       │   ├── index.tsx
│   │   │       │   ├── new.tsx
│   │   │       │   └── [id]/
│   │   │       │       ├── edit.tsx
│   │   │       │       └── registrations.tsx
│   │   │       ├── gallery/
│   │   │       │   ├── index.tsx
│   │   │       │   └── [id].tsx
│   │   │       ├── sponsors/
│   │   │       ├── announcements/
│   │   │       ├── blog/
│   │   │       ├── certificates/
│   │   │       ├── users/
│   │   │       ├── cms/
│   │   │       ├── contacts/
│   │   │       └── audit-logs/
│   │   ├── router.tsx               # Route definitions
│   │   └── providers.tsx            # React Query, Auth, Theme
│   ├── components/
│   │   ├── ui/                      # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── table.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ...                  # All shadcn components
│   │   ├── layout/
│   │   │   ├── navbar.tsx
│   │   │   ├── footer.tsx
│   │   │   ├── sidebar.tsx          # Admin sidebar
│   │   │   ├── mobile-nav.tsx
│   │   │   └── breadcrumbs.tsx
│   │   ├── home/
│   │   │   ├── hero-section.tsx
│   │   │   ├── about-section.tsx
│   │   │   ├── events-section.tsx
│   │   │   ├── stats-section.tsx
│   │   │   ├── gallery-section.tsx
│   │   │   ├── sponsors-section.tsx
│   │   │   ├── testimonials-section.tsx
│   │   │   └── contact-section.tsx
│   │   ├── events/
│   │   │   ├── event-card.tsx
│   │   │   ├── event-filters.tsx
│   │   │   ├── event-countdown.tsx
│   │   │   ├── registration-form.tsx
│   │   │   └── team-registration-form.tsx
│   │   ├── gallery/
│   │   │   ├── album-card.tsx
│   │   │   ├── lightbox.tsx
│   │   │   ├── media-grid.tsx
│   │   │   └── video-player.tsx
│   │   ├── certificates/
│   │   │   ├── certificate-card.tsx
│   │   │   └── verify-result.tsx
│   │   ├── admin/
│   │   │   ├── dashboard-cards.tsx
│   │   │   ├── charts/
│   │   │   │   ├── registration-chart.tsx
│   │   │   │   ├── traffic-chart.tsx
│   │   │   │   └── event-analytics.tsx
│   │   │   ├── data-table.tsx       # Reusable admin table
│   │   │   └── bulk-upload.tsx
│   │   └── shared/
│   │       ├── seo-head.tsx
│   │       ├── loading-spinner.tsx
│   │       ├── error-boundary.tsx
│   │       ├── infinite-scroll.tsx
│   │       ├── search-bar.tsx
│   │       ├── social-share.tsx
│   │       └── qr-code.tsx
│   ├── hooks/
│   │   ├── use-auth.ts
│   │   ├── use-debounce.ts
│   │   ├── use-intersection.ts
│   │   ├── use-media-query.ts
│   │   └── use-scroll-position.ts
│   ├── lib/
│   │   ├── api-client.ts            # Axios instance with interceptors
│   │   ├── auth.ts                  # Token management
│   │   ├── cloudinary.ts            # Cloudinary URL helpers
│   │   ├── constants.ts
│   │   ├── sentry.ts                # Sentry init
│   │   ├── analytics.ts             # GA4 helpers
│   │   └── utils.ts                 # cn(), formatDate(), etc.
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── events.service.ts
│   │   ├── gallery.service.ts
│   │   ├── registrations.service.ts
│   │   ├── sponsors.service.ts
│   │   ├── announcements.service.ts
│   │   ├── blog.service.ts
│   │   ├── certificates.service.ts
│   │   ├── admin.service.ts
│   │   ├── cms.service.ts
│   │   └── search.service.ts
│   ├── stores/
│   │   ├── auth.store.ts            # Zustand auth store
│   │   └── ui.store.ts              # UI state (sidebar, theme)
│   ├── types/
│   │   └── index.ts                 # Re-export from @itsa/shared
│   ├── validators/
│   │   ├── auth.schema.ts
│   │   ├── event.schema.ts
│   │   └── registration.schema.ts
│   ├── styles/
│   │   ├── globals.css
│   │   └── fonts.css
│   ├── main.tsx
│   └── vite-env.d.ts
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── components.json                   # shadcn/ui config
└── package.json
```

### 4.2 Backend (`apps/api`)

```
apps/api/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts                      # Database seeding
│   └── migrations/
├── src/
│   ├── config/
│   │   ├── env.ts                   # Zod-validated env config
│   │   ├── cors.ts
│   │   ├── redis.ts
│   │   ├── cloudinary.ts
│   │   ├── s3.ts
│   │   ├── sentry.ts
│   │   └── opentelemetry.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts       # JWT verification
│   │   ├── rbac.middleware.ts       # Role-based access control
│   │   ├── rate-limit.middleware.ts
│   │   ├── validate.middleware.ts   # Zod request validation
│   │   ├── audit.middleware.ts      # Audit logging
│   │   ├── error.middleware.ts      # Global error handler
│   │   ├── cors.middleware.ts
│   │   ├── request-id.middleware.ts
│   │   └── cache.middleware.ts      # Redis cache middleware
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.validators.ts
│   │   │   └── strategies/
│   │   │       ├── jwt.strategy.ts
│   │   │       └── google.strategy.ts
│   │   ├── events/
│   │   │   ├── events.controller.ts
│   │   │   ├── events.service.ts
│   │   │   ├── events.routes.ts
│   │   │   ├── events.validators.ts
│   │   │   └── events.repository.ts
│   │   ├── registrations/
│   │   │   ├── registrations.controller.ts
│   │   │   ├── registrations.service.ts
│   │   │   ├── registrations.routes.ts
│   │   │   ├── registrations.validators.ts
│   │   │   └── registrations.repository.ts
│   │   ├── gallery/
│   │   │   ├── gallery.controller.ts
│   │   │   ├── gallery.service.ts
│   │   │   ├── gallery.routes.ts
│   │   │   ├── gallery.validators.ts
│   │   │   └── gallery.repository.ts
│   │   ├── sponsors/
│   │   │   ├── sponsors.controller.ts
│   │   │   ├── sponsors.service.ts
│   │   │   ├── sponsors.routes.ts
│   │   │   └── sponsors.validators.ts
│   │   ├── announcements/
│   │   │   ├── announcements.controller.ts
│   │   │   ├── announcements.service.ts
│   │   │   ├── announcements.routes.ts
│   │   │   └── announcements.validators.ts
│   │   ├── blog/
│   │   │   ├── blog.controller.ts
│   │   │   ├── blog.service.ts
│   │   │   ├── blog.routes.ts
│   │   │   └── blog.validators.ts
│   │   ├── certificates/
│   │   │   ├── certificates.controller.ts
│   │   │   ├── certificates.service.ts
│   │   │   ├── certificates.routes.ts
│   │   │   ├── certificates.validators.ts
│   │   │   └── pdf-generator.ts
│   │   ├── users/
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.routes.ts
│   │   │   └── users.validators.ts
│   │   ├── admin/
│   │   │   ├── admin.controller.ts
│   │   │   ├── admin.service.ts
│   │   │   ├── admin.routes.ts
│   │   │   └── analytics.service.ts
│   │   ├── cms/
│   │   │   ├── cms.controller.ts
│   │   │   ├── cms.service.ts
│   │   │   └── cms.routes.ts
│   │   ├── contact/
│   │   │   ├── contact.controller.ts
│   │   │   ├── contact.service.ts
│   │   │   └── contact.routes.ts
│   │   └── search/
│   │       ├── search.controller.ts
│   │       ├── search.service.ts
│   │       └── search.routes.ts
│   ├── jobs/
│   │   ├── queue.ts                 # BullMQ queue setup
│   │   ├── worker.ts               # Worker entry point
│   │   ├── email.job.ts
│   │   ├── certificate.job.ts
│   │   ├── image-optimization.job.ts
│   │   └── backup.job.ts
│   ├── lib/
│   │   ├── prisma.ts               # Singleton Prisma client
│   │   ├── redis.ts                # Redis client
│   │   ├── logger.ts              # Structured logging (pino)
│   │   ├── email.ts               # Resend client
│   │   ├── cloudinary.ts          # Upload helpers
│   │   ├── s3.ts                  # S3 upload/streaming
│   │   ├── qr.ts                  # QR code generation
│   │   └── errors.ts             # Custom error classes
│   ├── types/
│   │   ├── express.d.ts           # Express type augmentation
│   │   └── index.ts
│   ├── utils/
│   │   ├── pagination.ts
│   │   ├── slug.ts
│   │   ├── csv-export.ts
│   │   └── date.ts
│   ├── app.ts                     # Express app setup
│   ├── server.ts                  # Server entry point
│   └── routes.ts                  # Route aggregator
├── tests/
│   ├── unit/
│   ├── integration/
│   └── setup.ts
├── Dockerfile
├── tsconfig.json
├── package.json
├── .env.example
└── railway.toml
```

### 4.3 Shared Package (`packages/shared`)

```
packages/shared/
├── src/
│   ├── types/
│   │   ├── auth.types.ts
│   │   ├── event.types.ts
│   │   ├── registration.types.ts
│   │   ├── gallery.types.ts
│   │   ├── sponsor.types.ts
│   │   ├── blog.types.ts
│   │   ├── certificate.types.ts
│   │   ├── user.types.ts
│   │   ├── api.types.ts          # Response envelope types
│   │   └── index.ts
│   ├── validators/
│   │   ├── auth.validators.ts
│   │   ├── event.validators.ts
│   │   ├── registration.validators.ts
│   │   └── index.ts
│   ├── constants/
│   │   ├── roles.ts
│   │   ├── permissions.ts
│   │   └── index.ts
│   └── index.ts
├── tsconfig.json
└── package.json
```

---

## 5. Deployment Architecture

### 5.1 Deployment Diagram

```mermaid
graph LR
    subgraph "Developer"
        DEV["Local Dev<br/>Docker Compose"]
    end

    subgraph "CI/CD"
        GH["GitHub Actions"]
    end

    subgraph "Frontend Hosting"
        VERCEL["Vercel<br/>Edge Network"]
    end

    subgraph "Backend Hosting (Railway)"
        API_SVC["API Service<br/>(Docker Container)"]
        WORKER_SVC["Worker Service<br/>(Docker Container)"]
        PG["PostgreSQL<br/>(Managed)"]
        REDIS_SVC["Redis<br/>(Managed)"]
    end

    subgraph "Storage"
        CLOUDINARY_SVC["Cloudinary<br/>(Images)"]
        S3_SVC["AWS S3<br/>(Videos + Files)"]
        CF["CloudFront<br/>(CDN for S3)"]
    end

    subgraph "Monitoring"
        SENTRY_SVC["Sentry<br/>(Errors)"]
        OTEL["OpenTelemetry<br/>(Traces)"]
    end

    DEV --> GH
    GH --> VERCEL
    GH --> API_SVC
    GH --> WORKER_SVC
    API_SVC --> PG
    API_SVC --> REDIS_SVC
    WORKER_SVC --> REDIS_SVC
    WORKER_SVC --> CLOUDINARY_SVC
    WORKER_SVC --> S3_SVC
    S3_SVC --> CF
    API_SVC --> SENTRY_SVC
    API_SVC --> OTEL
```

### 5.2 Environment Variables

```bash
# ===========================================
# Backend (.env)
# ===========================================

# Server
NODE_ENV=production
PORT=3000
API_VERSION=v1
CORS_ORIGIN=https://itsa.college.edu

# Database
DATABASE_URL=postgresql://user:pass@host:5432/itsa_db
DATABASE_PRIVATE_URL=postgresql://user:pass@postgres.railway.internal:5432/itsa_db

# Redis
REDIS_URL=redis://default:pass@redis.railway.internal:6379

# JWT
JWT_ACCESS_SECRET=<64-char-hex>
JWT_REFRESH_SECRET=<64-char-hex>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Google OAuth
GOOGLE_CLIENT_ID=<client-id>
GOOGLE_CLIENT_SECRET=<client-secret>
GOOGLE_CALLBACK_URL=https://api.itsa.college.edu/api/v1/auth/google/callback

# Cloudinary
CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_API_SECRET=<api-secret>

# AWS S3
AWS_ACCESS_KEY_ID=<access-key>
AWS_SECRET_ACCESS_KEY=<secret-key>
AWS_REGION=ap-south-1
AWS_S3_BUCKET=itsa-media
AWS_CLOUDFRONT_URL=https://d1234567.cloudfront.net

# Email (Resend)
RESEND_API_KEY=<resend-api-key>
EMAIL_FROM=noreply@itsa.college.edu

# Sentry
SENTRY_DSN=<sentry-dsn>

# OpenTelemetry
OTEL_EXPORTER_OTLP_ENDPOINT=<otlp-endpoint>
OTEL_SERVICE_NAME=itsa-api

# ===========================================
# Frontend (.env)
# ===========================================
VITE_API_URL=https://api.itsa.college.edu/api/v1
VITE_GOOGLE_CLIENT_ID=<client-id>
VITE_CLOUDINARY_CLOUD_NAME=<cloud-name>
VITE_CLOUDFRONT_URL=https://d1234567.cloudfront.net
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_SENTRY_DSN=<frontend-sentry-dsn>
```

### 5.3 Docker Configuration

```yaml
# docker-compose.yml (Development)
version: '3.9'

services:
  api:
    build:
      context: .
      dockerfile: docker/Dockerfile.api
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://itsa:itsa_pass@postgres:5432/itsa_db
      - REDIS_URL=redis://redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./apps/api/src:/app/apps/api/src
      - ./packages:/app/packages

  worker:
    build:
      context: .
      dockerfile: docker/Dockerfile.api
    command: ["node", "dist/jobs/worker.js"]
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://itsa:itsa_pass@postgres:5432/itsa_db
      - REDIS_URL=redis://redis:6379
    depends_on:
      - api

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: itsa
      POSTGRES_PASSWORD: itsa_pass
      POSTGRES_DB: itsa_db
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U itsa"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redisdata:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
  redisdata:
```

### 5.4 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy ITSA Platform

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm run lint
      - run: pnpm run type-check
      - run: pnpm run test

  deploy-api:
    needs: lint-and-test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: railwayapp/cli-action@v1
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: api

  deploy-web:
    needs: lint-and-test
    if: github.ref == 'refs/heads/main'
    # Vercel auto-deploys from GitHub integration
    runs-on: ubuntu-latest
    steps:
      - run: echo "Frontend auto-deploys via Vercel GitHub integration"
```

---

## 6. Security Architecture

### 6.1 Security Layers Diagram

```mermaid
graph TB
    REQ["Incoming Request"] --> HTTPS["1. HTTPS/TLS<br/>(Vercel/Railway)"]
    HTTPS --> HELMET["2. Helmet<br/>(Security Headers)"]
    HELMET --> CORS_L["3. CORS<br/>(Origin Whitelist)"]
    CORS_L --> RATE["4. Rate Limiting<br/>(Redis-backed)"]
    RATE --> CSRF_L["5. CSRF Protection<br/>(Double Submit Cookie)"]
    CSRF_L --> REQID["6. Request ID<br/>(Tracing)"]
    REQID --> AUTH_L["7. JWT Authentication<br/>(Access Token)"]
    AUTH_L --> RBAC_L["8. RBAC Authorization<br/>(Permission Check)"]
    RBAC_L --> VALIDATE["9. Input Validation<br/>(Zod Schemas)"]
    VALIDATE --> SANITIZE["10. XSS Sanitization<br/>(DOMPurify)"]
    SANITIZE --> CONTROLLER["11. Controller Logic"]
    CONTROLLER --> AUDIT["12. Audit Logging"]
```

### 6.2 Security Implementation Details

| Layer | Technology | Configuration |
|:---|:---|:---|
| **HTTPS** | Vercel/Railway automatic TLS | Force HTTPS redirect; HSTS header |
| **Helmet** | `helmet` npm package | Content-Security-Policy, X-Frame-Options, X-Content-Type-Options |
| **CORS** | Custom middleware | Whitelist `CORS_ORIGIN`; no wildcards in production |
| **Rate Limiting** | `express-rate-limit` + `rate-limit-redis` | Global: 100 req/15min; Auth: 5 req/15min; Upload: 10 req/hour |
| **CSRF** | Double-submit cookie pattern | CSRF token in cookie + header; validated on state-changing requests |
| **JWT** | `jsonwebtoken` + bcrypt | Access: 15min, RS256; Refresh: 7d, stored in DB, rotatable |
| **RBAC** | Custom middleware | Hierarchy: SuperAdmin > Admin > Coord > Student > Visitor |
| **Validation** | Zod | All request bodies, query params, and path params validated |
| **XSS** | `isomorphic-dompurify` | Sanitize all user-generated HTML (blog content, announcements) |
| **SQL Injection** | Prisma ORM | Parameterized queries by default; raw queries use `$queryRaw` tagged templates |
| **Password Hashing** | bcrypt | Cost factor: 12 rounds |
| **Audit Logging** | Custom middleware | All write operations logged with user, IP, user-agent, old/new data |

### 6.3 JWT Token Architecture

```
┌────────────────────────────────────┐
│ Access Token (15 min)              │
│ ─ Stored in memory (JS variable)  │
│ ─ Sent via Authorization header   │
│ ─ Contains: userId, role, email   │
│ ─ Signed with JWT_ACCESS_SECRET   │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ Refresh Token (7 days)             │
│ ─ Stored in httpOnly cookie       │
│ ─ Stored in DB (RefreshToken)     │
│ ─ Rotated on every refresh        │
│ ─ Revocable per user/session      │
│ ─ Signed with JWT_REFRESH_SECRET  │
└────────────────────────────────────┘
```

### 6.4 Rate Limiting Strategy

| Endpoint Category | Limit | Window | Storage |
|:---|:---|:---|:---|
| Global API | 100 requests | 15 minutes | Redis |
| Authentication (login/register) | 5 requests | 15 minutes | Redis |
| Password Reset | 3 requests | 1 hour | Redis |
| File Upload | 10 requests | 1 hour | Redis |
| Contact Form | 3 requests | 1 hour | Redis |
| Search | 30 requests | 1 minute | Redis |
| Admin API | 200 requests | 15 minutes | Redis |

### 6.5 Security Review Checklist

- [ ] All endpoints require authentication except explicitly public ones
- [ ] All request inputs validated with Zod before processing
- [ ] All user-generated HTML sanitized before storage and rendering
- [ ] Passwords hashed with bcrypt (12 rounds) before storage
- [ ] JWT tokens use short expiry (15min access) with refresh rotation
- [ ] Refresh tokens stored in httpOnly, Secure, SameSite=Strict cookies
- [ ] CORS restricted to exact production domain
- [ ] Rate limiting applied to all endpoints, stricter for auth/upload
- [ ] Helmet enabled with strict Content-Security-Policy
- [ ] All file uploads validated (type, size, dimensions)
- [ ] Database queries use parameterized queries (Prisma default)
- [ ] Audit logs capture all write operations with before/after data
- [ ] Environment secrets never committed to version control
- [ ] S3 bucket policy restricts public access; signed URLs for private files
- [ ] Google OAuth state parameter validated to prevent CSRF
- [ ] Error responses never expose stack traces or internal details in production

---

## 7. Scalability Strategy

### 7.1 Frontend Performance

| Strategy | Implementation |
|:---|:---|
| **Code Splitting** | React.lazy() + Suspense for all routes; dynamic import for admin panel |
| **Tree Shaking** | Vite production build; individual shadcn/ui imports |
| **Image Optimization** | Cloudinary auto-format (WebP/AVIF); responsive `srcset` via URL transforms |
| **Video Optimization** | S3 + CloudFront; lazy-loaded `<video>` with poster frame |
| **Bundle Analysis** | `rollup-plugin-visualizer` in CI; budget alerts for chunks > 250KB |
| **Font Loading** | `font-display: swap`; preloaded Google Fonts (Inter) |
| **Prefetching** | `<link rel="prefetch">` for likely next-page assets |
| **Service Worker** | Precache critical assets; offline-first for static pages |

### 7.2 Backend Performance

| Strategy | Implementation |
|:---|:---|
| **Redis Caching** | Cache public endpoints (events list, sponsors, gallery) with 5-15min TTL |
| **Cache Invalidation** | Write-through: invalidate on create/update/delete via service layer |
| **Database Indexing** | Composite indexes on frequent query patterns (see Prisma schema) |
| **Connection Pooling** | Prisma connection pool (default 5, configurable via `connection_limit`) |
| **Query Optimization** | Select only needed fields; avoid N+1 with `include`; use raw SQL for analytics |
| **Pagination** | Cursor-based pagination for infinite scroll; offset for admin tables |
| **Background Jobs** | BullMQ workers for email, PDF generation, image optimization |
| **Compression** | `compression` middleware (gzip/brotli) for API responses |
| **Response Streaming** | Streaming CSV exports for large datasets |

### 7.3 Caching Strategy

```mermaid
graph LR
    subgraph "Read Flow"
        REQ_R["GET /events"] --> CACHE_CHECK{"Redis<br/>Cache Hit?"}
        CACHE_CHECK -->|Yes| RETURN_CACHED["Return Cached<br/>(< 1ms)"]
        CACHE_CHECK -->|No| DB_QUERY["Query PostgreSQL"]
        DB_QUERY --> SET_CACHE["Set Cache<br/>(TTL: 5min)"]
        SET_CACHE --> RETURN_FRESH["Return Fresh"]
    end

    subgraph "Write Flow"
        REQ_W["POST /events"] --> WRITE_DB["Write PostgreSQL"]
        WRITE_DB --> INVALIDATE["Invalidate Cache<br/>(events:*)"]
        INVALIDATE --> RETURN_W["Return Response"]
    end
```

| Cache Key Pattern | TTL | Invalidation Trigger |
|:---|:---|:---|
| `events:list:{page}:{filters}` | 5 min | Event create/update/delete |
| `events:detail:{slug}` | 10 min | Event update/delete |
| `gallery:albums:{page}` | 15 min | Album create/update/delete |
| `sponsors:active` | 30 min | Sponsor create/update/delete |
| `cms:config:{section}` | 60 min | CMS config update |
| `search:{query}:{type}` | 2 min | Any content change |
| `analytics:dashboard` | 5 min | Periodic refresh |

### 7.4 Database Scaling Path

| Phase | Users | Strategy |
|:---|:---|:---|
| **MVP** (0–1K) | < 1,000 | Single Railway PostgreSQL; Prisma defaults |
| **Growth** (1K–10K) | 1,000–10,000 | Read replicas; connection pooling via PgBouncer; Redis caching |
| **Scale** (10K–50K) | 10,000–50,000 | Horizontal API scaling; dedicated Redis cluster; CDN for all static |
| **Enterprise** (50K+) | 50,000+ | Managed PostgreSQL (AWS RDS); table partitioning by year; full-text search via Meilisearch |

---

## 8. Monitoring & Observability

### 8.1 Observability Stack

```mermaid
graph TB
    subgraph "Application"
        API_M["Express API"]
        WORKER_M["BullMQ Worker"]
    end

    subgraph "Logging"
        PINO["Pino Logger<br/>(Structured JSON)"]
        RAILWAY_LOG["Railway Logs<br/>(Log Drain)"]
    end

    subgraph "Error Tracking"
        SENTRY_M["Sentry<br/>(Errors + Performance)"]
    end

    subgraph "Tracing"
        OTEL_M["OpenTelemetry SDK"]
        OTEL_COLLECTOR["OTLP Collector"]
    end

    subgraph "Metrics"
        HEALTH["Health Endpoints<br/>(/health, /health/deep)"]
        GA_M["Google Analytics 4<br/>(Frontend)"]
    end

    API_M --> PINO
    WORKER_M --> PINO
    PINO --> RAILWAY_LOG
    API_M --> SENTRY_M
    WORKER_M --> SENTRY_M
    API_M --> OTEL_M
    OTEL_M --> OTEL_COLLECTOR
    API_M --> HEALTH
```

### 8.2 Health Check Endpoints

```typescript
// GET /api/v1/health
{
  status: "healthy",
  timestamp: "2026-06-22T10:00:00Z",
  uptime: 3600,
  version: "1.0.0"
}

// GET /api/v1/health/deep
{
  status: "healthy",
  checks: {
    database: { status: "healthy", latency: "12ms" },
    redis: { status: "healthy", latency: "2ms" },
    cloudinary: { status: "healthy" },
    s3: { status: "healthy" },
    resend: { status: "healthy" }
  }
}
```

### 8.3 Structured Logging Format

```json
{
  "level": "info",
  "time": "2026-06-22T10:00:00.000Z",
  "requestId": "req_abc123",
  "userId": "usr_xyz789",
  "method": "POST",
  "path": "/api/v1/events",
  "statusCode": 201,
  "duration": 45,
  "msg": "Event created successfully"
}
```

### 8.4 Alerting Rules

| Alert | Condition | Severity | Channel |
|:---|:---|:---|:---|
| API Error Rate > 5% | 5xx errors / total > 0.05 | Critical | Sentry + Email |
| Response Time p95 > 2s | 95th percentile latency | Warning | Sentry |
| Database Connection Pool Exhausted | Available connections = 0 | Critical | Sentry + Email |
| Redis Memory > 80% | Memory usage threshold | Warning | Railway metrics |
| Failed Login Attempts > 10/min | Brute force detection | Critical | Sentry + Audit Log |
| Job Queue Backlog > 100 | BullMQ waiting count | Warning | Sentry |

---

## 9. Implementation Roadmap

### 9.1 MVP (Phase 1) — Weeks 1–6

| Week | Deliverable |
|:---|:---|
| **Week 1** | Monorepo setup, Docker, database schema, seed data, shared types |
| **Week 2** | Auth system (JWT + Google OAuth + refresh tokens), user management |
| **Week 3** | Events CRUD, event listing page with filters, event detail page |
| **Week 4** | Registration system (individual + team), QR generation, email confirmations |
| **Week 5** | Gallery system (album CRUD, media upload, lightbox), sponsor pages |
| **Week 6** | Homepage (hero, sections), About page, Contact page, global search |

**MVP Milestone**: Public website live with event listings, registrations, gallery, and basic admin.

---

### 9.2 Phase 2 — Weeks 7–10

| Week | Deliverable |
|:---|:---|
| **Week 7** | Admin dashboard (analytics, KPIs, charts), user management panel |
| **Week 8** | Certificate system (templates, PDF generation, verification), blog/announcements |
| **Week 9** | CMS (editable homepage, about page), advanced event features (waitlist, attendance) |
| **Week 10** | Performance optimization, Sentry integration, GA4, Lighthouse audit, security hardening |

**Phase 2 Milestone**: Full admin dashboard, certificate system, blog, CMS, monitoring.

---

### 9.3 5-Year Growth Roadmap

| Year | Focus | Key Additions |
|:---|:---|:---|
| **Year 1** | Foundation | MVP + Phase 2; onboard first batch of students and events |
| **Year 2** | Engagement | Mobile PWA, push notifications, student leaderboard, alumni portal |
| **Year 3** | Scale | Multi-college federation, event ticketing (paid events), API marketplace |
| **Year 4** | Intelligence | AI-powered recommendations, auto-generated certificates, smart scheduling |
| **Year 5** | Platform | White-label for other student bodies, integration marketplace, analytics SaaS |

---

## 10. Open Questions

> [!IMPORTANT]
> **Q1: College Branding** — Do you have ITSA's official brand assets (logo, colors, fonts, hero video)? If not, should I design a brand identity from scratch?

> [!IMPORTANT]
> **Q2: Monorepo vs Separate Repos** — The architecture above uses a Turborepo monorepo (`apps/web` + `apps/api` + `packages/shared`). This gives shared types and easier coordination. Do you prefer separate repos instead?

> [!IMPORTANT]
> **Q3: TailwindCSS Version** — You specified Tailwind CSS. Should I use **Tailwind CSS v4** (latest, uses `@import "tailwindcss"` instead of config file) or **v3** (stable, traditional `tailwind.config.ts`)? shadcn/ui supports both.

> [!WARNING]
> **Q4: Domain & Email** — What will the production domain be (e.g., `itsa.college.edu`)? This is needed for CORS, OAuth callbacks, and email `From:` address configuration. I'll use placeholder values until confirmed.

> [!NOTE]
> **Q5: Hero Video** — The spec calls for a "fullscreen looping video hero." Do you have a video file, or should I use a placeholder with a stock technology-themed video URL?

> [!NOTE]
> **Q6: Initial Data** — Should I create seed data for the database (sample events like "Code-O-Fiesta", "StackStride", sample sponsors, committee members, etc.) so the platform launches with demo content?

> [!NOTE]
> **Q7: Package Manager** — The architecture uses **pnpm** (industry standard for monorepos). Is this acceptable, or do you prefer npm/yarn?

---

## User Review Required

> [!CAUTION]
> **This architecture spans ~60+ API endpoints, 17+ database models, 100+ frontend components, and 12 security layers.** Please review each section and confirm:
> 1. Are the database models and relationships correct?
> 2. Is the API contract complete and the role permissions acceptable?
> 3. Is the folder structure and monorepo approach agreeable?
> 4. Is the deployment architecture (Vercel + Railway) confirmed?
> 5. Are there any missing features or changes to the roadmap?
>
> Once approved, I will generate the complete production-ready codebase module-by-module following the Phase 1 roadmap.
