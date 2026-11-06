import { create } from "zustand";

import {
  getCurrentSession,
  signOut,
} from "../services/auth.service";

import type { Session } from "@supabase/supabase-js";

type AuthState = {
  session: Session | null;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
  loadSession: () => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>(
  (set) => ({
    session: null,

    isLoading: true,

    setSession: (session) => {
      set({
        session,
        isLoading: false,
      });
    },

    loadSession: async () => {
      try {
        const session =
          await getCurrentSession();

        set({
          session,
          isLoading: false,
        });
      } catch (error) {
        console.error(
          "Failed to load session:",
          error
        );

        set({
          session: null,
          isLoading: false,
        });
      }
    },

    logout: async () => {
      await signOut();

      set({
        session: null,
        isLoading: false,
      });
    },
  })
);