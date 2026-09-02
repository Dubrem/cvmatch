"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "matchcv_download_credits";
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot() {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored ? parseInt(stored, 10) : 0;
}

function getServerSnapshot() {
  return 0;
}

function setCredits(value: number) {
  window.localStorage.setItem(STORAGE_KEY, String(Math.max(0, value)));
  listeners.forEach((listener) => listener());
}

export function useDownloadCredits() {
  const credits = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const consumeCredit = useCallback(() => {
    setCredits(getSnapshot() - 1);
  }, []);

  const addCredits = useCallback((amount: number) => {
    setCredits(getSnapshot() + amount);
  }, []);

  return { credits, consumeCredit, addCredits };
}
