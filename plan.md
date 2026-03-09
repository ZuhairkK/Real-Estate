# Activus AI — MVP Implementation Plan

**Overall Progress:** `40%`

**Target:** Web app MVP — validate core loop (capture signals → classify → display profile)

## TLDR
Build the fastest path to a working credibility profile powered by real agent workflow data. Data infrastructure and backend first, frontend last. Web app now, desktop later.

## Tech Stack
- **Language:** TypeScript (full stack)
- **Framework:** Next.js (App Router)
- **Database:** Supabase (Postgres + Auth + RLS + Edge Functions)
- **AI:** Claude API (activity classification)
- **APIs:** Google Calendar API, Gmail API
- **Deploy:** Vercel + Supabase Cloud
- **Desktop:** Deferred (Tauri wrap later)

## Critical Decisions
- **Web app first** — Ship and validate before desktop packaging. Tauri/Electron deferred.
- **Soft confirmation over MLS** — Launch on agent-controlled signals only. No gatekeeper dependencies.
- **Google Workspace as primary source** — Calendar + Gmail via OAuth. Covers majority of agent workflow.
- **Privacy-first inference** — Classify activity types without exposing raw data publicly.
- **Agent-distributed profiles** — Agents share their own links. Solves cold-start.
- **Iterative, feature-by-feature** — Each step produces something testable before moving on.

---

## Phase 1: Data Infrastructure
> Google OAuth + Calendar/Gmail ingestion pipelines. Pulls raw workflow signals into Supabase.
> **Key files:** `src/lib/google.ts`, `src/lib/signals.ts`, `src/lib/supabase.ts`

- [x] 🟩 **Step 1: Project Bootstrap**
  - [x] 🟩 Init Next.js + TypeScript + Tailwind
  - [ ] 🟨 Set up Supabase project (schema written, needs provisioning)
  - [x] 🟩 Google OAuth with Calendar + Gmail scopes
  - [x] 🟩 Secure token storage in Supabase

- [x] 🟩 **Step 2: Signal Ingestion — Google Calendar**
  - [x] 🟩 Google Calendar API integration (read events)
  - [x] 🟩 Sync job to pull and store calendar events
  - [x] 🟩 Raw events stored in private Supabase table
  - [x] 🟩 Token refresh and error handling

- [x] 🟩 **Step 3: Signal Ingestion — Gmail**
  - [x] 🟩 Gmail API integration (thread metadata only — subject, participants, timestamps)
  - [x] 🟩 Sync job for email signal metadata
  - [x] 🟩 Private Supabase table for email signals
  - [x] 🟩 No email bodies stored — metadata only

## Phase 2: Backend & Storage
> Database schema, RLS security policies, and Claude-powered activity classification engine.
> **Key files:** `supabase/migrations/001_initial_schema.sql`, `src/lib/classifier.ts`, `src/app/api/signals/sync/route.ts`

- [x] 🟩 **Step 4: Database Schema & RLS**
  - [x] 🟩 Design schema: agents, raw_signals, classified_activities
  - [x] 🟩 RLS policies: agents see only their own raw data
  - [x] 🟩 Public profile endpoint returns only aggregated data

- [x] 🟩 **Step 5: AI Activity Classification**
  - [x] 🟩 Define activity taxonomy (consultation, listing presentation, open house, tour, market eval, contract review, training)
  - [x] 🟩 Claude API prompt for classifying calendar + email signals → activity type + confidence score
  - [x] 🟩 Soft confirmation logic: cross-reference calendar with email to boost confidence
  - [x] 🟩 Store classified activities with scores

## Phase 3: Agent Representation (Iterate)
> Profile data model, aggregation logic, specialization inference, and agent feedback loop.
> **Key files:** `src/app/api/profile/[slug]/route.ts`, `src/app/api/activities/confirm/route.ts`

- [x] 🟩 **Step 6: Credibility Profile Data Model**
  - [x] 🟩 Aggregate activities into profile stats (counts, timeline, patterns)
  - [x] 🟩 Activity graph data structure (contribution-graph style)
  - [x] 🟩 Specialization inference from activity patterns
  - [x] 🟩 Public profile API endpoint

- [x] 🟩 **Step 7: Agent Feedback Loop**
  - [x] 🟩 Agents can confirm or dismiss inferred activities
  - [ ] 🟥 Feedback improves classification confidence over time
  - [x] 🟩 Minimal API routes for confirm/dismiss actions

## Phase 4: Web App & UI (Last)
> Minimal functional UI — agent dashboard and public profile page. Design polish deferred until mockups provided.
> **Key files:** `src/app/dashboard/page.tsx`, `src/app/agent/[slug]/page.tsx`, `src/app/page.tsx`

- [x] 🟩 **Step 8: Agent Dashboard (Minimal)**
  - [x] 🟩 View captured activities + confidence levels
  - [x] 🟩 Confirm/dismiss controls
  - [x] 🟩 Connected accounts status
  - [x] 🟩 Share profile link

- [x] 🟩 **Step 9: Public Profile Page**
  - [x] 🟩 Shareable URL (`/agent/[slug]`)
  - [x] 🟩 Activity graph visualization
  - [x] 🟩 Activity breakdown by type
  - [x] 🟩 Specialization indicators
  - [ ] 🟥 Design will follow provided screenshots/mockups

- [ ] 🟨 **Step 10: Deploy & Validate**
  - [ ] 🟥 Deploy to Vercel + Supabase Cloud
  - [x] 🟩 Onboarding flow (connect Google → see activities → share)
  - [ ] 🟥 Test classification accuracy with real accounts
  - [ ] 🟥 Event tracking: account_connected, activity_inferred, profile_shared, profile_viewed

---

## Future (Post-MVP)
- Desktop app (Tauri wrap of web app)
- MLS context verification (optional signal boost)
- CRM / scheduling tool integrations
- Specialization inference v2
- Anomaly detection / gaming prevention
