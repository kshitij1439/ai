import { AIProvider, Message, ChatOptions } from "../types";

export class GoogleAIProvider implements AIProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private convertMessages(messages: Message[]) {
    // Combine system messages into the first user message
    const systemMessages = messages
      .filter(m => m.role === "system")
      .map(m => m.content)
      .join("\n");
    
    const chatMessages = messages.filter(m => m.role !== "system");
    
    const contents = chatMessages.map((msg, idx) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ 
        text: idx === 0 && systemMessages 
          ? `${systemMessages}\n\n${msg.content}` 
          : msg.content 
      }]
    }));

    return contents;
  }

  async chat(messages: Message[], options?: ChatOptions): Promise<string> {
    const model = options?.model || "gemini-2.5-flash-lite";
    
    try {
      const contents = this.convertMessages(messages);

      const requestBody: Record<string, unknown> = {
        contents,
      };

      // Add generation config if options provided
      if (options?.temperature !== undefined || options?.maxTokens !== undefined) {
        requestBody.generationConfig = {
          temperature: options.temperature,
          maxOutputTokens: options.maxTokens,
          topP: options.topP,
        };
      }

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`Google AI API error: ${JSON.stringify(errorData)}`);
      }

      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } catch (err) {
      console.error("Google AI call failed:", err);
      throw err;
    }
  }

  async streamChat(
    messages: Message[],
    onChunk: (chunk: string) => void,
    options?: ChatOptions
  ): Promise<void> {
    const model = options?.model || "gemini-2.5-flash-lite";
    
    const contents = this.convertMessages(messages);

    const requestBody: Record<string, unknown> = {
      contents,
    };

    if (options?.temperature !== undefined || options?.maxTokens !== undefined) {
      requestBody.generationConfig = {
        temperature: options.temperature,
        maxOutputTokens: options.maxTokens,
        topP: options.topP,
      };
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      }
    );

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(`Google AI API error: ${JSON.stringify(errorData)}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error("No reader available");

    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n").filter(line => line.trim());

      for (const line of lines) {
        try {
          const json = JSON.parse(line);
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) onChunk(text);
        } catch {
          // ignore partial JSON
        }
      }
    }
  }
}