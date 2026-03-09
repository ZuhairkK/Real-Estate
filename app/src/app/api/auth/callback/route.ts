import { NextRequest, NextResponse } from "next/server";
import { createOAuth2Client } from "@/lib/google";
import { createServiceClient } from "@/lib/supabase";
import { google } from "googleapis";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      new URL("/?error=no_code", process.env.NEXT_PUBLIC_APP_URL!)
    );
  }

  try {
    const oauth2Client = createOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    const supabase = createServiceClient();

    // Upsert agent record
    const { data: agent, error } = await supabase
      .from("agents")
      .upsert(
        {
          email: userInfo.email,
          name: userInfo.name,
          avatar_url: userInfo.picture,
          google_access_token: tokens.access_token,
          google_refresh_token: tokens.refresh_token,
          google_token_expiry: tokens.expiry_date
            ? new Date(tokens.expiry_date).toISOString()
            : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "email" }
      )
      .select("id, slug")
      .single();

    if (error) throw error;

    // Set a session cookie with the agent ID
    const response = NextResponse.redirect(
      new URL("/dashboard", process.env.NEXT_PUBLIC_APP_URL!)
    );

    response.cookies.set("agent_id", agent.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/?error=auth_failed", process.env.NEXT_PUBLIC_APP_URL!)
    );
  }
}
