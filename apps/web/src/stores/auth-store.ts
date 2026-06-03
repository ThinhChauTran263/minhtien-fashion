import { create } from "zustand";
import { authApi } from "@/lib/api";
import { clearPersistedCart } from "@/stores/cart-store";

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  role: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  /** True until first hydrate() resolves. Use this to gate auth-dependent UI. */
  isHydrated: boolean;
  /** If the account is locked, contains the block reason */
  blockedReason: string | null;
  setAuth: (user: User) => void;
  setUser: (user: User) => void;
  setBlocked: (reason: string) => void;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

const USER_CACHE_KEY = "mtf-user-cache";

function loadCachedUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(USER_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

function saveCachedUser(user: User | null) {
  if (typeof window === "undefined") return;
  try {
    if (user) {
      sessionStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
    } else {
      sessionStorage.removeItem(USER_CACHE_KEY);
    }
  } catch {
    // sessionStorage may be unavailable (private mode); ignore.
  }
}

// Deduplicate concurrent hydrate() calls
let hydratePromise: Promise<void> | null = null;

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isHydrated: false,
  blockedReason: null,

  setAuth: (user) => {
    saveCachedUser(user);
    set({ user, isAuthenticated: true, isHydrated: true, blockedReason: null });
    hydratePromise = null;
  },

  setUser: (user) => {
    saveCachedUser(user);
    set({ user, isAuthenticated: true, isHydrated: true, blockedReason: null });
    hydratePromise = null;
  },

  setBlocked: (reason) => {
    saveCachedUser(null);
    set({ user: null, isAuthenticated: false, isHydrated: true, blockedReason: reason });
    hydratePromise = null;
  },

  logout: async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      localStorage.removeItem("mtf-compare");
    }
    clearPersistedCart();
    saveCachedUser(null);
    hydratePromise = null;
    set({ user: null, isAuthenticated: false, isHydrated: true });

    try {
      await authApi.logout();
    } catch {
      // Ignore logout API failures; local state is already cleared.
    }
  },

  hydrate: async () => {
    if (typeof window === "undefined") return;

    // Deduplicate: multiple components calling hydrate() share one network request
    if (hydratePromise) return hydratePromise;

    // Hydrate optimistically from cache for instant UI
    const cached = loadCachedUser();
    if (cached) {
      set({ user: cached, isAuthenticated: true, isHydrated: true });
    }

    hydratePromise = (async () => {
      // Clean up legacy keys (we use HttpOnly cookies now)
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");

      try {
        const { data } = await authApi.getMe();
        const user = data.data as User;
        saveCachedUser(user);
        set({ user, isAuthenticated: true, isHydrated: true, blockedReason: null });
      } catch (err: any) {
        saveCachedUser(null);
        // Detect blocked account (403 with specific message)
        const status = err?.response?.status;
        const errorMsg = err?.response?.data?.error || "";
        if (status === 403 && errorMsg.includes("khóa")) {
          set({ user: null, isAuthenticated: false, isHydrated: true, blockedReason: errorMsg });
        } else {
          set({ user: null, isAuthenticated: false, isHydrated: true, blockedReason: null });
        }
      } finally {
        hydratePromise = null;
      }
    })();

    return hydratePromise;
  },
}));

