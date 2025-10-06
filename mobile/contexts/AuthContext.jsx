import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { authApi } from "@/services/api";

const TOKEN_KEY = "heladeria_token";

async function secureStoreAvailable() {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

const storage = {
  getItem: async (key) => {
    if (await secureStoreAvailable()) {
      return SecureStore.getItemAsync(key);
    }
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return null;
  },
  setItem: async (key, value) => {
    if (await secureStoreAvailable()) {
      return SecureStore.setItemAsync(key, value);
    }
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  },
  deleteItem: async (key) => {
    if (await secureStoreAvailable()) {
      return SecureStore.deleteItemAsync(key);
    }
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  },
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authenticating, setAuthenticating] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const storedToken = await storage.getItem(TOKEN_KEY);
        if (storedToken) {
          setToken(storedToken);
          const profile = await authApi.profile(storedToken);
          setUser(profile.user);
        }
      } catch (error) {
        console.warn("No se pudo restaurar la sesión", error?.message);
        await storage.deleteItem(TOKEN_KEY);
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const handleAuth = useCallback(async (payload, mode) => {
    setAuthenticating(true);
    try {
      const response = mode === "register" ? await authApi.register(payload) : await authApi.login(payload);
      const nextToken = response.token;
      await storage.setItem(TOKEN_KEY, nextToken);
      setToken(nextToken);
      setUser(response.user);
      return response.user;
    } finally {
      setAuthenticating(false);
    }
  }, []);

  const login = useCallback(async ({ email, password }) => handleAuth({ email, password }, "login"), [handleAuth]);

  const register = useCallback(
    async ({ name, email, password, phone }) => handleAuth({ name, email, password, phone }, "register"),
    [handleAuth]
  );

  const logout = useCallback(async () => {
    setUser(null);
    setToken(null);
    await storage.deleteItem(TOKEN_KEY);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!token) return null;
    const profile = await authApi.profile(token);
    setUser(profile.user);
    return profile.user;
  }, [token]);

  const value = useMemo(
    () => ({ user, token, loading, authenticating, login, register, logout, refreshProfile }),
    [user, token, loading, authenticating, login, register, logout, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
};

