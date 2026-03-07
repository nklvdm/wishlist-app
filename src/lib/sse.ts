// Simple in-process SSE broadcaster
// For multi-instance production use Redis pub/sub instead

type Listener = (data: string) => void;

const listeners = new Map<string, Set<Listener>>();

export const sse = {
  subscribe(channel: string, fn: Listener) {
    if (!listeners.has(channel)) listeners.set(channel, new Set());
    listeners.get(channel)!.add(fn);
    return () => listeners.get(channel)?.delete(fn);
  },

  publish(channel: string, event: { type: string; payload: unknown }) {
    const data = JSON.stringify(event);
    listeners.get(channel)?.forEach((fn) => fn(data));
  },
};
