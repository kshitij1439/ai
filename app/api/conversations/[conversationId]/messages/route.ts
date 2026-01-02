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

    if (!session?.user?.id) {
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

        // Create user message first
        const message = await prisma.message.create({
            data: { conversationId, role, content, tokens },
        });

        // Count ONLY user messages (after insert)
        const userMessageCount = await prisma.message.count({
            where: { conversationId, role: "user" },
        });

        const isFirstUserMessage = userMessageCount === 1;

        let assistantMessage = null;

        if (role === "user") {
            const conversation = await prisma.conversation.findUnique({
                where: { id: conversationId },
                include: { messages: { orderBy: { createdAt: "asc" } } },
            });

            if (!conversation) {
                return NextResponse.json(
                    { error: "Conversation not found" },
                    { status: 404 }
                );
            }

            const memoryContext = await memoryService.getConversationContext(
                session.user.id,
                content,
                conversationId
            );

            const conversationHistory = [
                ...conversation.messages.map((msg) => ({
                    role: msg.role as "user" | "assistant" | "system",
                    content: msg.content,
                })),
                { role: "user" as const, content },
            ];

            if (memoryContext) {
                conversationHistory.unshift({
                    role: "system",
                    content: `You are a helpful AI assistant with memory.\n\n${memoryContext}`,
                });
            }

            const assistantResponse = await aiService.chat(
                conversationHistory,
                model,
                { maxTokens: 8000 }
            );

            if (assistantResponse) {
                // ✅ create assistant message ONCE
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

                // ✅ generate title ONLY on first user message
                if (isFirstUserMessage) {
                    const titlePrompt = `
Generate a short, clear conversation title (max 6 words)
based on this user message:

"${content}"
                    `;

                    const generatedTitle = await aiService.chat(
                        [{ role: "user", content: titlePrompt }],
                        model,
                        { maxTokens: 30 }
                    );

                    await prisma.conversation.update({
                        where: { id: conversationId },
                        data: {
                            title: generatedTitle.replace(/^"|"$/g, "").trim(),
                        },
                    });
                }
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
