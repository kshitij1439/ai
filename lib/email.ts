// lib/email.ts
import { Resend } from 'resend';

export async function sendOTPEmail(email: string, otp: string) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: email,
      subject: 'Your Login OTP Code',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">Login Verification</h1>
            </div>
            
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; margin-bottom: 20px;">Hello,</p>
              
              <p style="font-size: 16px; margin-bottom: 20px;">
                You requested to log in to your account. Use the verification code below:
              </p>
              
              <div style="background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
                <p style="font-size: 14px; color: #666; margin: 0 0 10px 0;">Your OTP Code</p>
                <p style="font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; margin: 0;">
                  ${otp}
                </p>
              </div>
              
              <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
                This code will expire in <strong>10 minutes</strong>.
              </p>
              
              <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
                If you didn't request this code, please ignore this email.
              </p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      throw new Error('Failed to send OTP email');
    }

    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('Failed to send OTP email');
  }
}