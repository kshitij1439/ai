// scripts/seed.mjs
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

const roles = ["user", "assistant", "system"];
const sampleMessages = [
  "Hello, how can I help you?",
  "What is the weather today?",
  "Can you explain Prisma?",
  "Sure! Here's an example.",
  "Let's build something awesome!",
  "Testing message content.",
  "I like this chat model.",
];

async function main() {
  console.log("Seeding database...");

  for (let i = 1; i <= 20; i++) {
    const user = await prisma.user.create({
      data: {
        email: `demo_user${i}@example.com`,
        name: `Demo User ${i}`,
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

      const messageCount = Math.floor(Math.random() * 4) + 2;
      for (let k = 0; k < messageCount; k++) {
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            role: randomChoice(roles),
            content: randomChoice(sampleMessages),
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
