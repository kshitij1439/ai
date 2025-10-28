
"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, Variants } from "framer-motion";
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Mail, Lock, LogIn, Loader2, Chrome } from "lucide-react";

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
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!email.trim() || !password.trim()) {
            setError("Email and password cannot be empty.");
            return;
        }

        setLoading(true);

        // 1. CREDENTIALS SIGN IN
        const res = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        if (!res?.error) {
            // Successful login
            router.push("/dashboard");
        } else {
            // Failed login
            setError("Invalid email or password. Please try again.");
            // Log the actual error for debugging, but show a generic message to the user
            console.error("Login Error:", res.error); 
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
                        <form onSubmit={handleLogin} className="space-y-6">
                            {/* Email Input */}
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

                            {/* Password Input */}
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
                            
                            {/* Error Message */}
                            {error && (
                                <motion.p 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    className="text-sm text-center text-red-500 bg-red-50 p-2 rounded-md border border-red-200"
                                >
                                    {error}
                                </motion.p>
                            )}
                            
                            {/* Login Button */}
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
                        
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                            <span>OR</span>
                            <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                        </div>

                        {/* Google Sign-in */}
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
