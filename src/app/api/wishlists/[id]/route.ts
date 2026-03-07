import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/wishlists/[id] — works without auth (public share)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  // Accept both DB id and slug
  const wishlist = await prisma.wishlist.findFirst({
    where: { OR: [{ id: params.id }, { slug: params.id }] },
    include: {
      user: { select: { name: true } },
      items: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
        include: {
          contributions: { select: { amount: true } }, // no token exposed
        },
      },
    },
  });

  if (!wishlist) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = userId === wishlist.userId;

  const items = wishlist.items.map((item) => {
    const collected = item.contributions.reduce((s, c) => s + c.amount, 0);
    return {
      id: item.id,
      name: item.name,
      price: item.price,
      link: item.link,
      emoji: item.emoji,
      imageUrl: item.imageUrl,
      isGroupBuy: item.isGroupBuy,
      collected,
      contributorsCount: item.contributions.length,
      // Owner sees status but NOT who reserved/contributed
      reserved: item.reserved,
      // Non-owner: reserved = anonymous boolean only
    };
  });

  return NextResponse.json({
    id: wishlist.id,
    slug: wishlist.slug,
    name: wishlist.name,
    description: wishlist.description,
    emoji: wishlist.emoji,
    ownerName: wishlist.user.name,
    isOwner,
    items,
  });
}

// DELETE /api/wishlists/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const wishlist = await prisma.wishlist.findUnique({ where: { id: params.id } });
  if (!wishlist) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (wishlist.userId !== (session.user as any).id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.wishlist.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
