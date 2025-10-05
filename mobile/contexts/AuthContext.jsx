import { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { authApi } from "@/services/api";

const TOKEN_KEY = "heladeria_token";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authenticating, setAuthenticating] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        if (storedToken) {
          setToken(storedToken);
          const profile = await authApi.profile(storedToken);
          setUser(profile.user);
        }
      } catch (error) {
        console.warn("No se pudo restaurar la sesión", error?.message);
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const handleAuth = async (payload, mode) => {
    setAuthenticating(true);
    try {
      const response = mode === "register" ? await authApi.register(payload) : await authApi.login(payload);
      const nextToken = response.token;
      await SecureStore.setItemAsync(TOKEN_KEY, nextToken);
      setToken(nextToken);
      setUser(response.user);
      return response.user;
    } finally {
      setAuthenticating(false);
    }
  };

  const login = async ({ email, password }) => {
    return handleAuth({ email, password }, "login");
  };

  const register = async ({ name, email, password, phone }) => {
    return handleAuth({ name, email, password, phone }, "register");
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  };

  const refreshProfile = async () => {
    if (!token) return null;
    const profile = await authApi.profile(token);
    setUser(profile.user);
    return profile.user;
  };

  const value = useMemo(
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
    [user, token, loading, authenticating]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return context;
};
