// app/api/auth/otp/verify/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limiter";

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email and OTP are required" },
        { status: 400 }
      );
    }

    // Rate limiting for verification attempts: 10 attempts per 15 minutes
    const rateLimitKey = `otp-verify:${email.toLowerCase()}`;
    const rateLimit = checkRateLimit(rateLimitKey, 10, 15 * 60 * 1000);

    if (!rateLimit.allowed) {
      const resetIn = Math.ceil((rateLimit.resetAt - Date.now()) / 1000 / 60);
      return NextResponse.json(
        { 
          error: `Too many verification attempts. Please try again in ${resetIn} minutes.`,
          resetAt: rateLimit.resetAt 
        },
        { status: 429 }
      );
    }

    // Find the OTP
    const otpRecord = await prisma.oTP.findFirst({
      where: {
        email: email.toLowerCase(),
        code: otp,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { error: "Invalid OTP code" },
        { status: 401 }
      );
    }

    // Check if OTP is expired
    if (new Date() > otpRecord.expiresAt) {
      await prisma.oTP.delete({ where: { id: otpRecord.id } });
      return NextResponse.json(
        { error: "OTP has expired. Please request a new one." },
        { status: 401 }
      );
    }

    // Check attempt limit (max 5 attempts per OTP)
    if (otpRecord.attempts >= 5) {
      await prisma.oTP.delete({ where: { id: otpRecord.id } });
      return NextResponse.json(
        { error: "Maximum verification attempts exceeded. Please request a new OTP." },
        { status: 401 }
      );
    }

    // Increment attempts
    await prisma.oTP.update({
      where: { id: otpRecord.id },
      data: { attempts: otpRecord.attempts + 1 },
    });

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Delete the used OTP
    await prisma.oTP.delete({ where: { id: otpRecord.id } });

    // Return user data for NextAuth session creation
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      },
    });
  } catch (err) {
    console.error("OTP verification error:", err);
    return NextResponse.json(
      { error: "Verification failed. Please try again." },
      { status: 500 }
    );
  }
}