"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Button, Card, inputCls } from "./ui";

// Shown once on a brand-new device so visitors join the group's existing
// trip instead of accidentally starting their own.
export function Welcome() {
  const { isFresh, dismissWelcome, joinTrip } = useStore();
  const [code, setCode] = useState("");

  if (!isFresh) return null;

  return (
    <Card className="border-brand-300 bg-brand-50/60">
      <div className="mb-1 text-lg font-bold text-brand-800">
        Welcome! 🏕️
      </div>
      <p className="mb-3 text-sm text-gray-600">
        Is your group already planning a trip here? Join it with the invite
        code from your share link — or start a fresh trip.
      </p>
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Invite code (e.g. ABC123)"
          className={`${inputCls} uppercase tracking-widest`}
          maxLength={12}
        />
        <Button
          onClick={() => {
            if (code.trim()) joinTrip(code);
          }}
        >
          Join
        </Button>
      </div>
      <button
        onClick={dismissWelcome}
        className="mt-3 text-sm font-medium text-brand-600 underline"
      >
        No code? Start a new trip →
      </button>
    </Card>
  );
}
