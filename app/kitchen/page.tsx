"use client";

import { useStore } from "@/lib/store";
import { Checklist } from "@/components/Checklist";
import { PageHeader } from "@/components/ui";
import { uid } from "@/lib/seed";
import type { ChecklistItem } from "@/lib/types";

const CATEGORIES = [
  "Cooking",
  "Cookware",
  "Utensils",
  "Tableware",
  "Cleanup",
  "Storage",
  "Water",
  "Other",
];

export default function KitchenPage() {
  const { state, update } = useStore();

  return (
    <div>
      <PageHeader
        title="Kitchen Supplies"
        subtitle="Stove, cookware, tableware & cleanup"
      />
      <Checklist
        items={state.kitchen}
        members={state.members}
        categories={CATEGORIES}
        onPatch={(id, patch) =>
          update((d) => {
            const it = d.kitchen.find((x) => x.id === id);
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
            d.kitchen.push(it);
          })
        }
        onRemove={(id) =>
          update((d) => {
            d.kitchen = d.kitchen.filter((x) => x.id !== id);
          })
        }
      />
    </div>
  );
}
