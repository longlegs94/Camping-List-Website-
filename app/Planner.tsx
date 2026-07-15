"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Trip = {
  id: string;
  name: string;
  location: string;
  start_date: string;
  end_date: string;
  notes: string;
};

type Member = { id: string; name: string; notes: string };
type Meal = {
  id: string;
  day: string;
  slot: string;
  name: string;
  servings: number;
  menu: string;
  ingredientsJson: string;
  assignedMemberId: string | null;
  complete: number | boolean;
};
type Item = {
  id: string;
  name: string;
  normalizedName: string;
  category: "food" | "camping" | "kitchen";
  section: string;
  amount: number;
  unit: string;
  assignedMemberId: string | null;
  status: string;
  notes: string;
};
type PersonalItem = { id: string; memberId: string; name: string; status: string };
type PlanData = { trip: Trip; members: Member[]; meals: Meal[]; items: Item[]; personalItems: PersonalItem[] };
type View = "Home" | "Meals" | "Lists" | "Assignments" | "My items";
type ModalName = "member" | "meal" | "item" | "trip" | null;

const inviteCodePattern = /^[A-Z0-9]{10}$/;
const nav: { label: View; icon: string }[] = [
  { label: "Home", icon: "⌂" },
  { label: "Meals", icon: "◴" },
  { label: "Lists", icon: "✓" },
  { label: "Assignments", icon: "↗" },
  { label: "My items", icon: "●" },
];

const statusOrder = ["Assigned", "Confirmed", "Purchased", "Packed", "Complete"];
const categoryMeta = {
  food: { label: "Food & drinks", icon: "◒", tone: "amber" },
  camping: { label: "Camping gear", icon: "⌂", tone: "green" },
  kitchen: { label: "Kitchen supplies", icon: "⌁", tone: "coral" },
} as const;

function quantity(item: Item) {
  const amount = Number(item.amount);
  return `${Number.isInteger(amount) ? amount : amount.toFixed(1)} ${item.unit}`;
}

function initials(name: string) {
  return name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function nextStatus(status: string) {
  const index = statusOrder.indexOf(status);
  return statusOrder[Math.min(index + 1, statusOrder.length - 1)] ?? "Assigned";
}

function memberName(members: Member[], id: string | null) {
  return members.find((member) => member.id === id)?.name ?? "Unassigned";
}

function Modal({ title, eyebrow, onClose, children }: { title: string; eyebrow: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close">×</button>
        </div>
        {children}
      </section>
    </div>
  );
}

export default function Planner() {
  const [planData, setData] = useState<PlanData | null>(null);
  const [planCode, setPlanCode] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [checkingLink, setCheckingLink] = useState(true);
  const [view, setView] = useState<View>("Home");
  const [selectedMember, setSelectedMember] = useState("member-organizer");
  const [listCategory, setListCategory] = useState<"food" | "camping" | "kitchen">("food");
  const [listFilter, setListFilter] = useState("All");
  const [modal, setModal] = useState<ModalName>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function load(code = planCode, quiet = false) {
    if (!inviteCodePattern.test(code)) return;
    try {
      const response = await fetch(`/api/plan?code=${encodeURIComponent(code)}`, { cache: "no-store" });
      const result = await response.json() as PlanData & { error?: string };
      if (!response.ok) throw new Error(result.error || "Could not load the trip.");
      setData(result);
      if (!result.members.some((member) => member.id === selectedMember)) setSelectedMember(result.members[0]?.id ?? "");
    } catch (error) {
      if (!quiet) setMessage(error instanceof Error ? error.message : "Could not load the trip.");
    }
  }

  useEffect(() => {
    const code = (new URLSearchParams(window.location.search).get("plan") ?? "").trim().toUpperCase();
    setCheckingLink(false);
    if (!inviteCodePattern.test(code)) return;
    setPlanCode(code);
    setCodeInput(code);
    void load(code);
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void load(code, true);
    }, 10_000);
    return () => window.clearInterval(timer);
  }, []);

  function joinTrip(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = codeInput.replace(/[^a-z0-9]/gi, "").toUpperCase();
    if (!inviteCodePattern.test(code)) {
      setMessage("Enter the 10-character invite code from the trip organizer.");
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.set("plan", code);
    window.history.replaceState(null, "", url);
    setMessage("");
    setData(null);
    setPlanCode(code);
    setCodeInput(code);
    void load(code);
  }

  async function save(payload: Record<string, unknown>) {
    if (!inviteCodePattern.test(planCode)) {
      setMessage("Open the trip from its shared CampList link first.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/plan?code=${encodeURIComponent(planCode)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json() as PlanData & { error?: string };
      if (!response.ok) throw new Error(result.error || "Could not save that change.");
      setData(result);
      setModal(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save that change.");
    } finally {
      setBusy(false);
    }
  }

  const summary = useMemo(() => {
    if (!planData) return { progress: 0, unassigned: 0, packed: 0, total: 0 };
    const completeItems = planData.items.filter((item) => ["Packed", "Complete"].includes(item.status)).length;
    const completeMeals = planData.meals.filter((meal) => Boolean(meal.complete)).length;
    const total = planData.items.length + planData.meals.length;
    return {
      progress: total ? Math.round(((completeItems + completeMeals) / total) * 100) : 0,
      unassigned: planData.items.filter((item) => !item.assignedMemberId).length + planData.meals.filter((meal) => !meal.assignedMemberId).length,
      packed: completeItems,
      total: planData.items.length,
    };
  }, [planData]);

  async function shareTrip() {
    const url = new URL(window.location.href);
    url.searchParams.set("plan", planCode);
    const share = { title: planData?.trip.name ?? "Camping plan", text: "Here is our camping meal and packing plan.", url: url.toString() };
    if (navigator.share) await navigator.share(share);
    else {
      await navigator.clipboard.writeText(url.toString());
      setMessage("Trip link copied — ready for WhatsApp.");
    }
  }

  if (checkingLink) {
    return (
      <main className="loading-screen">
        <div className="brand-mark">C</div>
        <h1>Getting CampList ready...</h1>
      </main>
    );
  }

  if (!planData && !planCode) {
    return (
      <main className="loading-screen">
        <section className="join-card">
          <div className="brand-mark">C</div>
          <span className="eyebrow">SHARED CAMPING PLAN</span>
          <h1>Join your camp crew</h1>
          <p>Paste the invite code from your organizer to open the shared meals, assignments, and packing lists.</p>
          <form className="invite-form" onSubmit={joinTrip}>
            <label className="field">
              <span>Invite code</span>
              <input
                value={codeInput}
                onChange={(event) => setCodeInput(event.target.value.toUpperCase())}
                maxLength={10}
                autoCapitalize="characters"
                autoComplete="off"
                placeholder="10 characters"
                aria-label="CampList invite code"
                required
                autoFocus
              />
            </label>
            <button className="primary-button" type="submit">Open trip</button>
          </form>
          {message && <p className="join-error" role="alert">{message}</p>}
        </section>
      </main>
    );
  }

  if (!planData) {
    return (
      <main className="loading-screen">
        <div className="brand-mark">C</div>
        <h1>Getting camp ready…</h1>
        <p>{message || "Loading meals, lists, and assignments."}</p>
        {message && <button className="primary-button" onClick={() => void load(planCode)}>Try again</button>}
      </main>
    );
  }

  const data = planData;
  const activeItems = data.items.filter((item) => item.category === listCategory && (listFilter === "All" || item.status === listFilter));
  const personal = data.personalItems.filter((item) => item.memberId === selectedMember);
  const selectedName = memberName(data.members, selectedMember);

  function renderHome() {
    const attention = data.items.filter((item) => !item.assignedMemberId).slice(0, 4);
    return (
      <>
        <section className="hero-card">
          <div className="hero-copy">
            <span className="eyebrow light">TRIP COMMAND CENTRE</span>
            <h1>Everything your camp crew needs. <em>One list.</em></h1>
            <p>Plan the meals, split the supplies, and know what is packed before anyone leaves home.</p>
            <div className="hero-actions">
              <button className="cream-button" onClick={() => { setView("Assignments"); }}>Assign what’s missing</button>
              <button className="ghost-button" onClick={() => setModal("trip")}>Edit trip details</button>
            </div>
          </div>
          <div className="progress-orbit" style={{ "--progress": `${summary.progress * 3.6}deg` } as React.CSSProperties}>
            <div><strong>{summary.progress}%</strong><span>trip ready</span></div>
          </div>
        </section>

        <section className="metric-grid" aria-label="Trip summary">
          <article><span className="metric-icon amber">◴</span><div><strong>{data.meals.length}</strong><span>Meals planned</span></div></article>
          <article><span className="metric-icon coral">!</span><div><strong>{summary.unassigned}</strong><span>Need an owner</span></div></article>
          <article><span className="metric-icon green">✓</span><div><strong>{summary.packed}/{summary.total}</strong><span>Shared items packed</span></div></article>
          <article><span className="metric-icon ink">●</span><div><strong>{data.members.length}</strong><span>Camp crew members</span></div></article>
        </section>

        <div className="home-grid">
          <section className="panel">
            <div className="section-head">
              <div><span className="eyebrow">UP NEXT</span><h2>Meal plan</h2></div>
              <button className="text-button" onClick={() => setView("Meals")}>See all meals →</button>
            </div>
            <div className="mini-meals">
              {data.meals.slice(0, 3).map((meal) => (
                <article key={meal.id}>
                  <div className="date-tile"><span>{meal.day.slice(0, 3)}</span><strong>{meal.slot.slice(0, 1)}</strong></div>
                  <div className="grow"><h3>{meal.name}</h3><p>{meal.menu}</p></div>
                  <span className={`owner-pill ${meal.assignedMemberId ? "owned" : ""}`}>{memberName(data.members, meal.assignedMemberId)}</span>
                </article>
              ))}
            </div>
          </section>

          <section className="panel attention-panel">
            <div className="section-head">
              <div><span className="eyebrow coral-text">NEEDS ATTENTION</span><h2>Still unassigned</h2></div>
              <span className="count-badge">{summary.unassigned}</span>
            </div>
            <div className="attention-list">
              {attention.map((item) => (
                <button key={item.id} onClick={() => { setListCategory(item.category); setView("Lists"); }}>
                  <span className={`metric-icon ${categoryMeta[item.category].tone}`}>{categoryMeta[item.category].icon}</span>
                  <span><strong>{item.name}</strong><small>{categoryMeta[item.category].label} · {quantity(item)}</small></span>
                  <b>＋</b>
                </button>
              ))}
            </div>
            <button className="secondary-button full" onClick={() => setView("Assignments")}>Review all assignments</button>
          </section>
        </div>
      </>
    );
  }

  function renderMeals() {
    const days = Array.from(new Set(data.meals.map((meal) => meal.day)));
    return (
      <section>
        <div className="page-head">
          <div><span className="eyebrow">FRIDAY TO SUNDAY</span><h1>Meal plan</h1><p>Every ingredient added here rolls into the food list.</p></div>
          <button className="primary-button" onClick={() => setModal("meal")}>＋ Add meal</button>
        </div>
        <div className="day-stack">
          {days.map((day) => (
            <section className="day-section" key={day}>
              <div className="day-label"><span>{day}</span><i /></div>
              <div className="meal-grid">
                {data.meals.filter((meal) => meal.day === day).map((meal) => {
                  let ingredients: unknown[] = [];
                  try { ingredients = JSON.parse(meal.ingredientsJson); } catch { ingredients = []; }
                  return (
                    <article className={`meal-card ${meal.complete ? "done" : ""}`} key={meal.id}>
                      <div className="meal-card-top">
                        <span className="slot-pill">{meal.slot}</span>
                        <label className="check-label"><input type="checkbox" checked={Boolean(meal.complete)} onChange={(event) => void save({ action: "updateMeal", id: meal.id, assignedMemberId: meal.assignedMemberId, complete: event.target.checked })} /><span>Done</span></label>
                      </div>
                      <h2>{meal.name}</h2><p>{meal.menu}</p>
                      <div className="meal-meta"><span>◉ {meal.servings} servings</span><span>◒ {ingredients.length} grocery lines</span></div>
                      <label className="field compact"><span>Responsible person</span><select value={meal.assignedMemberId ?? ""} onChange={(event) => void save({ action: "updateMeal", id: meal.id, a�-�G����ƭy�
                <article className="item-row" key={item.id}>
                  <button className={`round-check ${["Packed", "Complete"].includes(item.status) ? "checked" : ""}`} disabled={!item.assignedMemberId || busy} onClick={() => void save({ action: "updateItem", id: item.id, assignedMemberId: item.assignedMemberId, status: nextStatus(item.status) })} aria-label={`Advance ${item.name} status`}>{["Packed", "Complete"].includes(item.status) ? "✓" : ""}</button>
                  <div className="item-main"><h3>{item.name}</h3><p>{item.notes || categoryMeta[item.category].label}</p></div>
                  <strong className="quantity">{quantity(item)}</strong>
                  <select className="owner-select" aria-label={`Assign ${item.name}`} value={item.assignedMemberId ?? ""} onChange={(event) => void save({ action: "updateItem", id: item.id, assignedMemberId: event.target.value || null, status: event.target.value ? (item.status === "Unassigned" ? "Assigned" : item.status) : "Unassigned" })}><option value="">Unassigned</option>{data.members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select>
                  <button className={`status-pill status-${item.status.toLowerCase()}`} disabled={!item.assignedMemberId || busy} onClick={() => void save({ action: "updateItem", id: item.id, assignedMemberId: item.assignedMemberId, status: nextStatus(item.status) })}>{item.status}</button>
                </article>
              ))}
            </div>
          </section>
        ))}
        {!activeItems.length && <div className="empty-state"><span>✓</span><h2>Nothing in this view</h2><p>Try another filter or add a new item.</p></div>}
      </section>
    );
  }

  function renderAssignments() {
    const unassignedItems = data.items.filter((item) => !item.assignedMemberId);
    return (
      <section>
        <div className="page-head">
          <div><span className="eyebrow">WHO BRINGS WHAT</span><h1>Assignments</h1><p>A clear handoff for every person in the group.</p></div>
          <button className="primary-button" onClick={() => setModal("member")}>＋ Add member</button>
        </div>
        <div className="assignment-grid">
          {data.members.map((member) => {
            const memberItems = data.items.filter((item) => item.assignedMemberId === member.id);
            const memberMeals = data.meals.filter((meal) => meal.assignedMemberId === member.id);
            return (
              <article className="assignment-card" key={member.id}>
                <div className="person-head"><span className="avatar">{initials(member.name)}</span><div><h2>{member.name}</h2><p>{memberItems.length + memberMeals.length} responsibilities</p></div><button className="text-button" onClick={() => { setSelectedMember(member.id); setView("My items"); }}>View →</button></div>
                <div className="responsibility-list">
                  {memberMeals.map((meal) => <div key={meal.id}><span className="tiny-icon amber">◴</span><p><strong>{meal.name}</strong><small>{meal.day} · {meal.slot}</small></p><b>{meal.complete ? "✓" : ""}</b></div>)}
                  {memberItems.slice(0, 6).map((item) => <div key={item.id}><span className={`tiny-icon ${categoryMeta[item.category].tone}`}>{categoryMeta[item.category].icon}</span><p><strong>{item.name}</strong><small>{quantity(item)}</small></p><b>{["Packed", "Complete"].includes(item.status) ? "✓" : ""}</b></div>)}
                  {!memberItems.length && !memberMeals.length && <p className="quiet">Nothing assigned yet.</p>}
                </div>
              </article>
            );
          })}
          <article className="assignment-card unassigned-card">
            <div className="person-head"><span className="avatar alert">!</span><div><h2>Still unassigned</h2><p>{summary.unassigned} responsibilities</p></div></div>
            <div className="responsibility-list">{unassignedItems.slice(0, 7).map((item) => <button key={item.id} onClick={() => { setListCategory(item.category); setView("Lists"); }}><span className={`tiny-icon ${categoryMeta[item.category].tone}`}>{categoryMeta[item.category].icon}</span><p><strong>{item.name}</strong><small>{quantity(item)}</small></p><b>＋</b></button>)}</div>
          </article>
        </div>
      </section>
    );
  }

  function renderMyItems() {
    const assignedItems = data.items.filter((item) => item.assignedMemberId === selectedMember);
    const assignedMeals = data.meals.filter((meal) => meal.assignedMemberId === selectedMember);
    const personalDone = personal.filter((item) => item.status === "Packed").length;
    return (
      <section>
        <div className="page-head my-head">
          <div><span className="eyebrow">YOUR PERSONAL VIEW</span><h1>{selectedName}’s list</h1><p>Only the things this camper needs to handle.</p></div>
          <label className="member-switch"><span>Viewing as</span><select value={selectedMember} onChange={(event) => setSelectedMember(event.target.value)}>{data.members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label>
        </div>
        <section className="personal-progress"><div><span className="avatar large">{initials(selectedName)}</span><div><h2>Ready to pack?</h2><p>{personalDone} of {personal.length} personal essentials packed</p></div></div><div className="line-progress"><i style={{ width: `${personal.length ? (personalDone / personal.length) * 100 : 0}%` }} /></div></section>
        <div className="my-grid">
          <section className="panel"><div className="section-head"><div><span className="eyebrow">PERSONAL PACKING</span><h2>Just for {selectedName}</h2></div></div><div className="personal-list">{personal.map((item) => <label key={item.id}><input type="checkbox" checked={item.status === "Packed"} onChange={(event) => void save({ action: "updatePersonal", id: item.id, status: event.target.checked ? "Packed" : "Not packed" })} /><span>{item.name}</span></label>)}</div></section>
          <section className="panel"><div className="section-head"><div><span className="eyebrow">GROUP RESPONSIBILITIES</span><h2>Assigned to you</h2></div><span className="count-badge">{assignedItems.length + assignedMeals.length}</span></div><div className="assigned-to-me">{assignedMeals.map((meal) => <article key={meal.id}><span className="metric-icon amber">◴</span><div><h3>{meal.name}</h3><p>{meal.day} {meal.slot} · {meal.servings} servings</p></div><span className="owner-pill">Meal</span></article>)}{assignedItems.map((item) => <article key={item.id}><span className={`metric-icon ${categoryMeta[item.category].tone}`}>{categoryMeta[item.category].icon}</span><div><h3>{item.name}</h3><p>{quantity(item)} · {item.notes}</p></div><button className={`status-pill status-${item.status.toLowerCase()}`} onClick={() => void save({ action: "updateItem", id: item.id, assignedMemberId: item.assignedMemberId, status: nextStatus(item.status) })}>{item.status}</button></article>)}{!assignedItems.length && !assignedMeals.length && <div className="empty-inline">No shared responsibilities yet.</div>}</div></section>
        </div>
      </section>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => setView("Home")}><span className="brand-mark">C</span><span>CampList<small>GROUP PLANNER</small></span></button>
        <nav>{nav.map((item) => <button key={item.label} className={view === item.label ? "active" : ""} onClick={() => setView(item.label)}><span>{item.icon}</span>{item.label}{item.label === "Assignments" && summary.unassigned > 0 && <b>{summary.unassigned}</b>}</button>)}</nav>
        <div className="sidebar-trip"><span className="eyebrow light">CURRENT TRIP</span><h3>{data.trip.name}</h3><p>{data.trip.start_date} → {data.trip.end_date}</p><button onClick={() => setModal("trip")}>Trip settings</button></div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div className="trip-context"><span className="mobile-brand"><span className="brand-mark">C</span>CampList</span><span className="desktop-context">{data.trip.location}<i />{data.trip.start_date} — {data.trip.end_date}</span></div>
          <div className="top-actions">
            <label className="who-select"><span>Viewing as</span><select value={selectedMember} onChange={(event) => setSelectedMember(event.target.value)}>{data.members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label>
            <button className="share-button" onClick={() => void shareTrip()}>↗ <span>Share trip</span></button>
          </div>
        </header>
        <div className="page-content">
          {message && <div className="toast" role="status">{message}<button onClick={() => setMessage("")}>×</button></div>}
          {view === "Home" && renderHome()}
          {view === "Meals" && renderMeals()}
          {view === "Lists" && renderLists()}
          {view === "Assignments" && renderAssignments()}
          {view === "My items" && renderMyItems()}
        </div>
      </main>

      <nav className="bottom-nav">{nav.map((item) => <button key={item.label} className={view === item.label ? "active" : ""} onClick={() => setView(item.label)}><span>{item.icon}</span><small>{item.label === "Assignments" ? "Assign" : item.label}</small></button>)}</nav>

      {modal === "member" && <Modal title="Add a camp crew member" eyebrow="GROUP MEMBERS" onClose={() => setModal(null)}><form className="form-stack" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); void save({ action: "addMember", name: form.get("name"), notes: form.get("notes") }); }}><label className="field"><span>Name</span><input name="name" placeholder="e.g. Jordan" required autoFocus /></label><label className="field"><span>Dietary notes or allergies</span><textarea name="notes" placeholder="Optional" /></label><button className="primary-button" disabled={busy}>{busy ? "Adding…" : "Add member"}</button></form></Modal>}

      {modal === "item" && <Modal title="Add a checklist item" eyebrow="SHARED LIST" onClose={() => setModal(null)}><form className="form-stack" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); void save({ action: "addItem", name: form.get("name"), category: form.get("category"), section: form.get("section"), amount: Number(form.get("amount")), unit: form.get("unit"), notes: form.get("notes") }); }}><label className="field"><span>Item name</span><input name="name" placeholder="e.g. Extra lantern" required autoFocus /></label><div className="form-grid"><label className="field"><span>List</span><select name="category" defaultValue={listCategory}><option value="food">Food & drinks</option><option value="camping">Camping gear</option><option value="kitchen">Kitchen supplies</option></select></label><label className="field"><span>Section</span><input name="section" placeholder="e.g. Lighting" required /></label></div><div className="form-grid"><label className="field"><span>Quantity</span><input name="amount" type="number" min="0" step="0.5" defaultValue="1" required /></label><label className="field"><span>Unit</span><input name="unit" defaultValue="item" required /></label></div><label className="field"><span>Note</span><input name="notes" placeholder="Optional reminder" /></label><button className="primary-button" disabled={busy}>{busy ? "Adding…" : "Add to list"}</button></form></Modal>}

      {modal === "meal" && <Modal title="Add a meal" eyebrow="MEAL PLANNER" onClose={() => setModal(null)}><form className="form-stack" onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); const ingredients = String(form.get("ingredients") ?? "").split(/[;\n]+/).map((line) => { const [name, amount, unit] = line.split(",").map((part) => part.trim()); return { name, amount: Number(amount || 1), unit: unit || "item" }; }).filter((item) => item.name); void save({ action: "addMeal", day: form.get("day"), slot: form.get("slot"), name: form.get("name"), servings: Number(form.get("servings")), menu: form.get("menu"), assignedMemberId: form.get("assignedMemberId") || null, ingredients }); }}><div className="form-grid"><label className="field"><span>Day</span><select name="day"><option>Friday</option><option>Saturday</option><option>Sunday</option></select></label><label className="field"><span>Meal</span><select name="slot"><option>Breakfast</option><option>Lunch</option><option>Dinner</option><option>Snack</option></select></label></div><label className="field"><span>Meal name</span><input name="name" placeholder="e.g. Chili night" required autoFocus /></label><label className="field"><span>Menu</span><input name="menu" placeholder="What are you serving?" /></label><div className="form-grid"><label className="field"><span>Servings</span><input type="number" min="1" name="servings" defaultValue="9" /></label><label className="field"><span>Responsible person</span><select name="assignedMemberId"><option value="">Unassigned</option>{data.members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label></div><label className="field"><span>Ingredients</span><textarea name="ingredients" rows={4} placeholder={"One per line: item, quantity, unit\nBread, 2, loaves\nEggs, 24, eggs"} /><small>Matching ingredients are automatically combined in the food list.</small></label><button className="primary-button" disabled={busy}>{busy ? "Adding…" : "Add meal & groceries"}</button></form></Modal>}

      {modal === "trip" && <Modal title="Trip details" eyebrow="CURRENT TRIP" onClose={() => setModal(null)}><form className="form-stack" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); void save({ action: "updateTrip", name: form.get("name"), location: form.get("location"), startDate: form.get("startDate"), endDate: form.get("endDate"), notes: form.get("notes") }); }}><label className="field"><span>Trip name</span><input name="name" defaultValue={data.trip.name} required /></label><label className="field"><span>Location</span><input name="location" defaultValue={data.trip.location} /></label><div className="form-grid"><label className="field"><span>Arrival</span><input name="startDate" defaultValue={data.trip.start_date} /></label><label className="field"><span>Departure</span><input name="endDate" defaultValue={data.trip.end_date} /></label></div><label className="field"><span>Group note</span><textarea name="notes" defaultValue={data.trip.notes} /></label><button className="primary-button" disabled={busy}>{busy ? "Saving…" : "Save trip"}</button></form></Modal>}
    </div>
  );
}
