"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import { Bot, Loader2 } from "lucide-react";

interface Message {
    id: string;
    role: string;
    content: string;
    createdAt: string;
}

interface ChatWindowProps {
    conversationId: string;
    userId: string;
}

export default function ChatWindow({
    conversationId,
    userId,
}: ChatWindowProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchMessages();
    }, [conversationId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `/api/conversations/${conversationId}/messages`
            );
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
            }
        } catch (error) {
            console.error("Failed to fetch messages:", error);
        } finally {
            setLoading(false);
        }
    };

    const sendMessage = async (content: string) => {
        if (!content.trim() || sending) return;

        setSending(true);

        const tempUserMessage: Message = {
            id: `temp-${Date.now()}`,
            role: "user",
            content,
            createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, tempUserMessage]);

        try {
            const res = await fetch(
                `/api/conversations/${conversationId}/messages`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        role: "user",
                        content,
                    }),
                }
            );

            if (res.ok) {
                const data = await res.json();
                setMessages((prev) => {
                    const filtered = prev.filter(
                        (m) => m.id !== tempUserMessage.id
                    );
                    const newMessages = [];
                    if (data.user) newMessages.push(data.user);
                    if (data.assistant) newMessages.push(data.assistant);
                    return [...filtered, ...newMessages];
                });
            } else {
                setMessages((prev) =>
                    prev.filter((m) => m.id !== tempUserMessage.id)
                );
                alert("Failed to send message");
            }
        } catch (error) {
            console.error("Failed to send message:", error);
            setMessages((prev) =>
                prev.filter((m) => m.id !== tempUserMessage.id)
            );
            alert("Failed to send message");
        } finally {
            setSending(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            // Dark transparent background
            // className="flex flex-col bg-gray-900/50 backdrop-blur-sm h-full"
            className="flex flex-col bg-gray-900/50 backdrop-blur-sm min-h-screen"
        >
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-0">
                {loading ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center justify-center h-full"
                    >
                        <div className="text-center">
                            {/* Lighter purple for dark mode */}
                            <Loader2 className="w-12 h-12 mx-auto text-purple-400 animate-spin mb-3" />
                            <p className="text-gray-400">Loading messages...</p>
                        </div>
                    </motion.div>
                ) : messages.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-center h-full"
                    >
                        <div className="text-center">
                            <motion.div
                                animate={{
                                    scale: [1, 1.1, 1],
                                    rotate: [0, 10, -10, 0],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                }}
                            >
                                <Bot className="w-20 h-20 mx-auto text-purple-400 mb-4" />
                            </motion.div>
                            <p className="text-lg text-gray-200 font-medium">
                                Start the conversation
                            </p>
                            <p className="text-sm text-gray-500 mt-2">
                                Send a message to begin
                            </p>
                        </div>
                    </motion.div>
                ) : (
                    <div className="space-y-6 max-w-4xl mx-auto">
                        <AnimatePresence initial={false}>
                            {messages.map((message) => (
                                <MessageBubble
                                    key={message.id}
                                    message={message}
                                />
                            ))}
                        </AnimatePresence>
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input Area Wrapper */}
            <motion.div
                className="
                  sticky bottom-0
                   sm:pb-6 px-6
                  flex-shrink-0
                "
            >
                <div className="relative w-full ">
                    <MessageInput onSend={sendMessage} disabled={sending} />
                </div>
            </motion.div>
        </motion.div>
    );
}