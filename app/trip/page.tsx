"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { Button, Card, PageHeader } from "@/components/ui";
import { uid, personalTemplate } from "@/lib/seed";
import type { AppState } from "@/lib/types";

export default function TripPage() {
  const { state, update, replace, reset } = useStore();
  const { trip } = state;
  const [shareLink, setShareLink] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setShareLink(`${window.location.origin}/?join=${trip.inviteCode}`);
  }, [trip.inviteCode]);

  const set = <K extends keyof AppState["trip"]>(
    key: K,
    value: AppState["trip"][K]
  ) =>
    update((d) => {
      d.trip[key] = value;
    });

  const copyShareLink = async () => {
    if (!shareLink || typeof navigator === "undefined" || !navigator.clipboard)
      return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore clipboard errors */
    }
  };

  const duplicateTrip = () => {
    if (
      !window.confirm(
        "Duplicate this trip? This creates a fresh trip with the same meals/gear/kitchen lists, but clears members, assignments and statuses."
      )
    )
      return;

    const next: AppState = {
      trip: {
        ...state.trip,
        inviteCode: uid("trip").slice(-6).toUpperCase(),
      },
      members: [],
      meals: state.meals.map((m) => ({
        ...m,
        assignedMemberId: null,
        ingredients: m.ingredients.map((ing) => ({ ...ing })),
      })),
      gear: state.gear.map((i) => ({
        ...i,
        assignedMemberId: null,
        quantityAssigned: 0,
        status: "unassigned" as const,
      })),
      kitchen: state.kitchen.map((i) => ({
        ...i,
        assignedMemberId: null,
        quantityAssigned: 0,
        status: "unassigned" as const,
      })),
      personal: { template: personalTemplate() },
      groceryOverrides: {},
      manualGrocery: state.manualGrocery.map((m) => ({
        ...m,
        id: uid("gro"),
        assignedMemberId: null,
        purchased: false,
        packed: false,
      })),
      currentMemberId: null,
    };
    replace(next);
  };

  const resetAll = () => {
    if (
      window.confirm(
        "Reset all data? This permanently erases everything on this device and cannot be undone."
      )
    ) {
      reset();
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Trip Settings" subtitle="Details for the whole group" />

      <Card className="space-y-3">
        <div>
          <label className="text-xs font-medium text-gray-500">
            Trip name
          </label>
          <input
            value={trip.name}
            onChange={(e) => set("name", e.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500">
            Location
          </label>
          <input
            value={trip.location}
            onChange={(e) => set("location", e.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500">
              Arrival date
            </label>
            <input
              type="date"
              value={trip.arrivalDate}
              onChange={(e) => set("arrivalDate", e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">
              Departure date
            </label>
            <input
              type="date"
              value={trip.departureDate}
              onChange={(e) => set("departureDate", e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500">
              Adults
            </label>
            <input
              type="number"
              min={0}
              value={trip.adults}
              onChange={(e) => set("adults", Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">
              Children
            </label>
            <input
              type="number"
              min={0}
              value={trip.children}
              onChange={(e) => set("children", Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500">Notes</label>
          <textarea
            value={trip.notes}
            onChange={(e) => set("notes", e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500">
            Emergency contacts
          </label>
          <textarea
            value={trip.emergencyContacts}
            onChange={(e) => set("emergencyContacts", e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500">
            Campground rules
          </label>
          <textarea
            value={trip.campgroundRules}
            onChange={(e) => set("campgroundRules", e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
          />
        </div>
      </Card>

      <Card className="no-print space-y-2">
        <div className="text-xs font-medium text-gray-500">Invite code</div>
        <div className="text-lg font-bold tracking-widest text-brand-700">
          {trip.inviteCode}
        </div>
        <div className="truncate text-xs text-gray-400">{shareLink}</div>
        <Button onClick={copyShareLink}>
          {copied ? "Copied!" : "Copy share link"}
        </Button>
        <p className="text-xs text-gray-500">
          Share this link with your group. Note: everyone using the same
          browser on the same device shares the same data — see the README
          for multi-device options.
        </p>
      </Card>

      <Card className="no-print space-y-2">
        <div className="text-xs font-medium text-gray-500">Trip actions</div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={duplicateTrip}>
            Duplicate this trip
          </Button>
          <Button variant="danger" onClick={resetAll}>
            Reset all data
          </Button>
        </div>
      </Card>
    </div>
  );
}
