"use client";

import { motion } from "framer-motion";
import { MessageSquare, Clock } from "lucide-react";

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
        className="p-6 text-center"
      >
        <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-gray-400 text-sm">No conversations yet</p>
        <p className="text-gray-300 text-xs mt-1">Start a new one!</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-2 p-3">
      {conversations.map((conversation, index) => (
        <motion.button
          key={conversation.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ scale: 1.02, x: 4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect(conversation.id)}
          className={`w-full p-4 rounded-xl text-left transition-all group ${
            selectedId === conversation.id
              ? "bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg shadow-blue-500/30"
              : "hover:bg-gray-50 border border-transparent hover:border-gray-200"
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare
                  className={`w-4 h-4 flex-shrink-0 ${
                    selectedId === conversation.id
                      ? "text-white"
                      : "text-blue-500"
                  }`}
                />
                <h3
                  className={`font-semibold truncate ${
                    selectedId === conversation.id
                      ? "text-white"
                      : "text-gray-800 group-hover:text-blue-600"
                  }`}
                >
                  {conversation.title || "Untitled Conversation"}
                </h3>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    selectedId === conversation.id
                      ? "bg-white/20 text-white"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {conversation.model}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 ml-2 flex-shrink-0">
              <Clock
                className={`w-3 h-3 ${
                  selectedId === conversation.id
                    ? "text-white/70"
                    : "text-gray-400"
                }`}
              />
              <span
                className={`text-xs ${
                  selectedId === conversation.id
                    ? "text-white/70"
                    : "text-gray-400"
                }`}
              >
                {formatDate(conversation.createdAt)}
              </span>
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  );
}