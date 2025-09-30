import { prisma } from "@/lib/db"; // adjust path if needed
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        conversations: true, // include conversations if you want
      },
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(req: Request) {
    try {
      const body = await req.json();
      const { name, email } = body;
  
      if (!email) {
        return NextResponse.json({ error: "Email is required" }, { status: 400 });
      }
  
      const newUser = await prisma.user.create({
        data: { name, email },
      });
  
      return NextResponse.json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }
  }
  
