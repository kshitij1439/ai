// // FREE Models
// // FREE Models
// export type FreeAIModel =
//     // Google Gemini (FREE)
//     | "gemini-2.5-flash-lite"
//     | "gemini-2.5-flash"
//     | "gemini-2.5-pro"

//     // Ollama (FREE - Local)
//     // | "llama3.2"
//     // | "llama3.2:1b"
//     // | "llama3.1"
//     // | "phi3"
//     // | "mistral"
//     // | "codellama"

//     // Groq (FREE with rate limits)
//     | "llama-3.3-70b-versatile"
//     | "mixtral-8x7b-65536"
//     | "gemma-2-27b-it";

// // PAID Models
// // export type PaidAIModel =
//     // OpenAI
//     // | "gpt-4o"
//     // | "gpt-4o-mini"

//     // // Anthropic
//     // | "claude-3-5-sonnet-20241022"
//     // | "claude-3-5-haiku-20241022"
//     // | "claude-3-opus-20240229";

// export type AIModel = FreeAIModel
// // | PaidAIModel;

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

// export interface AIProvider {
//     chat(messages: Message[], options?: ChatOptions): Promise<string>;
//     streamChat?(
//         messages: Message[],
//         onChunk: (chunk: string) => void,
//         options?: ChatOptions
//     ): Promise<void>;
// }

// // Model Categories for UI
// export const MODEL_CATEGORIES = {
//     free: {
//         google: ["gemini-2.5-flash-lite"],
//         // ollama: [
//         //     "llama3.2",
//         //     "llama3.2:1b",
//         //     "llama3.1",
//         //     "phi3",
//         //     "mistral",
//         //     "codellama",
//         // ],
//         groq: [
//             "llama-3.3-70b-versatile",
//             // "mixtral-8x7b-65536",
//             // "gemma-2-27b-it",
//         ],
//     },
//     // paid: {
//     //     openai: ["gpt-4o", "gpt-4o-mini"],
//     //     anthropic: [
//     //         "claude-3-5-sonnet-20241022",
//     //         "claude-3-5-haiku-20241022",
//     //         "claude-3-opus-20240229",
//     //     ],
//     // },
// } as const;

// // Model Display Names
// export const MODEL_DISPLAY_NAMES: Record<AIModel, string> = {
//     // Google Gemini
//     "gemini-2.5-flash-lite": "Gemini 2.5 Flash Lite (FREE)",
//     "gemini-2.5-flash": "Gemini 2.5 Flash (FREE)",
//     "gemini-2.5-pro": "Gemini 2.5 Pro (FREE)",

//     // Ollama
//     // "llama3.2": "Llama 3.2 (Local)",
//     // "llama3.2:1b": "Llama 3.2 1B (Local)",
//     // "llama3.1": "Llama 3.1 (Local)",
//     // phi3: "Phi-3 (Local)",
//     // mistral: "Mistral (Local)",
//     // codellama: "Code Llama (Local)",

//     // Groq
//     "llama-3.3-70b-versatile": "Llama 3.3 70B (Groq)",
//     "mixtral-8x7b-65536": "Mixtral 8×7B 65k (Groq)",
//     "gemma-2-27b-it": "Gemma 2 27B IT (Groq)",

//     // OpenAI
//     // "gpt-4o": "GPT-4 Omni",
//     // "gpt-4o-mini": "GPT-4 Omni Mini",

//     // // Anthropic
//     // "claude-3-5-sonnet-20241022": "Claude 3.5 Sonnet",
//     // "claude-3-5-haiku-20241022": "Claude 3.5 Haiku",
//     // "claude-3-opus-20240229": "Claude 3 Opus",
// };
export const FREE_MODELS = [
    "gemini-2.5-flash-lite",
    "llama-3.3-70b-versatile",
    "mixtral-8x7b-65536",
    "qwen2.5:14b",
] as const;

export type FreeAIModel = (typeof FREE_MODELS)[number];
export type AIModel = FreeAIModel;
export const MODEL_CATEGORIES = {
    free: {
        google: ["gemini-2.5-flash-lite"],
        groq: ["llama-3.3-70b-versatile", "mixtral-8x7b-65536"],
        ollama: ["qwen2.5:14b"],
    },
} as const satisfies {
    free: Record<string, readonly FreeAIModel[]>;
};

export const MODEL_DISPLAY_NAMES = {
    "gemini-2.5-flash-lite": "Gemini 2.5 Flash Lite (FREE)",
    "llama-3.3-70b-versatile": "Llama 3.3 70B (Groq)",
    "mixtral-8x7b-65536": "Mixtral 8×7B 65k (Groq)",
    "qwen2.5:14b": "Qwen 2.5 14B (Self-hosted GCP)",
} satisfies Record<AIModel, string>;
