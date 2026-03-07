import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  emoji: z.string().default("🎁"),
});

// GET /api/wishlists — list user's wishlists
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const wishlists = await prisma.wishlist.findMany({
    where: { userId: (session.user as any).id },
    include: {
      items: {
        where: { deletedAt: null },
        select: {
          id: true,
          reserved: true,
          isGroupBuy: true,
          price: true,
          contributions: { select: { amount: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = wishlists.map((w) => ({
    id: w.id,
    name: w.name,
    description: w.description,
    emoji: w.emoji,
    slug: w.slug,
    createdAt: w.createdAt,
    itemCount: w.items.length,
    reservedCount: w.items.filter(
      (i) =>
        i.reserved ||
        (i.isGroupBuy &&
          i.contributions.reduce((s, c) => s + c.amount, 0) >= i.price)
    ).length,
  }));

  return NextResponse.json(result);
}

// POST /api/wishlists — create wishlist
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    const wishlist = await prisma.wishlist.create({
      data: { ...data, userId: (session.user as any).id },
    });

    return NextResponse.json(wishlist, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors }, { status: 400 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
