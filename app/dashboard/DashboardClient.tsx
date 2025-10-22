// DashboardClient.tsx
"use client";

import { signOut } from "next-auth/react";
import { Session } from "next-auth";

interface DashboardClientProps {
  session: Session | null;
}

export default function DashboardClient({ session }: DashboardClientProps) {
  if (!session)
    return (
      <div className="text-center mt-20">
        <p>You’re not logged in.</p>
        <a href="/login" className="text-blue-600 underline">
          Go to login
        </a>
      </div>
    );

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">
        Welcome, {session.user?.name || session.user?.email} 👋
      </h1>
      <p className="text-gray-600 mt-2">
        You’re authenticated via{" "}
        {session.user?.email?.includes("@gmail.com") ? "Google" : "Credentials"}.
      </p>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="px-4 py-2 bg-red-600 text-white rounded mt-4"
      >
        Logout
      </button>
    </div>
  );
}
