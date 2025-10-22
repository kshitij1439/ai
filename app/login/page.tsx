"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (!res?.error) router.push("/dashboard");
    else alert("Invalid credentials");
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <form onSubmit={handleLogin} className="flex flex-col gap-2 w-72">
        <input
          type="email"
          placeholder="Email"
          className="border p-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="border p-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className="bg-black text-white py-2 rounded">
          Login
        </button>
      </form>

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
