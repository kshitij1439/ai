import { prisma } from "@/lib/db";
import { chatWithLLM } from "@/lib/llm";
import { NextResponse } from "next/server";

interface Params {
    params: { conversationId: string };
}

export async function GET(req: Request, { params }: Params) {
    const { conversationId } = params;

    try {
        // Check if conversation exists
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
            orderBy: { createdAt: "asc" }, // chronological order
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

export async function POST(req: Request, { params }: Params) {
    const { conversationId } = params;

    try {
        const body = await req.json();
        const { role, content, tokens } = body;

        if (!role || !content) {
            return NextResponse.json(
                { error: "role and content are required" },
                { status: 400 }
            );
        }

        // Check if conversation exists
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
        });

        if (!conversation) {
            return NextResponse.json(
                { error: "Conversation not found" },
                { status: 404 }
            );
        }

        // Save user message
        const message = await prisma.message.create({
            data: { conversationId, role, content, tokens },
        });

        let assistantMessage = null;

        if (role === "user") {
            const assistantResponse = await chatWithLLM(content, "llama3");

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
