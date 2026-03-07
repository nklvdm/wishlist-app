import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  return (
    <main className="min-h-screen" style={{ background: "var(--cream)" }}>
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-[#C4962A]/15 bg-[#FAF7F2]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-display text-[22px] font-bold text-[#2D3561]">
            Wish<span className="text-[#C4962A]">list</span>
          </span>
          <div className="flex gap-3">
            <Link href="/auth/signin" className="btn btn-outline btn-sm">Войти</Link>
            <Link href="/auth/signin?mode=register" className="btn btn-gold btn-sm">Регистрация</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#C4962A]/10 text-[#C4962A] text-sm font-medium border border-[#C4962A]/20 mb-8">
          ✨ Вишлисты с магией
        </div>

        <h1 className="font-display text-6xl md:text-7xl font-bold text-[#1A1A2E] leading-tight mb-6">
          Подарки, которые<br />
          <em className="text-[#C4962A] not-italic">действительно</em> хочется
        </h1>

        <p className="text-xl text-[#6B6B80] max-w-lg mx-auto leading-relaxed mb-10">
          Создайте список желаний, поделитесь с друзьями — и они сами разберут подарки без повторений и неловких вопросов.
        </p>

        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/auth/signin?mode=register" className="btn btn-gold btn-lg">
            🎁 Создать вишлист
          </Link>
          <Link href="/auth/signin" className="btn btn-outline btn-lg">
            Войти
          </Link>
        </div>

        <div className="flex gap-8 justify-center mt-16 flex-wrap">
          {[
            "Без повторяющихся подарков",
            "Сбор денег вскладчину",
            "Реалтайм обновления",
            "Сюрприз сохранён",
          ].map((f) => (
            <div key={f} className="flex items-center gap-2 text-[#6B6B80] text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-[#C4962A]" />
              {f}
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <h2 className="font-display text-4xl font-bold text-center text-[#1A1A2E] mb-12">
          Как это работает
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { n: "1", title: "Создайте список", desc: "Добавьте желания с названием, ценой и ссылкой. Вставьте URL — мы подтянем всё сами.", emoji: "📝" },
            { n: "2", title: "Поделитесь ссылкой", desc: "Отправьте ссылку друзьям. Они откроют её без регистрации.", emoji: "🔗" },
            { n: "3", title: "Сюрприз!", desc: "Друзья резервируют подарки. Вы не видите кто что выбрал — сюрприз сохранён!", emoji: "🎉" },
          ].map((s) => (
            <div key={s.n} className="card p-8 text-center">
              <div className="text-4xl mb-4">{s.emoji}</div>
              <div className="font-display text-xl font-semibold text-[#1A1A2E] mb-3">{s.title}</div>
              <p className="text-[#6B6B80] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
