import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { syncCalendarEvents, syncGmailMetadata } from "@/lib/signals";
import { classifyAgentSignals } from "@/lib/classifier";

export async function POST(request: NextRequest) {
  const agentId = request.cookies.get("agent_id")?.value;

  if (!agentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data: agent, error } = await supabase
    .from("agents")
    .select("id, google_access_token, google_refresh_token, google_token_expiry")
    .eq("id", agentId)
    .single();

  if (error || !agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  try {
    // Sync signals from both sources
    const [calendarCount, gmailCount] = await Promise.all([
      syncCalendarEvents(agent),
      syncGmailMetadata(agent),
    ]);

    // Classify the new signals
    const classifiedCount = await classifyAgentSignals(agentId);

    return NextResponse.json({
      synced: { calendar: calendarCount, gmail: gmailCount },
      classified: classifiedCount,
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: "Sync failed" },
      { status: 500 }
    );
  }
}
