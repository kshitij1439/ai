import type { Message, Conversation } from "@prisma/client";

export function createMockMessage(overrides?: Partial<Message>): Message {
    return {
        id: "1",
        conversationId: "123",
        role: "user",
        content: "Test message",
        tokens: null,
        createdAt: new Date(),
        metadata: null,
        ...overrides,
    };
}

export function createMockConversation(
    overrides?: Partial<Conversation>
): Conversation {
    return {
        id: "123",
        userId: "user123",
        title: "Test Conversation",
        createdAt: new Date(),
        model: "gpt-4",
        ...overrides,
    };
}
