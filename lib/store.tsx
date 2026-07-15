"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { AppState } from "./types";
import { defaultState } from "./seed";
import { supabase, TRIPS_TABLE } from "./supabase";

const STORAGE_KEY = "camping-planner-state-v1";
const ME_KEY = "camping-planner-me";

export type SyncStatus = "local" | "saving" | "synced" | "error";

type Producer = (draft: AppState) => void;

interface StoreValue {
  state: AppState;
  update: (producer: Producer) => void;
  reset: () => void;
  replace: (next: AppState) => void;
  loaded: boolean;
  syncStatus: SyncStatus;
  // True on a brand-new device with no saved trip (drives the welcome card).
  isFresh: boolean;
  dismissWelcome: () => void;
  // Switch this device to another trip by invite code.
  joinTrip: (code: string) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

function loadLocal(): { state: AppState; existed: boolean } {
  if (typeof window === "undefined")
    return { state: defaultState(), existed: false };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const me = window.localStorage.getItem(ME_KEY);
    if (!raw) return { state: defaultState(), existed: false };
    const parsed = JSON.parse(raw) as AppState;
    // Shallow-merge with defaults so new fields don't break old data.
    return {
      state: { ...defaultState(), ...parsed, currentMemberId: me || null },
      existed: true,
    };
  } catch {
    return { state: defaultState(), existed: false };
  }
}

// The cloud copy is shared by the whole group, so "who am I on this
// device" must never be part of it.
function stripLocalOnly(state: AppState): Omit<AppState, "currentMemberId"> {
  const { currentMemberId: _me, ...shared } = state;
  return shared;
}

// Key-order-independent serializer: Postgres jsonb re-orders object keys,
// so plain JSON.stringify comparisons between what we sent and what comes
// back would never match.
function stableStringify(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(",")}]`;
  const obj = v as Record<string, unknown>;
  return `{${Object.keys(obj)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`)
    .join(",")}}`;
}

function sharedJson(state: AppState): string {
  return stableStringify(stripLocalOnly(state));
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const [loaded, setLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("local");
  const [isFresh, setIsFresh] = useState(false);

  // Serialized shared-state we last sent to (or received from) the cloud.
  // Used to skip redundant saves and ignore our own realtime echoes.
  const lastSyncedRef = useRef<string>("");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Merge a cloud row into local state, keeping this device's identity
  // (only if that member still exists in the shared member list).
  const applyRemote = useCallback((remote: Partial<AppState>) => {
    setState((prev) => {
      const next: AppState = {
        ...defaultState(),
        ...remote,
        currentMemberId:
          prev.currentMemberId &&
          (remote.members ?? []).some((m) => m.id === prev.currentMemberId)
            ? prev.currentMemberId
            : null,
      };
      lastSyncedRef.current = sharedJson(next);
      return next;
    });
    setSyncStatus("synced");
  }, []);

  // True once we've synced at least once and the user has changed something
  // that hasn't been saved yet. While dirty, incoming remote state is
  // skipped — our pending (newer) save will overwrite it anyway.
  const localDirty = () =>
    lastSyncedRef.current !== "" &&
    sharedJson(stateRef.current) !== lastSyncedRef.current;

  const fetchCloud = useCallback(
    async (code: string) => {
      try {
        const { data, error } = await supabase
          .from(TRIPS_TABLE)
          .select("state")
          .eq("code", code)
          .maybeSingle();
        if (error) throw error;
        if (data?.state) {
          const remoteJson = stableStringify(data.state);
          if (remoteJson !== lastSyncedRef.current && !localDirty()) {
            applyRemote(data.state as Partial<AppState>);
          } else if (!localDirty()) {
            setSyncStatus("synced");
          }
        }
        // No cloud row yet: nothing to pull. The row is created the first
        // time the user actually changes something (debounced save below),
        // so just visiting the site never creates stray trips.
      } catch {
        setSyncStatus("error");
      }
    },
    [applyRemote]
  );

  // ---- Initial hydration -------------------------------------------------
  useEffect(() => {
    const { state: local, existed } = loadLocal();
    const url = new URL(window.location.href);
    const joinCode = url.searchParams.get("join");

    let initial = local;
    if (joinCode && joinCode.toUpperCase() !== local.trip.inviteCode) {
      // Joining someone else's trip: adopt their code, keep nothing local.
      initial = { ...defaultState(), currentMemberId: null };
      initial.trip.inviteCode = joinCode.toUpperCase();
      // Clean the ?join= param out of the address bar.
      url.searchParams.delete("join");
      window.history.replaceState({}, "", url.toString());
    }
    setState(initial);
    // Baseline the sync comparison to what we just loaded, so a slow first
    // fetch can never be raced by an auto-save of stale local data, and
    // fresh visitors don't push an untouched default trip to the cloud.
    lastSyncedRef.current = sharedJson(initial);
    setIsFresh(!existed && !joinCode);
    setLoaded(true);

    void fetchCloud(initial.trip.inviteCode);
  }, [fetchCloud]);

  // ---- Persist locally + push to cloud (debounced) ------------------------
  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      if (state.currentMemberId)
        window.localStorage.setItem(ME_KEY, state.currentMemberId);
      else window.localStorage.removeItem(ME_KEY);
    } catch {
      /* ignore quota errors */
    }

    const json = sharedJson(state);
    if (json === lastSyncedRef.current) return; // nothing shared changed

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSyncStatus("saving");
    const code = state.trip.inviteCode;
    saveTimerRef.current = setTimeout(async () => {
      try {
        const { error } = await supabase.from(TRIPS_TABLE).upsert({
          code,
          state: JSON.parse(json),
          updated_at: new Date().toISOString(),
        });
        if (error) throw error;
        lastSyncedRef.current = json;
        setSyncStatus("synced");
      } catch {
        setSyncStatus("error");
      }
    }, 700);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [state, loaded]);

  // ---- Live updates from other group members ------------------------------
  useEffect(() => {
    if (!loaded) return;
    const code = state.trip.inviteCode;

    const channel = supabase
      .channel(`trip-${code}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: TRIPS_TABLE,
          filter: `code=eq.${code}`,
        },
        (payload) => {
          const row = payload.new as { state?: Partial<AppState> } | null;
          if (!row?.state) return;
          const remoteJson = stableStringify(row.state);
          if (remoteJson === lastSyncedRef.current) return; // our own write
          if (localDirty()) return; // don't clobber unsaved local edits
          applyRemote(row.state);
        }
      )
      .subscribe();

    // Also refresh when the tab regains focus (covers missed events).
    const onFocus = () => void fetchCloud(code);
    window.addEventListener("focus", onFocus);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("focus", onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, state.trip.inviteCode, applyRemote, fetchCloud]);

  const update = (producer: Producer) => {
    setState((prev) => {
      const draft: AppState = structuredClone(prev);
      producer(draft);
      return draft;
    });
  };

  const reset = () => setState(defaultState());
  const replace = (next: AppState) => setState(next);
  const dismissWelcome = () => setIsFresh(false);

  const joinTrip = (rawCode: string) => {
    const code = rawCode.trim().toUpperCase();
    if (!code) return;
    const next: AppState = { ...defaultState(), currentMemberId: null };
    next.trip.inviteCode = code;
    // Baseline first so the auto-save can't race the fetch and overwrite
    // the trip we're joining with an empty default state.
    lastSyncedRef.current = sharedJson(next);
    setState(next);
    setIsFresh(false);
    void fetchCloud(code);
  };

  return (
    <StoreContext.Provider
      value={{
        state,
        update,
        reset,
        replace,
        loaded,
        syncStatus,
        isFresh,
        dismissWelcome,
        joinTrip,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
