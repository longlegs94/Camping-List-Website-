"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { Checklist } from "@/components/Checklist";
import {
  Button,
  Card,
  PageHeader,
  EmptyState,
  MemberSelect,
} from "@/components/ui";
import { uid, listFromTemplate } from "@/lib/seed";
import type { ChecklistItem } from "@/lib/types";

const CATEGORIES = [
  "Clothing",
  "Footwear",
  "Toiletries",
  "Health",
  "Electronics",
  "Gear",
  "Sleep",
  "Other",
];

// Bulk-add items to every member's personal list (and the template, so
// anyone who joins later gets them too). Accepts one item per line or a
// comma-separated list; duplicates already on a list are skipped.
function AddForEveryone() {
  const { state, update } = useStore();
  const [text, setText] = useState("");
  const [cat, setCat] = useState<string>("Other");
  const [message, setMessage] = useState("");

  const memberCount = state.members.length;
  if (memberCount === 0) return null;

  const addToAll = () => {
    const names = text
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);
    // Dedupe within the input itself (case-insensitive, keep first spelling).
    const unique = Array.from(
      new Map(names.map((n) => [n.toLowerCase(), n])).values()
    );
    if (unique.length === 0) return;

    update((d) => {
      const targets = [...d.members.map((m) => m.id), "template"];
      for (const key of targets) {
        if (!d.personal[key]) d.personal[key] = listFromTemplate(d.personal);
        const list = d.personal[key];
        const existing = new Set(list.map((i) => i.name.toLowerCase()));
        for (const name of unique) {
          if (existing.has(name.toLowerCase())) continue;
          list.push({
            id: uid("chk"),
            name,
            category: cat,
            quantityNeeded: 1,
            quantityAssigned: 0,
            assignedMemberId: key === "template" ? null : key,
            status: key === "template" ? "unassigned" : "assigned",
            notes: "",
          });
        }
      }
    });

    setMessage(
      `Added ${unique.length} item${unique.length === 1 ? "" : "s"} to all ${memberCount} personal list${memberCount === 1 ? "" : "s"}.`
    );
    setText("");
  };

  return (
    <Card className="no-print mb-4 space-y-3 border-brand-200 bg-brand-50/40">
      <div>
        <h2 className="text-sm font-bold text-brand-700">
          Add to everyone&apos;s list
        </h2>
        <p className="text-xs text-gray-500">
          Items you add here go into every member&apos;s personal list (and
          the template, so anyone who joins later gets them too). One item
          per line, or separate with commas.
        </p>
      </div>
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (message) setMessage("");
        }}
        rows={3}
        placeholder={"Headlamp\nRain jacket, bug spray, water shoes"}
        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
      />
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          className="rounded-xl border border-gray-200 px-2 py-2 text-sm"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <Button onClick={addToAll} disabled={!text.trim()}>
          Add to everyone
        </Button>
        {message && (
          <span className="text-xs font-medium text-brand-600">{message}</span>
        )}
      </div>
    </Card>
  );
}

export default function PersonalPage() {
  const { state, update } = useStore();
  const memberId = state.currentMemberId;
  const member = state.members.find((m) => m.id === memberId);

  // Ensure the selected member has a personal list (seeded from template).
  const ensureList = (id: string) =>
    update((d) => {
      if (!d.personal[id]) d.personal[id] = listFromTemplate(d.personal);
    });

  if (!memberId || !member) {
    return (
      <div>
        <PageHeader title="Personal Packing" />
        <EmptyState>
          <p className="mb-3">Choose who you are to see your packing list.</p>
          {state.members.length > 0 ? (
            <MemberSelect
              members={state.members}
              value={null}
              placeholder="Pick your name"
              onChange={(id) => {
                if (id) {
                  ensureList(id);
                  update((d) => {
                    d.currentMemberId = id;
                  });
                }
              }}
            />
          ) : (
            <Link href="/members" className="font-semibold text-brand-600">
              Add group members first →
            </Link>
          )}
        </EmptyState>
        <div className="mt-4">
          <AddForEveryone />
        </div>
      </div>
    );
  }

  const items = state.personal[memberId] ?? [];
  if (!state.personal[memberId]) {
    ensureList(memberId);
  }

  return (
    <div>
      <PageHeader
        title="Personal Packing"
        subtitle={`${member.name}'s list`}
      />
      <Card className="no-print mb-4 flex items-center gap-2 text-sm">
        <span className="text-gray-500">Viewing as</span>
        <MemberSelect
          members={state.members}
          value={memberId}
          placeholder="Pick your name"
          onChange={(id) => {
            if (id) ensureList(id);
            update((d) => {
              d.currentMemberId = id;
            });
          }}
        />
      </Card>

      <AddForEveryone />

      <Checklist
        items={items}
        members={state.members}
        categories={CATEGORIES}
        hideAssign
        onPatch={(id, patch) =>
          update((d) => {
            const it = d.personal[memberId]?.find((x) => x.id === id);
            if (it) Object.assign(it, patch);
          })
        }
        onAdd={(name, category) =>
          update((d) => {
            const it: ChecklistItem = {
              id: uid("chk"),
              name,
              category,
              quantityNeeded: 1,
              quantityAssigned: 0,
              assignedMemberId: memberId,
              status: "assigned",
              notes: "",
              custom: true,
            };
            if (!d.personal[memberId]) d.personal[memberId] = [];
            d.personal[memberId].push(it);
          })
        }
        onRemove={(id) =>
          update((d) => {
            if (d.personal[memberId])
              d.personal[memberId] = d.personal[memberId].filter(
                (x) => x.id !== id
              );
          })
        }
      />
    </div>
  );
}
