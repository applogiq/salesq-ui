# SalesQ UI — Frontend

> AI-powered outbound sales platform UI built with **Next.js 14**, **Tailwind CSS**, and **Recharts**.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Pages & Routes](#pages--routes)
- [Role-Based Navigation](#role-based-navigation)
- [Environment Variables](#environment-variables)
- [Component Patterns](#component-patterns)
- [Package Manager](#package-manager)

---

## Overview

SalesQ UI is the frontend for the SalesQ outbound AI calling system. It provides role-based dashboards and tools for **Sales Executives**, **Team Leads**, and **Administrators** to manage campaigns, leads, live calls, QA compliance, conversation intelligence, and telephony infrastructure.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v3 |
| Charts | Recharts 2 |
| Icons | Lucide React |
| State | React Context (Role) |
| Package Manager | pnpm 10 |

---

## Project Structure

```
salesq-ui/
├── app/
│   ├── layout.tsx              # Root layout — wraps app with RoleProvider
│   ├── page.tsx                # Redirects → /login
│   ├── login/
│   │   └── page.tsx            # Login screen
│   ├── dashboard/
│   │   ├── layout.tsx
│   │   └── page.tsx            # Role-based dashboard (Executive / Team Lead / Admin)
│   ├── campaigns/
│   │   ├── layout.tsx
│   │   └── page.tsx            # Campaign detail — metrics, charts, exec table
│   ├── coaching/
│   │   ├── layout.tsx
│   │   └── page.tsx            # Conversation Intelligence — sentiment, objections
│   ├── leads/
│   │   ├── layout.tsx
│   │   └── page.tsx            # Leads & CRM — table + detail panel
│   ├── qa/
│   │   ├── layout.tsx
│   │   └── page.tsx            # QA & Compliance — scorecards, auto-fail rules
│   ├── telephony/
│   │   ├── layout.tsx
│   │   └── page.tsx            # Telephony — numbers, routing, webhooks
│   └── dialpad/
│       ├── layout.tsx
│       └── page.tsx            # Dialpad view
├── components/
│   ├── AppShell.tsx            # Sidebar + TopBar + main content wrapper
│   ├── Sidebar.tsx             # Collapsible nav with role-based sections
│   ├── TopBar.tsx              # Header with search, role switcher, actions
│   └── dashboard/
│       ├── ExecutiveDashboard.tsx
│       ├── TeamDashboard.tsx
│       └── AdminDashboard.tsx
├── context/
│   └── RoleContext.tsx         # Role state: executive | team-lead | admin
├── lib/
│   └── utils.ts                # cn() utility (clsx + tailwind-merge)
├── .npmrc                      # pnpm config (fund=false, strict-ssl=false)
├── next.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+
- **pnpm** 10+ — install globally if not present:
  ```bash
  npm install -g pnpm --strict-ssl=false
  ```

### Installation

```bash
# 1. Clone the repo (or navigate to the folder)
cd salesq-ui

# 2. Install dependencies
pnpm install

# 3. Copy and fill environment variables
cp .env.example .env.local
```

### Run Development Server

```bash
pnpm dev
```

App runs at **http://localhost:3000**

---

## Available Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start development server with hot reload |
| `pnpm build` | Create optimised production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | Run ESLint across the codebase |

---

## Pages & Routes

| Route | Page | Description |
|---|---|---|
| `/` | Redirect | Redirects to `/login` |
| `/login` | Login | Authentication screen |
| `/dashboard` | Dashboard | Role-based dashboard view |
| `/campaigns` | Campaigns | Campaign detail — KPIs, charts, exec performance |
| `/coaching` | Conversation Intelligence | AI analysis — objections, sentiment, buying signals |
| `/leads` | Leads & CRM | Lead table with AI brief and activity timeline |
| `/qa` | QA & Compliance | Scorecards, auto-fail rules, compliance status, audit log |
| `/telephony` | Telephony | Phone numbers, call routing, webhook health, dialer modes |
| `/dialpad` | Dialpad | Outbound dialling interface |

---

## Role-Based Navigation

The app supports three roles switchable via the TopBar role switcher (demo mode):

| Role | Label | Sidebar Sections |
|---|---|---|
| `executive` | Sales Rep | Workspace, Pipeline, Performance, Account |
| `team-lead` | Team Lead | Overview, Team, Quality, Workspace |
| `admin` | Admin | Overview, Operations, Intelligence, Admin |

Role state is managed in `context/RoleContext.tsx` and consumed by `Sidebar`, `TopBar`, and `Dashboard` components.

---

## Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000/ws
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the SalesQ FastAPI backend |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL for live call events |

---

## Component Patterns

### AppShell

Every page is wrapped in `AppShell` via its `layout.tsx`:

```tsx
// app/[route]/layout.tsx
import AppShell from '@/components/AppShell';
export default function Layout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
```

### Adding a New Page

1. Create `app/<route>/layout.tsx` (copy the AppShell wrapper above).
2. Create `app/<route>/page.tsx` with `'use client'` if using hooks/events.
3. Add the nav item to the correct section in `components/Sidebar.tsx`.

### Utility — `cn()`

Use `cn()` from `@/lib/utils` for conditional Tailwind classes:

```tsx
import { cn } from '@/lib/utils';
<div className={cn('px-4 py-2', isActive && 'bg-cyan-500 text-white')} />
```

---

## Package Manager

This project uses **pnpm** instead of npm for 3–5× faster installs on Windows.

```bash
pnpm install          # Install all dependencies
pnpm add <package>    # Add a new package
pnpm remove <package> # Remove a package
pnpm dev              # Run dev server
```

> **Note:** The `.npmrc` file sets `strict-ssl=false` to handle corporate SSL inspection proxies.
