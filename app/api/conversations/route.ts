import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const conversations = await prisma.conversation.findMany({
      include: {
        user: true,
        messages: true,
      },
    });
    return NextResponse.json(conversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }
}



export async function POST(req: Request) {
    try {
      const body = await req.json();
      const { userId, model, title } = body;
  
      if (!userId || !model) {
        return NextResponse.json(
          { error: "userId and model are required" },
          { status: 400 }
        );
      }
  
      // Check if user exists
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }
  
      // Create conversation
      const conversation = await prisma.conversation.create({
        data: {
          userId,
          model,
          title,
        },
      });
  
      return NextResponse.json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
    }
  }
  