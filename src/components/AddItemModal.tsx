"use client";
import { useState } from "react";

export function AddItemModal({ wishlistId, onClose, onAdd }: {
  wishlistId: string;
  onClose: () => void;
  onAdd: () => void;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [link, setLink] = useState("");
  const [emoji, setEmoji] = useState("🎁");
  const [imageUrl, setImageUrl] = useState("");
  const [isGroup, setIsGroup] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchMeta = async () => {
    if (!link) return;
    setFetching(true);
    try {
      const res = await fetch(`/api/meta?url=${encodeURIComponent(link)}`);
      const data = await res.json();
      if (data.title) setName(data.title);
      if (data.price) setPrice(String(data.price));
      if (data.image) setImageUrl(data.image);
    } catch {}
    setFetching(false);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !price) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wishlistId,
          name,
          price: Math.round(parseFloat(price)),
          link: link || undefined,
          emoji,
          imageUrl: imageUrl || undefined,
          isGroupBuy: isGroup,
        }),
      });
      if (!res.ok) { setError("Не удалось добавить. Проверьте данные."); setLoading(false); return; }
      onAdd();
    } catch {
      setError("Ошибка сети");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1A2E]/50 backdrop-blur-sm animate-fade-in overflow-y-auto"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl animate-slide-up my-4">
        <h2 className="font-display text-2xl font-bold text-[#1A1A2E] mb-1">Добавить желание</h2>
        <p className="text-[#6B6B80] mb-7">Вставьте ссылку — мы подтянем всё сами</p>

        {/* URL autofill */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-[#6B6B80] uppercase tracking-wide mb-1.5">Ссылка на товар</label>
          <div className="flex gap-2">
            <input className="input flex-1" placeholder="https://..." value={link} onChange={e => setLink(e.target.value)} />
            <button className="btn btn-outline btn-sm flex-shrink-0" onClick={fetchMeta} disabled={fetching || !link}>
              {fetching ? "⏳" : "✨ Авто"}
            </button>
          </div>
        </div>

        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-[#6B6B80] uppercase tracking-wide mb-1.5">Название *</label>
            <input className="input" placeholder="Что хотите?" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="w-16">
            <label className="block text-xs font-semibold text-[#6B6B80] uppercase tracking-wide mb-1.5">Иконка</label>
            <input className="input text-center text-xl" value={emoji} onChange={e => setEmoji(e.target.value)} />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-[#6B6B80] uppercase tracking-wide mb-1.5">Цена (₽) *</label>
          <input className="input" type="number" placeholder="0" value={price} onChange={e => setPrice(e.target.value)} />
        </div>

        {imageUrl && (
          <div className="mb-4 flex items-center gap-3 p-3 bg-[#FAF7F2] rounded-xl">
            <img src={imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />
            <div className="text-sm text-[#6B6B80]">Картинка подтянулась автоматически ✓</div>
            <button className="ml-auto text-[#6B6B80] hover:text-red-500" onClick={() => setImageUrl("")}>✕</button>
          </div>
        )}

        {/* Group buy toggle */}
        <div className="mb-6 p-4 bg-[#FAF7F2] rounded-xl border border-[#C4962A]/20 flex items-start gap-3 cursor-pointer"
          onClick={() => setIsGroup(p => !p)}>
          <div className={`w-5 h-5 rounded flex-shrink-0 mt-0.5 flex items-center justify-center transition-all
            ${isGroup ? "bg-[#C4962A] border-[#C4962A]" : "border-2 border-[#2D3561]/20 bg-white"}`}>
            {isGroup && <span className="text-white text-xs">✓</span>}
          </div>
          <div>
            <div className="font-medium text-sm text-[#1A1A2E]">💛 Сбор вскладчину</div>
            <div className="text-xs text-[#6B6B80] mt-0.5">Несколько друзей смогут скинуться на этот подарок</div>
          </div>
        </div>

        {error && <div className="mb-4 px-4 py-3 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>}

        <div className="flex gap-3 justify-end">
          <button className="btn btn-ghost" onClick={onClose}>Отмена</button>
          <button className="btn btn-gold" onClick={handleSubmit} disabled={!name.trim() || !price || loading}>
            {loading ? "⏳ Добавляем..." : "Добавить"}
          </button>
        </div>
      </div>
    </div>
  );
}
