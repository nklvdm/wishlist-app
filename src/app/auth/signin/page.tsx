"use client";
import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function SignInPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<"login" | "register">(
    params.get("mode") === "register" ? "register" : "login"
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      if (mode === "register") {
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        if (!res.ok) {
          const d = await res.json();
          setError(d.error === "Email already in use" ? "Этот email уже зарегистрирован" : "Ошибка регистрации");
          setLoading(false);
          return;
        }
      }
      const res = await signIn("credentials", { email, password, redirect: false });
      if (res?.error) {
        setError("Неверный email или пароль");
        setLoading(false);
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("Что-то пошло не так. Попробуйте ещё раз.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--cream)" }}>
      <div className="w-full max-w-md">
        <Link href="/" className="block text-center font-display text-2xl font-bold text-[#2D3561] mb-8">
          Wish<span className="text-[#C4962A]">list</span>
        </Link>

        <div className="card p-10 animate-slide-up">
          <h1 className="font-display text-3xl font-bold text-[#1A1A2E] mb-2">
            {mode === "login" ? "С возвращением" : "Добро пожаловать"}
          </h1>
          <p className="text-[#6B6B80] mb-8">
            {mode === "login" ? "Войдите в свой аккаунт" : "Создайте аккаунт бесплатно"}
          </p>

          <button
            className="btn btn-outline w-full justify-center mb-5"
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          >
            <GoogleIcon /> Продолжить с Google
          </button>

          <div className="flex items-center gap-3 text-[#6B6B80] text-sm mb-5">
            <div className="flex-1 h-px bg-[#2D3561]/10" />
            или по email
            <div className="flex-1 h-px bg-[#2D3561]/10" />
          </div>

          {mode === "register" && (
            <div className="mb-4">
              <label className="block text-xs font-semibold text-[#6B6B80] uppercase tracking-wide mb-1.5">Имя</label>
              <input className="input" placeholder="Ваше имя" value={name} onChange={e => setName(e.target.value)} />
            </div>
          )}

          <div className="mb-4">
            <label className="block text-xs font-semibold text-[#6B6B80] uppercase tracking-wide mb-1.5">Email</label>
            <input className="input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>

          <div className="mb-6">
            <label className="block text-xs font-semibold text-[#6B6B80] uppercase tracking-wide mb-1.5">Пароль</label>
            <input className="input" type="password" placeholder="••••••••" value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()} />
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>
          )}

          <button className="btn btn-gold w-full justify-center py-3.5 text-base" onClick={handleSubmit} disabled={loading}>
            {loading ? "⏳ Загрузка..." : mode === "login" ? "Войти" : "Зарегистрироваться"}
          </button>

          <button
            className="btn btn-ghost w-full justify-center mt-3 text-sm"
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
          >
            {mode === "login" ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти"}
          </button>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}
