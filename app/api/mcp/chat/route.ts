import { NextResponse } from "next/server";
import { getAIService } from "@/lib/ai";
import { AIModel } from "@/lib/ai/modelTypes";

const aiService = getAIService();

interface Message {
    role: "user" | "assistant";
    content: string;
    timestamp: string;
}

interface DriveSource {
    name: string;
    type: "folder" | "file";
    path: string;
    url?: string;
}

// In-memory storage for session memory (in production, use Redis or database)
const sessionMemories = new Map<string, Message[]>();

export async function POST(req: Request) {
    try {
        const { message, conversationHistory, currentPath, sessionId } = await req.json();

        if (!message || typeof message !== "string") {
            return NextResponse.json(
                { error: "Message is required" },
                { status: 400 }
            );
        }

        // Get session memory
        const sessionMemory = sessionMemories.get(sessionId) || [];
        
        // Keep only last 10 messages for context
        if (sessionMemory.length > 20) {
            sessionMemory.splice(0, sessionMemory.length - 20);
        }

        // Get Drive context
        const driveContext = getDriveContext(currentPath);

        // Build memory context
        const memoryContext = sessionMemory.length > 0 
            ? `Previous conversation context:\n${sessionMemory.slice(-5).map(m => 
                `${m.role === "user" ? "User" : "Assistant"}: ${m.content.substring(0, 100)}`
              ).join("\n")}`
            : "";

        const systemPrompt = `You are a helpful AI assistant for SPPU (Savitribai Phule Pune University) with access to public educational files and documents stored in Google Drive.

CURRENT GOOGLE DRIVE CONTEXT:
${driveContext}

${memoryContext ? `\n${memoryContext}\n` : ""}

Your capabilities:
1. Navigate and browse through folders
2. Search for specific files or topics
3. Read and summarize document contents
4. Answer questions about files and their contents
5. Remember context from the current conversation

When responding:
- Be helpful and educational
- If users ask to navigate or open folders, suggest the path
- If users ask about files, provide information based on metadata
- If users ask to read files, indicate you'll retrieve the content
- Reference previous messages when relevant
- Be conversational and friendly

Current location: ${currentPath.length > 0 ? currentPath.join("/") : "Root folder"}

Guidelines:
- Focus on educational content
- Provide clear, structured responses
- Cite file names when referencing documents
- Suggest related files when appropriate`;

        const messages = [
            { role: "system" as const, content: systemPrompt },
            ...(conversationHistory || []).slice(-10).map((msg: Message) => ({
                role: msg.role,
                content: msg.content,
            })),
            { role: "user" as const, content: message },
        ];

        const aiResponse = await aiService.chat(
            messages,
            "llama-3.3-70b-versatile" as AIModel,
            { maxTokens: 4000 }
        );

        // Store in session memory
        sessionMemory.push(
            { role: "user", content: message, timestamp: new Date().toISOString() },
            { role: "assistant", content: aiResponse, timestamp: new Date().toISOString() }
        );
        sessionMemories.set(sessionId, sessionMemory);

        // Extract suggested paths and sources
        const suggestedPath = extractSuggestedPath(aiResponse, currentPath);
        const sources = extractSources(aiResponse);

        return NextResponse.json({
            response: aiResponse,
            suggestedPath,
            sources,
        });
    } catch (error) {
        console.error("Public MCP chat error:", error);
        return NextResponse.json(
            { error: "Failed to process message" },
            { status: 500 }
        );
    }
}

function getDriveContext(currentPath: string[]): string {
    const pathStr = currentPath.length > 0 ? currentPath.join("/") : "Root";
    
    return `Current location: ${pathStr}
Available: Browse folders in the sidebar or search for specific files.
You have access to public educational materials, documents, and resources.`;
}

function extractSuggestedPath(response: string, currentPath: string[]): string[] | null {
    const folderMatch = response.match(
        /(?:navigate to|open|go to)\s+(?:folder\s+)?["']?([^"'\n]+)["']?/i
    );

    if (folderMatch) {
        const folderName = folderMatch[1].trim();
        return [...currentPath, folderName];
    }

    return null;
}

function extractSources(response: string): DriveSource[] {
    const sources: DriveSource[] = [];
    const fileMatches = response.matchAll(
        /(?:file|document)\s+["']?([^"'\n]+)["']?/gi
    );

    for (const match of fileMatches) {
        sources.push({
            name: match[1].trim(),
            type: "file",
            path: match[1].trim(),
        });
    }

    return sources;
}

// Cleanup old sessions periodically (run this in a separate process in production)
setInterval(() => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    
    for (const [sessionId, messages] of sessionMemories.entries()) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && new Date(lastMessage.timestamp).getTime() < oneHourAgo) {
            sessionMemories.delete(sessionId);
        }
    }
}, 15 * 60 * 1000); // Run every 15 minutes