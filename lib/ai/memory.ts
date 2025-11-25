// lib/memory.ts
import { QdrantClient } from "@qdrant/js-client-rest";
import { MemoryClient, Memory as Mem0Memory, Message as Mem0Message   } from "mem0ai"; 

type Memory = Mem0Memory;
class MemoryService {
    private qdrant: QdrantClient;
    private mem0ApiKey: string;
    private mem0BaseUrl: string;
    private collectionName: string;
    private googleApiKey: string;
    private mem0Client: MemoryClient;
    constructor() {
        this.qdrant = new QdrantClient({
            url: process.env.QDRANT_URL || "http://localhost:6333",
            apiKey: process.env.QDRANT_API_KEY || ""
        });
        this.mem0ApiKey = process.env.MEM0_API_KEY || "";
        this.mem0BaseUrl = "https://api.mem0.ai/v1";
        this.collectionName = "conversations";
        this.googleApiKey = process.env.GOOGLE_AI_KEY || "";
        this.mem0Client = new MemoryClient({
            apiKey: process.env.MEM0_API_KEY || "",
          });
        this.initializeCollection();
    }

    private async initializeCollection() {
        try {
            const collections = await this.qdrant.getCollections();
            const exists = collections.collections.some(
                (c) => c.name === this.collectionName
            );

            if (!exists) {
                await this.qdrant.createCollection(this.collectionName, {
                    vectors: {
                        size: 768, // Google AI embedding dimension
                        distance: "Cosine",
                    },
                });
                console.log(
                    `Created Qdrant collection: ${this.collectionName}`
                );
            }
        } catch (error) {
            console.error("Error initializing Qdrant collection:", error);
        }
    }

    private async generateEmbedding(text: string): Promise<number[]> {
        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${this.googleApiKey}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        content: { parts: [{ text }] },
                    }),
                }
            );

            if (!response.ok) {
                throw new Error(`Embedding API error: ${response.statusText}`);
            }

            const data = await response.json();
            return data.embedding.values;
        } catch (error) {
            console.error("Error generating embedding:", error);
            throw error;
        }
    }

    // Mem0 Methods - Updated based on official docs
    async getUserMemories(userId: string): Promise<Memory[]> {
        try {
          const memories = await this.mem0Client.getAll({
            user_id: userId,
          });
          return memories || [];
        } catch (error) {
          console.error("Error fetching user memories:", error);
          return [];
        }
      }

      async addMemory(
        userId: string,
        messages: Mem0Message[],
        metadata?: Record<string, unknown>
      ): Promise<void> {
        try {
          await this.mem0Client.add(messages, {
            user_id: userId,
            metadata,
          });
        } catch (error) {
          console.error("Error adding memory:", error);
        }
      }

      async searchMemories(
        query: string,
        userId: string,
        limit: number = 5
      ): Promise<Memory[]> {
        try {
          const results = await this.mem0Client.search(query, {
            user_id: userId,
            limit,
          });
          return results || [];
        } catch (error) {
          console.error("Error searching memories:", error);
          return [];
        }
      }

    // Qdrant Methods
    async storeConversationMessage(
        conversationId: string,
        userId: string,
        userMessage: string,
        assistantMessage: string,
        messageId: string
    ): Promise<void> {
        try {
            // Store USER message separately (for finding what user said)
            const userEmbedding = await this.generateEmbedding(userMessage);
            const userNumericId = (messageId + "-user")
                .split("")
                .reduce((acc, char) => acc + char.charCodeAt(0), 0);

            await this.qdrant.upsert(this.collectionName, {
                wait: true,
                points: [
                    {
                        id: userNumericId,
                        vector: userEmbedding,
                        payload: {
                            conversationId,
                            userId,
                            messageType: "user", // ADD THIS
                            content: userMessage, // Just the user message
                            relatedAssistantMessage: assistantMessage,
                            messageId,
                            timestamp: new Date().toISOString(),
                        },
                    },
                ],
            });

            // Store ASSISTANT message separately (for finding what AI said)
            const assistantEmbedding = await this.generateEmbedding(
                assistantMessage
            );
            const assistantNumericId = (messageId + "-assistant")
                .split("")
                .reduce((acc, char) => acc + char.charCodeAt(0), 0);

            await this.qdrant.upsert(this.collectionName, {
                wait: true,
                points: [
                    {
                        id: assistantNumericId,
                        vector: assistantEmbedding,
                        payload: {
                            conversationId,
                            userId,
                            messageType: "assistant", // ADD THIS
                            content: assistantMessage, // Just the assistant message
                            relatedUserMessage: userMessage,
                            messageId,
                            timestamp: new Date().toISOString(),
                        },
                    },
                ],
            });
        } catch (error) {
            console.error("Error storing message in Qdrant:", error);
        }
    }
    async searchSimilarConversations(
        query: string,
        userId: string,
        currentConversationId: string, // ADD THIS PARAMETER
        limit: number = 3
    ): Promise<
        Array<{
            userMessage: string;
            assistantMessage: string;
            score: number;
        }>
    > {
        try {
            const queryEmbedding = await this.generateEmbedding(query);

            const searchResults = await this.qdrant.search(
                this.collectionName,
                {
                    vector: queryEmbedding,
                    limit,
                    filter: {
                        must: [
                            {
                                key: "userId",
                                match: { value: userId },
                            },
                        ],
                        must_not: [
                            // ADD THIS TO EXCLUDE CURRENT CONVERSATION
                            {
                                key: "conversationId",
                                match: { value: currentConversationId },
                            },
                        ],
                    },
                }
            );

            return searchResults.map((result) => ({
                userMessage: result.payload?.userMessage as string,
                assistantMessage: result.payload?.assistantMessage as string,
                score: result.score,
            }));
        } catch (error) {
            console.error("Error searching similar conversations:", error);
            return [];
        }
    }
    async searchUserStatements(
        query: string,
        userId: string,
        currentConversationId: string,
        limit: number = 5
    ): Promise<
        Array<{
            userMessage: string;
            assistantMessage: string;
            score: number;
        }>
    > {
        try {
            const queryEmbedding = await this.generateEmbedding(query);

            const searchResults = await this.qdrant.search(
                this.collectionName,
                {
                    vector: queryEmbedding,
                    limit,
                    filter: {
                        must: [
                            {
                                key: "userId",
                                match: { value: userId },
                            },
                            {
                                key: "messageType", // FILTER FOR USER MESSAGES ONLY
                                match: { value: "user" },
                            },
                        ],
                        must_not: [
                            {
                                key: "conversationId",
                                match: { value: currentConversationId },
                            },
                        ],
                    },
                }
            );

            return searchResults.map((result) => ({
                userMessage: result.payload?.content as string,
                assistantMessage: result.payload
                    ?.relatedAssistantMessage as string,
                score: result.score,
            }));
        } catch (error) {
            console.error("Error searching user statements:", error);
            return [];
        }
    }
    // Combined method to enhance conversation with memories
    async getConversationContext(
        userId: string,
        currentMessage: string,
        currentConversationId: string
    ): Promise<string> {
        try {
            const userMemories = await this.getUserMemories(userId);

            // Search what USER said in the past (to find facts like "my name is kg")
            const userStatements = await this.searchUserStatements(
                currentMessage,
                userId,
                currentConversationId,
                5
            );

            console.log("📝 User Memories:", userMemories);
            console.log("🗣️ User Past Statements:", userStatements);

            let contextPrompt = "";

            if (userMemories.length > 0) {
                contextPrompt += "User Context:\n";
                userMemories.slice(0, 5).forEach((mem) => {
                    contextPrompt += `- ${mem.memory}\n`;
                });
                contextPrompt += "\n";
            }

            // Add relevant statements from past
            if (userStatements.length > 0) {
                contextPrompt += "User Previously Said:\n";
                userStatements.slice(0, 3).forEach((stmt) => {
                    if (stmt.score > 0.4) {
                        contextPrompt += `- "${stmt.userMessage}"\n`;
                    }
                });
                contextPrompt += "\n";
            }

            console.log("🧠 Final Context:", contextPrompt);
            return contextPrompt;
        } catch (error) {
            console.error("Error getting conversation context:", error);
            return "";
        }
    }
}

export const memoryService = new MemoryService();
