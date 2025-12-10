"use client";

import React, { useState } from "react";
import { BACKEND_BASE } from "@/lib/config";

export default function EventPage({ params }: { params: { eventId: string } }) {
  const { eventId } = params;
  const [loading, setLoading] = useState(false);

  const createGroup = async (mode: "solo" | "friend" | "watch") => {
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_BASE}/queue/create-group`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: eventId,
          buyer1_id: "demo-user-1",
          mode,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        alert(data.detail || "Error creating group");
        return;
      }

      window.location.href = `/events/${eventId}/queue/status/${data.group_id}`;
    } catch (err) {
      console.error(err);
      setLoading(false);
      alert("Network error creating group");
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-10 flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Event {eventId}</h1>
      <p className="text-zinc-400">
        Choose how you want to join. You can queue alone, with a friend, or as a watch party.
      </p>

      <div className="flex flex-col gap-3 max-w-md mt-4">
        <button
          onClick={() => createGroup("solo")}
          className="bg-emerald-500 text-black font-bold py-3 px-6 rounded-md"
          disabled={loading}
        >
          {loading ? "Joining…" : "Join Queue"}
        </button>

        <button
          onClick={() => createGroup("friend")}
          className="bg-blue-500 text-black font-bold py-3 px-6 rounded-md"
          disabled={loading}
        >
          {loading ? "Creating…" : "Queue With a Friend"}
        </button>

        <button
          onClick={() => createGroup("watch")}
          className="bg-purple-500 text-black font-bold py-3 px-6 rounded-md"
          disabled={loading}
        >
          {loading ? "Joining…" : "Join Watch Party"}
        </button>
      </div>
    </main>
  );
}
