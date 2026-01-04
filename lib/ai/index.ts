// lib/ai/index.ts
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOllama } from "@langchain/ollama";
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGroq } from "@langchain/groq";
import {
    BaseMessage,
    HumanMessage,
    AIMessage,
    SystemMessage,
} from "@langchain/core/messages";
import { AIModel, Message, ChatOptions } from "./modelTypes";

class AIService {
    private googleModel: ChatGoogleGenerativeAI | null = null;
    private ollamaModel: ChatOllama | null = null;
    private openaiModel: ChatOpenAI | null = null;
    private anthropicModel: ChatAnthropic | null = null;
    private groqModel: ChatGroq | null = null;

    constructor() {
        try {
            // Initialize Google AI (Gemini) - FREE
            const googleApiKey = process.env.GOOGLE_AI_KEY;
            if (googleApiKey) {
                this.googleModel = new ChatGoogleGenerativeAI({
                    apiKey: googleApiKey,
                    model: "gemini-2.5-flash-lite",
                    temperature: 1,
                });
            }
        } catch (error) {
            console.warn("Failed to initialize Google AI:", error);
        }

        try {
            // Initialize Ollama - FREE (Local)
            this.ollamaModel = new ChatOllama({
                baseUrl:
                    process.env.OLLAMA_BASE_URL || "http://localhost:11434",
                model: "llama3.2",
            });
        } catch (error) {
            console.warn("Failed to initialize Ollama:", error);
        }

        try {
            // Initialize OpenAI - PAID
            const openaiKey = process.env.OPENAI_API_KEY;
            if (openaiKey) {
                this.openaiModel = new ChatOpenAI({
                    apiKey: openaiKey,
                    model: "gpt-4o-mini",
                    temperature: 1,
                });
            }
        } catch (error) {
            console.warn("Failed to initialize OpenAI:", error);
        }

        try {
            // Initialize Anthropic (Claude) - PAID
            const anthropicKey = process.env.ANTHROPIC_API_KEY;
            if (anthropicKey) {
                this.anthropicModel = new ChatAnthropic({
                    apiKey: anthropicKey,
                    model: "claude-3-5-sonnet-20241022",
                    temperature: 1,
                });
            }
        } catch (error) {
            console.warn("Failed to initialize Anthropic:", error);
        }

        try {
            // Initialize Groq - FREE (with limits)
            const groqKey = process.env.GROQ_API_KEY;
            if (groqKey) {
                this.groqModel = new ChatGroq({
                    apiKey: groqKey,
                    model: "llama-3.3-70b-versatile",
                    temperature: 1,
                });
            }
        } catch (error) {
            console.warn("Failed to initialize Groq:", error);
        }
    }

    private convertToLangChainMessages(messages: Message[]): BaseMessage[] {
        return messages.map((msg) => {
            switch (msg.role) {
                case "system":
                    return new SystemMessage(msg.content);
                case "assistant":
                    return new AIMessage(msg.content);
                case "user":
                default:
                    return new HumanMessage(msg.content);
            }
        });
    }

    private getModel(model: AIModel, options?: ChatOptions) {
        // Ollama Models (FREE - Local)
        if (
            [
                "llama3.2",
                "llama3.2:1b",
                "llama3.1",
                "phi3",
                "mistral",
                "codellama",
            ].includes(model)
        ) {
            if (!this.ollamaModel) {
                throw new Error(
                    "Ollama not initialized. Install Ollama and pull models."
                );
            }
            // Create new instance with specific model
            const ollamaInstance = new ChatOllama({
                baseUrl:
                    process.env.OLLAMA_BASE_URL || "http://localhost:11434",
                model: model,
                temperature: options?.temperature ?? 1,
                numCtx: options?.maxTokens,
                topP: options?.topP,
            });
            return ollamaInstance;
        }

        // Google Gemini Models (FREE)
        if (
            [
                "gemini-2.5-flash-lite",
                "gemini-1.5-flash",
                "gemini-1.5-pro",
            ].includes(model)
        ) {
            if (!this.googleModel) {
                throw new Error(
                    "Google AI not initialized. Get free API key at https://ai.google.dev"
                );
            }
            // Create new instance with specific model
            const googleInstance = new ChatGoogleGenerativeAI({
                apiKey: process.env.GOOGLE_AI_KEY!,
                model: model,
                temperature: options?.temperature ?? 1,
                maxOutputTokens: options?.maxTokens,
                topP: options?.topP,
            });
            return googleInstance;
        }

        // OpenAI Models (PAID)
        if (
            ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"].includes(
                model
            )
        ) {
            if (!this.openaiModel) {
                throw new Error(
                    "OpenAI not initialized. Add OPENAI_API_KEY to .env"
                );
            }
            // Create new instance with specific model
            const openaiInstance = new ChatOpenAI({
                apiKey: process.env.OPENAI_API_KEY!,
                model: model,
                temperature: options?.temperature ?? 1,
                maxTokens: options?.maxTokens,
                topP: options?.topP,
            });
            return openaiInstance;
        }

        // Anthropic Claude Models (PAID)
        if (
            [
                "claude-3-5-sonnet-20241022",
                "claude-3-5-haiku-20241022",
                "claude-3-opus-20240229",
            ].includes(model)
        ) {
            if (!this.anthropicModel) {
                throw new Error(
                    "Anthropic not initialized. Add ANTHROPIC_API_KEY to .env"
                );
            }
            // Create new instance with specific model
            const anthropicInstance = new ChatAnthropic({
                apiKey: process.env.ANTHROPIC_API_KEY!,
                model: model,
                temperature: options?.temperature ?? 1,
                maxTokens: options?.maxTokens,
                topP: options?.topP,
            });
            return anthropicInstance;
        }

        // Groq Models (FREE with rate limits)
        if (
            [
                "llama-3.3-70b-versatile",
                "llama-3.1-70b-versatile",
                "mixtral-8x7b-32768",
                "gemma2-9b-it",
            ].includes(model)
        ) {
            if (!this.groqModel) {
                throw new Error(
                    "Groq not initialized. Get free API key at https://console.groq.com"
                );
            }
            // Create new instance with specific model
            const groqInstance = new ChatGroq({
                apiKey: process.env.GROQ_API_KEY!,
                model: model,
                temperature: options?.temperature ?? 1,
                maxTokens: options?.maxTokens,
                topP: options?.topP,
            });
            return groqInstance;
        }

        throw new Error(`Unknown model: ${model}`);
    }

    async chat(
        messages: Message[],
        model: AIModel = "gemini-2.5-flash-lite",
        options?: ChatOptions
    ): Promise<string> {
        try {
            const langchainMessages = this.convertToLangChainMessages(messages);
            const llm = this.getModel(model, options);

            const response = await llm.invoke(langchainMessages);
            return response.content.toString();
        } catch (error) {
            console.error("AI chat error:", error);
            throw error;
        }
    }

    async streamChat(
        messages: Message[],
        onChunk: (chunk: string) => void,
        model: AIModel = "gemini-2.5-flash-lite",
        options?: ChatOptions
    ): Promise<void> {
        try {
            const langchainMessages = this.convertToLangChainMessages(messages);
            const llm = this.getModel(model, options);

            const stream = await llm.stream(langchainMessages);

            for await (const chunk of stream) {
                onChunk(chunk.content.toString());
            }
        } catch (error) {
            console.error("AI stream error:", error);
            throw error;
        }
    }

    // Utility method to check which providers are available
    getAvailableProviders(): string[] {
        const providers: string[] = [];
        if (this.googleModel) providers.push("google");
        if (this.ollamaModel) providers.push("ollama");
        if (this.openaiModel) providers.push("openai");
        if (this.anthropicModel) providers.push("anthropic");
        if (this.groqModel) providers.push("groq");
        return providers;
    }
}

export const aiService = new AIService();
export type { Message, AIModel, ChatOptions };
