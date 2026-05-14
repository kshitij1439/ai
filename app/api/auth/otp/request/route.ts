// app/api/auth/otp/request/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendOTPEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limiter";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    // Rate limiting: 5 requests per 15 minutes per email
    const rateLimitKey = `otp-request:${email.toLowerCase()}`;
    const rateLimit = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000);

    if (!rateLimit.allowed) {
      const resetIn = Math.ceil((rateLimit.resetAt - Date.now()) / 1000 / 60);
      return NextResponse.json(
        { 
          error: `Too many OTP requests. Please try again in ${resetIn} minutes.`,
          resetAt: rateLimit.resetAt 
        },
        { status: 429 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "No account found with this email" },
        { status: 404 }
      );
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete old OTPs for this email
    await prisma.oTP.deleteMany({
      where: {
        email: email.toLowerCase(),
      },
    });

    // Store new OTP
    await prisma.oTP.create({
      data: {
        email: email.toLowerCase(),
        code: otp,
        expiresAt,
      },
    });

    // Send OTP via email
    await sendOTPEmail(email, otp);

    return NextResponse.json({
      success: true,
      message: "OTP sent to your email",
      expiresIn: 600, // 10 minutes in seconds
    });
  } catch (err) {
    console.error("OTP request error:", err);
    return NextResponse.json(
      { error: "Failed to send OTP. Please try again." },
      { status: 500 }
    );
  }
}