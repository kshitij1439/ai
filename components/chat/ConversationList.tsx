"use client";

import { motion } from "framer-motion";
import { MessageSquare, Clock, ChevronRight } from "lucide-react";

interface Conversation {
    id: string;
    title: string | null;
    model: string;
    createdAt: string;
}

interface ConversationListProps {
    conversations: Conversation[];
    selectedId: string | null;
    onSelect: (id: string) => void;
}

export default function ConversationList({
    conversations,
    selectedId,
    onSelect,
}: ConversationListProps) {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();
        const diffInHours = diffInMs / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return date.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
            });
        } else if (diffInHours < 48) {
            return "Yesterday";
        } else {
            return date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
            });
        }
    };

    if (conversations.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-8 text-center mt-10"
            >
                <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-zinc-800">
                    <MessageSquare className="w-8 h-8 text-zinc-600" />
                </div>
                <p className="text-zinc-400 text-sm font-medium">
                    No conversations yet
                </p>
                <p className="text-zinc-600 text-xs mt-1">
                    Start a new chat to begin
                </p>
            </motion.div>
        );
    }

    return (
        <div className="space-y-1 p-3">
            {conversations.map((conversation, index) => (
                <motion.button
                    key={conversation.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => onSelect(conversation.id)}
                    className={`
            group w-full p-4 rounded-xl text-left transition-all duration-200 border
            flex flex-col gap-2 relative overflow-hidden
            ${
                selectedId === conversation.id
                    ? "bg-zinc-800/80 border-zinc-700 shadow-md" // Selected: Professional Dark Grey
                    : "bg-transparent border-transparent hover:bg-zinc-900/50 hover:border-zinc-800/50" // Unselected
            }
          `}
                >
                    {/* Active Indicator Strip (Optional: adds a nice pro touch on the left) */}
                    {selectedId === conversation.id && (
                        <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-blue-500" />
                    )}

                    <div className="flex items-start justify-between w-full">
                        <div className="flex-1 min-w-0 pl-2">
                            <div className="flex items-center gap-2 mb-1.5">
                                <h3
                                    className={`font-medium text-sm truncate transition-colors ${
                                        selectedId === conversation.id
                                            ? "text-zinc-100"
                                            : "text-zinc-400 group-hover:text-zinc-200"
                                    }`}
                                >
                                    {conversation.title ||
                                        "Untitled Conversation"}
                                </h3>
                            </div>

                            <div className="flex items-center gap-3">
                                <span
                                    className={`text-[10px] px-2 py-0.5 rounded border uppercase tracking-wider font-medium ${
                                        selectedId === conversation.id
                                            ? "bg-black/30 border-zinc-600 text-zinc-300"
                                            : "bg-zinc-900 border-zinc-800 text-zinc-500 group-hover:border-zinc-700"
                                    }`}
                                >
                                    {conversation.model}
                                </span>

                                <div className="flex items-center gap-1.5">
                                    <Clock
                                        className={`w-3 h-3 ${
                                            selectedId === conversation.id
                                                ? "text-zinc-500"
                                                : "text-zinc-600"
                                        }`}
                                    />
                                    <span
                                        className={`text-[11px] ${
                                            selectedId === conversation.id
                                                ? "text-zinc-500"
                                                : "text-zinc-600"
                                        }`}
                                    >
                                        {formatDate(conversation.createdAt)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Subtle Chevron for active state or hover */}
                        <div
                            className={`
                flex items-center h-full pl-2 transition-opacity duration-200
                ${
                    selectedId === conversation.id
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-50"
                }
            `}
                        >
                            <ChevronRight className="w-4 h-4 text-zinc-500" />
                        </div>
                    </div>
                </motion.button>
            ))}
        </div>
    );
}
