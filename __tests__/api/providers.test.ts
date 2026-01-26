import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetAvailableProviders = vi.hoisted(() => vi.fn<() => string[]>());

vi.mock("@/lib/ai", () => ({
    getAIService: vi.fn(() => ({
        getAvailableProviders: mockGetAvailableProviders,
    })),
}));

import { GET } from "@/app/api/ai/providers/route";

describe("GET /api/ai/providers", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should return available providers", async () => {
        const mockProviders = ["openai", "anthropic", "google"];
        mockGetAvailableProviders.mockReturnValue(mockProviders);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.providers).toEqual(mockProviders);
        expect(data.message).toBe("Available AI providers");
    });

    it("should handle errors gracefully", async () => {
        mockGetAvailableProviders.mockImplementation(() => {
            throw new Error("Service unavailable");
        });

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe("Failed to check providers");
    });
});
