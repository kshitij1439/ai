import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Message, Conversation } from "@prisma/client";

vi.mock("@/lib/ai/memory", () => ({
    memoryService: {
        getConversationContext: vi.fn(),
        storeConversationMessage: vi.fn(),
        addMemory: vi.fn(),
    },
}));

vi.mock("@/lib/db", () => ({
    prisma: {
        conversation: {
            findUnique: vi.fn(),
        },
        message: {
            findMany: vi.fn(),
            create: vi.fn(),
        },
        $transaction: vi.fn(),
    },
}));

vi.mock("next-auth", () => ({
    getServerSession: vi.fn(),
}));

vi.mock("@/lib/ai", () => ({
    aiService: {
        chat: vi.fn(),
    },
}));

vi.mock("@/lib/ai/webSearch", () => ({
    shouldUseWebSearch: vi.fn().mockResolvedValue(false),
    performWebSearch: vi.fn(),
}));

import { GET } from "@/app/api/conversations/[conversationId]/messages/route";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";

describe("GET /api/conversations/[conversationId]/messages", () => {
    const mockRequest = new Request("http://localhost:3000");
    const mockParams = { params: Promise.resolve({ conversationId: "123" }) };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should return 401 if not authenticated", async () => {
        vi.mocked(getServerSession).mockResolvedValue(null);

        const response = await GET(mockRequest, mockParams);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe("Unauthorized");
    });

    it("should return 404 if conversation not found", async () => {
        vi.mocked(getServerSession).mockResolvedValue({
            user: { id: "user123", email: "test@test.com" },
            expires: "2024-12-31",
        });
        vi.mocked(prisma.conversation.findUnique).mockResolvedValue(null);

        const response = await GET(mockRequest, mockParams);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe("Conversation not found");
    });

    it("should return messages for valid conversation", async () => {
        const mockMessages: Message[] = [
            {
                id: "1",
                conversationId: "123",
                role: "user",
                content: "Hello",
                tokens: null,
                createdAt: new Date("2024-01-01"),
                metadata: null,
            },
            {
                id: "2",
                conversationId: "123",
                role: "assistant",
                content: "Hi!",
                tokens: null,
                createdAt: new Date("2024-01-01"),
                metadata: null,
            },
        ];

        const mockConversation: Conversation = {
            id: "123",
            userId: "user123",
            title: "Test",
            createdAt: new Date("2024-01-01"),
            model: "gpt-4",
        };

        vi.mocked(getServerSession).mockResolvedValue({
            user: { id: "user123", email: "test@test.com" },
            expires: "2024-12-31",
        });
        vi.mocked(prisma.conversation.findUnique).mockResolvedValue(
            mockConversation
        );
        vi.mocked(prisma.message.findMany).mockResolvedValue(mockMessages);

        const response = await GET(mockRequest, mockParams);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveLength(2);
        expect(data[0]).toMatchObject({
            id: "1",
            conversationId: "123",
            role: "user",
            content: "Hello",
        });
        expect(data[1]).toMatchObject({
            id: "2",
            conversationId: "123",
            role: "assistant",
            content: "Hi!",
        });
    });
});
