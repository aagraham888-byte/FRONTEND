"use client";

import React, { useEffect, useState } from "react";

type Props = {
  expiresAt: string | number;
};

export default function LockCountdown({ expiresAt }: Props) {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    const parseExpiry = () => {
      if (typeof expiresAt === "number") return new Date(expiresAt * 1000);
      return new Date(String(expiresAt));
    };

    let mounted = true;

    const update = () => {
      const now = new Date();
      const exp = parseExpiry();
      const diff = exp.getTime() - now.getTime();

      if (diff <= 0) {
        if (mounted) setTimeLeft("Expired");
        return;
      }

      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);

      if (mounted) setTimeLeft(`${mins}m ${secs}s`);
    };

    update();
    const id = setInterval(update, 1000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [expiresAt]);

  return (
    <span
      className={
        "font-bold " +
        (timeLeft === "Expired" ? "text-rose-500" : "text-amber-400")
      }
    >
      {timeLeft}
    </span>
  );
}
