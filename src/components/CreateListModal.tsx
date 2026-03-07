"use client";
import { useState } from "react";

const EMOJIS = ["🎁", "🎂", "🎄", "💍", "🌸", "🏠", "✈️", "🎮", "📚", "🌿", "🎵", "☕"];

export function CreateListModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (list: any) => void;
}) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [emoji, setEmoji] = useState("🎁");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/wishlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description: desc, emoji }),
      });
      if (!res.ok) { setError("Не удалось создать список. Попробуйте ещё раз."); setLoading(false); return; }
      const data = await res.json();
      onCreate(data);
    } catch {
      setError("Ошибка сети");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1A2E]/50 backdrop-blur-sm animate-fade-in"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl p-10 w-full max-w-md shadow-2xl animate-slide-up">
        <h2 className="font-display text-2xl font-bold text-[#1A1A2E] mb-1">Новый вишлист</h2>
        <p className="text-[#6B6B80] mb-7">Назовите список и выберите эмодзи</p>

        <div className="mb-5">
          <label className="block text-xs font-semibold text-[#6B6B80] uppercase tracking-wide mb-2">Эмодзи</label>
          <div className="flex gap-2 flex-wrap">
            {EMOJIS.map(e => (
              <button key={e} onClick={() => setEmoji(e)}
                className={`w-10 h-10 rounded-xl text-xl transition-all cursor-pointer
                  ${emoji === e ? "bg-[#2D3561]/10 border-2 border-[#2D3561]" : "bg-[#FAF7F2] border-2 border-transparent hover:border-[#2D3561]/20"}`}>
                {e}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-[#6B6B80] uppercase tracking-wide mb-1.5">Название *</label>
          <input className="input" placeholder="День рождения, Новый год..." value={name} onChange={e => setName(e.target.value)} />
        </div>

        <div className="mb-6">
          <label className="block text-xs font-semibold text-[#6B6B80] uppercase tracking-wide mb-1.5">Описание</label>
          <input className="input" placeholder="Мне исполняется 25! Собираемся 15 июня..." value={desc} onChange={e => setDesc(e.target.value)} />
        </div>

        {error && <div className="mb-4 px-4 py-3 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>}

        <div className="flex gap-3 justify-end">
          <button className="btn btn-ghost" onClick={onClose}>Отмена</button>
          <button className="btn btn-gold" onClick={handleSubmit} disabled={!name.trim() || loading}>
            {loading ? "⏳ Создаём..." : "Создать список"}
          </button>
        </div>
      </div>
    </div>
  );
}
