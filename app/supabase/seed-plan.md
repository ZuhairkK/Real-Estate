# Feature Implementation Plan: Agent Profile — Seed Data & Profile Validation

**Overall Progress:** `67%`

## TLDR
Seed the DB with realistic test data across 5 agent archetypes, validate the profile API aggregations and specialization logic, upgrade the activity graph to a GitHub-style heatmap, and test edge cases — until `/agent/test-agent` earns homebuyer trust.

## Critical Decisions
- **Seed directly into `classified_activities`** — skip `raw_signals`, no need to run the classifier for test data
- **5 archetypes** — veteran (Sarah Chen), new agent (Marcus Riley), buyer specialist (Priya Nair), seller specialist (David Okafor), well-rounded (Jordan Mills / `test-agent`)
- **Idempotent seed script** — deletes and re-inserts on each run, safe to re-run locally and in CI
- **Heatmap replaces bar chart in-place** — modify `agent/[slug]/page.tsx`, no new component file
- **Specialization threshold stays at >20%** — validate with seeded data before changing

## Tasks

- [x] 🟩 **Step 1: Seed Script**
  - [x] 🟩 Create `app/supabase/seed.ts`
  - [x] 🟩 Define 5 agent archetypes with realistic type weights and activity counts
  - [x] 🟩 Upsert agents by email (idempotent)
  - [x] 🟩 Generate varied activity dates spread across `spreadDays`
  - [x] 🟩 Realistic per-type summaries in metadata

- [x] 🟩 **Step 2: Install Dependencies & Run Seed**
  - [x] 🟩 `tsx` and `dotenv` added to `package.json` devDependencies + `npm run seed` script
  - [x] 🟩 `npm install` completed successfully
  - [ ] 🟥 Populate `.env.local` with Supabase URL and service role key *(manual — needs your credentials)*
  - [ ] 🟥 Run `npm run seed` inside `app/` and verify 5 agents appear in DB

- [ ] 🟥 **Step 3: Validate Profile API**
  - [ ] 🟥 Hit `/api/profile/test-agent`, `/api/profile/marcus-riley`, `/api/profile/priya-nair`, `/api/profile/david-okafor`
  - [ ] 🟥 Confirm specializations surface correctly per archetype (buyer-only → buyer tags, seller-heavy → listing tags)
  - [ ] 🟥 Confirm new agent (3 activities) doesn't crash or show misleading specializations

- [x] 🟩 **Step 4: Upgrade Activity Graph to Heatmap**
  - [x] 🟩 Profile API now returns `activity_by_day` (day-level counts, `YYYY-MM-DD`)
  - [x] 🟩 Bar chart replaced with `ActivityHeatmap` component in `page.tsx`
  - [x] 🟩 52-week × 7-day grid, color-coded by count (gray → light → medium → dark green)
  - [x] 🟩 Sparse data handled — empty cells render as `bg-gray-100`, future cells transparent
  - [x] 🟩 Tooltip on hover: `"2025-03-01: 2 activities"`
  - [x] 🟩 Legend added (Less → More)

- [ ] 🟥 **Step 5: Edge Case Verification**
  - [ ] 🟥 New agent (Marcus Riley, 3 activities) — no broken UI, no false specializations
  - [ ] 🟥 Veteran (Sarah Chen, 90 activities) — heatmap fills correctly over 365 days
  - [ ] 🟥 Buyer-only (Priya Nair) — specialization shows buyer tags only
  - [ ] 🟥 Seller-heavy (David Okafor) — specialization shows listing/seller tags
  - [ ] 🟥 Well-rounded (Jordan Mills / `test-agent`) — multiple specializations shown

- [ ] 🟥 **Step 6: Final Review**
  - [ ] 🟥 Visit `/agent/test-agent` and assess: "Would I trust this as a homebuyer?"
  - [ ] 🟥 Commit seed script + heatmap changes
  - [ ] 🟥 Push and close issue #1
