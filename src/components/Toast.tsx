"use client";

interface ToastItem { id: number; text: string; type?: string; }

export function Toast({ toasts }: { toasts: ToastItem[] }) {
  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-[1000] pointer-events-none">
      {toasts.map(t => (
        <div key={t.id}
          className={`px-4 py-3 rounded-xl text-sm font-medium shadow-xl animate-toast-in max-w-xs
            ${t.type === "success" ? "bg-[#7A9E87] text-white" :
              t.type === "gold" ? "bg-[#C4962A] text-white" :
              t.type === "warning" ? "bg-amber-500 text-white" :
              "bg-[#1A1A2E] text-white"}`}>
          {t.text}
        </div>
      ))}
    </div>
  );
}
