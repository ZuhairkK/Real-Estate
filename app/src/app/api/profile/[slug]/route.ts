import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = createServiceClient();

  // Get agent by slug
  const { data: agent, error: agentError } = await supabase
    .from("agents")
    .select("id, name, slug, avatar_url, bio, brokerage, years_active, created_at")
    .eq("slug", slug)
    .single();

  if (agentError || !agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  // Get confirmed activities (aggregated)
  const { data: activities } = await supabase
    .from("classified_activities")
    .select("activity_type, confidence_score, activity_date, metadata")
    .eq("agent_id", agent.id)
    .gte("confidence_score", 0.5)
    .not("agent_confirmed", "eq", false)
    .order("activity_date", { ascending: false });

  // Aggregate into profile stats
  const activityCounts: Record<string, number> = {};
  const activityTimeline: Record<string, number> = {};

  for (const activity of activities || []) {
    // Count by type
    activityCounts[activity.activity_type] =
      (activityCounts[activity.activity_type] || 0) + 1;

    // Weekly activity graph
    const weekKey = getWeekKey(new Date(activity.activity_date));
    activityTimeline[weekKey] = (activityTimeline[weekKey] || 0) + 1;
  }

  // Determine specialization from top activity types
  const sortedTypes = Object.entries(activityCounts).sort(
    ([, a], [, b]) => b - a
  );
  const totalActivities = sortedTypes.reduce((sum, [, count]) => sum + count, 0);
  const specializations = sortedTypes
    .filter(([, count]) => count / totalActivities > 0.2)
    .map(([type]) => type);

  return NextResponse.json({
    agent: {
      name: agent.name,
      slug: agent.slug,
      avatar_url: agent.avatar_url,
      bio: agent.bio,
      brokerage: agent.brokerage,
      years_active: agent.years_active,
      member_since: agent.created_at,
    },
    stats: {
      total_activities: totalActivities,
      activity_counts: activityCounts,
      activity_timeline: activityTimeline,
      specializations,
    },
  });
}

function getWeekKey(date: Date): string {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(
    ((date.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
  );
  return `${date.getFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
}
