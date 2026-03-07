import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  wishlistId: z.string(),
  name: z.string().min(1).max(300),
  price: z.number().int().min(1), // roubles, stored as kopecks * 100
  link: z.string().url().optional().or(z.literal("")),
  emoji: z.string().default("🎁"),
  imageUrl: z.string().url().optional().or(z.literal("")),
  isGroupBuy: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = schema.parse(body);

    // Verify ownership
    const wishlist = await prisma.wishlist.findUnique({ where: { id: data.wishlistId } });
    if (!wishlist) return NextResponse.json({ error: "Wishlist not found" }, { status: 404 });
    if (wishlist.userId !== (session.user as any).id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const item = await prisma.item.create({
      data: {
        name: data.name,
        price: data.price * 100, // store as kopecks
        link: data.link || null,
        emoji: data.emoji,
        imageUrl: data.imageUrl || null,
        isGroupBuy: data.isGroupBuy,
        wishlistId: data.wishlistId,
      },
    });

    return NextResponse.json({ ...item, price: item.price / 100 }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors }, { status: 400 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
