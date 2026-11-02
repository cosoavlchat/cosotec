"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { UserRole } from "@/types/user";

interface AdminAuthContextType {
  user: User | null;
  role: UserRole | null;
  claims: Record<string, any>;
  loading: boolean;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType>({
  user: null,
  role: null,
  claims: {},
  loading: true,
  logout: async () => {},
});

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [claims, setClaims] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setRole(null);
        setClaims({});
        setLoading(false);
        return;
      }

      try {
        const tokenResult = await currentUser.getIdTokenResult();
        const userRole = (tokenResult.claims.role as UserRole) || null;

        setUser(currentUser);
        setRole(userRole);
        setClaims(tokenResult.claims || {});
      } catch (err) {
        console.error("[AdminAuthProvider] Error obteniendo claims:", err);
        setUser(null);
        setRole(null);
        setClaims({});
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("[AdminAuthProvider] Error al cerrar sesión:", err);
    } finally {
      setUser(null);
      setRole(null);
      setClaims({});
      if (typeof window !== "undefined") {
        window.location.href = "/admin/login";
      }
    }
  };

  return (
    <AdminAuthContext.Provider value={{ user, role, claims, loading, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth debe utilizarse dentro de un AdminAuthProvider");
  }
  return context;
}

