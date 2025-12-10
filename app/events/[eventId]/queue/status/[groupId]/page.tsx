"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BACKEND_BASE } from "@/lib/config";

type Group = {
  id: string;
  event_id: string;
  buyer1_id: string | null;
  buyer2_id: string | null;
  watch1_id: string | null;
  watch2_id: string | null;
  locked: boolean;
  in_checkout: boolean;
  queue_position: number | null;
};

export default function QueueStatusPage({
  params,
}: {
  params: { eventId: string; groupId: string };
}) {
  const { eventId, groupId } = params;
  const router = useRouter();
  const [group, setGroup] = useState<Group | null>(null);
  const [position, setPosition] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const res = await fetch(`${BACKEND_BASE}/queue/group/${groupId}`);
        if (res.ok) {
          const data = await res.json();
          if (mounted) setGroup(data);
        }

        const posRes = await fetch(
          `${BACKEND_BASE}/queue/position/${eventId}/${groupId}`
        );
        if (posRes.ok) {
          const posData = await posRes.json();
          if (mounted) setPosition(posData.position ?? null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    const id = setInterval(load, 5000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [eventId, groupId]);

  const handleLeave = async () => {
    setLeaving(true);
    try {
      await fetch(`${BACKEND_BASE}/queue/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: eventId,
          group_id: groupId,
        }),
      });
      router.push(`/events/${eventId}`);
    } catch (err) {
      console.error(err);
      setLeaving(false);
    }
  };

  const goToMap = () => {
    router.push(`/events/${eventId}/map?groupId=${groupId}`);
  };

  return (
    <main className="min-h-screen bg-black text-white p-10 flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Queue Status</h1>
      <p className="text-zinc-400">
        Group ID: <span className="font-mono text-xs">{groupId}</span>
      </p>

      {loading && <p className="text-zinc-400">Loading queue info…</p>}

      {!loading && (
        <>
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 max-w-md">
            <p className="text-sm text-zinc-400 mb-1">Your position</p>
            <p className="text-4xl font-bold">{position ?? "—"}</p>
            <p className="text-xs text-zinc-500 mt-2">
              This demo queue updates every few seconds.
            </p>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={goToMap}
              className="px-4 py-2 rounded-md bg-emerald-500 text-black font-semibold"
            >
              Continue to Seats
            </button>
            <button
              onClick={handleLeave}
              disabled={leaving}
              className="px-4 py-2 rounded-md bg-zinc-800 text-sm text-zinc-200"
            >
              {leaving ? "Leaving…" : "Leave Queue"}
            </button>
          </div>

          {group && (
            <div className="mt-6 text-sm text-zinc-400">
              <p>Mode:</p>
              <ul className="list-disc list-inside">
                <li>Buyer 1: {group.buyer1_id || "—"}</li>
                <li>Buyer 2: {group.buyer2_id || "—"}</li>
                <li>Watchers: {[group.watch1_id, group.watch2_id].filter(Boolean).join(", ") || "—"}</li>
              </ul>
            </div>
          )}
        </>
      )}
    </main>
  );
}
