import type { SupportedStorage } from "@supabase/auth-js";

const getLocalStorage = (): Storage | null => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
};

export const storage: SupportedStorage = {
  getItem: async (key) => {
    return getLocalStorage()?.getItem(key) ?? null;
  },

  setItem: async (key, value) => {
    getLocalStorage()?.setItem(key, value);
  },

  removeItem: async (key) => {
    getLocalStorage()?.removeItem(key);
  },
};