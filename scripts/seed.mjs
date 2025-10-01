// scripts/seed.mjs
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

const sampleUserMessages = [
    "Hello, how can I help you?",
    "What is the weather today?",
    "Can you explain Prisma?",
    "Tell me a programming tip.",
    "Let's build something awesome!",
    "Testing message content.",
    "I like this chat model.",
];

const sampleAssistantResponses = [
    "Sure! Here's an example.",
    "The answer is 42.",
    "Let me explain that in detail.",
    "Here's how you can do it...",
    "Absolutely! That works like this...",
    "I can help you with that.",
    "Here’s a quick example for you.",
];

async function main() {
    console.log("Seeding database...");

    // const hashedPassword = await bcrypt.hash("123456", 10);

    for (let i = 1; i <= 10; i++) {
        const user = await prisma.user.create({
            data: {
                email: `demo_user${i}@example.com`,
                name: `Demo User ${i}`,
                password: "123456",
            },
        });

        const conversationCount = Math.floor(Math.random() * 3) + 1;
        for (let j = 0; j < conversationCount; j++) {
            const conversation = await prisma.conversation.create({
                data: {
                    userId: user.id,
                    model: "gpt-3.5-turbo",
                    title: `Demo Conversation ${j + 1}`,
                },
            });

            // Ensure first message is user, second is assistant
            const firstUserMessage = await prisma.message.create({
                data: {
                    conversationId: conversation.id,
                    role: "user",
                    content: randomChoice(sampleUserMessages),
                    tokens: Math.floor(Math.random() * 50) + 1,
                },
            });

            await prisma.message.create({
                data: {
                    conversationId: conversation.id,
                    role: "assistant",
                    content: randomChoice(sampleAssistantResponses),
                    tokens: Math.floor(Math.random() * 50) + 1,
                },
            });

            // Add random extra messages
            const extraMessageCount = Math.floor(Math.random() * 3); // 0-2 extra messages
            for (let k = 0; k < extraMessageCount; k++) {
                const role = randomChoice(["user", "assistant"]);
                const content =
                    role === "user"
                        ? randomChoice(sampleUserMessages)
                        : randomChoice(sampleAssistantResponses);

                await prisma.message.create({
                    data: {
                        conversationId: conversation.id,
                        role,
                        content,
                        tokens: Math.floor(Math.random() * 50) + 1,
                    },
                });
            }
        }
    }

    console.log("Seeding completed.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
