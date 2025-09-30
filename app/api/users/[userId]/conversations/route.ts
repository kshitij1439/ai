import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

interface Params {
  params: { userId: string };
}

export async function GET(req: Request, { params }: Params) {
  const { userId } = params;

  try {
    const conversations = await prisma.conversation.findMany({
      where: { userId },
      include: { messages: true },
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error(`Error fetching conversations for user ${userId}:`, error);
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }
}
