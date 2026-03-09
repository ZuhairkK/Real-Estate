import { cookies } from "next/headers";
import { createServiceClient } from "./supabase";

export async function getCurrentAgent() {
  const cookieStore = await cookies();
  const agentId = cookieStore.get("agent_id")?.value;

  if (!agentId) return null;

  const supabase = createServiceClient();
  const { data: agent } = await supabase
    .from("agents")
    .select("id, name, slug, email, avatar_url, bio, brokerage, years_active")
    .eq("id", agentId)
    .single();

  return agent;
}
