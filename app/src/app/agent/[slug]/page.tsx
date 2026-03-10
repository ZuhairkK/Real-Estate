"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface ProfileData {
  agent: {
    name: string;
    slug: string;
    avatar_url: string;
    bio: string;
    brokerage: string;
    years_active: number;
    member_since: string;
  };
  stats: {
    total_activities: number;
    activity_counts: Record<string, number>;
    activity_timeline: Record<string, number>;
    activity_by_day: Record<string, number>;
    specializations: string[];
  };
}

// ─── Heatmap ─────────────────────────────────────────────────────────────────

/** Color intensity based on activity count per day */
function heatColor(count: number): string {
  if (count === 0) return "bg-gray-100";
  if (count === 1) return "bg-green-200";
  if (count <= 3) return "bg-green-400";
  return "bg-green-600";
}

/**
 * Builds a 53-week × 7-day grid anchored to today.
 * Returns an array of week columns, each with 7 day cells.
 */
function buildGrid(activityByDay: Record<string, number>) {
  const today = new Date();

  // Start on the Sunday 52 full weeks before today's week-start
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - today.getDay() - 52 * 7);

  const weeks: Array<Array<{ date: string; count: number; isFuture: boolean }>> = [];
  const cursor = new Date(startDate);

  while (cursor <= today) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const iso = cursor.toISOString().split("T")[0];
      week.push({
        date: iso,
        count: activityByDay[iso] ?? 0,
        isFuture: cursor > today,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }

  return weeks;
}

function ActivityHeatmap({ activityByDay }: { activityByDay: Record<string, number> }) {
  const weeks = buildGrid(activityByDay);
  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">
        Activity (last 12 months)
      </h2>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {/* Day-of-week labels */}
        <div className="flex flex-col gap-1 mr-1 mt-0">
          {DAY_LABELS.map((label) => (
            <div
              key={label}
              className="h-3 w-6 text-gray-400 text-[9px] leading-3 flex items-center"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Week columns */}
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map(({ date, count, isFuture }) => (
              <div
                key={date}
                title={
                  isFuture
                    ? ""
                    : count === 0
                    ? `${date}: no activity`
                    : `${date}: ${count} activit${count === 1 ? "y" : "ies"}`
                }
                className={`w-3 h-3 rounded-sm ${
                  isFuture ? "bg-transparent" : heatColor(count)
                }`}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1 mt-2">
        <span className="text-gray-400 text-[10px] mr-1">Less</span>
        {["bg-gray-100", "bg-green-200", "bg-green-400", "bg-green-600"].map((cls) => (
          <div key={cls} className={`w-3 h-3 rounded-sm ${cls}`} />
        ))}
        <span className="text-gray-400 text-[10px] ml-1">More</span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AgentProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/profile/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(setProfile)
      .catch(() => setError(true));
  }, [slug]);

  if (error) return <div className="p-8 text-center">Agent not found.</div>;
  if (!profile) return <div className="p-8 text-center">Loading...</div>;

  const { agent, stats } = profile;

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="flex items-center gap-4 mb-6">
        {agent.avatar_url && (
          <img
            src={agent.avatar_url}
            alt={agent.name}
            className="w-16 h-16 rounded-full"
          />
        )}
        <div>
          <h1 className="text-2xl font-bold">{agent.name}</h1>
          {agent.brokerage && (
            <p className="text-gray-500">{agent.brokerage}</p>
          )}
          {agent.years_active && (
            <p className="text-gray-400 text-sm">
              {agent.years_active} years in real estate
            </p>
          )}
        </div>
      </div>

      {agent.bio && <p className="text-gray-700 mb-6">{agent.bio}</p>}

      {stats.specializations.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">
            Specializations
          </h2>
          <div className="flex gap-2">
            {stats.specializations.map((s) => (
              <span
                key={s}
                className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
              >
                {s.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">
          Activity Summary
        </h2>
        <p className="text-3xl font-bold">{stats.total_activities}</p>
        <p className="text-gray-500 text-sm">verified professional activities</p>
      </div>

      {Object.keys(stats.activity_counts).length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">
            Activity Breakdown
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(stats.activity_counts)
              .sort(([, a], [, b]) => b - a)
              .map(([type, count]) => (
                <div
                  key={type}
                  className="flex justify-between border rounded p-3"
                >
                  <span className="text-sm">
                    {type.replace(/_/g, " ")}
                  </span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Activity heatmap — GitHub-style 52-week grid */}
      <ActivityHeatmap activityByDay={stats.activity_by_day} />

      <div className="mt-8 pt-4 border-t text-center text-gray-400 text-xs">
        Verified by Activus AI
      </div>
    </div>
  );
}
