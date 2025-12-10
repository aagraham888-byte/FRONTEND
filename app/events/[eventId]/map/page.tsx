"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { mockSeats, Seat as MockSeat } from "./seats";
import { BACKEND_BASE } from "@/lib/config";

type Section = {
  id: string;
  label: string;
  level: "lower" | "upper";
  basePrice: number;
  color: string;
  totalSeats: number;
  availableSeats: number;
};

type Seat = {
  id: string;
  sectionId: string;
  row: string;
  number: number;
  price: number;
  available: boolean;
};

const MAX_SELECTION = 4;

export default function EventStadiumMapPage({
  params,
}: {
  params: { eventId: string };
}) {
  const { eventId } = params;
  const searchParams = useSearchParams();
  const router = useRouter();
  const groupId = searchParams.get("groupId") ?? "demo-group";

  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    null
  );
  const [sectionSeats, setSectionSeats] = useState<Seat[]>([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [loadingSections, setLoadingSections] = useState(false);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [zoom, setZoom] = useState(1);

  const selectedSection = useMemo(
    () => sections.find((s) => s.id === selectedSectionId) || null,
    [sections, selectedSectionId]
  );

  const selectedSeats = useMemo(
    () =>
      selectedSeatIds
        .map((id) => sectionSeats.find((s) => s.id === id))
        .filter(Boolean) as Seat[],
    [selectedSeatIds, sectionSeats]
  );

  const totalPrice = useMemo(
    () => selectedSeats.reduce((sum, s) => sum + s.price, 0),
    [selectedSeats]
  );

  // Load sections
  useEffect(() => {
    const loadSections = async () => {
      setLoadingSections(true);
      try {
        const res = await fetch(
          `${BACKEND_BASE}/map/events/${eventId}/sections`
        );
        if (!res.ok) throw new Error("failed");
        const data = await res.json();
        const apiSections = (data.sections || []) as any[];
        const normalized: Section[] = apiSections.map((s) => ({
          id: s.id,
          label: s.label,
          level: s.level === "upper" ? "upper" : "lower",
          basePrice: s.basePrice ?? 0,
          color: s.color ?? "#22c55e",
          totalSeats: s.totalSeats ?? 0,
          availableSeats: s.availableSeats ?? 0,
        }));
        setSections(normalized);
        if (normalized.length > 0) setSelectedSectionId(normalized[0].id);
      } catch (err) {
        console.warn("[Map] Backend section load failed, using mock seats.", err);
        const bySection: Record<string, Seat[]> = {};
        mockSeats.forEach((m) => {
          if (!bySection[m.sectionId]) bySection[m.sectionId] = [];
          bySection[m.sectionId].push({
            id: m.id,
            sectionId: m.sectionId,
            row: m.row,
            number: m.number,
            price: m.price,
            available: m.available,
          });
        });

        const fallback: Section[] = Object.entries(bySection).map(
          ([id, seats]) => ({
            id,
            label: id,
            level: id.startsWith("2") ? "upper" : "lower",
            basePrice: seats[0]?.price ?? 0,
            color: id.startsWith("2") ? "#38bdf8" : "#22c55e",
            totalSeats: seats.length,
            availableSeats: seats.filter((s) => s.available).length,
          })
        );

        setSections(fallback);
        if (fallback.length > 0) setSelectedSectionId(fallback[0].id);
      } finally {
        setLoadingSections(false);
      }
    };

    loadSections();
  }, [eventId]);

  // Load seats for selected section
  useEffect(() => {
    if (!selectedSectionId) return;

    const loadSeats = async () => {
      setLoadingSeats(true);
      try {
        const res = await fetch(
          `${BACKEND_BASE}/map/events/${eventId}/sections/${selectedSectionId}/seats`
        );
        if (!res.ok) throw new Error("failed");
        const data = await res.json();
        const apiSeats = (data.seats || []) as any[];

        const normalized: Seat[] = apiSeats.map((s) => ({
          id: s.id,
          sectionId: s.sectionId,
          row: String(s.row),
          number: Number(s.number),
          price: Number(s.price),
          available: !!s.available,
        }));

        setSectionSeats(normalized);
      } catch (err) {
        console.warn("[Map] Seat load failed, using mock seats.", err);
        const fallback = mockSeats
          .filter((m) => m.sectionId === selectedSectionId)
          .map((m: MockSeat) => ({
            id: m.id,
            sectionId: m.sectionId,
            row: m.row,
            number: m.number,
            price: m.price,
            available: m.available,
          }));
        setSectionSeats(fallback);
      } finally {
        setLoadingSeats(false);
      }
    };

    loadSeats();
  }, [eventId, selectedSectionId]);

  const toggleSeat = (seat: Seat) => {
    if (!seat.available) return;
    setSelectedSeatIds((prev) => {
      if (prev.includes(seat.id)) return prev.filter((id) => id !== seat.id);
      if (prev.length >= MAX_SELECTION) return prev;
      return [...prev, seat.id];
    });
  };

  const handleCheckout = async () => {
    if (!selectedSeats.length) return;

    try {
      const res = await fetch(`${BACKEND_BASE}/checkout/lock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          group_id: groupId,
          ticket_ids: selectedSeats.map((s) => s.id),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert("Seat lock failed: " + (data.detail ?? JSON.stringify(data)));
        return;
      }

      localStorage.setItem(
        "checkout_data",
        JSON.stringify({
          groupId,
          expiresAt: data.expires_at,
          selectedSeats,
          totalPrice,
        })
      );

      router.push(`/checkout/${eventId}`);
    } catch (err) {
      console.error(err);
      alert("Error locking seats.");
    }
  };

  const sectionPositions = useMemo(() => {
    if (!sections.length)
      return [] as { id: string; x: number; y: number }[];
    const radius = 180;
    const centerX = 300;
    const centerY = 260;

    return sections.map((section, idx) => {
      const angle = (idx / sections.length) * Math.PI * 2 - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * (radius * 0.6);
      return { id: section.id, x, y };
    });
  }, [sections]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <div>
          <h1 className="text-xl font-semibold">
            Stadium Map — Event {eventId}
          </h1>
          <p className="text-sm text-zinc-400">
            Click a section, then choose up to {MAX_SELECTION} seats.
          </p>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-emerald-500" /> Lower level
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-sky-400" /> Upper level
          </div>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        <section className="flex-[3] flex items-center justify-center border-r border-zinc-800 bg-zinc-950">
          <div className="relative">
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <button
                onClick={() => setZoom((z) => Math.min(1.6, z + 0.1))}
                className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-lg"
              >
                +
              </button>
              <button
                onClick={() => setZoom((z) => Math.max(0.7, z - 0.1))}
                className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-lg"
              >
                –
              </button>
            </div>

            <svg
              width={600}
              height={480}
              viewBox="0 0 600 480"
              className="drop-shadow-[0_0_30px_rgba(0,0,0,0.8)]"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "50% 50%",
                transition: "transform 150ms ease-out",
              }}
            >
              <rect
                x={190}
                y={120}
                width={220}
                height={100}
                rx={16}
                fill="#111827"
                stroke="#4b5563"
              />
              <rect
                x={120}
                y={90}
                width={360}
                height={260}
                rx={70}
                fill="#020617"
                stroke="#334155"
              />
              <rect
                x={80}
                y={60}
                width={440}
                height={310}
                rx={90}
                fill="none"
                stroke="#1f2937"
                strokeDasharray="4 6"
              />

              {sectionPositions.map((pos) => {
                const section = sections.find((s) => s.id === pos.id);
                if (!section) return null;
                const isActive = selectedSectionId === section.id;

                return (
                  <g
                    key={section.id}
                    onClick={() => {
                      setSelectedSectionId(section.id);
                      setSelectedSeatIds([]);
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <rect
                      x={pos.x - 30}
                      y={pos.y - 14}
                      width={60}
                      height={28}
                      rx={14}
                      fill={section.color}
                      opacity={isActive ? 1 : 0.6}
                      stroke={isActive ? "#facc15" : "transparent"}
                      strokeWidth={isActive ? 2 : 0}
                    />
                    <text
                      x={pos.x}
                      y={pos.y + 4}
                      textAnchor="middle"
                      fontSize={12}
                      fontWeight={700}
                      fill="#020617"
                    >
                      {section.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </section>

        <section className="flex-[2] flex flex-col bg-zinc-950">
          <div className="p-5 border-b border-zinc-800">
            {loadingSections ? (
              <p className="text-zinc-400 text-sm">Loading sections…</p>
            ) : selectedSection ? (
              <>
                <p className="text-xs uppercase tracking-wide text-zinc-500 mb-1">
                  Section
                </p>
                <h2 className="text-xl font-semibold mb-2">
                  {selectedSection.label}{" "}
                  <span className="text-xs font-normal text-zinc-400 ml-2">
                    {selectedSection.level === "lower"
                      ? "Lower level – closer to floor"
                      : "Upper level – elevated view"}
                  </span>
                </h2>
                <p className="text-xs text-zinc-400">
                  {selectedSection.availableSeats} of {" "}
                  {selectedSection.totalSeats} seats available
                </p>
              </>
            ) : (
              <p className="text-zinc-400 text-sm">
                Select a section on the map to see seats.
              </p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {loadingSeats ? (
              <p className="text-zinc-400 text-sm">Loading seats…</p>
            ) : sectionSeats.length === 0 ? (
              <p className="text-zinc-500 text-sm">
                No seats found for this section.
              </p>
            ) : (
              sectionSeats.map((seat) => {
                const isSelected = selectedSeatIds.includes(seat.id);
                const disabled = !seat.available;

                return (
                  <button
                    key={seat.id}
                    onClick={() => toggleSeat(seat)}
                    disabled={disabled}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md border text-sm transition
                      ${
                        disabled
                          ? "border-zinc-800 bg-zinc-900/40 text-zinc-500 cursor-not-allowed"
                          : isSelected
                          ? "border-emerald-400 bg-emerald-500/10 text-emerald-100"
                          : "border-zinc-800 bg-zinc-900 hover:border-zinc-600"
                      }`}
                  >
                    <div className="flex flex-col text-left">
                      <span className="font-medium">
                        Row {seat.row} • Seat {seat.number}
                      </span>
                      <span className="text-xs text-zinc-400">
                        Section {seat.sectionId}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-semibold">${seat.price}</span>
                      {!seat.available && (
                        <span className="text-[10px] uppercase text-rose-400">
                          Sold
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="border-t border-zinc-800 px-5 py-4 flex items-center justify-between bg-zinc-950/90">
            <div className="flex flex-col">
              <span className="text-xs text-zinc-400 uppercase tracking-wide">
                Selected seats
              </span>
              <span className="text-sm">
                {selectedSeats.length} / {MAX_SELECTION} • {" "}
                <span className="font-semibold">${totalPrice}</span>
              </span>
            </div>
            <button
              disabled={!selectedSeats.length}
              onClick={handleCheckout}
              className={`px-4 py-2 rounded-md text-sm font-medium transition
                ${
                  selectedSeats.length
                    ? "bg-emerald-500 text-black hover:bg-emerald-400"
                    : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                }`}
            >
              Continue to checkout
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
