import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

interface Params {
    params: Promise<{ userId: string }>; // Change to Promise
}

export async function GET(_req: Request,{ params }: Params) {
    const { userId } = await params; // Add await

    try {
        const conversations = await prisma.conversation.findMany({
            where: { userId },
            include: { messages: true },
        });

        return NextResponse.json(conversations);
    } catch (error) {
        console.error(
            `Error fetching conversations for user ${userId}:`,
            error
        );
        return NextResponse.json(
            { error: "Failed to fetch conversations" },
            { status: 500 }
        );
    }
}
