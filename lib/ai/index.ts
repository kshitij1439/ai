import { AIProvider, Message, AIModel, ChatOptions } from "./types";
import { OllamaProvider } from "./providers/ollama";
import { GoogleAIProvider } from "./providers/google";

class AIService {
  private providers: Map<string, AIProvider> = new Map();

  constructor() {
    this.providers.set("ollama", new OllamaProvider());
    
    const googleApiKey = process.env.PUBLIC_GOOGLE_AI_KEY;
    if (googleApiKey) {
      this.providers.set("google", new GoogleAIProvider(googleApiKey));
    }
  }

  private getProvider(model: AIModel): AIProvider {
    if (model === "llama3") {
      return this.providers.get("ollama")!;
    }
    
    if (["gemini-2.5-flash-lite", "gemini-pro", "gemini-nano", "veo-3"].includes(model)) {
      const provider = this.providers.get("google");
      if (!provider) throw new Error("Google AI provider not initialized. Add NEXT_PUBLIC_GOOGLE_AI_KEY to .env");
      return provider;
    }

    throw new Error(`Unknown model: ${model}`);
  }

  async chat(
    messages: Message[],
    model: AIModel = "llama3",
    options?: ChatOptions
  ): Promise<string> {
    const provider = this.getProvider(model);
    return provider.chat(messages, { ...options, model });
  }

  async streamChat(
    messages: Message[],
    onChunk: (chunk: string) => void,
    model: AIModel = "llama3",
    options?: ChatOptions
  ): Promise<void> {
    const provider = this.getProvider(model);
    if (!provider.streamChat) {
      throw new Error("Provider does not support streaming");
    }
    return provider.streamChat(messages, onChunk, { ...options, model });
  }
}

export const aiService = new AIService();
export type { Message, AIModel, ChatOptions };