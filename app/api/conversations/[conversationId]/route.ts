import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Update conversation title
export async function PATCH(
    req: Request,
    context: { params: Promise<{ conversationId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // CRITICAL: Await params in Next.js 15+
        const resolvedParams = await context.params;
        const conversationId = resolvedParams.conversationId;

        console.log("🔍 Received conversationId:", conversationId);
        console.log("👤 User ID:", session.user.id);

        if (!conversationId) {
            return NextResponse.json(
                { error: "Conversation ID is missing" },
                { status: 400 }
            );
        }

        const { title } = await req.json();

        if (!title?.trim()) {
            return NextResponse.json(
                { error: "Title is required" },
                { status: 400 }
            );
        }

        // Verify ownership
        const existing = await prisma.conversation.findUnique({
            where: { id: conversationId },
        });

        console.log("📝 Found conversation:", existing);

        if (!existing) {
            return NextResponse.json(
                { error: "Conversation not found" },
                { status: 404 }
            );
        }

        if (existing.userId !== session.user.id) {
            return NextResponse.json(
                { error: "Forbidden: You don't own this conversation" },
                { status: 403 }
            );
        }

        // Update conversation
        const updated = await prisma.conversation.update({
            where: { id: conversationId },
            data: { title: title.trim() },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("❌ Error updating conversation:", error);
        return NextResponse.json(
            { error: "Failed to update conversation" },
            { status: 500 }
        );
    }
}

// Delete conversation
export async function DELETE(context: {
    params: Promise<{ conversationId: string }>;
}) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { conversationId } = await context.params;

        // Verify ownership before deleting
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
        });

        if (!conversation) {
            return NextResponse.json(
                { error: "Conversation not found" },
                { status: 404 }
            );
        }

        if (conversation.userId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Delete the conversation (messages cascade delete if configured)
        await prisma.conversation.delete({
            where: { id: conversationId },
        });

        return NextResponse.json({
            message: "Conversation deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting conversation:", error);
        return NextResponse.json(
            { error: "Failed to delete conversation" },
            { status: 500 }
        );
    }
}

// Get single conversation with messages
export async function GET(
    _req: Request,
    { params }: { params: Promise<{ conversationId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }
        const { conversationId } = await params;

        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: {
                messages: {
                    orderBy: { createdAt: "asc" },
                },
            },
        });

        if (!conversation) {
            return NextResponse.json(
                { error: "Conversation not found" },
                { status: 404 }
            );
        }

        if (conversation.userId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        return NextResponse.json(conversation);
    } catch (error) {
        console.error("Error fetching conversation:", error);
        return NextResponse.json(
            { error: "Failed to fetch conversation" },
            { status: 500 }
        );
    }
}
