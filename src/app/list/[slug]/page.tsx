"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { ContributeModal } from "@/components/ContributeModal";
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

// Stored in localStorage so the same browser won't see own reservations as "available"
const RESERVER_TOKEN_KEY = "wl_reserver_token";
function getReserverToken() {
  if (typeof window === "undefined") return "";
  let t = localStorage.getItem(RESERVER_TOKEN_KEY);
  if (!t) { t = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem(RESERVER_TOKEN_KEY, t); }
  return t;
}

export default function PublicWishlistPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<WishlistDetail | null>(null);
  const [contributeItem, setContributeItem] = useState<Item | null>(null);
  const [toasts, setToasts] = useState<{ id: number; text: string; type?: string }[]>([]);
  const [activities, setActivities] = useState<{ id: number; text: string }[]>([]);
  const [notFound, setNotFound] = useState(false);
  const sseRef = useRef<EventSource | null>(null);

  const toast = (text: string, type?: string) => {
    const tid = Date.now();
    setToasts(p => [...p, { id: tid, text, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== tid)), 3500);
  };

  const activity = (text: string) => {
    const aid = Date.now();
    setActivities(p => [...p, { id: aid, text }]);
    setTimeout(() => setActivities(p => p.filter(a => a.id !== aid)), 4500);
  };

  const load = useCallback(() => {
    fetch(`/api/wishlists/${slug}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) { setNotFound(true); return; }
        setData(d);
      });
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  // SSE realtime
  useEffect(() => {
    if (!slug) return;
    const es = new EventSource(`/api/sse/${slug}`);
    sseRef.current = es;

    es.onmessage = (e) => {
      const evt = JSON.parse(e.data);
      if (evt.type === "ITEM_RESERVED") {
        setData(d => d ? { ...d, items: d.items.map(i => i.id === evt.payload.itemId ? { ...i, reserved: true } : i) } : d);
        activity("🎁 Кто-то зарезервировал подарок");
      }
      if (evt.type === "ITEM_UNRESERVED") {
        setData(d => d ? { ...d, items: d.items.map(i => i.id === evt.payload.itemId ? { ...i, reserved: false } : i) } : d);
      }
      if (evt.type === "CONTRIBUTION_ADDED") {
        const p = evt.payload;
        setData(d => d ? {
          ...d,
          items: d.items.map(i => i.id === p.itemId
            ? { ...i, collected: p.newTotal, contributorsCount: p.contributorsCount }
            : i)
        } : d);
        activity(`💛 Кто-то внёс вклад в сбор`);
      }
      if (evt.type === "ITEM_DELETED") {
        setData(d => d ? { ...d, items: d.items.filter(i => i.id !== evt.payload.itemId) } : d);
        if (evt.payload.hadContributions) {
          toast("⚠️ Товар из сбора был удалён владельцем. Средства будут возвращены.", "warning");
        }
      }
    };

    return () => es.close();
  }, [slug]);

  const handleReserve = async (item: Item) => {
    const token = getReserverToken();
    const res = await fetch(`/api/items/${item.id}/reserve`, {
      method: "POST",
      headers: { "x-reserver-token": token },
    });
    if (res.ok) {
      setData(d => d ? { ...d, items: d.items.map(i => i.id === item.id ? { ...i, reserved: true } : i) } : d);
      toast("🎁 Подарок зарезервирован! Только вы об этом знаете 🤫", "success");
    } else if (res.status === 409) {
      toast("Этот подарок уже зарезервирован", "");
    }
  };

  if (notFound) return <NotFound />;
  if (!data) return <LoadingScreen />;

  return (
    <div style={{ background: "var(--cream)", minHeight: "100vh" }}>
      <nav className="sticky top-0 z-50 border-b border-[#C4962A]/15 bg-[#FAF7F2]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-display text-xl font-bold text-[#2D3561]">
            Wish<span className="text-[#C4962A]">list</span>
          </span>
          <span className="live-dot text-[#7A9E87] text-sm">Онлайн</span>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Friend banner */}
        <div className="rounded-2xl p-6 mb-8 flex items-center gap-4 flex-wrap"
          style={{ background: "linear-gradient(135deg, #2D3561, #3D4880)" }}>
          <div className="text-3xl">🎁</div>
          <div className="flex-1 text-white">
            <div className="font-semibold mb-1">Вишлист {data.ownerName}</div>
            <div className="text-white/75 text-sm">Зарезервируйте подарок — {data.ownerName} не увидит кто что выбрал. Сюрприз сохранён!</div>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="text-5xl mb-3">{data.emoji}</div>
          <h1 className="font-display text-3xl font-bold text-[#1A1A2E] mb-2">{data.name}</h1>
          {data.description && <p className="text-[#6B6B80] max-w-lg">{data.description}</p>}
        </div>

        {data.items.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4 opacity-50">🌟</div>
            <h2 className="font-display text-2xl font-semibold text-[#1A1A2E] mb-3">Список пока пуст</h2>
            <p className="text-[#6B6B80]">{data.ownerName} ещё не добавил(а) желания</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {data.items.map(item => (
              <FriendItemCard
                key={item.id}
                item={item}
                onReserve={handleReserve}
                onContribute={setContributeItem}
              />
            ))}
          </div>
        )}
      </div>

      {/* Realtime activity feed */}
      <div className="fixed bottom-6 left-6 flex flex-col gap-2 z-50 pointer-events-none">
        {activities.map(a => (
          <div key={a.id} className="bg-white rounded-xl px-4 py-2.5 shadow-lg text-sm text-[#1A1A2E] border-l-4 border-[#C4962A] animate-activity-in max-w-[240px]">
            {a.text}
          </div>
        ))}
      </div>

      {contributeItem && (
        <ContributeModal
          item={contributeItem}
          onClose={() => setContributeItem(null)}
          onContribute={async (amount) => {
            const res = await fetch(`/api/items/${contributeItem.id}/contribute`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ amount }),
            });
            if (res.ok) {
              setContributeItem(null);
              toast(`💛 Вы внесли ${amount.toLocaleString("ru")} ₽. Спасибо!`, "gold");
            } else {
              const d = await res.json();
              toast(d.error === "Already fully funded" ? "Сумма уже собрана!" : "Ошибка. Попробуйте ещё раз.", "");
            }
          }}
        />
      )}

      <Toast toasts={toasts} />
    </div>
  );
}

function FriendItemCard({ item, onReserve, onContribute }: {
  item: Item;
  onReserve: (i: Item) => void;
  onContribute: (i: Item) => void;
}) {
  const pct = item.isGroupBuy ? Math.min(100, Math.round((item.collected / item.price) * 100)) : 0;
  const funded = pct >= 100;

  return (
    <div className={`card overflow-hidden ${item.reserved && !item.isGroupBuy ? "opacity-70" : ""}`}>
      <div className="h-40 bg-[#F0EBE1] flex items-center justify-center text-5xl overflow-hidden">
        {item.imageUrl
          ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
          : item.emoji}
      </div>
      <div className="p-5">
        <div className="font-display text-base font-semibold text-[#1A1A2E] leading-tight mb-2">{item.name}</div>
        <div className="text-lg font-bold text-[#2D3561] mb-2">{item.price.toLocaleString("ru")} ₽</div>

        {item.link && (
          <a href={item.link} target="_blank" rel="noreferrer"
            className="text-[#C4962A] text-xs flex items-center gap-1 hover:underline mb-3">
            🔗 Посмотреть товар
          </a>
        )}

        {item.isGroupBuy && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-[#6B6B80] mb-1.5">
              <span>{item.contributorsCount} {item.contributorsCount === 1 ? "человек" : "человека"}</span>
              <strong className="text-[#1A1A2E]">{pct}%</strong>
            </div>
            <div className="h-2 bg-[#F0EBE1] rounded-full overflow-hidden">
              <div className={`h-full rounded-full progress-fill ${funded ? "funded" : ""}`} style={{ width: `${pct}%` }} />
            </div>
            <div className="text-xs text-[#6B6B80] mt-1">
              {item.collected.toLocaleString("ru")} / {item.price.toLocaleString("ru")} ₽
            </div>
          </div>
        )}

        {item.isGroupBuy ? (
          funded
            ? <div className="px-3 py-1.5 rounded-full bg-[#7A9E87]/12 text-[#7A9E87] text-xs inline-flex items-center gap-1">✓ Сумма собрана</div>
            : <button className="btn btn-gold btn-sm w-full justify-center" onClick={() => onContribute(item)}>💛 Скинуться</button>
        ) : item.reserved ? (
          <div className="px-3 py-1.5 rounded-full bg-[#7A9E87]/12 text-[#7A9E87] text-xs inline-flex items-center gap-1">✓ Зарезервировано</div>
        ) : (
          <button className="btn btn-primary btn-sm w-full justify-center" onClick={() => onReserve(item)}>🎁 Зарезервировать</button>
        )}
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

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center text-center px-6" style={{ background: "var(--cream)" }}>
      <div>
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="font-display text-3xl font-bold text-[#1A1A2E] mb-3">Список не найден</h1>
        <p className="text-[#6B6B80]">Возможно, ссылка устарела или список был удалён.</p>
      </div>
    </div>
  );
}
