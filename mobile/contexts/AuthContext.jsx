import { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { authApi } from "@/services/api";

const TOKEN_KEY = "heladeria_token";

<<<<<<< HEAD
=======
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

>>>>>>> a822bae (Primer commit desde VS Code - ajustes y conexión API)
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authenticating, setAuthenticating] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      try {
<<<<<<< HEAD
        const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
=======
        const storedToken = await storage.getItem(TOKEN_KEY);
>>>>>>> a822bae (Primer commit desde VS Code - ajustes y conexión API)
        if (storedToken) {
          setToken(storedToken);
          const profile = await authApi.profile(storedToken);
          setUser(profile.user);
        }
      } catch (error) {
        console.warn("No se pudo restaurar la sesión", error?.message);
<<<<<<< HEAD
        await SecureStore.deleteItemAsync(TOKEN_KEY);
=======
        await storage.deleteItem(TOKEN_KEY);
>>>>>>> a822bae (Primer commit desde VS Code - ajustes y conexión API)
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };
<<<<<<< HEAD

=======
>>>>>>> a822bae (Primer commit desde VS Code - ajustes y conexión API)
    bootstrap();
  }, []);

  const handleAuth = async (payload, mode) => {
    setAuthenticating(true);
    try {
<<<<<<< HEAD
      const response = mode === "register" ? await authApi.register(payload) : await authApi.login(payload);
      const nextToken = response.token;
      await SecureStore.setItemAsync(TOKEN_KEY, nextToken);
=======
      const response =
        mode === "register" ? await authApi.register(payload) : await authApi.login(payload);
      const nextToken = response.token;
      await storage.setItem(TOKEN_KEY, nextToken);
>>>>>>> a822bae (Primer commit desde VS Code - ajustes y conexión API)
      setToken(nextToken);
      setUser(response.user);
      return response.user;
    } finally {
      setAuthenticating(false);
    }
  };

<<<<<<< HEAD
  const login = async ({ email, password }) => {
    return handleAuth({ email, password }, "login");
  };

  const register = async ({ name, email, password, phone }) => {
    return handleAuth({ name, email, password, phone }, "register");
  };
=======
  const login = ({ email, password }) => handleAuth({ email, password }, "login");

  const register = ({ name, email, password, phone }) =>
    handleAuth({ name, email, password, phone }, "register");
>>>>>>> a822bae (Primer commit desde VS Code - ajustes y conexión API)

  const logout = async () => {
    setUser(null);
    setToken(null);
<<<<<<< HEAD
    await SecureStore.deleteItemAsync(TOKEN_KEY);
=======
    await storage.deleteItem(TOKEN_KEY);
>>>>>>> a822bae (Primer commit desde VS Code - ajustes y conexión API)
  };

  const refreshProfile = async () => {
    if (!token) return null;
    const profile = await authApi.profile(token);
    setUser(profile.user);
    return profile.user;
  };

  const value = useMemo(
<<<<<<< HEAD
    () => ({
      user,
      token,
      loading,
      authenticating,
      login,
      register,
      logout,
      refreshProfile,
    }),
=======
    () => ({ user, token, loading, authenticating, login, register, logout, refreshProfile }),
>>>>>>> a822bae (Primer commit desde VS Code - ajustes y conexión API)
    [user, token, loading, authenticating]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return context;
};
