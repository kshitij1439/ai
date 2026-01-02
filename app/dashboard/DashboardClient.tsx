// app/dashboard/DashboardClient.tsx
"use client";

import { signOut } from "next-auth/react";
import { Session } from "next-auth";
import { useState, useEffect } from "react";
import ConversationList from "@/components/chat/ConversationList";
import ChatWindow from "@/components/chat/ChatWindow";
import Loading from "../chat/[conversationId]/loading";

interface DashboardClientProps {
    session: Session | null;
}

interface Conversation {
    id: string;
    userId: string;
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
    const [sidebarOpen, setSidebarOpen] = useState(false);

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
                    (conv: Conversation) => conv.userId === session?.user?.id
                );
                setConversations(userConversations);
            }
        } catch (error) {
            console.error("Failed to fetch conversations:", error);
        } finally {
            setLoading(false);
        }
    };

    const createNewConversation = () => {
        setSelectedConversationId(null); // draft mode
    };

    const handleSelectConversation = (id: string) => {
        setSelectedConversationId(id);
        setSidebarOpen(false); // Close sidebar on mobile after selecting
    };

    const handleUpdateConversation = async (id: string, newTitle: string) => {
        try {
            const res = await fetch(`/api/conversations/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: newTitle }),
            });

            if (res.ok) {
                const updated = await res.json();
                setConversations((prev) =>
                    prev.map((conv) =>
                        conv.id === id
                            ? { ...conv, title: updated.title }
                            : conv
                    )
                );
            } else {
                const error = await res.json();
                console.error("Failed to update conversation:", error);
                alert(error.error || "Failed to update conversation");
            }
        } catch (error) {
            console.error("Failed to update conversation:", error);
            alert("Failed to update conversation");
        }
    };

    if (!session) {
        return (
            <div className="text-center mt-20 px-4">
                <p className="text-gray-200">{"You're not logged in."}</p>
                <a
                    href="/login"
                    className="text-blue-400 underline hover:text-blue-300"
                >
                    Go to login
                </a>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-black overflow-hidden text-gray-100">
            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-20 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div
                className={`
        fixed lg:relative inset-y-0 left-0 z-30
        w-80 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
        bg-black border-r border-zinc-800
    `}
            >
                {/* Header */}
                <div className="p-4 border-b border-zinc-800">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                            Conversations
                        </h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() =>
                                    signOut({ callbackUrl: "/login" })
                                }
                                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-2 py-1 rounded hover:bg-zinc-900"
                            >
                                Logout
                            </button>
                            {/* Close button for mobile */}
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="lg:hidden text-zinc-400 hover:text-zinc-100"
                            >
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* User Profile Card - Professional Look */}
                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                        <div className="w-6 h-6 rounded bg-gradient-to-tr from-zinc-700 to-zinc-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-[10px] font-bold text-white">
                                {session.user?.name?.[0]?.toUpperCase() || "U"}
                            </span>
                        </div>
                        <p className="text-xs text-zinc-300 truncate font-medium">
                            {session.user?.name || session.user?.email}
                        </p>
                    </div>
                </div>

                {/* New Conversation Button */}
                <div className="p-4">
                    <button
                        onClick={createNewConversation}
                        className="group w-full px-4 py-2.5 bg-zinc-100 hover:bg-white text-zinc-900 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                        <span className="text-lg leading-none mb-0.5">+</span>
                        <span>New Chat</span>
                    </button>
                </div>

                {/* Conversation List */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <SkeletonLoader />
                    ) : conversations.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <ConversationList
                            conversations={conversations}
                            selectedId={selectedConversationId}
                            onSelect={handleSelectConversation}
                            onUpdate={handleUpdateConversation}
                        />
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col w-full lg:w-auto bg-black">
                {/* Mobile Header */}
                {selectedConversationId && (
                    <div className="absolute z-10 top-0 lg:hidden flex items-center gap-3 p-4 bg-gray-900 border-b border-gray-800">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="text-gray-400 hover:text-white"
                        >
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            </svg>
                        </button>
                    </div>
                )}

                {/* {selectedConversationId ? ( */}
                <ChatWindow
                    key={selectedConversationId ?? "draft"}
                    conversationId={selectedConversationId}
                    userId={session.user.id}
                    onConversationCreated={(id) => {
                        setSelectedConversationId(id);
                        fetchConversations();
                    }}
                />

                {/* )} */}
            </div>
        </div>
    );
}

// Skeleton Loader
function SkeletonLoader() {
    return (
        <div className="p-3 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
                <div
                    key={i}
                    className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50 animate-pulse"
                >
                    <div className="h-4 bg-zinc-800 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-zinc-800 rounded w-1/2"></div>
                </div>
            ))}
        </div>
    );
}

// Empty State
function EmptyState() {
    return (
        <div className="p-8 text-center mt-10">
            <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-zinc-800">
                <svg
                    className="w-8 h-8 text-zinc-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                </svg>
            </div>
            <p className="text-zinc-400 text-sm font-medium">
                No conversations yet
            </p>
            <p className="text-zinc-600 text-xs mt-1">
                Start a new chat to begin
            </p>
        </div>
    );
}
