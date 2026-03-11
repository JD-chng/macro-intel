# Macro Intelligence Platform

> AI-powered macro intelligence engine for institutional asset managers.

**Live Demo:** https://jd-chng.github.io/macro-intel/

---

## About

**Project Title:** Macro Economic Tracker
**Team Name:** StraitsX

Macro Intelligence is an AI driven macro research platform that transforms large volumes of financial news into structured insights. The system aggregates live articles from multiple sources and uses AI to classify them into macro themes, generate concise summaries, assign sentiment labels and track the momentum of emerging narratives. Instead of presenting isolated headlines, the platform organizes information into evolving macro stories that are continuously updated as new data arrives.

The platform features an integrated dashboard that displays key system metrics, active themes, and overall market sentiment. A Theme Heat Monitor ranks macro narratives based on momentum and article activity, while the Risk Implication Tree maps how a selected event may propagate across different asset classes such as rates, FX, equities and credit. A Knowledge Graph visualizes relationships between macro concepts, allowing users to explore how policies, geopolitical events and markets are interconnected.

Additional features include an Article Intelligence Feed that processes and tags incoming news, an Emerging Themes Watchlist that identifies narratives with high breakout potential and automated Weekly Macro Briefs generated from the latest developments. Together, these tools convert fragmented news signals into a structured, continuously updated macro intelligence system.

---

## What It Does

Asset managers face a daily flood of macro-relevant news across central banks, geopolitics, trade, and economic data releases. Monitoring this manually is slow, error-prone, and fragmented.

This platform transforms raw news into structured investment intelligence by:

- **Discovering macro themes automatically** — Claude AI clusters articles by narrative and names themes without predefined categories
- **Tracking heat in real time** — each theme gets a dynamic score (0–100) based on article volume, language intensity, and source diversity
- **Detecting suspicious silence** — flags when a previously hot theme suddenly drops from coverage (often the most dangerous signal)
- **Generating causal risk chains** — for any macro event: Rates → FX → Equities → Credit, structured and searchable
- **Mapping macro relationships** — interactive D3 knowledge graph links themes, institutions, countries, and asset classes
- **Preserving institutional memory** — every AI analysis is timestamped and semantically searchable
- **Predicting emerging breakouts** — AI watchlist identifies themes before they go mainstream with breakout probability scores

---

## Architecture

Three-tier system with clear separation of concerns:

```
┌─────────────────────┐     ┌──────────────────┐     ┌────────────────────┐
│   Frontend (React)  │────▶│  Supabase (DB)   │◀────│  Backend (Node.js) │
│   GitHub Pages      │     │  Postgres + REST  │     │  Railway (cron)    │
└─────────────────────┘     └──────────────────┘     └────────────────────┘
```

- **Frontend** reads from Supabase only
- **Backend** writes to Supabase only (runs every 30 minutes via cron)
- No direct frontend ↔ backend connection

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, D3.js, Recharts |
| Backend | Node.js (ESM), node-cron |
| Database | Supabase (Postgres) |
| AI | Anthropic Claude (Opus for theme discovery, Haiku for classification) |
| Market Data | Alpha Vantage |
| News | NewsAPI + 10+ RSS feeds (Reuters, Bloomberg, FT, WSJ) |
| Social | Reddit, StockTwits |
| Video | YouTube Data API |
| Hosting | GitHub Pages (frontend), Railway (backend) |

---

## Features

### Theme Heat Monitor
Real-time heat scoring for discovered macro themes. Each theme displays a 90-day heat trend chart, article count, coverage change, and AI-generated analysis. Click any theme to see the full detail popup with risk implications and related articles.

### AI Theme Discovery
The backend sends the latest 60 headlines to Claude Opus every 30 minutes. Claude freely identifies whatever macro narratives are present — no predefined categories. New themes appear automatically as they emerge in the news.

### Risk Implication Trees
For any macro theme, Claude generates a structured causal chain: trigger event → first-order market impacts → second-order contagion → policy response. Updated per ingestion cycle.

### Knowledge Graph
Interactive D3 force-directed graph linking themes, countries, asset classes, and institutions. Hover to highlight connections, click to explore relationships.

### Emerging Watchlist
AI-predicted themes with breakout probability scores. Analyzes article velocity, source migration, graph centrality, and policy proximity. Results cached to Supabase — loads instantly on revisit.

### Weekly Macro Brief
AI-generated institutional-grade weekly summary covering top themes, key developments, and forward-looking risks. Cached for 24 hours.

### Social Pulse
Fear & Greed index derived from Reddit and StockTwits sentiment. Real-time social feed with trending macro topics and sentiment shift detection.

### AI Query Interface
Natural language queries answered by Claude with full context of all live themes and articles. Example: *"What are the second-order effects of a Fed pivot on EM currencies?"*

### Institutional Memory
Every AI analysis is stored with timestamp, theme context, and heat levels at time of analysis — creating a searchable historical record.

---

## Data Ingestion Pipeline

Every 30 minutes the backend runs:

```
1. Fetch Articles     → 10+ RSS feeds + NewsAPI (~80–100 articles/cycle)
2. AI Classification  → Claude Haiku classifies articles into themes, scores heat & sentiment
3. Theme Discovery    → Claude Opus identifies 6–10 macro themes from latest headlines
4. Store Articles     → Upserted to Supabase by URL (deduplication)
5. Update Themes      → Heat scores, trend arrays, article counts updated
6. Market Data        → Alpha Vantage sentiment + market pulse (forex, indices)
7. Social Data        → Reddit posts, StockTwits, fear/greed computation
8. YouTube            → Macro analysis videos per theme
```

---

## Database Schema

| Table | Purpose |
|-------|---------|
| `themes` | Theme name, heat, status, description, tags, countries, assets, trend array |
| `heat_history` | Historical heat scores per theme (powers 90-day chart) |
| `articles` | Classified articles with themes, sentiment, heat score |
| `social_posts` | Reddit + StockTwits posts with sentiment |
| `youtube_videos` | Macro analysis videos per theme |
| `social_metrics` | Fear & greed index, trending topics, sentiment shifts |
| `market_sentiment` | Alpha Vantage bullish/bearish scores per theme |
| `market_pulse` | Live market indicators (forex, indices) |
| `memory` | Stored AI analysis history |
| `emerging_themes` | Cached AI breakout predictions |

---

## Setup

### Prerequisites
- Node.js 18+
- Supabase project
- API keys: Anthropic, NewsAPI, Alpha Vantage, YouTube Data API v3

### Frontend

```bash
git clone https://github.com/JD-chng/macro-intel.git
cd macro-intel
npm install

# Copy and fill in environment variables
cp .env.example .env
```

`.env` file:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_ANTHROPIC_KEY=sk-ant-...
VITE_AV_KEY=your_alpha_vantage_key
VITE_YT_KEY=your_youtube_api_key
```

```bash
npm run dev       # Development
npm run build     # Production build
npm run preview   # Preview production build
```

### Backend

```bash
git clone https://github.com/JD-chng/macro-intel-backend.git
cd macro-intel-backend
npm install
```

Environment variables (Railway or `.env`):
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
ANTHROPIC_API_KEY=sk-ant-...
NEWS_API_KEY=your_newsapi_key
ALPHA_VANTAGE_KEY=your_av_key
YOUTUBE_API_KEY=your_youtube_key
INGEST_INTERVAL_MINUTES=30
PORT=3000
```

```bash
node index.js     # Start ingestion server
```

---

## Deployment

### Frontend → GitHub Pages

Push to `main` — GitHub Actions auto-deploys via `.github/workflows/deploy.yml`.

**Required GitHub Secrets** (Settings → Secrets and variables → Actions):
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_ANTHROPIC_KEY
VITE_AV_KEY
VITE_YT_KEY
```

Also add the same secrets to the `github-pages` environment (Settings → Environments → github-pages).

Enable Pages: **Settings → Pages → Source: GitHub Actions**

### Backend → Railway

Connect the backend repo to Railway. Add all environment variables in the Railway dashboard. The service starts automatically and runs ingestion on the configured interval.

---

## Heat Score Methodology

Heat scores (0–100) are evaluated by Claude Opus based on three factors:

- **Volume** — number of articles covering this theme in the current cycle
- **Significance** — market-moving potential of the developments
- **Urgency** — how time-sensitive or fast-evolving the situation is

The trend array stores the last 30 heat readings, powering the 90-day historical chart. Article counts accumulate across ingestion cycles for a running total.

---

## Known Limitations

- Alpha Vantage free tier rate limits restrict sentiment to ~1 theme per cycle
- Reddit may return 403 errors when server IP is blocked (handled gracefully)
- WSJ RSS requires a subscription (401 errors handled gracefully)
- Theme deduplication is by exact name — similar themes (e.g. "Iran Oil Shock" vs "Iran Oil Crisis") may appear separately

---

## Project Structure

```
macro-intel/                    ← Frontend repo
├── src/
│   ├── App.jsx                 — Main shell, navigation, data loading
│   ├── main.jsx                — Entry point
│   ├── context/
│   │   └── AppContext.jsx      — Global UI state
│   ├── lib/
│   │   └── supabase.js         — Supabase client + all fetch functions
│   ├── data/
│   │   └── seed.js             — Fallback mock data
│   └── components/
│       ├── shared.jsx          — CSS vars, callClaude, shared components
│       ├── Overview.jsx        — System overview + market pulse
│       ├── ThemeMonitor.jsx    — Heat monitor with trend charts
│       ├── RiskTree.jsx        — Risk implication trees
│       ├── KnowledgeGraph.jsx  — D3 force graph
│       ├── WeeklyBrief.jsx     — AI weekly summary
│       ├── EmergingWatchlist.jsx — AI breakout predictions
│       └── Panels.jsx          — Article feed, memory, query, social
└── .github/workflows/
    └── deploy.yml              — GitHub Actions deployment

macro-intel-backend/            ← Backend repo (private)
├── index.js                    — Orchestrator + cron scheduler
├── db/
│   └── supabase.js             — DB client + upsert functions
├── fetchers/
│   ├── news.js                 — RSS + NewsAPI
│   ├── alphavantage.js         — Market sentiment + pulse
│   ├── youtube.js              — Macro video search
│   └── social.js              — Reddit + StockTwits
└── processors/
    └── themes.js               — AI theme discovery + classification
```

---

## Built For

FinTech Innovators' Hackathon — Case Competition Hackathon, March 2026.

Judging criteria: Innovation · Technology & Prototype · User Experience · Feasibility & Impact · Market Potential
