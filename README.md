# AI CMS Platform

A full-stack, AI-powered content management system built with Next.js, Express, PostgreSQL, and Google Gemini. Features a dark glassmorphism UI, JWT authentication, multi-tenant architecture, and AI-assisted content generation.

**Live Demo:** [ai-cms-platform-web.vercel.app](https://ai-cms-platform-web.vercel.app)

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.10-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Gemini](https://img.shields.io/badge/Gemini_AI-Integrated-4285F4?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [AI Integration](#ai-integration)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [License](#license)

---

## Features

**Content Management**
- Create, edit, publish, and delete content with a full WYSIWYG workflow
- Support for multiple content types: articles, blog posts, pages, newsletters
- Tag management, SEO metadata, featured images
- Content filtering, search, and pagination
- Preview mode before publishing

**Public Blog**
- Public-facing blog at `/blog` — no login required
- Browse all published posts across all users and organizations
- Search and filter by content type (articles, posts, pages, newsletters)
- Full post view with author attribution, publish date, tags, and view count
- Paginated listing with responsive card grid
- Powered by unauthenticated API routes (`/api/public/posts`)

**AI-Powered Generation**
- Full article generation with configurable tone, length, and content type
- AI-generated content ideas and title variations
- Automatic SEO title and meta description generation
- Content quality scoring with automatic regeneration
- Powered by Google Gemini (gemini-2.5-flash)

**Authentication & Multi-Tenancy**
- JWT-based authentication with token refresh
- Automatic organization creation on registration
- Role-based access scoping per organization
- Secure password hashing with bcrypt

**UI/UX**
- Dark glassmorphism design system with frosted glass cards and animated mesh backgrounds
- Fully responsive across desktop, tablet, and mobile
- CSS-only hover effects and transitions (no JavaScript hover state management)
- Consistent component library: glass cards, inputs, buttons, badges, alerts, spinners

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript |
| Backend | Express.js 4, TypeScript, Node.js 20+ |
| Database | PostgreSQL 15 (Prisma ORM) |
| AI | Google Gemini API (`@google/generative-ai`) |
| Auth | JWT (jsonwebtoken), bcrypt |
| Styling | Custom CSS design system (glassmorphism) |
| Dev Tools | Docker Compose, Nodemon, Turbopack |
| Deployment | Vercel (frontend), Render (API), Neon (database) |

---

## Architecture

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   Next.js App   │──────>│  Express API    │──────>│   PostgreSQL    │
│   (Vercel)      │  HTTP │  (Render)       │Prisma │   (Neon)        │
│                 │<──────│                 │<──────│                 │
└─────────────────┘       └────────┬────────┘       └─────────────────┘
                                   │
                                   │ API Call
                                   v
                          ┌─────────────────┐
                          │  Google Gemini  │
                          │  AI Service     │
                          └─────────────────┘
```

The application follows a monorepo structure with two workspaces:
- `apps/web` — Next.js frontend (client-side rendering, App Router)
- `apps/api` — Express REST API with Prisma ORM

All API communication uses JSON over HTTP with Bearer token authentication.

---

## Getting Started

### Prerequisites

- **Node.js** 20+
- **Docker & Docker Compose** (for local database services)
- **Git**

### 1. Clone the repository

```bash
git clone https://github.com/realAkshaj/ai-cms-platform.git
cd ai-cms-platform
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example apps/api/.env
```

Edit `apps/api/.env` and update the values as needed. See [Environment Variables](#environment-variables) for details.

Create `apps/web/.env.local`:

```bash
echo 'NEXT_PUBLIC_API_URL=http://localhost:3001' > apps/web/.env.local
```

### 4. Start database services

```bash
docker-compose up -d
```

This starts PostgreSQL (port 5432), Redis (port 6379), and MongoDB (port 27017).

Verify containers are running:

```bash
docker ps
```

### 5. Initialize the database

```bash
cd apps/api
npx prisma generate
npx prisma db push
cd ../..
```

### 6. Start the development servers

```bash
npm run dev
```

This starts both servers concurrently:
- **Frontend:** http://localhost:3000
- **API:** http://localhost:3001
- **Health check:** http://localhost:3001/health

### 7. Verify the setup

1. Open http://localhost:3000
2. Register a new account
3. Log in and explore the dashboard
4. Create content at `/content/create`

---

## Environment Variables

### API (`apps/api/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `NODE_ENV` | No | `development` | Environment mode |
| `API_PORT` | No | `3001` | API server port |
| `FRONTEND_URL` | No | `http://localhost:3000` | Allowed CORS origin(s), comma-separated |
| `JWT_SECRET` | Yes | — | Secret key for signing JWTs |
| `JWT_REFRESH_SECRET` | Yes | — | Secret key for refresh tokens |
| `JWT_EXPIRES_IN` | No | `15m` | Access token expiration |
| `JWT_REFRESH_EXPIRES_IN` | No | `7d` | Refresh token expiration |
| `GEMINI_API_KEY` | No | — | Google Gemini API key (enables AI features) |
| `REDIS_URL` | No | — | Redis connection string (for caching) |

### Frontend (`apps/web/.env.local`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | No | `http://localhost:3001` | Backend API base URL |

---

## API Reference

### Health & Status

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/health` | No | Server health, database status, AI status |

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | No | Register user and create organization |
| `POST` | `/api/auth/login` | No | Authenticate and receive JWT |
| `POST` | `/api/auth/logout` | No | Logout (client-side token removal) |

**Register request body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "organizationName": "My Org"
}
```

**Login response:**

```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "...", "firstName": "...", "lastName": "..." },
    "accessToken": "eyJhbGciOi..."
  }
}
```

### Content Management

All content endpoints require `Authorization: Bearer <token>` header.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/content` | List content (supports `page`, `limit`, `status`, `type`, `search`, `sortBy`, `sortOrder` query params) |
| `POST` | `/api/content` | Create content |
| `GET` | `/api/content/:id` | Get content by ID |
| `PUT` | `/api/content/:id` | Update content |
| `DELETE` | `/api/content/:id` | Delete content |
| `POST` | `/api/content/:id/publish` | Publish a draft |
| `GET` | `/api/content/analytics/stats` | Dashboard statistics |

**Create content request body:**

```json
{
  "title": "My Article",
  "content": "<p>Article body...</p>",
  "type": "ARTICLE",
  "status": "DRAFT",
  "tags": ["tech", "ai"],
  "seoTitle": "My Article | AI CMS",
  "seoDescription": "A great article about..."
}
```

### Public Blog

These endpoints require no authentication and return only published content.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/public/posts` | List published posts (supports `page`, `limit`, `search`, `type` query params) |
| `GET` | `/api/public/posts/:id` | Get a single published post by ID |

### AI Generation

All AI endpoints require authentication. AI features are available when `GEMINI_API_KEY` is configured.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/ai/status` | AI service status and configuration |
| `POST` | `/api/ai/generate` | Generate full content |
| `POST` | `/api/ai/ideas` | Generate content ideas |
| `POST` | `/api/ai/titles` | Generate title variations |
| `POST` | `/api/ai/improve` | Improve existing content |

**Generate content request:**

```json
{
  "topic": "Getting Started with TypeScript",
  "type": "ARTICLE",
  "tone": "professional",
  "length": "medium",
  "keywords": ["typescript", "javascript", "types"],
  "includeSEO": true,
  "includeOutline": true
}
```

**Tone options:** `professional`, `casual`, `friendly`, `authoritative`, `conversational`
**Length options:** `short` (300-500 words), `medium` (800-1200 words), `long` (1500-2500 words)
**Type options:** `ARTICLE`, `POST`, `NEWSLETTER`, `PAGE`

---

## AI Integration

The platform integrates with Google Gemini for content generation. To enable AI features:

1. Get an API key at [Google AI Studio](https://aistudio.google.com/apikey)
2. Add `GEMINI_API_KEY=your_key` to your environment variables
3. Verify at `GET /api/ai/status`

**Capabilities:**
- Full article generation with structured headings, paragraphs, and formatting
- Content quality scoring with automatic regeneration for low-quality outputs
- Repetition and filler phrase detection
- SEO metadata generation (titles, descriptions, suggested tags)
- Content ideas brainstorming
- Title variation generation

The AI Assistant panel is accessible from the content creation and editing pages via the floating action button.

---

## Deployment

The application is deployed using free tiers of three services:

| Service | Purpose | URL |
|---------|---------|-----|
| [Vercel](https://vercel.com) | Next.js frontend | `https://ai-cms-platform-web.vercel.app` |
| [Render](https://render.com) | Express API | `https://ai-cms-api.onrender.com` |
| [Neon](https://neon.tech) | PostgreSQL database | Managed connection |

### Deploy your own

#### 1. Database (Neon)

1. Create a free project at [neon.tech](https://neon.tech)
2. Copy the connection string
3. Push the schema:

```bash
cd apps/api
DATABASE_URL="your-neon-connection-string" npx prisma db push
```

#### 2. API (Render)

1. Create a new **Web Service** on [render.com](https://render.com)
2. Connect your GitHub repository
3. Configure:
   - **Root Directory:** `apps/api`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start`
   - **Instance Type:** Free
4. Add environment variables: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `GEMINI_API_KEY`, `NODE_ENV=production`

#### 3. Frontend (Vercel)

1. Import your repository on [vercel.com](https://vercel.com)
2. Set **Root Directory** to `apps/web`
3. Add environment variable: `NEXT_PUBLIC_API_URL=https://your-api.onrender.com`
4. Deploy

#### 4. Connect CORS

Update the `FRONTEND_URL` environment variable on Render to your Vercel domain:

```
FRONTEND_URL=https://your-app.vercel.app
```

> **Note:** Render's free tier spins down after 15 minutes of inactivity. The first request after idle will take ~30 seconds for a cold start.

---

## Project Structure

```
ai-cms-platform/
├── apps/
│   ├── api/                        # Express REST API
│   │   ├── prisma/
│   │   │   └── schema.prisma       # Database schema (4 models)
│   │   └── src/
│   │       ├── server.ts           # Server entry point
│   │       ├── app.ts              # Express app configuration
│   │       ├── config/
│   │       │   └── env.ts          # Environment validation
│   │       ├── controllers/
│   │       │   └── auth.ts         # Auth controller
│   │       ├── middleware/
│   │       │   ├── auth.ts         # JWT authentication middleware
│   │       │   └── validation.ts   # Request validation
│   │       ├── routes/
│   │       │   ├── auth.ts         # Auth endpoints
│   │       │   ├── content.ts      # Content CRUD + AI endpoints
│   │       │   ├── ai.ts           # AI-specific endpoints
│   │       │   └── public.ts       # Unauthenticated public blog endpoints
│   │       └── services/
│   │           ├── ai.ts           # Gemini AI service
│   │           ├── auth.ts         # Auth business logic
│   │           └── content.ts      # Content business logic
│   │
│   └── web/                        # Next.js frontend
│       └── src/
│           ├── app/
│           │   ├── globals.css     # Design system (CSS variables, components)
│           │   ├── layout.tsx      # Root layout with mesh background
│           │   ├── page.tsx        # Landing page
│           │   ├── auth/
│           │   │   ├── login/      # Login page
│           │   │   └── register/   # Registration page
│           │   ├── blog/
│           │   │   ├── page.tsx    # Public blog listing
│           │   │   └── [id]/       # Public post detail view
│           │   ├── content/
│           │   │   ├── page.tsx    # Content list with filters
│           │   │   ├── create/     # Content creation with AI
│           │   │   ├── edit/[id]/  # Content editing
│           │   │   └── view/[id]/  # Content viewer
│           │   └── dashboard/      # Analytics dashboard
│           ├── components/
│           │   └── AIAssistant.tsx  # AI assistant slide-out panel
│           ├── lib/
│           │   ├── config.ts       # API URL configuration
│           │   └── api.ts          # Fetch-based API client
│           └── services/
│               ├── api.ts          # Axios API client with interceptors
│               ├── authService.ts  # Auth service layer
│               └── contentService.ts # Content service layer
│
├── docker-compose.yml              # Local dev services (PostgreSQL, Redis, MongoDB)
├── render.yaml                     # Render deployment config
├── package.json                    # Root workspace config
└── .env.example                    # Environment variable template
```

---

## Database Schema

Four models managed by Prisma ORM:

**Organization** — Multi-tenant workspace
| Field | Type | Notes |
|-------|------|-------|
| `id` | String | CUID primary key |
| `name` | String | Organization name |
| `slug` | String | Unique URL slug |

**User** — Authenticated user within an organization
| Field | Type | Notes |
|-------|------|-------|
| `id` | String | CUID primary key |
| `email` | String | Unique |
| `password` | String | bcrypt hashed |
| `firstName` | String | |
| `lastName` | String | |
| `organizationId` | String | Foreign key |

**Content** — CMS content entries
| Field | Type | Notes |
|-------|------|-------|
| `id` | String | CUID primary key |
| `title` | String | |
| `slug` | String | Unique per organization |
| `body` | Text | HTML content body |
| `status` | Enum | `DRAFT`, `PUBLISHED`, `ARCHIVED` |
| `type` | Enum | `POST`, `PAGE`, `ARTICLE`, `NEWSLETTER` |
| `tags` | String[] | Array of tag strings |
| `views`, `likes`, `shares` | Int | Engagement metrics |
| `seoTitle`, `seoDescription` | String? | SEO metadata |
| `featuredImage` | String? | Image URL |
| `authorId` | String | Foreign key to User |
| `organizationId` | String | Foreign key to Organization |

**AIAnalysis** — AI generation audit log
| Field | Type | Notes |
|-------|------|-------|
| `id` | String | CUID primary key |
| `type` | String | Generation type |
| `input` | Text | Prompt/request data |
| `output` | Text | Generated result |
| `contentId` | String? | Optional link to content |
| `organizationId` | String | Foreign key |

---

## License

MIT
