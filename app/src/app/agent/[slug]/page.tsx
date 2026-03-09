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
    specializations: string[];
  };
}

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

      {/* Activity timeline - simple bar representation */}
      {Object.keys(stats.activity_timeline).length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">
            Activity Timeline
          </h2>
          <div className="flex items-end gap-1 h-24">
            {Object.entries(stats.activity_timeline)
              .sort(([a], [b]) => a.localeCompare(b))
              .slice(-26) // Last 26 weeks
              .map(([week, count]) => {
                const maxCount = Math.max(
                  ...Object.values(stats.activity_timeline)
                );
                const height = Math.max(4, (count / maxCount) * 100);
                return (
                  <div
                    key={week}
                    className="bg-green-500 rounded-sm flex-1 min-w-1"
                    style={{ height: `${height}%` }}
                    title={`${week}: ${count} activities`}
                  />
                );
              })}
          </div>
          <p className="text-gray-400 text-xs mt-1">
            Weekly activity (last 6 months)
          </p>
        </div>
      )}

      <div className="mt-8 pt-4 border-t text-center text-gray-400 text-xs">
        Verified by Activus AI
      </div>
    </div>
  );
}
