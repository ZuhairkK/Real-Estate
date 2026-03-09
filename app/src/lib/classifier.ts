import Anthropic from "@anthropic-ai/sdk";
import { createServiceClient } from "./supabase";

const anthropic = new Anthropic();

const ACTIVITY_TYPES = [
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
] as const;

interface RawSignal {
  id: string;
  source: string;
  signal_data: Record<string, unknown>;
  signal_timestamp: string;
}

interface ClassifiedActivity {
  activity_type: (typeof ACTIVITY_TYPES)[number];
  confidence_score: number;
  activity_date: string;
  source_signal_ids: string[];
  metadata: Record<string, unknown>;
}

export async function classifySignals(
  agentId: string,
  signals: RawSignal[]
): Promise<ClassifiedActivity[]> {
  if (signals.length === 0) return [];

  const signalSummary = signals.map((s) => ({
    id: s.id,
    source: s.source,
    timestamp: s.signal_timestamp,
    data: s.signal_data,
  }));

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `You are an AI system that classifies real estate agent professional activities from workflow signals.

Given these raw signals from a real estate agent's calendar and email, classify each meaningful professional activity.

SIGNALS:
${JSON.stringify(signalSummary, null, 2)}

VALID ACTIVITY TYPES:
${ACTIVITY_TYPES.join(", ")}

RULES:
- Only classify signals that clearly indicate real estate professional activity
- Assign a confidence_score between 0 and 1
- Higher confidence when multiple signals corroborate (e.g., calendar event + related email)
- "other" is for real estate work that doesn't fit other categories
- Skip personal/non-work events entirely
- Group related signals into a single activity when they clearly refer to the same event

Respond with a JSON array of classified activities:
[{
  "activity_type": "one of the valid types",
  "confidence_score": 0.0 to 1.0,
  "activity_date": "YYYY-MM-DD",
  "source_signal_ids": ["signal_id_1"],
  "summary": "brief non-sensitive description"
}]

Return ONLY the JSON array, no other text.`,
      },
    ],
  });

  try {
    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const parsed = JSON.parse(text) as Array<{
      activity_type: (typeof ACTIVITY_TYPES)[number];
      confidence_score: number;
      activity_date: string;
      source_signal_ids: string[];
      summary?: string;
    }>;

    return parsed.map((item) => ({
      activity_type: item.activity_type,
      confidence_score: Math.min(1, Math.max(0, item.confidence_score)),
      activity_date: item.activity_date,
      source_signal_ids: item.source_signal_ids,
      metadata: { summary: item.summary },
    }));
  } catch {
    console.error("Failed to parse classifier response");
    return [];
  }
}

export async function classifyAgentSignals(agentId: string) {
  const supabase = createServiceClient();

  // Get unclassified signals (signals not yet referenced by any activity)
  const { data: signals, error } = await supabase
    .from("raw_signals")
    .select("id, source, signal_data, signal_timestamp")
    .eq("agent_id", agentId)
    .order("signal_timestamp", { ascending: false })
    .limit(100);

  if (error || !signals) {
    console.error("Failed to fetch signals:", error);
    return 0;
  }

  // Classify in batches of 20 signals
  let totalClassified = 0;
  for (let i = 0; i < signals.length; i += 20) {
    const batch = signals.slice(i, i + 20);
    const activities = await classifySignals(agentId, batch);

    if (activities.length > 0) {
      const rows = activities.map((a) => ({
        agent_id: agentId,
        ...a,
      }));

      const { error: insertError } = await supabase
        .from("classified_activities")
        .insert(rows);

      if (insertError) {
        console.error("Failed to insert activities:", insertError);
      } else {
        totalClassified += activities.length;
      }
    }
  }

  return totalClassified;
}
