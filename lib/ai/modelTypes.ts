// FREE Models
export type FreeAIModel =
    // Google Gemini (FREE - Best free option)
    | "gemini-2.5-flash-lite" // Latest, fastest, FREE
    | "gemini-1.5-flash" // Fast and efficient, FREE
    | "gemini-1.5-pro" // More capable, FREE

    // Ollama (FREE - Local, no API needed)
    | "llama3.2" // Latest Llama, local
    | "llama3.2:1b" // Lightweight, local
    | "llama3.1" // Previous version, local
    | "phi3" // Microsoft's model, local
    | "mistral" // Mistral AI, local
    | "codellama" // Code-focused, local

    // Groq (FREE with rate limits - Very fast inference)
    | "llama-3.3-70b-versatile" // Latest Llama on Groq
    | "llama-3.1-70b-versatile" // Llama 3.1 on Groq
    | "mixtral-8x7b-32768" // Mixtral on Groq
    | "gemma2-9b-it"; // Google's Gemma on Groq

// PAID Models
export type PaidAIModel =
    // OpenAI (PAID)
    | "gpt-4o" // Latest GPT-4 Omni
    | "gpt-4o-mini" // Cheaper GPT-4
    | "gpt-4-turbo" // GPT-4 Turbo
    | "gpt-3.5-turbo" // Cheapest OpenAI

    // Anthropic Claude (PAID)
    | "claude-3-5-sonnet-20241022" // Latest Claude Sonnet
    | "claude-3-5-haiku-20241022" // Fast Claude
    | "claude-3-opus-20240229"; // Most capable Claude

export type AIModel = FreeAIModel | PaidAIModel;

export interface Message {
    role: "system" | "user" | "assistant";
    content: string;
}

export interface ChatOptions {
    model?: AIModel;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
}

export interface AIProvider {
    chat(messages: Message[], options?: ChatOptions): Promise<string>;
    streamChat?(
        messages: Message[],
        onChunk: (chunk: string) => void,
        options?: ChatOptions
    ): Promise<void>;
}

// Model Categories for UI
export const MODEL_CATEGORIES = {
    free: {
        google: ["gemini-2.5-flash-lite", "gemini-1.5-flash", "gemini-1.5-pro"],
        ollama: [
            "llama3.2",
            "llama3.2:1b",
            "llama3.1",
            "phi3",
            "mistral",
            "codellama",
        ],
        groq: [
            "llama-3.3-70b-versatile",
            "llama-3.1-70b-versatile",
            "mixtral-8x7b-32768",
            "gemma2-9b-it",
        ],
    },
    paid: {
        openai: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
        anthropic: [
            "claude-3-5-sonnet-20241022",
            "claude-3-5-haiku-20241022",
            "claude-3-opus-20240229",
        ],
    },
} as const;

// Model Display Names
export const MODEL_DISPLAY_NAMES: Record<AIModel, string> = {
    // Google Gemini
    "gemini-2.5-flash-lite": "Gemini 2.0 Flash (FREE)",
    "gemini-1.5-flash": "Gemini 1.5 Flash (FREE)",
    "gemini-1.5-pro": "Gemini 1.5 Pro (FREE)",

    // Ollama
    "llama3.2": "Llama 3.2 (Local)",
    "llama3.2:1b": "Llama 3.2 1B (Local)",
    "llama3.1": "Llama 3.1 (Local)",
    phi3: "Phi-3 (Local)",
    mistral: "Mistral (Local)",
    codellama: "Code Llama (Local)",

    // Groq
    "llama-3.3-70b-versatile": "Llama 3.3 70B (Groq)",
    "llama-3.1-70b-versatile": "Llama 3.1 70B (Groq)",
    "mixtral-8x7b-32768": "Mixtral 8x7B (Groq)",
    "gemma2-9b-it": "Gemma 2 9B (Groq)",

    // OpenAI
    "gpt-4o": "GPT-4 Omni",
    "gpt-4o-mini": "GPT-4 Omni Mini",
    "gpt-4-turbo": "GPT-4 Turbo",
    "gpt-3.5-turbo": "GPT-3.5 Turbo",

    // Anthropic
    "claude-3-5-sonnet-20241022": "Claude 3.5 Sonnet",
    "claude-3-5-haiku-20241022": "Claude 3.5 Haiku",
    "claude-3-opus-20240229": "Claude 3 Opus",
};
