"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getStore } from "@/lib/data";
import { EMPTY_SNAPSHOT, type DataStore, type Snapshot } from "@/lib/data/types";

type DataContextValue = {
  /** Null until the store has been created on the client. */
  store: DataStore | null;
  snapshot: Snapshot;
  /** True until the first snapshot has loaded. */
  loading: boolean;
  isMock: boolean;
  reload: () => Promise<void>;
  /** Runs a mutation against the store, then reloads the snapshot. */
  mutate: <T>(fn: (store: DataStore) => Promise<T>) => Promise<T>;
};

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<DataStore | null>(null);
  const [store, setStore] = useState<DataStore | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot>(EMPTY_SNAPSHOT);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const current = storeRef.current;
    if (!current) return;
    setSnapshot(await current.loadSnapshot());
  }, []);

  useEffect(() => {
    let cancelled = false;
    getStore()
      .then(async (created) => {
        if (cancelled) return;
        storeRef.current = created;
        setStore(created);
        setSnapshot(await created.loadSnapshot());
      })
      .catch((error) => console.error("Data store failed to start", error))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const mutate = useCallback(
    async <T,>(fn: (store: DataStore) => Promise<T>): Promise<T> => {
      const current = storeRef.current;
      if (!current) throw new Error("Data store not ready");
      const result = await fn(current);
      setSnapshot(await current.loadSnapshot());
      return result;
    },
    [],
  );

  const value = useMemo<DataContextValue>(
    () => ({ store, snapshot, loading, isMock: store?.mode !== "supabase", reload, mutate }),
    [store, snapshot, loading, reload, mutate],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside <DataProvider>");
  return ctx;
}

/** Shorthand for screens that only read. */
export function useSnapshot(): Snapshot {
  return useData().snapshot;
}
