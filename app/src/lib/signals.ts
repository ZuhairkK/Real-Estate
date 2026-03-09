import { getCalendarClient, getGmailClient, refreshAccessToken } from "./google";
import { createServiceClient } from "./supabase";

interface AgentTokens {
  id: string;
  google_access_token: string;
  google_refresh_token: string;
  google_token_expiry: string | null;
}

async function getValidAccessToken(agent: AgentTokens): Promise<string> {
  const supabase = createServiceClient();
  const expiry = agent.google_token_expiry
    ? new Date(agent.google_token_expiry)
    : null;

  // Refresh if expired or expiring within 5 minutes
  if (!expiry || expiry.getTime() < Date.now() + 5 * 60 * 1000) {
    const credentials = await refreshAccessToken(agent.google_refresh_token);

    await supabase
      .from("agents")
      .update({
        google_access_token: credentials.access_token,
        google_token_expiry: credentials.expiry_date
          ? new Date(credentials.expiry_date).toISOString()
          : null,
      })
      .eq("id", agent.id);

    return credentials.access_token!;
  }

  return agent.google_access_token;
}

export async function syncCalendarEvents(agent: AgentTokens) {
  const accessToken = await getValidAccessToken(agent);
  const calendar = getCalendarClient(accessToken);
  const supabase = createServiceClient();

  // Fetch events from the last 90 days
  const timeMin = new Date();
  timeMin.setDate(timeMin.getDate() - 90);

  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin: timeMin.toISOString(),
    maxResults: 250,
    singleEvents: true,
    orderBy: "startTime",
  });

  const events = response.data.items || [];
  const signals = events.map((event) => ({
    agent_id: agent.id,
    source: "google_calendar" as const,
    external_id: event.id,
    signal_data: {
      summary: event.summary,
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      attendee_count: event.attendees?.length || 0,
      location: event.location,
      has_meet_link: !!event.hangoutLink || !!event.conferenceData,
    },
    signal_timestamp: event.start?.dateTime || event.start?.date || new Date().toISOString(),
  }));

  if (signals.length > 0) {
    await supabase.from("raw_signals").upsert(signals, {
      onConflict: "agent_id,source,external_id",
    });
  }

  return signals.length;
}

export async function syncGmailMetadata(agent: AgentTokens) {
  const accessToken = await getValidAccessToken(agent);
  const gmail = getGmailClient(accessToken);
  const supabase = createServiceClient();

  // Fetch recent threads (last 90 days)
  const after = Math.floor(
    (Date.now() - 90 * 24 * 60 * 60 * 1000) / 1000
  );

  const response = await gmail.users.threads.list({
    userId: "me",
    q: `after:${after}`,
    maxResults: 100,
  });

  const threads = response.data.threads || [];
  const signals = [];

  // Fetch metadata for each thread (batch in groups of 10)
  for (let i = 0; i < Math.min(threads.length, 50); i++) {
    const thread = threads[i];
    try {
      const detail = await gmail.users.threads.get({
        userId: "me",
        id: thread.id!,
        format: "metadata",
        metadataHeaders: ["Subject", "From", "To", "Date"],
      });

      const headers = detail.data.messages?.[0]?.payload?.headers || [];
      const getHeader = (name: string) =>
        headers.find((h) => h.name === name)?.value || "";

      signals.push({
        agent_id: agent.id,
        source: "gmail" as const,
        external_id: thread.id,
        signal_data: {
          subject: getHeader("Subject"),
          from_domain: getHeader("From").split("@").pop()?.replace(">", ""),
          message_count: detail.data.messages?.length || 1,
          date: getHeader("Date"),
        },
        signal_timestamp: new Date(
          parseInt(detail.data.messages?.[0]?.internalDate || "0")
        ).toISOString(),
      });
    } catch {
      // Skip threads we can't read
      continue;
    }
  }

  if (signals.length > 0) {
    await supabase.from("raw_signals").upsert(signals, {
      onConflict: "agent_id,source,external_id",
    });
  }

  return signals.length;
}
