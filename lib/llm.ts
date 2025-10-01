export async function chatWithLLM(prompt: string, model = "llama3") {
    try {
      const res = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, prompt }),
      });
  
      const reader = res.body?.getReader();
      let fullText = "";
  
      if (reader) {
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
  
          const chunk = decoder.decode(value, { stream: true });
          try {
            const json = JSON.parse(chunk);
            fullText += json.response || "";
          } catch {
            // ignore partial JSON
          }
        }
      }
  
      return fullText;
    } catch (err) {
      console.error("LLM call failed:", err);
      return null;
    }
  }
  