"use client";

import React, { useEffect, useState } from "react";
import LockCountdown from "@/components/LockCountdown";

const BACKEND_BASE =
  process.env.NEXT_PUBLIC_BACKEND_BASE || "https://api.ticketfangrub.com";

type Seat = {
  id: string;
  sectionId: string | number;
  row: string | number;
  number: string | number;
  price: number;
};

type CheckoutData = {
  groupId: string;
  expiresAt: string;
  selectedSeats: Seat[];
  totalPrice: number;
};

export default function CheckoutPage({
  params,
}: {
  params: { eventId: string };
}) {
  const { eventId } = params;

  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("checkout_data");
    if (!saved) return;
    const parsed: CheckoutData = JSON.parse(saved);
    setCheckoutData(parsed);
  }, []);

  const completePurchase = async () => {
    if (!checkoutData) return;

    const res = await fetch(`${BACKEND_BASE}/checkout/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        group_id: checkoutData.groupId,
        buyer_id: "demo-buyer-1",
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.detail || "Error completing purchase");
      return;
    }

    localStorage.removeItem("checkout_data");
    window.location.href = "/checkout/success";
  };

  if (!checkoutData) {
    return (
      <main className="min-h-screen bg-black text-white p-10">
        <h1 className="text-3xl font-bold mb-4">Checkout</h1>
        <p>No seat selection found.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-10 flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Checkout — Event {eventId}</h1>

      <div className="text-xl">
        ⏳ Seat lock expires in: {" "}
        <LockCountdown expiresAt={checkoutData.expiresAt} />
      </div>

      <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-700">
        <h2 className="text-xl mb-3">Selected Seats</h2>

        {checkoutData.selectedSeats.map((seat) => (
          <div
            key={seat.id}
            className="flex justify-between border-b border-zinc-700 py-2"
          >
            <span>
              Section {seat.sectionId} — Row {seat.row}, Seat {seat.number}
            </span>
            <span>${seat.price}</span>
          </div>
        ))}

        <div className="flex justify-between font-bold text-lg mt-3">
          <span>Total</span>
          <span>${checkoutData.totalPrice}</span>
        </div>
      </div>

      <button
        onClick={completePurchase}
        className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 px-6 rounded-md text-lg"
      >
        Complete Purchase
      </button>
    </main>
  );
}
