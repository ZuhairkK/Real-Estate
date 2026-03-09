import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const agentId = request.cookies.get("agent_id")?.value;

  if (!agentId) {
    return NextResponse.json({ agent: null, activities: [] });
  }

  const supabase = createServiceClient();

  const { data: agent } = await supabase
    .from("agents")
    .select("name, slug, email")
    .eq("id", agentId)
    .single();

  const { data: activities } = await supabase
    .from("classified_activities")
    .select("id, activity_type, confidence_score, activity_date, agent_confirmed, metadata")
    .eq("agent_id", agentId)
    .order("activity_date", { ascending: false })
    .limit(50);

  return NextResponse.json({
    agent,
    activities: activities || [],
  });
}
