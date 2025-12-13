// app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        return NextResponse.json({ user: session.user });
    } catch (err) {
        console.error("me error", err);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}
