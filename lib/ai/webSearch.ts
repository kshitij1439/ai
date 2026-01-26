
import { getAIService } from "./index";
import { AIModel } from "./modelTypes";
import { TavilySearchAPIRetriever } from "@langchain/community/retrievers/tavily_search_api";
const aiService = getAIService();
export interface SearchSource {
    title: string;
    url: string;
    snippet: string;
}

export interface WebSearchResult {
    formattedResults: string;
    sources: SearchSource[];
}

export async function performWebSearch(query: string): Promise<WebSearchResult> {
    try {
        const retriever = new TavilySearchAPIRetriever({
            k: 3,
            apiKey: process.env.TAVILY_API_KEY,
        });

        const documents = await retriever.invoke(query);

        const sources: SearchSource[] = [];
        let formattedResults = "Sources:\n";
        
        documents.forEach((doc, index) => {
            const rawUrl = doc.metadata?.url || doc.metadata?.source || doc.metadata?.link || "";
            
            let validUrl = "";
            if (rawUrl) {
                try {
                    if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
                        validUrl = `https://${rawUrl}`;
                    } else {
                        validUrl = rawUrl;
                    }
                    new URL(validUrl);
                } catch {
                    validUrl = "";
                }
            }
            
            const title = doc.metadata?.title || doc.metadata?.source || "Untitled";
            const snippet = doc.pageContent;
            
            console.log(`Source ${index + 1} metadata:`, doc.metadata);
            
            // Store structured source data
            sources.push({ 
                title, 
                url: validUrl, 
                snippet 
            });
            
            // Format for AI context
            formattedResults += `${index + 1}. ${title}\n`;
            formattedResults += `   ${snippet}\n`;
            if (validUrl) {
                formattedResults += `   URL: ${validUrl}\n`;
            }
            formattedResults += "\n";
        });

        console.log("📚 Extracted sources:", sources);

        return { formattedResults, sources };
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

Respond ONLY with "YES" or "NO".`;

        const response = await aiService.chat(
            [{ role: "user", content: classificationPrompt }],
            model,
            { maxTokens: 10 }
        );

        const decision = response.trim().toUpperCase() === "YES";
        console.log(`🔍 Web search needed for "${query}": ${decision ? "YES" : "NO"}`);
        return decision;
    } catch (error) {
        console.error("Web search classification error:", error);

        const urgentKeywords = [
            "latest", "current", "today", "now", "price", 
            "weather", "news", "breaking"
        ];
        const hasUrgentKeyword = urgentKeywords.some((keyword) =>
            query.toLowerCase().includes(keyword)
        );

        console.log(`⚠️ Fallback classification: ${hasUrgentKeyword ? "YES" : "NO"}`);
        return hasUrgentKeyword;
    }
}