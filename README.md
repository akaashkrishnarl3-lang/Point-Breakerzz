# MeetFlow AI — Meeting Accountability Platform

> Production-ready Monorepo architecture with clean separation between Frontend and Backend services.

MeetFlow AI converts meeting transcripts into grounded decisions, action items, owners, deadlines, and cross-meeting carry-over audit trails with zero hallucinations.

---

## 📁 Repository Structure

```text
Point Breakerzz/
│
├── frontend/                     # Client-side UI application (React + Vite + Tailwind CSS)
│   ├── public/                   # Public assets & icons
│   ├── src/
│   │   ├── components/           # Reusable UI components & views
│   │   │   ├── views/            # Dashboard, Meetings, Detail, Tracker, Decisions, etc.
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   └── AuditTrailModal.tsx
│   │   ├── data/                 # Sample transcripts & fallback presets
│   │   ├── services/
│   │   │   └── api.ts            # HTTP API client to communicate with backend
│   │   ├── types/                # TypeScript interfaces and domain types
│   │   ├── App.tsx               # Main application controller
│   │   ├── main.tsx              # React DOM entrypoint
│   │   └── index.css             # Tailwind base & custom design tokens
│   ├── .env.example              # Frontend environment template
│   ├── index.html                # HTML entry document
│   ├── package.json              # Frontend dependencies and build scripts
│   ├── postcss.config.js         # PostCSS configuration
│   ├── tailwind.config.js        # Tailwind styling theme & color tokens
│   ├── tsconfig.json             # Frontend TypeScript compiler config
│   └── vite.config.ts            # Vite bundler configuration
│
├── backend/                      # Server-side API & AI processing engine (Node.js + Express)
│   ├── src/
│   │   ├── controllers/          # Express route controllers
│   │   │   ├── meetingController.ts
│   │   │   ├── actionController.ts
│   │   │   ├── decisionController.ts
│   │   │   ├── unresolvedController.ts
│   │   │   ├── statsController.ts
│   │   │   └── systemController.ts
│   │   ├── data/                 # Seed data & synthetic sprint datasets
│   │   ├── middleware/           # CORS, request validation, error handling
│   │   │   ├── corsMiddleware.ts
│   │   │   ├── errorHandler.ts
│   │   │   └── validateRequest.ts
│   │   ├── models/               # Data store models & persistence
│   │   │   └── dataStore.ts
│   │   ├── routes/               # API endpoint definitions
│   │   │   ├── meetings.ts
│   │   │   ├── actions.ts
│   │   │   ├── decisions.ts
│   │   │   ├── unresolved.ts
│   │   │   ├── stats.ts
│   │   │   ├── health.ts
│   │   │   └── index.ts
│   │   ├── services/             # Core business logic & AI engines
│   │   │   ├── extractorService.ts    # Gemini API + Grounded Local NLP fallback
│   │   │   ├── crossMeetingTracker.ts # Cross-meeting carry-over reconciliation
│   │   │   └── storageService.ts      # Storage orchestration
│   │   ├── types/                # TypeScript interfaces
│   │   ├── utils/                # Config, logging, server validators
│   │   │   ├── env.ts
│   │   │   ├── logger.ts
│   │   │   └── validators.ts
│   │   └── index.ts              # Express server entrypoint (0.0.0.0 binding)
│   ├── .env.example              # Backend environment template
│   ├── package.json              # Backend dependencies and scripts
│   └── tsconfig.json             # Backend TypeScript configuration
│
├── .gitignore                    # Monorepo git ignore rules
├── package.json                  # Root monorepo scripts for convenience
└── README.md                     # Comprehensive architecture and deployment guide
```

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ or v24+ recommended)
- **npm**: v9.0.0 or higher

---

### 2. Backend Setup & Run

Open a terminal and run:

```bash
cd backend
npm install
npm run dev
```

The backend server will start on `http://0.0.0.0:10000` (or the port defined in `PORT`).
- **Health Check**: `http://localhost:10000/api/health`
- **Meetings Endpoint**: `http://localhost:10000/api/meetings`

---

### 3. Frontend Setup & Run

In a separate terminal, run:

```bash
cd frontend
npm install
npm run dev
```

The frontend application will start on `http://localhost:5173`.
It automatically connects to the backend at `http://localhost:10000`.

---

## ⚙️ Environment Variables

### Frontend (`frontend/.env`)
Copy `frontend/.env.example` to `frontend/.env`:

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base URL of the backend HTTP API | `http://localhost:10000` |
| `NEXT_PUBLIC_API_URL` | Monorepo compatibility fallback | `http://localhost:10000` |

> **Security Rule**: The frontend contains **zero secrets**. Never place API keys or database credentials in frontend configuration.

### Backend (`backend/.env`)
Copy `backend/.env.example` to `backend/.env`:

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `PORT` | Port the Express server listens on | `10000` |
| `FRONTEND_URL` | Allowed origin for CORS protection | `http://localhost:5173` |
| `GEMINI_API_KEY` | *(Optional)* Google Gemini API key for live AI extraction | Leave blank to run offline NLP engine |
| `DATABASE_URL` | *(Optional)* External database connection string | (Optional) |

---

## 🛠️ Production Build & Start Commands

### Backend Production:
```bash
cd backend
npm install
npm run build
npm start
```
`npm run build` compiles TypeScript to `backend/dist/`.
`npm start` launches `node dist/index.js` binding to `0.0.0.0:${PORT}`.

### Frontend Production:
```bash
cd frontend
npm install
npm run build
npm start
```
`npm run build` outputs optimized production assets to `frontend/dist/`.
`npm start` previews the production build on port `5173`.

---

## 🌐 Deployment Guide

### Deploying Backend to Render
1. Create a new **Web Service** on [Render](https://render.com).
2. Connect your Git repository.
3. Configure the following service settings:
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. In the **Environment Variables** tab on Render:
   - `PORT`: `10000` (or let Render set its dynamic port)
   - `FRONTEND_URL`: URL of your deployed frontend (e.g. `https://meetflow-ai.vercel.app`)
   - `GEMINI_API_KEY`: Your Google Gemini API key (optional)
5. Save and deploy. Note your Render service URL (e.g. `https://meetflow-backend.onrender.com`).

### Deploying Frontend to Vercel
1. Create a new project on [Vercel](https://vercel.com).
2. Import your Git repository.
3. Set the **Root Directory** to `frontend`.
4. Build and output settings:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. In **Environment Variables**:
   - `VITE_API_URL`: `https://your-backend-app.onrender.com`
   - `NEXT_PUBLIC_API_URL`: `https://your-backend-app.onrender.com`
6. Deploy!

---

## 🔒 Security & Grounding Guarantees

1. **Secret Isolation**: Secret API keys (`GEMINI_API_KEY`) reside exclusively in backend environment variables and are never transmitted to client browsers.
2. **CORS Enforcement**: Backend strictly limits allowed origins in production via `FRONTEND_URL`.
3. **Anti-Hallucination Grounding**: Every extracted decision, action item, and open issue is strictly validated against verbatim quotes from the meeting transcript. Unsupported owners or deadlines default to `null` with explicit ambiguity flags.
4. **Cross-Meeting Reconciliation**: Statuses transition deterministically (`NEW` → `CARRIED_OVER` → `COMPLETED` / `OVERDUE`) only when verified by transcript evidence.
