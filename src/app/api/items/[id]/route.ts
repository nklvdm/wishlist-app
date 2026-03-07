import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sse } from "@/lib/sse";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const item = await prisma.item.findUnique({
    where: { id: params.id },
    include: {
      wishlist: true,
      contributions: { select: { amount: true } },
    },
  });

  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (item.wishlist.userId !== (session.user as any).id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Soft delete — contributions are preserved in DB for audit/refund
  await prisma.item.update({
    where: { id: params.id },
    data: { deletedAt: new Date() },
  });

  const totalContributed = item.contributions.reduce((s, c) => s + c.amount, 0);

  // Broadcast to live viewers
  sse.publish(item.wishlist.slug, {
    type: "ITEM_DELETED",
    payload: {
      itemId: params.id,
      hadContributions: totalContributed > 0,
    },
  });

  return NextResponse.json({
    ok: true,
    hadContributions: totalContributed > 0,
    totalContributed: totalContributed / 100,
  });
}
