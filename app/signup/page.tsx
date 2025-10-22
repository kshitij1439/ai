"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { signIn } from "next-auth/react";

export default function SignupPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const router = useRouter();

    const handleSignup = async () => {
        if (!email || !password) {
            setMessage("Email and password required");
            return;
        }

        setLoading(true);
        setMessage("");

        try {
            const res = await fetch("/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Signup failed");

            const loginRes = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const loginData = await loginRes.json();

            if (loginRes.ok) {
                localStorage.setItem("token", loginData.token);
                localStorage.setItem("user", JSON.stringify(loginData.user));
                useAuthStore.getState().setToken(loginData.token);
                useAuthStore.getState().setUser(loginData.user);
                router.push("/dashboard");
            } else {
                setMessage(loginData.error || "Login failed after signup");
            }
        } catch (err) {
            if (err instanceof Error) {
                setMessage(err.message);
            } else {
                setMessage(String(err));
            }
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
            <h1 className="text-2xl font-semibold">Create an Account</h1>
            <input
                className="border p-2 rounded w-64"
                placeholder="Name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            <input
                className="border p-2 rounded w-64"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <input
                className="border p-2 rounded w-64"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />

            <button
                onClick={handleSignup}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-60"
            >
                {loading ? "Creating Account..." : "Sign Up"}
            </button>

            {message && <p className="text-red-500 text-sm">{message}</p>}

            <p className="text-sm">
                Already have an account?{" "}
                <a href="/login" className="text-blue-600 underline">
                    Log in
                </a>
            </p>
            <div className="flex items-center gap-2">
        <span>or</span>
      </div>

      <button
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
        className="bg-red-500 text-white px-4 py-2 rounded"
      >
        Continue with Google
      </button>
        </div>
    );
}
