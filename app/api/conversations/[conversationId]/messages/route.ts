import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { aiService } from "@/lib/ai";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { memoryService } from "@/lib/ai/memory";
import { AIModel } from "@/lib/ai/modelTypes";

interface RouteContext {
    params: Promise<{ conversationId: string }>;
}

async function shouldUseMemoryContext(
    userMessage: string,
    model: AIModel
): Promise<boolean> {
    try {
        const classificationPrompt = `Analyze this user message and determine if it would benefit from accessing past conversation history or user preferences.

User message: "${userMessage}"

Consider:
- Does it reference past conversations? ("remember", "last time", "you said")
- Does it ask about user preferences or history?
- Is it a substantive question that might benefit from personalization?
- Is it just a simple greeting or acknowledgment?

Respond with ONLY "YES" or "NO".`;

        const response = await aiService.chat(
            [{ role: "user", content: classificationPrompt }],
            model,
            { maxTokens: 10 }
        );

        const decision = response.trim().toUpperCase();
        // console.log(` AI Memory Decision for "${userMessage}": ${decision}`);

        return decision === "YES";
    } catch (error) {
        console.error("Error in AI memory classification:", error);
        // Fallback: use memory for longer messages
        return userMessage.length > 20;
    }
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


            const useMemory = await shouldUseMemoryContext(
                content,
                model as AIModel
            );
            let memoryContext = null;

            if (useMemory) {
                try {
                    memoryContext = await memoryService.getConversationContext(
                        session.user.id,
                        content,
                        conversationId
                    );
                    // console.log(
                    //     " Memory context loaded based on AI decision"
                    // );
                } catch (error) {
                    console.error(
                        "Memory context error (non-blocking):",
                        error
                    );
                }
            } 
            // else {
            //     console.log(" Skipping memory context based on AI decision");
            // }

            const conversationHistory = [
                ...(memoryContext
                    ? [
                          {
                              role: "system" as const,
                              content: `You are a helpful AI assistant with memory capabilities.

CONTEXT FROM PAST CONVERSATIONS:
The following represents relevant information from the user's past interactions. Use this to provide personalized responses when appropriate, but focus primarily on addressing their current message.

${memoryContext}

---
Now respond to the user's current message.`,
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

            // console.log("-----------------");
            // console.log("Conversation Stats:");
            // console.log("  Messages in history:", conversationHistory.length);
            // console.log("  Memory context used:", !!memoryContext);
            // console.log("  Model:", model);
            // console.log("-----------------");

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
