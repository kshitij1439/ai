"use client";

import { motion } from "framer-motion";
import {
    MessageSquare,
    Clock,
    ChevronRight,
    Edit2,
    Check,
    X,
    Trash2,
} from "lucide-react";
import React, { useState } from "react";

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
    onUpdate: (id: string, newTitle: string) => void;
    onDelete: (id: string) => void;
}

export default function ConversationList({
    conversations,
    selectedId,
    onSelect,
    onUpdate,
    onDelete,
}: ConversationListProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [deleteConverstaion, setDeleteConverstaion] = useState(false);
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

    const handleEditClick = (
        conversation: Conversation,
        e: React.MouseEvent
    ) => {
        e.stopPropagation();
        setEditingId(conversation.id);
        setEditTitle(conversation.title || "");
    };
    const handleDeleteClick = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(id);
    };

    const handleSave = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (editTitle.trim()) {
            await onUpdate(id, editTitle.trim());
        }
        setEditingId(null);
        setEditTitle("");
    };

    const handleCancel = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingId(null);
        setEditTitle("");
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
                <motion.div
                    key={conversation.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className={`
                        group w-full rounded-xl transition-all duration-200 border relative overflow-hidden
                        ${
                            selectedId === conversation.id
                                ? "bg-zinc-800/80 border-zinc-700 shadow-md"
                                : "bg-transparent border-transparent hover:bg-zinc-900/50 hover:border-zinc-800/50"
                        }
                    `}
                >
                    {editingId === conversation.id ? (
                        <div
                            className="p-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex flex-col gap-2">
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) =>
                                        setEditTitle(e.target.value)
                                    }
                                    disabled={isGenerating}
                                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
                                    placeholder={
                                        isGenerating
                                            ? "AI is generating title..."
                                            : "Enter title"
                                    }
                                    autoFocus
                                />
                                {isGenerating && (
                                    <p className="text-xs text-zinc-500 flex items-center gap-2">
                                        <span className="animate-spin">⏳</span>
                                        AI is suggesting a title...
                                    </p>
                                )}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) =>
                                            handleSave(conversation.id, e)
                                        }
                                        disabled={
                                            isGenerating || !editTitle.trim()
                                        }
                                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white text-xs rounded-lg transition-colors"
                                    >
                                        <Check className="w-3 h-3" />
                                        Save
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        disabled={isGenerating}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 text-zinc-300 text-xs rounded-lg transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div
                            onClick={() => onSelect(conversation.id)}
                            className="w-full p-4 text-left flex flex-col gap-2 cursor-pointer"
                        >
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
                                                    selectedId ===
                                                    conversation.id
                                                        ? "text-zinc-500"
                                                        : "text-zinc-600"
                                                }`}
                                            />
                                            <span
                                                className={`text-[11px] ${
                                                    selectedId ===
                                                    conversation.id
                                                        ? "text-zinc-500"
                                                        : "text-zinc-600"
                                                }`}
                                            >
                                                {formatDate(
                                                    conversation.createdAt
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 pl-2">
                                    <button
                                        onClick={(e) =>
                                            handleEditClick(conversation, e)
                                        }
                                        className={`p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 ${
                                            selectedId === conversation.id
                                                ? "hover:bg-zinc-700 text-zinc-400"
                                                : "hover:bg-zinc-800 text-zinc-500"
                                        }`}
                                        title="Edit title (AI-assisted)"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={(e) =>
                                            handleDeleteClick(
                                                conversation.id,
                                                e
                                            )
                                        }
                                        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100
               hover:bg-red-900/40 text-red-500 transition-all"
                                        title="Delete conversation"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                    <div
                                        className={`transition-opacity duration-200 ${
                                            selectedId === conversation.id
                                                ? "opacity-100"
                                                : "opacity-0 group-hover:opacity-50"
                                        }`}
                                    >
                                        <ChevronRight className="w-4 h-4 text-zinc-500" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            ))}
        </div>
    );
}
