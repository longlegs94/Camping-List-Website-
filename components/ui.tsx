"use client";

import type { ReactNode } from "react";
import { STATUS_LABEL, STATUSES } from "@/lib/types";
import type { Status, Member } from "@/lib/types";
import { statusColor } from "@/lib/utils";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-brand-100 bg-white p-4 shadow-sm print-block ${className}`}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-brand-800">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(
        status
      )}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export function StatusSelect({
  value,
  onChange,
}: {
  value: Status;
  onChange: (s: Status) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Status)}
      className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm focus:border-brand-400 focus:outline-none"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {STATUS_LABEL[s]}
        </option>
      ))}
    </select>
  );
}

export function MemberSelect({
  members,
  value,
  onChange,
  placeholder = "Unassigned",
}: {
  members: Member[];
  value: string | null;
  onChange: (id: string | null) => void;
  placeholder?: string;
}) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm focus:border-brand-400 focus:outline-none"
    >
      <option value="">{placeholder}</option>
      {members.map((m) => (
        <option key={m.id} value={m.id}>
          {m.name}
        </option>
      ))}
    </select>
  );
}

export function Button({
  children,
  onClick,
  variant = "primary",
  type = "button",
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger";
  type?: "button" | "submit";
  className?: string;
}) {
  const styles: Record<string, string> = {
    primary: "bg-brand-500 text-white hover:bg-brand-600",
    ghost:
      "bg-white text-brand-700 border border-brand-200 hover:bg-brand-50",
    danger: "bg-white text-red-600 border border-red-200 hover:bg-red-50",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-brand-200 bg-white/60 p-8 text-center text-sm text-gray-500">
      {children}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-brand-100 bg-white p-3 text-center shadow-sm">
      <div className="text-2xl font-bold text-brand-700">{value}</div>
      <div className="text-xs font-medium text-gray-500">{label}</div>
      {hint && <div className="text-[11px] text-gray-400">{hint}</div>}
    </div>
  );
}

export function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-brand-100">
      <div
        className="h-full rounded-full bg-brand-500 transition-all"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
