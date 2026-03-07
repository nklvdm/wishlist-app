"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { AddItemModal } from "@/components/AddItemModal";
import { Toast } from "@/components/Toast";

interface Item {
  id: string; name: string; price: number; link?: string;
  emoji: string; imageUrl?: string; isGroupBuy: boolean;
  reserved: boolean; collected: number; contributorsCount: number;
}
interface WishlistDetail {
  id: string; slug: string; name: string; description?: string;
  emoji: string; ownerName: string; isOwner: boolean; items: Item[];
}

export default function OwnerWishlistPage() {
  const { id } = useParams<{ id: string }>();
  const { status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<WishlistDetail | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; text: string; type?: string }[]>([]);
  const [copied, setCopied] = useState(false);

  const toast = (text: string, type?: string) => {
    const tid = Date.now();
    setToasts(p => [...p, { id: tid, text, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== tid)), 3500);
  };

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
  }, [status, router]);

  const load = () => {
    fetch(`/api/wishlists/${id}`)
      .then(r => r.json())
      .then(d => { if (d.id) setData(d); });
  };

  useEffect(() => { if (status === "authenticated") load(); }, [status, id]);

  const handleDelete = async (item: Item) => {
    const res = await fetch(`/api/items/${item.id}`, { method: "DELETE" });
    const d = await res.json();
    if (d.hadContributions) {
      toast("⚠️ Товар удалён. Участники сбора будут уведомлены о возврате средств.", "warning");
    } else {
      toast("Удалено", "");
    }
    load();
  };

  const copyLink = () => {
    const url = `${window.location.origin}/list/${data?.slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast("Ссылка скопирована! 🔗", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!data) return <LoadingScreen />;

  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/list/${data.slug}`;

  return (
    <div style={{ background: "var(--cream)", minHeight: "100vh" }}>
      <nav className="sticky top-0 z-50 border-b border-[#C4962A]/15 bg-[#FAF7F2]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-4">
          <button className="btn btn-ghost btn-sm" onClick={() => router.push("/dashboard")}>← Назад</button>
          <span className="font-display text-lg font-semibold text-[#2D3561] truncate">{data.name}</span>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="card p-8 mb-8 flex flex-wrap gap-8 items-start justify-between">
          <div>
            <div className="text-5xl mb-3">{data.emoji}</div>
            <h1 className="font-display text-3xl font-bold text-[#1A1A2E] mb-2">{data.name}</h1>
            {data.description && <p className="text-[#6B6B80] max-w-lg">{data.description}</p>}
            <div className="flex gap-2 mt-4 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-[#2D3561]/8 text-[#2D3561] text-xs font-medium">{data.items.length} желаний</span>
              <span className="px-3 py-1 rounded-full bg-[#7A9E87]/12 text-[#7A9E87] text-xs font-medium">
                {data.items.filter(i => i.reserved || (i.isGroupBuy && i.collected >= i.price)).length} выполнено
              </span>
            </div>
          </div>

          {/* Share box */}
          <div className="bg-[#FAF7F2] rounded-xl p-5 min-w-[280px] border border-[#C4962A]/2">
            <div className="text-xs font-semibold text-[#6B6B80] uppercase tracking-wider mb-3">Поделитесь с друзьями</div>
            <div className="flex gap-2">
              <div className="flex-1 bg-white rounded-lg px-3 py-2 text-xs text-[#2D3561] border border-[#2D3561]/10 truncate">
                {shareUrl}
              </div>
              <button className="btn btn-outline btn-sm flex-shrink-0" onClick={copyLink}>
                {copied ? "✓" : "Копировать"}
              </button>
            </div>
            <p className="text-xs text-[#6B6B80] mt-2">Друзья откроют без регистрации</p>
          </div>
        </div>

        <div className="mb-6">
          <button className="btn btn-gold" onClick={() => setShowAdd(true)}>+ Добавить желание</button>
        </div>

        {data.items.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4 opacity-50">🌟</div>
            <h2 className="font-display text-2xl font-semibold text-[#1A1A2E] mb-3">Список пуст</h2>
            <p className="text-[#6B6B80] mb-6 max-w-sm mx-auto">Добавьте первое желание и поделитесь списком с друзьями!</p>
            <button className="btn btn-gold" onClick={() => setShowAdd(true)}>Добавить желание</button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {data.items.map(item => (
              <OwnerItemCard key={item.id} item={item} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <AddItemModal
          wishlistId={data.id}
          onClose={() => setShowAdd(false)}
          onAdd={() => { setShowAdd(false); load(); toast("Желание добавлено! ✨", "success"); }}
        />
      )}

      <Toast toasts={toasts} />
    </div>
  );
}

function OwnerItemCard({ item, onDelete }: { item: Item; onDelete: (i: Item) => void }) {
  const pct = item.isGroupBuy ? Math.min(100, Math.round((item.collected / item.price) * 100)) : 0;
  const funded = pct >= 100;

  return (
    <div className="card overflow-hidden">
      <div className="h-40 bg-[#F0EBE1] flex items-center justify-center text-5xl">
        {item.imageUrl
          ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
          : item.emoji}
      </div>
      <div className="p-5">
        <div className="font-display text-base font-semibold text-[#1A1A2E] leading-tight mb-2">{item.name}</div>
        <div className="text-lg font-bold text-[#2D3561] mb-3">{(item.price).toLocaleString("ru")} ₽</div>

        {item.link && (
          <a href={item.link} target="_blank" rel="noreferrer"
            className="text-[#C4962A] text-xs flex items-center gap-1 hover:underline mb-3">
            🔗 Посмотреть товар
          </a>
        )}

        {item.isGroupBuy && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-[#6B6B80] mb-1.5">
              <span>{item.contributorsCount} участников сбора</span>
              <span className="font-semibold">{pct}%</span>
            </div>
            <div className="h-2 bg-[#F0EBE1] rounded-full overflow-hidden">
              <div className={`h-full rounded-full progress-fill ${funded ? "funded" : ""}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          {item.isGroupBuy
            ? funded
              ? <span className="px-2 py-1 rounded-full bg-[#7A9E87]/12 text-[#7A9E87] text-xs">✓ Собрано</span>
              : <span className="px-2 py-1 rounded-full bg-[#C4962A]/10 text-[#C4962A] text-xs">💛 {item.collected.toLocaleString("ru")} / {item.price.toLocaleString("ru")} ₽</span>
            : item.reserved
              ? <span className="px-2 py-1 rounded-full bg-[#7A9E87]/12 text-[#7A9E87] text-xs">✓ Зарезервирован</span>
              : <span className="px-2 py-1 rounded-full bg-[#2D3561]/8 text-[#2D3561] text-xs">Ожидает</span>
          }
          <button className="ml-auto btn btn-danger btn-sm" onClick={() => onDelete(item)}>🗑</button>
        </div>
      </div>
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
