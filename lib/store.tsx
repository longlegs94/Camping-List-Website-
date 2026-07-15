"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { AppState } from "./types";
import { defaultState } from "./seed";

const STORAGE_KEY = "camping-planner-state-v1";

type Producer = (draft: AppState) => void;

interface StoreValue {
  state: AppState;
  update: (producer: Producer) => void;
  reset: () => void;
  replace: (next: AppState) => void;
  loaded: boolean;
}

const StoreContext = createContext<StoreValue | null>(null);

function load(): AppState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as AppState;
    // Shallow-merge with defaults so new fields don't break old data.
    return { ...defaultState(), ...parsed };
  } catch {
    return defaultState();
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const [loaded, setLoaded] = useState(false);
  const firstRun = useRef(true);

  // Hydrate from localStorage on mount (client only).
  useEffect(() => {
    setState(load());
    setLoaded(true);
  }, []);

  // Persist on every change (after initial hydration).
  useEffect(() => {
    if (!loaded) return;
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore quota errors */
    }
  }, [state, loaded]);

  const update = (producer: Producer) => {
    setState((prev) => {
      const draft: AppState = structuredClone(prev);
      producer(draft);
      return draft;
    });
  };

  const reset = () => setState(defaultState());
  const replace = (next: AppState) => setState(next);

  return (
    <StoreContext.Provider value={{ state, update, reset, replace, loaded }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
