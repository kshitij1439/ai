import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/ai/providers/route";
import { aiService } from "@/lib/ai";

vi.mock("@/lib/ai", () => ({
    aiService: {
        getAvailableProviders: vi.fn(),
    },
}));

describe("GET /api/ai/providers", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should return available providers", async () => {
        const mockProviders = ["openai", "anthropic", "google"];
        vi.mocked(aiService.getAvailableProviders).mockReturnValue(
            mockProviders
        );

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.providers).toEqual(mockProviders);
        expect(data.message).toBe("Available AI providers");
    });

    it("should handle errors gracefully", async () => {
        vi.mocked(aiService.getAvailableProviders).mockImplementation(() => {
            throw new Error("Service unavailable");
        });

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe("Failed to check providers");
    });
});
