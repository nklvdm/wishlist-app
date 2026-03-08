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
  const [metaStatus, setMetaStatus] = useState<"idle" | "success" | "fail">("idle");

  const fetchMeta = async () => {
    if (!link) return;
    setFetching(true);
    setMetaStatus("idle");
    try {
      const res = await fetch(`/api/meta?url=${encodeURIComponent(link)}`);
      const data = await res.json();
      let got = false;
      if (data.title) { setName(data.title); got = true; }
      if (data.price) { setPrice(String(data.price)); got = true; }
      if (data.image) { setImageUrl(data.image); got = true; }
      setMetaStatus(got ? "success" : "fail");
    } catch {
      setMetaStatus("fail");
    }
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
          price: Math.round(parseFloat(price)), // roubles, backend converts to kopecks
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
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16, background: "rgba(26,26,46,0.5)", backdropFilter: "blur(4px)"
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card animate-slide-up" style={{ padding: 32, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto" }}>
        <h2 className="font-display" style={{ fontSize: 24, fontWeight: 700, color: "#1A1A2E", marginBottom: 4 }}>Добавить желание</h2>
        <p style={{ color: "#6B6B80", marginBottom: 24, fontSize: 14 }}>Вставьте ссылку — мы подтянем всё сами</p>

        {/* URL autofill */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6B6B80", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Ссылка на товар</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input className="input" style={{ flex: 1 }} placeholder="https://..." value={link}
              onChange={e => { setLink(e.target.value); setMetaStatus("idle"); }} />
            <button className="btn btn-outline btn-sm" style={{ flexShrink: 0, minWidth: 80 }}
              onClick={fetchMeta} disabled={fetching || !link}>
              {fetching ? "⏳" : "✨ Авто"}
            </button>
          </div>
          {metaStatus === "success" && (
            <div style={{ fontSize: 12, color: "#7A9E87", marginTop: 6 }}>✓ Данные подтянулись — проверьте и уточните при необходимости</div>
          )}
          {metaStatus === "fail" && (
            <div style={{ fontSize: 12, color: "#C4962A", marginTop: 6 }}>⚠️ Не удалось подтянуть автоматически — заполните вручную</div>
          )}
        </div>

        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6B6B80", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Название *</label>
            <input className="input" placeholder="Что хотите?" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div style={{ width: 64 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6B6B80", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Иконка</label>
            <input className="input" style={{ textAlign: "center", fontSize: 20 }} value={emoji} onChange={e => setEmoji(e.target.value)} />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6B6B80", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Цена (₽) *</label>
          <input className="input" type="number" placeholder="0" value={price} onChange={e => setPrice(e.target.value)} />
        </div>

        {imageUrl && (
          <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12, padding: 12, background: "var(--cream)", borderRadius: 12 }}>
            <img src={imageUrl} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover" }} />
            <div style={{ fontSize: 13, color: "#6B6B80", flex: 1 }}>Картинка подтянулась ✓</div>
            <button onClick={() => setImageUrl("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B6B80", fontSize: 16 }}>✕</button>
          </div>
        )}

        {/* Group buy toggle */}
        <div style={{
          marginBottom: 24, padding: 16, background: "var(--cream)", borderRadius: 12,
          border: "1.5px solid rgba(196,150,42,0.2)", display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer"
        }} onClick={() => setIsGroup(p => !p)}>
          <div style={{
            width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 2,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: isGroup ? "var(--gold)" : "white",
            border: isGroup ? "2px solid var(--gold)" : "2px solid rgba(45,53,97,0.2)",
            transition: "all 0.15s"
          }}>
            {isGroup && <span style={{ color: "white", fontSize: 12 }}>✓</span>}
          </div>
          <div>
            <div style={{ fontWeight: 500, fontSize: 14, color: "#1A1A2E" }}>💛 Сбор вскладчину</div>
            <div style={{ fontSize: 12, color: "#6B6B80", marginTop: 2 }}>Несколько друзей смогут скинуться на этот подарок</div>
          </div>
        </div>

        {error && <div style={{ marginBottom: 16, padding: "12px 16px", background: "#fee2e2", color: "#dc2626", borderRadius: 12, fontSize: 14 }}>{error}</div>}

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button className="btn btn-ghost" onClick={onClose}>Отмена</button>
          <button className="btn btn-gold" onClick={handleSubmit} disabled={!name.trim() || !price || loading}>
            {loading ? "⏳ Добавляем..." : "Добавить"}
          </button>
        </div>
      </div>
    </div>
  );
}
