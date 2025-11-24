import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { aiService } from "@/lib/ai";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

interface RouteContext {
    params: Promise<{ conversationId: string }>;
}

export async function GET(req: Request, { params }: RouteContext) {
    const { conversationId } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
        });

        if (!conversation) {
            return NextResponse.json(
                { error: "Conversation not found" },
                { status: 404 }
            );
        }

        const messages = await prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: "asc" },
        });

        return NextResponse.json(messages);
    } catch (error) {
        console.error("Error fetching messages:", error);
        return NextResponse.json(
            { error: "Failed to fetch messages" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request, { params }: RouteContext) {
    const { conversationId } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
        const body = await req.json();
        const { role, content, tokens, model = "gemini-2.5-flash-lite" } = body;

        if (!role || !content) {
            return NextResponse.json(
                { error: "role and content are required" },
                { status: 400 }
            );
        }

        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: {
                messages: { orderBy: { createdAt: "desc" } },
            },
        });

        if (!conversation) {
            return NextResponse.json(
                { error: "Conversation not found" },
                { status: 404 }
            );
        }

        const message = await prisma.message.create({
            data: { conversationId, role, content, tokens },
        });

        let assistantMessage = null;

        if (role === "user") {
            const conversationHistory = [
                ...conversation.messages.map((msg) => ({
                    role: msg.role as "user" | "assistant" | "system",
                    content: msg.content,
                })),
                { role: "user" as const, content },
            ];

            const assistantResponse = await aiService.chat(
                conversationHistory,
                model,
                {
                    temperature: 0.7,
                    maxTokens: 2048,
                }
            );

            if (assistantResponse) {
                assistantMessage = await prisma.message.create({
                    data: {
                        conversationId,
                        role: "assistant",
                        content: assistantResponse,
                    },
                });
            }
        }

        return NextResponse.json({
            user: message,
            assistant: assistantMessage,
        });
    } catch (error) {
        console.error("Error creating message:", error);
        return NextResponse.json(
            { error: "Failed to create message" },
            { status: 500 }
        );
    }
}
