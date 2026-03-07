"use client";
import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function SignInForm() {
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
    <div style={{ width: "100%", maxWidth: 440 }}>
      <Link href="/" style={{ display: "block", textAlign: "center", marginBottom: 32, textDecoration: "none" }}>
        <span className="font-display" style={{ fontSize: 24, fontWeight: 700, color: "#2D3561" }}>
          Wish<span style={{ color: "#C4962A" }}>list</span>
        </span>
      </Link>

      <div className="card" style={{ padding: 40 }}>
        <h1 className="font-display" style={{ fontSize: 28, fontWeight: 700, color: "#1A1A2E", marginBottom: 8 }}>
          {mode === "login" ? "С возвращением" : "Добро пожаловать"}
        </h1>
        <p style={{ color: "#6B6B80", marginBottom: 32 }}>
          {mode === "login" ? "Войдите в свой аккаунт" : "Создайте аккаунт бесплатно"}
        </p>

        <button className="btn btn-outline" style={{ width: "100%", justifyContent: "center", marginBottom: 20 }}
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}>
          <GoogleIcon /> Продолжить с Google
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#6B6B80", fontSize: 14, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: "rgba(45,53,97,0.1)" }} />
          или по email
          <div style={{ flex: 1, height: 1, background: "rgba(45,53,97,0.1)" }} />
        </div>

        {mode === "register" && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6B6B80", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Имя</label>
            <input className="input" placeholder="Ваше имя" value={name} onChange={e => setName(e.target.value)} />
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6B6B80", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Email</label>
          <input className="input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6B6B80", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Пароль</label>
          <input className="input" type="password" placeholder="••••••••" value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSubmit()} />
        </div>

        {error && (
          <div style={{ marginBottom: 16, padding: "12px 16px", background: "#fee2e2", color: "#dc2626", borderRadius: 12, fontSize: 14 }}>{error}</div>
        )}

        <button className="btn btn-gold" style={{ width: "100%", justifyContent: "center", padding: "14px" }}
          onClick={handleSubmit} disabled={loading}>
          {loading ? "⏳ Загрузка..." : mode === "login" ? "Войти" : "Зарегистрироваться"}
        </button>

        <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center", marginTop: 12 }}
          onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>
          {mode === "login" ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти"}
        </button>
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

export default function SignInPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "var(--cream)" }}>
      <Suspense fallback={<div style={{ fontSize: 40 }}>🎁</div>}>
        <SignInForm />
      </Suspense>
    </div>
  );
}
