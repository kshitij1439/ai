import { AIProvider, Message } from "../types";

export class OllamaProvider implements AIProvider {
  private baseUrl: string;

  constructor(baseUrl = "http://localhost:11434") {
    this.baseUrl = baseUrl;
  }

  async chat(messages: Message[], options?: { model?: string }): Promise<string> {
    const model = options?.model || "llama3";
    
    try {
      const res = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages, stream: true }),
      });

      const reader = res.body?.getReader();
      let fullText = "";

      if (reader) {
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n").filter((line) => line.trim());

          for (const line of lines) {
            try {
              const json = JSON.parse(line);
              if (json.message?.content) {
                fullText += json.message.content;
              }
            } catch {
              // ignore partial JSON
            }
          }
        }
      }

      return fullText;
    } catch (err) {
      console.error("Ollama call failed:", err);
      throw err;
    }
  }

  async streamChat(
    messages: Message[],
    onChunk: (chunk: string) => void,
    options?: { model?: string }
  ): Promise<void> {
    const model = options?.model || "llama3";
    
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, stream: true }),
    });

    const reader = res.body?.getReader();
    if (!reader) throw new Error("No reader available");

    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n").filter((line) => line.trim());

      for (const line of lines) {
        try {
          const json = JSON.parse(line);
          if (json.message?.content) {
            onChunk(json.message.content);
          }
        } catch {
          // ignore partial JSON
        }
      }
    }
  }
}