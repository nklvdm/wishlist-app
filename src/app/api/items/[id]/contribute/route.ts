import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sse } from "@/lib/sse";
import { z } from "zod";

const schema = z.object({
  amount: z.number().int().min(100), // minimum 100 roubles
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { amount } = schema.parse(body);

    const item = await prisma.item.findUnique({
      where: { id: params.id, deletedAt: null },
      include: {
        wishlist: { select: { userId: true, slug: true } },
        contributions: { select: { amount: true } },
      },
    });

    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!item.isGroupBuy) return NextResponse.json({ error: "Not a group buy item" }, { status: 400 });

    const currentTotal = item.contributions.reduce((s, c) => s + c.amount, 0);
    const remaining = item.price - currentTotal;

    if (remaining <= 0) {
      return NextResponse.json({ error: "Already fully funded" }, { status: 409 });
    }

    // Cap contribution at remaining amount
    const actualAmount = Math.min(amount * 100, remaining); // store as kopecks

    const contribution = await prisma.contribution.create({
      data: {
        itemId: params.id,
        amount: actualAmount,
      },
    });

    const newTotal = currentTotal + actualAmount;
    const isFunded = newTotal >= item.price;

    // Notify viewers — no amount details sent to owner channel
    sse.publish(item.wishlist.slug, {
      type: "CONTRIBUTION_ADDED",
      payload: {
        itemId: params.id,
        newTotal: newTotal / 100,
        isFunded,
        contributorsCount: item.contributions.length + 1,
        percent: Math.round((newTotal / item.price) * 100),
      },
    });

    return NextResponse.json({
      ok: true,
      contributionId: contribution.token, // return token so contributor can identify their contribution later
      newTotal: newTotal / 100,
      isFunded,
    });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors }, { status: 400 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
