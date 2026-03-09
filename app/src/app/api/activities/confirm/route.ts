import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const agentId = request.cookies.get("agent_id")?.value;
  if (!agentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { activityId, confirmed } = await request.json();
  if (!activityId || typeof confirmed !== "boolean") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { error } = await supabase
    .from("classified_activities")
    .update({ agent_confirmed: confirmed })
    .eq("id", activityId)
    .eq("agent_id", agentId); // Ensure agent owns this activity

  if (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
