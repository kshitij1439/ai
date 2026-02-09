"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, Variants } from "framer-motion";
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Mail, Lock, LogIn, Loader2, Chrome, Shield } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const cardVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 50, 
    scale: 0.95 
  },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1, 
    transition: { 
      type: "spring", 
      stiffness: 100, 
      damping: 10 
    } 
  },
};

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [countdown, setCountdown] = useState(0);
    const router = useRouter();

    const handlePasswordLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!email.trim() || !password.trim()) {
            setError("Email and password cannot be empty.");
            return;
        }

        setLoading(true);

        const res = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        if (!res?.error) {
            router.push("/dashboard");
        } else {
            setError("Invalid email or password. Please try again.");
            console.error("Login Error:", res.error);
        }
        
        setLoading(false);
    };

    const handleRequestOTP = async () => {
        setError(null);

        if (!email.trim()) {
            setError("Please enter your email address.");
            return;
        }

        setOtpLoading(true);

        try {
            const res = await fetch("/api/auth/otp/request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim() }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to send OTP");
            }

            setOtpSent(true);
            setCountdown(60); // 60 second countdown
            
            // Start countdown timer
            const timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Failed to send OTP. Please try again.");
            }
        } finally {
            setOtpLoading(false);
        }
    };

    const handleOTPLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!email.trim() || !otp.trim()) {
            setError("Email and OTP are required.");
            return;
        }

        if (otp.length !== 6) {
            setError("OTP must be 6 digits.");
            return;
        }

        setLoading(true);

        const res = await signIn("otp", {
            email: email.trim(),
            otp: otp.trim(),
            redirect: false,
        });

        if (!res?.error) {
            router.push("/dashboard");
        } else {
            setError("Invalid or expired OTP. Please try again.");
            console.error("OTP Login Error:", res.error);
        }
        
        setLoading(false);
    };

    const handleGoogleSignIn = () => {
        signIn("google", { callbackUrl: "/dashboard" });
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
            <motion.div
                initial="hidden"
                animate="visible"
                variants={cardVariants}
                className="w-full max-w-md"
            >
                <Card className="shadow-2xl border-none">
                    <CardHeader className="text-center">
                        <LogIn className="mx-auto h-10 w-10 text-primary mb-2" />
                        <CardTitle className="text-3xl font-bold">Welcome Back</CardTitle>
                        <CardDescription>
                            Sign in to access your dashboard.
                        </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                        <Tabs defaultValue="password" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="password">Password</TabsTrigger>
                                <TabsTrigger value="otp">
                                    <Shield className="w-4 h-4 mr-1" />
                                    OTP
                                </TabsTrigger>
                            </TabsList>

                            {/* Password Login */}
                            <TabsContent value="password" className="space-y-4 mt-4">
                                <form onSubmit={handlePasswordLogin} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="m@example.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="pl-10"
                                                disabled={loading}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password">Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                id="password"
                                                type="password"
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="pl-10"
                                                disabled={loading}
                                                required
                                            />
                                        </div>
                                        <Button variant="link" size="sm" className="p-0 h-auto text-xs text-muted-foreground">
                                            Forgot Password?
                                        </Button>
                                    </div>
                                    
                                    {error && (
                                        <motion.p 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            className="text-sm text-center text-red-500 bg-red-50 p-2 rounded-md border border-red-200"
                                        >
                                            {error}
                                        </motion.p>
                                    )}
                                    
                                    <Button
                                        type="submit"
                                        disabled={loading || !email.trim() || !password.trim()}
                                        className="w-full h-10"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Logging In...
                                            </>
                                        ) : (
                                            "Log In"
                                        )}
                                    </Button>
                                </form>
                            </TabsContent>

                            {/* OTP Login */}
                            <TabsContent value="otp" className="space-y-4 mt-4">
                                <form onSubmit={handleOTPLogin} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email-otp">Email</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                id="email-otp"
                                                type="email"
                                                placeholder="m@example.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="pl-10"
                                                disabled={loading || otpSent}
                                                required
                                            />
                                        </div>
                                    </div>

                                    {!otpSent ? (
                                        <Button
                                            type="button"
                                            onClick={handleRequestOTP}
                                            disabled={otpLoading || !email.trim()}
                                            className="w-full h-10"
                                            variant="secondary"
                                        >
                                            {otpLoading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Sending OTP...
                                                </>
                                            ) : (
                                                <>
                                                    <Shield className="mr-2 h-4 w-4" />
                                                    Send OTP
                                                </>
                                            )}
                                        </Button>
                                    ) : (
                                        <>
                                            <div className="space-y-2">
                                                <Label htmlFor="otp">Enter OTP</Label>
                                                <Input
                                                    id="otp"
                                                    type="text"
                                                    placeholder="123456"
                                                    value={otp}
                                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                                    className="text-center text-2xl tracking-widest"
                                                    disabled={loading}
                                                    maxLength={6}
                                                    required
                                                />
                                                <p className="text-xs text-muted-foreground text-center">
                                                    OTP sent to {email}
                                                </p>
                                            </div>

                                            {error && (
                                                <motion.p 
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: "auto" }}
                                                    className="text-sm text-center text-red-500 bg-red-50 p-2 rounded-md border border-red-200"
                                                >
                                                    {error}
                                                </motion.p>
                                            )}

                                            <Button
                                                type="submit"
                                                disabled={loading || otp.length !== 6}
                                                className="w-full h-10"
                                            >
                                                {loading ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Verifying...
                                                    </>
                                                ) : (
                                                    "Verify & Login"
                                                )}
                                            </Button>

                                            <Button
                                                type="button"
                                                onClick={() => {
                                                    setOtpSent(false);
                                                    setOtp("");
                                                    setError(null);
                                                }}
                                                disabled={countdown > 0}
                                                variant="ghost"
                                                className="w-full"
                                            >
                                                {countdown > 0 ? `Resend OTP in ${countdown}s` : "Request New OTP"}
                                            </Button>
                                        </>
                                    )}
                                </form>
                            </TabsContent>
                        </Tabs>
                        
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                            <span>OR</span>
                            <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                        </div>

                        <Button
                            variant="outline"
                            onClick={handleGoogleSignIn}
                            className="w-full h-10 group"
                            disabled={loading}
                        >
                            <Chrome className="mr-2 h-4 w-4 text-red-500 group-hover:animate-pulse" />
                            Continue with Google
                        </Button>
                    </CardContent>

                    <CardFooter className="justify-center pt-4">
                        <p className="text-sm text-center text-muted-foreground">
                        Don&apos;t have an account?
                        {" "}
                            <Button variant="link" asChild className="p-0 h-auto">
                                <a href="/signup">Sign Up</a>
                            </Button>
                        </p>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    );
}