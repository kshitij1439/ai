// app/dashboard/DashboardClient.tsx
"use client";

import { signOut } from "next-auth/react";
import { Session } from "next-auth";
import { useState, useEffect } from "react";
import ConversationList from "@/components/chat/ConversationList";
import ChatWindow from "@/components/chat/ChatWindow";

interface DashboardClientProps {
    session: Session | null;
}

interface Conversation {
    id: string;
    title: string | null;
    model: string;
    createdAt: string;
}

export default function DashboardClient({ session }: DashboardClientProps) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversationId, setSelectedConversationId] = useState<
        string | null
    >(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (session?.user) {
            fetchConversations();
        }
    }, [session]);

    const fetchConversations = async () => {
        try {
            const res = await fetch("/api/conversations");
            if (res.ok) {
                const data = await res.json();
                // Filter conversations for current user
                const userConversations = data.filter(
                    (conv: any) => conv.userId === session?.user?.id
                );
                setConversations(userConversations);
            }
        } catch (error) {
            console.error("Failed to fetch conversations:", error);
        } finally {
            setLoading(false);
        }
    };

    const createNewConversation = async () => {
        if (!session?.user?.id) return;

        try {
            const res = await fetch("/api/conversations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: session.user.id,
                    model: "llama3",
                    title: "New Conversation",
                }),
            });

            if (res.ok) {
                const newConversation = await res.json();
                setConversations([newConversation, ...conversations]);
                setSelectedConversationId(newConversation.id);
            }
        } catch (error) {
            console.error("Failed to create conversation:", error);
        }
    };

    if (!session) {
        return (
            <div className="text-center mt-20">
                <p>{"You're not logged in."}</p>
                <a href="/login" className="text-blue-600 underline">
                    Go to login
                </a>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-800">
                            Conversations
                        </h2>
                        <button
                            onClick={() => signOut({ callbackUrl: "/login" })}
                            className="text-sm text-red-600 hover:text-red-700"
                        >
                            Logout
                        </button>
                    </div>
                    <p className="text-sm text-gray-600">
                        {session.user?.name || session.user?.email}
                    </p>
                </div>

                {/* New Conversation Button */}
                <div className="p-4">
                    <button
                        onClick={createNewConversation}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        + New Conversation
                    </button>
                </div>

                {/* Conversation List */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="p-4 text-center text-gray-500">
                            Loading...
                        </div>
                    ) : (
                        <ConversationList
                            conversations={conversations}
                            selectedId={selectedConversationId}
                            onSelect={setSelectedConversationId}
                        />
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
                {selectedConversationId ? (
                    <ChatWindow
                        conversationId={selectedConversationId}
                        userId={session.user.id || ""}
                    />
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400">
                        <div className="text-center">
                            <svg
                                className="w-16 h-16 mx-auto mb-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                />
                            </svg>
                            <p className="text-lg">
                                Select a conversation or start a new one
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
