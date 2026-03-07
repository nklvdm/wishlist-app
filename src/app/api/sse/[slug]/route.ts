import { NextRequest } from "next/server";
import { sse } from "@/lib/sse";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const { slug } = params;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial heartbeat
      controller.enqueue(`data: ${JSON.stringify({ type: "CONNECTED" })}\n\n`);

      const unsub = sse.subscribe(slug, (data) => {
        try {
          controller.enqueue(`data: ${data}\n\n`);
        } catch {
          // Client disconnected
        }
      });

      // Heartbeat every 25s to keep connection alive through proxies
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(`: heartbeat\n\n`);
        } catch {
          clearInterval(heartbeat);
          unsub();
        }
      }, 25_000);

      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        unsub();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // disable nginx buffering
    },
  });
}
