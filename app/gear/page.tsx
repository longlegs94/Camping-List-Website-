"use client";

import { useStore } from "@/lib/store";
import { Checklist } from "@/components/Checklist";
import { PageHeader } from "@/components/ui";
import { uid } from "@/lib/seed";
import type { ChecklistItem } from "@/lib/types";

const CATEGORIES = [
  "Tent & Shelter",
  "Sleeping",
  "Camp Furniture",
  "Lighting",
  "Fire Supplies",
  "Safety",
  "Recreation",
  "Weather Protection",
  "Baby & Child Gear",
  "Other",
];

export default function GearPage() {
  const { state, update } = useStore();

  return (
    <div>
      <PageHeader title="Camping Gear" subtitle="Tents, sleeping, fire & safety" />
      <Checklist
        items={state.gear}
        members={state.members}
        categories={CATEGORIES}
        onPatch={(id, patch) =>
          update((d) => {
            const it = d.gear.find((x) => x.id === id);
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
              assignedMemberId: null,
              status: "unassigned",
              notes: "",
              custom: true,
            };
            d.gear.push(it);
          })
        }
        onRemove={(id) =>
          update((d) => {
            d.gear = d.gear.filter((x) => x.id !== id);
          })
        }
      />
    </div>
  );
}
