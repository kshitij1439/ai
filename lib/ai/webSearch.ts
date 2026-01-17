import { aiService } from "./index";
import { AIModel } from "./modelTypes";

interface TavilySearchResult {
    title: string;
    url: string;
    content: string;
    score: number;
}

interface TavilyResponse {
    answer?: string;
    results: TavilySearchResult[];
}

export async function performWebSearch(query: string): Promise<string> {
    try {
        const response = await fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                api_key: process.env.TAVILY_API_KEY,
                query: query,
                search_depth: "basic",
                include_answer: true,
                max_results: 3,
            }),
        });

        if (!response.ok) {
            throw new Error(`Tavily API error: ${response.statusText}`);
        }

        const data: TavilyResponse = await response.json();

        let formattedResults = "";

        if (data.answer) {
            formattedResults += `Quick Answer: ${data.answer}\n\n`;
        }

        if (data.results && data.results.length > 0) {
            formattedResults += "Sources:\n";
            data.results.forEach((result, index) => {
                formattedResults += `${index + 1}. ${result.title}\n`;
                formattedResults += `   ${result.content}\n`;
                formattedResults += `   URL: ${result.url}\n\n`;
            });
        }

        return formattedResults;
    } catch (error) {
        console.error("Web search error:", error);
        throw error;
    }
}

export async function shouldUseWebSearch(
    query: string,
    model: AIModel
): Promise<boolean> {
    try {
        const classificationPrompt = `You are a search intent classifier. Analyze if this query needs real-time web search.

Query: "${query}"

A query NEEDS web search if it:
- Asks about current events, breaking news, or recent happenings
- Requests real-time data (prices, weather, scores, rates)
- Asks "who is currently", "what is the latest", "what happened"
- Needs information after January 2025
- Asks about someone's current role/position/status
- Requests live or frequently-changing information
- Asks about recent developments in any field

A query DOES NOT need web search if it:
- Asks for explanations of concepts, theories, or how things work
- Requests creative content (stories, code, essays)
- Asks about historical facts or well-established knowledge
- Is a general "how to" or tutorial request
- Seeks help with personal tasks or advice
- Is conversational ("hello", "thank you", "tell me about yourself")

Examples that NEED search:
- "What's the latest AI news?"
- "Current Bitcoin price"
- "Who won yesterday's game?"
- "Weather in Tokyo"
- "What happened to Twitter?"
- "Who is the current CEO of OpenAI?"

Examples that DON'T need search:
- "Explain quantum computing"
- "Help me write code for a login form"
- "What's the Pythagorean theorem?"
- "How do I bake a cake?"
- "Tell me a joke"
- "What did we talk about last time?"

Respond ONLY with "YES" or "NO".`;

        const response = await aiService.chat(
            [{ role: "user", content: classificationPrompt }],
            model,
            { maxTokens: 10 }
        );

        const decision = response.trim().toUpperCase() === "YES";
        console.log(
            `🔍 Web search needed for "${query}": ${decision ? "YES" : "NO"}`
        );
        return decision;
    } catch (error) {
        console.error("Web search classification error:", error);

        // Fallback: simple keyword detection only for obvious cases
        const urgentKeywords = [
            "latest",
            "current",
            "today",
            "now",
            "price",
            "weather",
            "news",
            "breaking",
        ];
        const hasUrgentKeyword = urgentKeywords.some((keyword) =>
            query.toLowerCase().includes(keyword)
        );

        console.log(
            `⚠️ Fallback classification: ${hasUrgentKeyword ? "YES" : "NO"}`
        );
        return hasUrgentKeyword;
    }
}
