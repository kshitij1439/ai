export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  [key: string]: unknown;
}

export interface AIProvider {
  chat(messages: Message[], options?: ChatOptions): Promise<string>;
  streamChat?(
    messages: Message[],
    onChunk: (chunk: string) => void,
    options?: ChatOptions
  ): Promise<void>;
}

export type AIModel = 
  | "llama3"
  | "gemini-2.5-flash-lite"
  | "gemini-pro"
  | "gemini-nano"
  | "veo-3";