
"use client";

import React from "react";
import { Lock } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface UnauthorizedProps {
    title?: string;
    message?: string;
    buttonText?: string;
    href?: string;
}

const Unauthorized = ({
    title = "Access Denied",
    message = "Please sign in to access your dashboard.",
    buttonText = "Sign In",
    href = "/login",
}: UnauthorizedProps) => {
    return (
        <div className="flex min-h-screen items-center justify-center bg-black px-4">
            <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="w-full max-w-md rounded-2xl border border-zinc-800
                   bg-zinc-900/50 p-10 text-center
                   backdrop-blur-md shadow-2xl"
            >
                {/* Icon */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="mx-auto mb-6 flex h-16 w-16 items-center
                     justify-center rounded-xl border
                     border-zinc-700/50 bg-zinc-800/50"
                >
                    <Lock className="h-8 w-8 text-zinc-400" />
                </motion.div>

                {/* Text */}
                <h2 className="mb-3 text-2xl font-semibold tracking-tight text-white">
                    {title}
                </h2>

                <p className="mb-10 text-sm leading-relaxed text-zinc-500">
                    {message}
                </p>

                {/* Action */}
                <Button
                    asChild
                    className="w-full bg-zinc-100 text-zinc-900
                     hover:bg-white font-semibold
                     active:scale-[0.98] transition"
                >
                    <a href={href}>{buttonText}</a>
                </Button>
            </motion.div>
        </div>
    );
};

export default Unauthorized;
