$signin = @'
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