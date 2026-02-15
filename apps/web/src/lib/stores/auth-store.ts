import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
  id: string;
  did: string;
  roles: string[];
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  login: (data: {
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
  }) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,

      login: ({ user, accessToken, refreshToken }) => {
        // Sync tokens to separate localStorage keys for API client
        if (typeof window !== "undefined") {
          localStorage.setItem("tml_access_token", accessToken);
          localStorage.setItem("tml_refresh_token", refreshToken);
        }
        set({ user, accessToken, refreshToken, isLoading: false });
      },

      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("tml_access_token");
          localStorage.removeItem("tml_refresh_token");
        }
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isLoading: false,
        });
      },
    }),
    { name: "tml-auth" },
  ),
);
