// Client-side PDF generation for printable checklists. jsPDF is imported
// dynamically so it only loads when someone actually downloads a PDF.

import type { AppState, Status } from "./types";
import { buildGroceryList } from "./grocery";
import { memberName } from "./utils";

interface Row {
  name: string;
  detail: string;
  done: boolean;
}

interface Section {
  title: string;
  rows: Row[];
}

const isDone = (s: Status) => s === "packed" || s === "complete";

function tripSubtitle(state: AppState): string {
  const { trip } = state;
  const dates = [trip.arrivalDate, trip.departureDate]
    .filter(Boolean)
    .join(" to ");
  return [trip.name, trip.location, dates].filter(Boolean).join("  ·  ");
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function renderPdf(opts: {
  title: string;
  subtitle: string;
  sections: Section[];
  filename: string;
}): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 16; // page margin
  let y = 20;

  const ensureRoom = (needed: number) => {
    if (y + needed > H - 16) {
      doc.addPage();
      y = 20;
    }
  };

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(20, 83, 45);
  doc.text(opts.title, M, y);
  y += 7;
  if (opts.subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(110, 110, 110);
    doc.text(opts.subtitle, M, y);
    y += 6;
  }
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(M, y, W - M, y);
  y += 8;

  for (const s of opts.sections) {
    if (s.rows.length === 0) continue;
    ensureRoom(16);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(20, 83, 45);
    doc.text(s.title.toUpperCase(), M, y);
    y += 6.5;
    doc.setFont("helvetica", "normal");

    for (const r of s.rows) {
      const nameWidth = W - M * 2 - 8 - 42; // room for checkbox + detail column
      const lines = doc.splitTextToSize(r.name, nameWidth) as string[];
      const rowH = Math.max(6.5, lines.length * 5 + 1.5);
      ensureRoom(rowH);

      // Checkbox (ticked when the item is already packed/purchased).
      doc.setDrawColor(120, 120, 120);
      doc.setLineWidth(0.2);
      doc.rect(M, y - 3.5, 4, 4);
      if (r.done) {
        doc.setDrawColor(20, 83, 45);
        doc.setLineWidth(0.5);
        doc.line(M + 0.8, y - 1.6, M + 1.8, y - 0.4);
        doc.line(M + 1.8, y - 0.4, M + 3.4, y - 3);
        doc.setLineWidth(0.2);
      }

      doc.setFontSize(10.5);
      if (r.done) doc.setTextColor(150, 150, 150);
      else doc.setTextColor(30, 30, 30);
      doc.text(lines, M + 7, y);

      if (r.detail) {
        doc.setFontSize(8.5);
        doc.setTextColor(130, 130, 130);
        doc.text(r.detail, W - M, y, { align: "right" });
      }
      y += rowH;
    }
    y += 4;
  }

  if (opts.sections.every((s) => s.rows.length === 0)) {
    doc.setFontSize(11);
    doc.setTextColor(110, 110, 110);
    doc.text("Nothing on this list yet.", M, y);
  }

  // Footer: page numbers + generated date.
  const pages = doc.getNumberOfPages();
  const stamp = new Date().toLocaleDateString();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(160, 160, 160);
    doc.text(`${i} / ${pages}`, W / 2, H - 8, { align: "center" });
    doc.text(stamp, W - M, H - 8, { align: "right" });
  }

  doc.save(opts.filename);
}

function qtyName(name: string, qty: number): string {
  return qty > 1 ? `${name}  (x${qty})` : name;
}

// One person's full sheet: personal packing + shared items they're
// bringing + groceries they're buying.
export async function downloadMyListPdf(
  state: AppState,
  memberId: string
): Promise<void> {
  const name = memberName(state.members, memberId) || "My";
  const personal = [...(state.personal[memberId] ?? [])].sort(
    (a, b) =>
      a.category.localeCompare(b.category) || a.name.localeCompare(b.name)
  );
  const shared = [
    ...state.gear.map((i) => ({ ...i, src: "Gear" })),
    ...state.kitchen.map((i) => ({ ...i, src: "Kitchen" })),
  ].filter((i) => i.assignedMemberId === memberId);
  const grocery = buildGroceryList(state).filter(
    (g) => g.assignedMemberId === memberId
  );

  await renderPdf({
    title: `${name} — Packing List`,
    subtitle: tripSubtitle(state),
    sections: [
      {
        title: "Personal packing",
        rows: personal.map((i) => ({
          name: qtyName(i.name, i.quantityNeeded),
          detail: i.category,
          done: isDone(i.status),
        })),
      },
      {
        title: "Gear & kitchen I'm bringing",
        rows: shared.map((i) => ({
          name: qtyName(i.name, i.quantityNeeded),
          detail: i.src,
          done: isDone(i.status),
        })),
      },
      {
        title: "Groceries I'm buying",
        rows: grocery.map((g) => ({
          name: g.name,
          detail: `${g.quantity} ${g.unit}`,
          done: g.purchased || g.packed,
        })),
      },
    ],
    filename: `${slug(name)}-packing-list.pdf`,
  });
}

// Full shared lists, for printing the group's master copies.
export async function downloadSharedListPdf(
  state: AppState,
  kind: "grocery" | "gear" | "kitchen"
): Promise<void> {
  if (kind === "grocery") {
    const lines = [...buildGroceryList(state)].sort(
      (a, b) =>
        a.category.localeCompare(b.category) || a.name.localeCompare(b.name)
    );
    await renderPdf({
      title: "Combined Grocery List",
      subtitle: tripSubtitle(state),
      sections: [
        {
          title: "Groceries",
          rows: lines.map((g) => {
            const who = memberName(state.members, g.assignedMemberId);
            return {
              name: g.name,
              detail: [`${g.quantity} ${g.unit}`, who]
                .filter(Boolean)
                .join("  ·  "),
              done: g.purchased || g.packed,
            };
          }),
        },
      ],
      filename: "grocery-list.pdf",
    });
    return;
  }

  const items = [...(kind === "gear" ? state.gear : state.kitchen)].sort(
    (a, b) =>
      a.category.localeCompare(b.category) || a.name.localeCompare(b.name)
  );
  await renderPdf({
    title: kind === "gear" ? "Camping Gear" : "Kitchen Supplies",
    subtitle: tripSubtitle(state),
    sections: [
      {
        title: kind === "gear" ? "Gear" : "Kitchen",
        rows: items.map((i) => {
          const who = memberName(state.members, i.assignedMemberId);
          return {
            name: qtyName(i.name, i.quantityNeeded),
            detail: [i.category, who].filter(Boolean).join("  ·  "),
            done: isDone(i.status),
          };
        }),
      },
    ],
    filename: `${kind}-list.pdf`,
  });
}
