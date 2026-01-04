import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { aiService } from "@/lib/ai";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { memoryService } from "@/lib/ai/memory";
import { AIModel } from "@/lib/ai/types";

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
        const { 
            role, 
            content, 
            tokens, 
            model = "gemini-2.5-flash-lite" 
        } = body;

        if (!role || !content) {
            return NextResponse.json(
                { error: "role and content are required" },
                { status: 400 }
            );
        }

        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: {
                messages: {
                    orderBy: { createdAt: "asc" },
                    where: { role: "user" },
                },
            },
        });

        if (!conversation) {
            return NextResponse.json(
                { error: "Conversation not found" },
                { status: 404 }
            );
        }

        const isFirstUserMessage = conversation.messages.length === 0;

        const userMessage = await prisma.message.create({
            data: { conversationId, role, content, tokens },
        });

        let assistantMessage = null;

        if (role === "user") {
            const fullMessages = await prisma.message.findMany({
                where: { conversationId },
                orderBy: { createdAt: "asc" },
            });

            const memoryContext = await memoryService.getConversationContext(
                session.user.id,
                content,
                conversationId
            );

            const conversationHistory = [
                ...(memoryContext
                    ? [
                          {
                              role: "system" as const,
                              content: `You are a helpful AI assistant with memory.\n\n${memoryContext}`,
                          },
                      ]
                    : []),
                ...fullMessages.map((msg) => ({
                    role: msg.role as "user" | "assistant" | "system",
                    content: msg.content,
                })),
                { role: "user" as const, content },
            ];

            const assistantResponse = await aiService.chat(
                conversationHistory,
                model as AIModel,
                { maxTokens: 8000 }
            );

            if (assistantResponse) {
                if (isFirstUserMessage) {
                    const titlePrompt = `Generate a short, clear conversation title (max 6 words) based on this user message: "${content}"`;

                    const generatedTitle = await aiService.chat(
                        [{ role: "user", content: titlePrompt }],
                        model as AIModel,
                        { maxTokens: 30 }
                    );

                    const [newAssistantMsg] = await prisma.$transaction([
                        prisma.message.create({
                            data: {
                                conversationId,
                                role: "assistant",
                                content: assistantResponse,
                            },
                        }),
                        prisma.conversation.update({
                            where: { id: conversationId },
                            data: {
                                title: generatedTitle
                                    .replace(/^"|"$/g, "")
                                    .trim(),
                            },
                        }),
                    ]);

                    assistantMessage = newAssistantMsg;
                } else {
                    assistantMessage = await prisma.message.create({
                        data: {
                            conversationId,
                            role: "assistant",
                            content: assistantResponse,
                        },
                    });
                }

                Promise.all([
                    memoryService.storeConversationMessage(
                        conversationId,
                        session.user.id,
                        content,
                        assistantResponse,
                        assistantMessage.id
                    ),
                    memoryService.addMemory(
                        session.user.id,
                        [
                            { role: "user", content },
                            { role: "assistant", content: assistantResponse },
                        ],
                        {
                            conversationId,
                            timestamp: new Date().toISOString(),
                        }
                    ),
                ]).catch((error) => {
                    console.error(
                        "Memory service error (non-blocking):",
                        error
                    );
                });
            }
        }

        return NextResponse.json({
            user: userMessage,
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