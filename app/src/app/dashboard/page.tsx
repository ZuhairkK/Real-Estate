"use client";

import { useEffect, useState } from "react";

interface DashboardData {
  agent: { name: string; slug: string; email: string } | null;
  activities: Array<{
    id: string;
    activity_type: string;
    confidence_score: number;
    activity_date: string;
    agent_confirmed: boolean | null;
    metadata: { summary?: string };
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/signals/sync", { method: "POST" });
      const result = await res.json();
      alert(
        `Synced ${result.synced?.calendar || 0} calendar + ${result.synced?.gmail || 0} email signals. Classified ${result.classified || 0} activities.`
      );
      // Reload data
      const updated = await fetch("/api/dashboard").then((r) => r.json());
      setData(updated);
    } catch (err) {
      console.error("Sync failed:", err);
    } finally {
      setSyncing(false);
    }
  };

  const handleConfirm = async (activityId: string, confirmed: boolean) => {
    await fetch("/api/activities/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activityId, confirmed }),
    });
    // Reload
    const updated = await fetch("/api/dashboard").then((r) => r.json());
    setData(updated);
  };

  if (!data) return <div className="p-8">Loading...</div>;
  if (!data.agent)
    return (
      <div className="p-8">
        <a href="/api/auth/login" className="underline">
          Connect Google Account
        </a>
      </div>
    );

  const profileUrl = `/agent/${data.agent.slug}`;

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
      <p className="text-gray-600 mb-6">Welcome, {data.agent.name}</p>

      <div className="flex gap-4 mb-8">
        <button
          onClick={handleSync}
          disabled={syncing}
          className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {syncing ? "Syncing..." : "Sync Signals"}
        </button>
        <button
          onClick={() => navigator.clipboard.writeText(window.location.origin + profileUrl)}
          className="border border-gray-300 px-4 py-2 rounded"
        >
          Copy Profile Link
        </button>
      </div>

      <h2 className="text-lg font-semibold mb-4">
        Captured Activities ({data.activities.length})
      </h2>

      {data.activities.length === 0 ? (
        <p className="text-gray-500">
          No activities yet. Click &quot;Sync Signals&quot; to pull from your
          Google Calendar and Gmail.
        </p>
      ) : (
        <ul className="space-y-3">
          {data.activities.map((activity) => (
            <li
              key={activity.id}
              className="border rounded p-4 flex items-center justify-between"
            >
              <div>
                <span className="font-medium">
                  {activity.activity_type.replace(/_/g, " ")}
                </span>
                <span className="text-gray-400 ml-2 text-sm">
                  {activity.activity_date}
                </span>
                <span className="text-gray-400 ml-2 text-sm">
                  ({Math.round(activity.confidence_score * 100)}% confidence)
                </span>
                {activity.metadata?.summary && (
                  <p className="text-gray-500 text-sm mt-1">
                    {activity.metadata.summary}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {activity.agent_confirmed === null && (
                  <>
                    <button
                      onClick={() => handleConfirm(activity.id, true)}
                      className="text-green-600 text-sm border border-green-200 px-2 py-1 rounded"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => handleConfirm(activity.id, false)}
                      className="text-red-600 text-sm border border-red-200 px-2 py-1 rounded"
                    >
                      Dismiss
                    </button>
                  </>
                )}
                {activity.agent_confirmed === true && (
                  <span className="text-green-600 text-sm">Confirmed</span>
                )}
                {activity.agent_confirmed === false && (
                  <span className="text-red-400 text-sm">Dismissed</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
