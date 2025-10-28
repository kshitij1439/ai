"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { signIn } from "next-auth/react"; 
import { motion, Variants } from "framer-motion"; 
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Mail, Lock, User, Loader2, UserPlus, Chrome } from "lucide-react";

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
export default function SignupPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const router = useRouter();

    const handleSignup = async () => {
        if (!email.trim() || !password.trim()) {
            setMessage("Email and password are required.");
            return;
        }
        if (password.length < 8) {
            setMessage("Password must be at least 8 characters long.");
            return;
        }

        setLoading(true);
        setMessage("");

        try {
            // 1. SIGNUP API CALL
            const res = await fetch("/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Signup failed. Please try again.");
            }

            // 2. AUTO-LOGIN API CALL (Keeping your original API-based login flow)
            const loginRes = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim(), password }),
            });
            const loginData = await loginRes.json();

            if (loginRes.ok) {
                // Set state and storage
                const { token, user } = loginData;
                localStorage.setItem("token", token);
                localStorage.setItem("user", JSON.stringify(user));
                useAuthStore.getState().setToken(token);
                useAuthStore.getState().setUser(user);
                
                router.push("/dashboard");
            } else {
                // If auto-login fails, still show the user a success message for signup but direct them to login
                setMessage("Account created successfully. Please log in.");
                router.push("/login");
            }

        } catch (err) {
            if (err instanceof Error) {
                setMessage(err.message);
            } else {
                setMessage("An unexpected error occurred.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = () => {
        // next-auth function for provider login
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
                        <UserPlus className="mx-auto h-10 w-10 text-primary mb-2" />
                        <CardTitle className="text-3xl font-bold">Create Your Account</CardTitle>
                        <CardDescription>
                            Enter your details below to get started.
                        </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                        {/* Name Input */}
                        <div className="space-y-2">
                            <Label htmlFor="name">Name (optional)</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="name"
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

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
                                    required
                                />
                            </div>
                        </div>

                        {/* Error/Message Display */}
                        {message && (
                            <motion.p 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="text-sm text-center text-red-500 bg-red-50 p-2 rounded-md border border-red-200"
                            >
                                {message}
                            </motion.p>
                        )}
                        
                        {/* Signup Button */}
                        <Button
                            onClick={handleSignup}
                            disabled={loading || !email.trim() || !password.trim()}
                            className="w-full h-10"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating Account...
                                </>
                            ) : (
                                "Sign Up"
                            )}
                        </Button>
                        
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
                        >
                            <Chrome className="mr-2 h-4 w-4 text-red-500 group-hover:animate-pulse" />
                            Continue with Google
                        </Button>
                    </CardContent>

                    <CardFooter className="justify-center pt-4">
                        <p className="text-sm text-center text-muted-foreground">
                            Already have an account?{" "}
                            <Button variant="link" asChild className="p-0 h-auto">
                                <a href="/login">Log in</a>
                            </Button>
                        </p>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    );
}
