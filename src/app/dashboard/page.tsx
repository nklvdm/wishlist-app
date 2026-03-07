"use client";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CreateListModal } from "@/components/CreateListModal";

interface WishlistSummary {
  id: string; name: string; emoji: string;
  slug: string; description?: string;
  itemCount: number; reservedCount: number;
  createdAt: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [lists, setLists] = useState<WishlistSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/wishlists")
        .then(r => r.json())
        .then(data => { setLists(data); setLoading(false); });
    }
  }, [status]);

  const handleCreate = (newList: WishlistSummary) => {
    setLists(p => [newList, ...p]);
    setShowCreate(false);
    router.push(`/dashboard/${newList.id}`);
  };

  if (status === "loading" || loading) return <LoadingScreen />;

  return (
    <div style={{ background: "var(--cream)", minHeight: "100vh" }}>
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-[#C4962A]/15 bg-[#FAF7F2]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-display text-xl font-bold text-[#2D3561]">
            Wish<span className="text-[#C4962A]">list</span>
          </span>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#2D3561] text-white flex items-center justify-center font-semibold text-sm">
              {session?.user?.name?.[0] ?? "?"}
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => signOut({ callbackUrl: "/" })}>Выйти</button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-start justify-between mb-10 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-4xl font-bold text-[#1A1A2E]">Мои вишлисты</h1>
            <p className="text-[#6B6B80] mt-1">Привет, {session?.user?.name}! Создайте список и поделитесь с друзьями.</p>
          </div>
          <button className="btn btn-gold" onClick={() => setShowCreate(true)}>+ Новый список</button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {lists.map(list => (
            <div key={list.id}
              className="card p-7 cursor-pointer hover:shadow-md hover:-translate-y-1 relative overflow-hidden"
              onClick={() => router.push(`/dashboard/${list.id}`)}
            >
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#C4962A] to-[#E8C4A0]" />
              <div className="text-4xl mb-4">{list.emoji}</div>
              <div className="font-display text-xl font-semibold text-[#1A1A2E] mb-2">{list.name}</div>
              {list.description && <div className="text-[#6B6B80] text-sm mb-4 line-clamp-2">{list.description}</div>}
              <div className="flex gap-4 text-sm text-[#6B6B80]">
                <span><strong className="text-[#1A1A2E]">{list.itemCount}</strong> желаний</span>
                <span><strong className="text-[#1A1A2E]">{list.reservedCount}</strong> выполнено</span>
              </div>
            </div>
          ))}

          <button
            className="border-2 border-dashed border-[#2D3561]/15 rounded-2xl p-7
                       flex flex-col items-center justify-center gap-3 min-h-[180px]
                       text-[#6B6B80] hover:text-[#2D3561] hover:border-[#2D3561] hover:bg-[#2D3561]/3
                       transition-all cursor-pointer bg-transparent"
            onClick={() => setShowCreate(true)}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" /><path d="M12 8v8M8 12h8" strokeLinecap="round" />
            </svg>
            <span className="font-medium">Создать список</span>
          </button>
        </div>

        {lists.length === 0 && !loading && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4 opacity-50">🎁</div>
            <h2 className="font-display text-2xl font-semibold text-[#1A1A2E] mb-3">Пока пусто</h2>
            <p className="text-[#6B6B80] mb-6">Создайте первый вишлист и поделитесь с друзьями!</p>
            <button className="btn btn-gold btn-lg" onClick={() => setShowCreate(true)}>Создать первый список</button>
          </div>
        )}
      </div>

      {showCreate && (
        <CreateListModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--cream)" }}>
      <div className="text-4xl animate-bounce">🎁</div>
    </div>
  );
}
