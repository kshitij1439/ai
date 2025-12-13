import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { aiService } from "@/lib/ai";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { memoryService } from "@/lib/ai/memory";

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
            const memoryContext = await memoryService.getConversationContext(
                session.user.id,
                content,
                conversationId
            );

            const conversationHistory = [
                ...conversation.messages.map(
                    (msg: { role: string; content: string }) => ({
                        role: msg.role as "user" | "assistant" | "system",
                        content: msg.content,
                    })
                ),
                { role: "user" as const, content },
            ];
            if (memoryContext) {
                conversationHistory.unshift({
                    role: "system",
                    content: `You are a helpful AI assistant with memory. Here's what you know about the user and relevant past conversations:\n\n${memoryContext}\n\nUse this context naturally in your responses when relevant, but don't explicitly mention that you're using memory.`,
                });
            }

            const assistantResponse = await aiService.chat(
                conversationHistory,
                model,
                {
                    // temperature: 0.7,
                    maxTokens: 8000,
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

                await memoryService.storeConversationMessage(
                    conversationId,
                    session.user.id,
                    content,
                    assistantResponse,
                    assistantMessage.id
                );

                await memoryService.addMemory(
                    session.user.id,
                    [
                        { role: "user", content },
                        { role: "assistant", content: assistantResponse },
                    ],
                    {
                        conversationId,
                        timestamp: new Date().toISOString(),
                    }
                );
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
