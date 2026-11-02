"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { UserRole } from "@/types/user";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState(false);

  useEffect(() => {
    if (searchParams.get("expired") === "1") {
      setSessionExpiredNotice(true);
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSessionExpiredNotice(false);

    try {
      if (!email.trim() || !password) {
        setError("Por favor completa tu correo y contraseña.");
        setIsLoading(false);
        return;
      }

      // 1. Iniciar sesión en Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);

      // 2. Forzar lectura del ID Token para validar Custom Claim de Rol
      const tokenResult = await userCredential.user.getIdTokenResult(true);
      const role = (tokenResult.claims.role as UserRole) || null;

      if (!role || !["admin", "vendedor", "soporte"].includes(role)) {
        await signOut(auth);
        setError("Acceso denegado: tu usuario no cuenta con un rol asignado (admin, vendedor o soporte).");
        setIsLoading(false);
        return;
      }

      // 3. Redirección exitosa
      router.replace("/admin");
    } catch (err: any) {
      console.error("[Login] Error de autenticación:", err);
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password"
      ) {
        setError("Correo electrónico o contraseña incorrectos.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Demasiados intentos fallidos. Intenta más tarde.");
      } else {
        setError(err.message || "Error al iniciar sesión.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#4A0C18] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#7A1428] opacity-50 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-[#C9A15B] opacity-20 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-white/20 relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center py-1">
            <img
              src="/logo-cosotec.png"
              alt="CosoTec by CoSoAVL"
              className="h-12 w-auto object-contain mx-auto"
              width={180}
              height={48}
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Panel de Administración
          </h1>
          <p className="text-xs text-gray-500 font-medium">
            Acceso administrativo y cotizador • CoSoAVL
          </p>
        </div>

        {sessionExpiredNotice && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Tu sesión expiró o no fue encontrada.</p>
              <p className="text-[11px] text-amber-700 mt-0.5">Por favor inicia sesión con tus credenciales.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-gray-700">Correo Electrónico</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@cosoavl.com"
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1428]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-gray-700">Contraseña</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1428]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#7A1428] hover:bg-[#4A0C18] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 group text-sm disabled:opacity-60"
          >
            <span>{isLoading ? "Iniciando sesión..." : "Entrar al Panel"}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="pt-4 border-t border-gray-100 text-center">
          <p className="text-[11px] text-gray-400 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Acceso protegido con Firebase Auth Custom Claims
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#4A0C18]" />}>
      <LoginForm />
    </Suspense>
  );
}
