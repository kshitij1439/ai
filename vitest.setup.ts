// vitest.setup.ts
import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
    cleanup();
});
vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn(),
    }),
    usePathname: () => "/",
    useSearchParams: () => new URLSearchParams(),
}));

// Mock Qdrant client to prevent connection attempts
vi.mock("@qdrant/js-client-rest", () => ({
    QdrantClient: vi.fn().mockImplementation(() => ({
        getCollections: vi.fn().mockResolvedValue({ collections: [] }),
        createCollection: vi.fn().mockResolvedValue({}),
        upsert: vi.fn().mockResolvedValue({}),
        search: vi.fn().mockResolvedValue([]),
        scroll: vi.fn().mockResolvedValue({ points: [] }),
    })),
}));
