import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sse } from "@/lib/sse";

// No auth required — friends don't need to register
// We use a session cookie to prevent double-reservation
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const item = await prisma.item.findUnique({
    where: { id: params.id, deletedAt: null },
    include: { wishlist: { select: { userId: true, slug: true } } },
  });

  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (item.isGroupBuy) return NextResponse.json({ error: "Use contribute endpoint for group buys" }, { status: 400 });
  if (item.reserved) return NextResponse.json({ error: "Already reserved" }, { status: 409 });

  // Use a fingerprint from headers as anonymous token (not stored as name)
  const reserverToken = req.headers.get("x-reserver-token") || "anonymous";

  await prisma.item.update({
    where: { id: params.id },
    data: { reserved: true, reservedBy: reserverToken },
  });

  // Notify all viewers — owner only sees "someone reserved", not who
  sse.publish(item.wishlist.slug, {
    type: "ITEM_RESERVED",
    payload: { itemId: params.id },
  });

  return NextResponse.json({ ok: true });
}

// Unreserve (only by same reserver token)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const reserverToken = req.headers.get("x-reserver-token");
  if (!reserverToken) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const item = await prisma.item.findUnique({
    where: { id: params.id },
    include: { wishlist: { select: { slug: true } } },
  });

  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (item.reservedBy !== reserverToken) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.item.update({
    where: { id: params.id },
    data: { reserved: false, reservedBy: null },
  });

  sse.publish(item.wishlist.slug, {
    type: "ITEM_UNRESERVED",
    payload: { itemId: params.id },
  });

  return NextResponse.json({ ok: true });
}
