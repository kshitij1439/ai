"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import { Bot, Loader2 } from "lucide-react";
import { AIModel } from "@/lib/ai/modelTypes";

interface Message {
    id: string;
    role: string;
    content: string;
    createdAt: string;
}

interface ChatWindowProps {
    conversationId: string | null;
    userId: string;
    selectedModel: AIModel;
    onConversationCreated: (id: string) => void;
    onMessageSent?: () => void;
}

export default function ChatWindow({
    conversationId,
    userId,
    selectedModel,
    onConversationCreated,
    onMessageSent,
}: ChatWindowProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const previousConversationIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (!conversationId) {
            if (previousConversationIdRef.current !== null) {
                setMessages([]);
            }
            previousConversationIdRef.current = null;
            return;
        }

        const isNewConversationTransition =
            previousConversationIdRef.current === null && conversationId;

        if (!isNewConversationTransition || messages.length === 0) {
            if (conversationId !== previousConversationIdRef.current) {
                fetchMessages(conversationId);
            }
        }

        previousConversationIdRef.current = conversationId;
    }, [conversationId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const fetchMessages = async (id: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/conversations/${id}/messages`);
            if (res.ok) {
                const fetchedMessages = await res.json();
                setMessages(fetchedMessages);
            } else {
                console.error("Failed to fetch messages, status:", res.status);
            }
        } catch (e) {
            console.error("Failed to fetch messages:", e);
        } finally {
            setLoading(false);
        }
    };

    const sendMessage = async (
        content: string,
        model: AIModel,
        webSearchEnabled: boolean
    ) => {
        if (!content.trim() || sending) return;
        setSending(true);

        let activeConversationId = conversationId;
        let isNewConversation = false;

        if (!activeConversationId) {
            try {
                const res = await fetch("/api/conversations", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        userId,
                        model: model,
                    }),
                });

                if (!res.ok) {
                    throw new Error("Failed to create conversation");
                }

                const conversation = await res.json();
                activeConversationId = conversation.id;
                isNewConversation = true;
            } catch (e) {
                console.error("Failed to create conversation:", e);
                setSending(false);
                alert("Failed to create conversation. Please try again.");
                return;
            }
        }

        if (!activeConversationId) {
            setSending(false);
            return;
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
                    body: JSON.stringify({
                        role: "user",
                        content,
                        model: model,
                        webSearchEnabled,
                    }),
                }
            );

            if (!res.ok) {
                throw new Error("Failed to send message");
            }

            const data = await res.json();

            setMessages((prev) => {
                const withoutTemp = prev.filter((m) => m.id !== tempMessage.id);
                const newMessages = [];

                if (data.user) {
                    newMessages.push(data.user);
                }
                if (data.assistant) {
                    newMessages.push(data.assistant);
                }

                return [...withoutTemp, ...newMessages];
            });

            if (isNewConversation) {
                setTimeout(() => {
                    onConversationCreated(activeConversationId as string);
                }, 100);
            }

            if (onMessageSent) {
                setTimeout(
                    () => {
                        onMessageSent();
                    },
                    isNewConversation ? 500 : 300
                );
            }
        } catch (e) {
            console.error("Send failed:", e);
            setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
            alert("Failed to send message. Please try again.");
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
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <Bot className="w-20 h-20 text-purple-400 mb-4" />
                        <p className="text-gray-400">Send a message to begin</p>
                        <p className="text-gray-600 text-sm mt-2">
                            Using: {selectedModel}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6 max-w-4xl mx-auto">
                        {messages.map((m) => (
                            <MessageBubble key={m.id} message={m} />
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            <div className="sticky bottom-0 px-6 pb-6">
                <MessageInput
                    onSend={sendMessage}
                    disabled={sending}
                    currentModel={selectedModel}
                    onModelChange={() => {}}
                />
            </div>
        </motion.div>
    );
}
