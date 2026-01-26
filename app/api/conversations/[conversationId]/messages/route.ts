import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { aiService } from "@/lib/ai";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { memoryService } from "@/lib/ai/memory";
import { AIModel } from "@/lib/ai/modelTypes";
import { performWebSearch, shouldUseWebSearch } from "@/lib/ai/webSearch";

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
        return decision === "YES";
    } catch (error) {
        console.error("Error in AI memory classification:", error);
        return userMessage.length > 20;
    }
}

export async function GET({ params }: RouteContext) {
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
            model = "gemini-2.5-flash-lite",
            webSearchEnabled = false,
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
        let searchSources = null;

        if (role === "user") {
            const fullMessages = await prisma.message.findMany({
                where: { conversationId },
                orderBy: { createdAt: "asc" },
            });

            // Determine if web search is needed
            const needsWebSearch =
                webSearchEnabled ||
                (await shouldUseWebSearch(content, model as AIModel));

            let webSearchResults = "";
            if (needsWebSearch && process.env.TAVILY_API_KEY) {
                try {
                    const searchResult = await performWebSearch(content);
                    webSearchResults = `\n\nWEB SEARCH RESULTS:\n${searchResult.formattedResults}`;
                    searchSources = searchResult.sources; // Store sources

                    console.log(
                        "✅ Web search completed with",
                        searchSources.length,
                        "sources"
                    );
                } catch (error) {
                    console.error("Web search error (non-blocking):", error);
                }
            }

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
                } catch (error) {
                    console.error(
                        "Memory context error (non-blocking):",
                        error
                    );
                }
            }

            const conversationHistory = [
                ...(memoryContext || webSearchResults
                    ? [
                          {
                              role: "system" as const,
                              content: `You are a helpful AI assistant with ${
                                  memoryContext ? "memory capabilities" : ""
                              } ${
                                  webSearchResults
                                      ? "and access to current web information"
                                      : ""
                              }.

${
    memoryContext
        ? `CONTEXT FROM PAST CONVERSATIONS:
The following represents relevant information from the user's past interactions. Use this to provide personalized responses when appropriate, but focus primarily on addressing their current message.

${memoryContext}`
        : ""
}

${
    webSearchResults
        ? `${webSearchResults}

IMPORTANT FORMATTING INSTRUCTIONS FOR WEB SEARCH RESPONSES:
When using information from these sources, format your response like this:
1. For each major point or claim, reference the source inline
2. Format: "Statement about topic <source_number>" 
3. Example format:
   "1. Gemini 3: Considered the strongest model by some, accessible through AI Studio. <1>
   2. Grok 4: Ranked #1 by Artificial Analysis with an 'Intelligence Index' of 73. <2>
   3. ChatGPT-5.1: A polished generalist model, ranking #2 in some evaluations. <3>"

Where <1>, <2>, <3> correspond to the source numbers from the search results above.
Use this citation style throughout your response to give proper attribution.`
        : ""
}

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
            sources: searchSources, // Include sources in response
        });
    } catch (error) {
        console.error("Error creating message:", error);
        return NextResponse.json(
            { error: "Failed to create message" },
            { status: 500 }
        );
    }
}