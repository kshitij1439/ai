// app/api/ai/providers/route.ts
import { NextResponse } from "next/server";
import { aiService } from "@/lib/ai";

export async function GET() {
  try {
    const providers = aiService.getAvailableProviders();
    console.log("Available providers:", providers);
    return NextResponse.json({
      providers,
      message: "Available AI providers",
    });
  } catch (error) {
    console.error("Error checking providers:", error);
    return NextResponse.json(
      { error: "Failed to check providers" },
      { status: 500 }
    );
  }
}