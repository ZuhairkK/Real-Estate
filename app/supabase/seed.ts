/**
 * Seed script: realistic test data for agent profiles
 * Run: npx tsx supabase/seed.ts
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// ─── Helpers ────────────────────────────────────────────────────────────────

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

type ActivityType =
  | "buyer_consultation"
  | "listing_presentation"
  | "open_house"
  | "property_tour"
  | "market_evaluation"
  | "contract_review"
  | "training_mentorship"
  | "client_meeting"
  | "listing_preparation"
  | "other";

function makeActivities(
  agentId: string,
  count: number,
  typeWeights: Partial<Record<ActivityType, number>>,
  spreadDays: number
): object[] {
  const allTypes: ActivityType[] = [
    "buyer_consultation",
    "listing_presentation",
    "open_house",
    "property_tour",
    "market_evaluation",
    "contract_review",
    "training_mentorship",
    "client_meeting",
    "listing_preparation",
    "other",
  ];

  // Build weighted pool
  const pool: ActivityType[] = [];
  for (const type of allTypes) {
    const weight = typeWeights[type] ?? 1;
    for (let i = 0; i < weight; i++) pool.push(type);
  }

  const activities = [];
  for (let i = 0; i < count; i++) {
    const activityType = pick(pool);
    const daysBack = randomBetween(1, spreadDays);
    activities.push({
      agent_id: agentId,
      activity_type: activityType,
      confidence_score: parseFloat((0.7 + Math.random() * 0.3).toFixed(2)),
      activity_date: daysAgo(daysBack),
      source_signal_ids: [],
      agent_confirmed: null,
      metadata: {
        summary: summaryFor(activityType),
      },
    });
  }
  return activities;
}

function summaryFor(type: ActivityType): string {
  const summaries: Record<ActivityType, string[]> = {
    buyer_consultation: [
      "Initial buyer consultation, first-time homebuyer",
      "Reviewed budget and wishlist with buyers",
      "Pre-approval discussion and neighborhood overview",
    ],
    listing_presentation: [
      "Presented CMA and marketing plan to sellers",
      "Listing presentation for 4BR in Westside",
      "Met with sellers to discuss pricing strategy",
    ],
    open_house: [
      "Open house at 123 Maple St, 14 visitors",
      "Sunday open house, collected 6 buyer inquiries",
      "Hosted open house, strong foot traffic",
    ],
    property_tour: [
      "Toured 3 properties with buyer clients",
      "Showing — 2BR condo downtown",
      "Private tour of newly listed home",
    ],
    market_evaluation: [
      "Prepared CMA for prospective seller",
      "Market analysis for neighborhood price trends",
      "Evaluated property value for client refinance",
    ],
    contract_review: [
      "Reviewed purchase agreement with buyers",
      "Counter-offer review and negotiation",
      "Went through inspection addendum with clients",
    ],
    training_mentorship: [
      "Attended brokerage training on contract law",
      "Mentored new agent on open house strategy",
      "Completed continuing education credit",
    ],
    client_meeting: [
      "Check-in call with active buyers",
      "Post-closing follow-up with client",
      "Status update meeting with seller clients",
    ],
    listing_preparation: [
      "Coordinated staging and photography",
      "Prepared listing for MLS launch",
      "Walkthrough with stager before listing went live",
    ],
    other: [
      "Attended local real estate networking event",
      "Reviewed escrow documents",
      "Coordinated with title company",
    ],
  };
  return pick(summaries[type]);
}

// ─── Seed Agents ────────────────────────────────────────────────────────────

const agents = [
  {
    // Veteran — mixed activity, 90 activities over 2 years
    email: "sarah.chen@activus-test.dev",
    name: "Sarah Chen",
    slug: "sarah-chen",
    brokerage: "Keller Williams Westside",
    bio: "12-year veteran helping families find their forever homes across the metro area. Specializes in first-time buyers and move-up transactions.",
    years_active: 12,
    typeWeights: {
      buyer_consultation: 5,
      property_tour: 6,
      client_meeting: 4,
      listing_presentation: 3,
      open_house: 3,
      contract_review: 3,
      market_evaluation: 2,
      listing_preparation: 2,
      training_mentorship: 1,
    } as Partial<Record<ActivityType, number>>,
    count: 90,
    spreadDays: 365,
  },
  {
    // New agent — only 3 activities
    email: "marcus.riley@activus-test.dev",
    name: "Marcus Riley",
    slug: "marcus-riley",
    brokerage: "Coldwell Banker Metro",
    bio: "New to real estate, passionate about helping buyers navigate the process.",
    years_active: 1,
    typeWeights: {
      buyer_consultation: 2,
      property_tour: 1,
    } as Partial<Record<ActivityType, number>>,
    count: 3,
    spreadDays: 60,
  },
  {
    // Buyer specialist — 45 activities, almost exclusively buyer-side
    email: "priya.nair@activus-test.dev",
    name: "Priya Nair",
    slug: "priya-nair",
    brokerage: "RE/MAX Premier",
    bio: "Dedicated buyer's agent. I work exclusively with buyers — no listings, no conflicts.",
    years_active: 5,
    typeWeights: {
      buyer_consultation: 8,
      property_tour: 7,
      client_meeting: 5,
      contract_review: 3,
      market_evaluation: 1,
    } as Partial<Record<ActivityType, number>>,
    count: 45,
    spreadDays: 180,
  },
  {
    // Seller specialist — listing-heavy
    email: "david.okafor@activus-test.dev",
    name: "David Okafor",
    slug: "david-okafor",
    brokerage: "Compass",
    bio: "Listing specialist with a track record of selling homes fast and above ask. I live in the seller side of the transaction.",
    years_active: 9,
    typeWeights: {
      listing_presentation: 8,
      listing_preparation: 7,
      open_house: 6,
      market_evaluation: 5,
      contract_review: 4,
      client_meeting: 3,
      buyer_consultation: 1,
    } as Partial<Record<ActivityType, number>>,
    count: 60,
    spreadDays: 270,
  },
  {
    // The canonical test agent slug
    email: "test.agent@activus-test.dev",
    name: "Jordan Mills",
    slug: "test-agent",
    brokerage: "Coldwell Banker Metro",
    bio: "Seven years helping clients on both sides of the transaction. Known for steady communication and no surprises at closing.",
    years_active: 7,
    typeWeights: {
      buyer_consultation: 4,
      listing_presentation: 3,
      open_house: 3,
      property_tour: 5,
      market_evaluation: 2,
      contract_review: 3,
      client_meeting: 4,
      listing_preparation: 2,
      training_mentorship: 1,
      other: 1,
    } as Partial<Record<ActivityType, number>>,
    count: 75,
    spreadDays: 365,
  },
];

// ─── Run ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log("Seeding agents and activities...\n");

  for (const agentDef of agents) {
    const { typeWeights, count, spreadDays, ...agentData } = agentDef;

    // Upsert agent (by email)
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .upsert(agentData, { onConflict: "email" })
      .select("id, slug")
      .single();

    if (agentError || !agent) {
      console.error(`Failed to upsert agent ${agentData.name}:`, agentError);
      continue;
    }

    // Delete existing seed activities to allow re-running cleanly
    await supabase
      .from("classified_activities")
      .delete()
      .eq("agent_id", agent.id);

    // Insert activities
    const activities = makeActivities(agent.id, count, typeWeights, spreadDays);
    const { error: actError } = await supabase
      .from("classified_activities")
      .insert(activities);

    if (actError) {
      console.error(`Failed to insert activities for ${agentData.name}:`, actError);
    } else {
      console.log(`✓ ${agentData.name} (/${agent.slug}) — ${count} activities`);
    }
  }

  console.log("\nDone. Visit /agent/test-agent to preview.");
}

seed().catch(console.error);
