"use client";
import { useState } from "react";

interface Item {
  id: string; name: string; price: number;
  collected: number; contributorsCount: number;
}

export function ContributeModal({ item, onClose, onContribute }: {
  item: Item;
  onClose: () => void;
  onContribute: (amount: number) => Promise<void>;
}) {
  const [amount, setAmount] = useState<number | null>(null);
  const [custom, setCustom] = useState("");
  const [loading, setLoading] = useState(false);

  const remaining = item.price - item.collected;
  const presets = [
    Math.max(100, Math.round(remaining * 0.25 / 100) * 100),
    Math.max(100, Math.round(remaining * 0.5 / 100) * 100),
    Math.max(100, Math.round(remaining * 0.75 / 100) * 100),
  ].filter((v, i, a) => a.indexOf(v) === i && v <= remaining);

  const finalAmount = amount !== null ? amount : custom ? Math.round(parseFloat(custom)) : 0;
  const valid = finalAmount >= 100 && finalAmount <= remaining;
  const pct = Math.min(100, Math.round((item.collected / item.price) * 100));

  const handleSubmit = async () => {
    if (!valid) return;
    setLoading(true);
    await onContribute(finalAmount);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1A2E]/50 backdrop-blur-sm animate-fade-in"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl animate-slide-up">
        <h2 className="font-display text-2xl font-bold text-[#1A1A2E] mb-1">Скинуться на подарок</h2>
        <p className="text-[#6B6B80] text-sm mb-6 truncate">{item.name}</p>

        {/* Progress */}
        <div className="mb-6 p-4 bg-[#FAF7F2] rounded-xl">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-[#6B6B80]">Собрано</span>
            <strong className="text-[#1A1A2E]">{item.collected.toLocaleString("ru")} / {item.price.toLocaleString("ru")} ₽</strong>
          </div>
          <div className="h-2.5 bg-[#F0EBE1] rounded-full overflow-hidden">
            <div className="h-full rounded-full progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="text-xs text-[#6B6B80] mt-2">
            Осталось: <strong className="text-[#1A1A2E]">{remaining.toLocaleString("ru")} ₽</strong> · {item.contributorsCount} участников
          </div>
        </div>

        {/* Presets */}
        {presets.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            {presets.map(p => (
              <button key={p}
                className={`py-2.5 rounded-xl border-2 text-sm font-semibold cursor-pointer transition-all
                  ${amount === p ? "bg-[#2D3561] border-[#2D3561] text-white" : "bg-white border-[#2D3561]/15 text-[#2D3561] hover:border-[#2D3561]"}`}
                onClick={() => { setAmount(p); setCustom(""); }}>
                {p.toLocaleString("ru")} ₽
              </button>
            ))}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-xs font-semibold text-[#6B6B80] uppercase tracking-wide mb-1.5">Своя сумма (мин. 100 ₽)</label>
          <input className="input" type="number" placeholder="Введите сумму" value={custom}
            onChange={e => { setCustom(e.target.value); setAmount(null); }} />
        </div>

        <div className="mb-6 p-3 bg-[#FAF7F2] rounded-xl text-xs text-[#6B6B80]">
          🔒 Владелец вишлиста не увидит, кто и сколько внёс — только прогресс-бар.
        </div>

        <div className="flex gap-3 justify-end">
          <button className="btn btn-ghost" onClick={onClose}>Отмена</button>
          <button className="btn btn-gold" disabled={!valid || loading} onClick={handleSubmit}>
            {loading ? "⏳" : valid ? `Внести ${finalAmount.toLocaleString("ru")} ₽` : "Введите сумму"}
          </button>
        </div>
      </div>
    </div>
  );
}
