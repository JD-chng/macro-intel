# Macro Intelligence Platform

**AI-powered macro intelligence engine for asset managers.**

## What It Does

Asset managers face a daily flood of macro-relevant news across central banks, geopolitics, trade, and economic data releases. Monitoring this manually is error-prone, slow, and fragmented.

This platform transforms raw news into structured investment intelligence by:

- **Discovering macro themes automatically** — AI clusters articles by narrative similarity and names themes without predefined categories
- **Tracking heat in real time** — each theme gets a dynamic score based on article velocity, language intensity, and source diversity, with 🔴🟡🟢 traffic-light indicators
- **Detecting suspicious silence** — flags when a previously hot theme suddenly drops from coverage (often the most dangerous signal)
- **Generating causal risk chains** — for any macro event: Rates → FX → Equities → Credit implications, structured and searchable
- **Mapping macro relationships** — interactive knowledge graph links themes, institutions, countries, and assets
- **Preserving institutional memory** — every AI analysis is timestamped and semantically searchable

## Live Demo Features

- Real Reuters RSS headlines ingested live
- One-click article ingest with Claude AI classification
- Natural language queries across all macro intelligence
- PM View / Analyst View toggle for different user personas
- Weekly AI-generated macro brief

## Tech Stack

React · Vite · D3.js · Recharts · Anthropic Claude API · GitHub Pages

## Setup

```bash
npm install
npm run dev
```

Enter your Anthropic API key on first load, or continue in Demo Mode.

## Deploy

Push to `main` branch — GitHub Actions auto-deploys to GitHub Pages.

Enable Pages in your repo: **Settings → Pages → Source: GitHub Actions**
