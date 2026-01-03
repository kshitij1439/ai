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
    conversationId: string | null;
    userId: string;
    onConversationCreated: (id: string) => void;
}

export default function ChatWindow({
    conversationId,
    userId,
    onConversationCreated,
}: ChatWindowProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch messages ONLY if conversation exists
    useEffect(() => {
        if (!conversationId) {
            setMessages([]);
            return;
        }
        fetchMessages(conversationId);
    }, [conversationId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const fetchMessages = async (id: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/conversations/${id}/messages`);
            if (res.ok) {
                setMessages(await res.json());
            }
        } catch (e) {
            console.error("Failed to fetch messages:", e);
        } finally {
            setLoading(false);
        }
    };
    const sendMessage = async (content: string) => {
        if (!content.trim() || sending) return;
        setSending(true);
    
        let activeConversationId = conversationId;
    
        if (!activeConversationId) {
            const res = await fetch("/api/conversations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    model: "llama3",
                }),
            });
    
            const conversation = await res.json();
            activeConversationId = conversation.id;
            onConversationCreated(activeConversationId as string);
        }
    
        if (!activeConversationId) {
            throw new Error("Conversation ID missing after creation");
        }
    
        const tempMessage: Message = {
            id: `temp-${Date.now()}`,
            role: "user",
            content,
            createdAt: new Date().toISOString(),
        };
    
        setMessages((prev) => [...prev, tempMessage]);
    
        try {
            const res = await fetch(
                `/api/conversations/${activeConversationId}/messages`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ role: "user", content }),
                }
            );
    
            if (res.ok) {
                const data = await res.json();
                setMessages((prev) =>
                    prev
                        .filter((m) => m.id !== tempMessage.id)
                        .concat(data.user, data.assistant)
                        .filter(Boolean)
                );
            }
        } catch (e) {
            console.error("Send failed:", e);
            setMessages((prev) =>
                prev.filter((m) => m.id !== tempMessage.id)
            );
        } finally {
            setSending(false);
        }
    };
    

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col bg-gray-900/50 backdrop-blur-sm min-h-screen"
        >
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-center">
                        <Bot className="w-20 h-20 text-purple-400 mb-4" />
                        <p className="text-gray-400">
                            Send a message to begin
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6 max-w-4xl mx-auto">
                        <AnimatePresence>
                            {messages.map((m) => (
                                <MessageBubble key={m.id} message={m} />
                            ))}
                        </AnimatePresence>
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            <div className="sticky bottom-0 px-6 pb-6">
                <MessageInput onSend={sendMessage} disabled={sending} />
            </div>
        </motion.div>
    );
}
