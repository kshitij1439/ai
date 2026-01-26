"use client";

import { useState, KeyboardEvent, useRef, useEffect } from "react";
import { Send, Loader2, Sparkles, Globe } from "lucide-react";
import { AIModel } from "@/lib/ai/modelTypes";

interface MessageInputProps {
    onSend: (
        message: string,
        model: AIModel,
        webSearchEnabled: boolean
    ) => void;
    disabled?: boolean;
    currentModel: AIModel;
    onModelChange: (model: AIModel) => void;
}

export default function MessageInput({
    onSend,
    disabled,
    currentModel,
    onModelChange,
}: MessageInputProps) {
    const [message, setMessage] = useState("");
    const [webSearchEnabled, setWebSearchEnabled] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.min(
                textareaRef.current.scrollHeight,
                200
            )}px`;
        }
    }, [message]);

    const handleSend = () => {
        if (message.trim() && !disabled) {
            onSend(message, currentModel, webSearchEnabled);
            setMessage("");
            if (textareaRef.current) {
                textareaRef.current.style.height = "auto";
            }
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="max-w-4xl mx-auto w-full space-y-2">
            <div className="relative flex items-end gap-2 bg-gray-800/50 border border-gray-700 rounded-2xl p-2 shadow-lg backdrop-blur-sm">
                <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message... (Shift+Enter for new line)"
                    disabled={disabled}
                    className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none resize-none disabled:cursor-not-allowed px-3 py-3 min-h-[56px] max-h-[200px]"
                    rows={1}
                />

                <div className="flex items-center gap-2 mb-1">
                    <button
                        onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                        disabled={disabled}
                        className={`flex-shrink-0 p-3 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 ${
                            webSearchEnabled
                                ? "bg-blue-600 text-white hover:bg-blue-500"
                                : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        title={
                            webSearchEnabled
                                ? "Web search enabled"
                                : "Enable web search"
                        }
                    >
                        <Globe className="w-5 h-5" />
                    </button>

                    <button
                        onClick={handleSend}
                        disabled={disabled || !message.trim()}
                        className="flex-shrink-0 p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95"
                        title={disabled ? "Sending..." : "Send message (Enter)"}
                    >
                        {disabled ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </button>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-700">
                        Enter
                    </kbd>
                    <span>to send</span>
                    <span className="text-gray-600">•</span>
                    <kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-700">
                        Shift + Enter
                    </kbd>
                    <span>for new line</span>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Sparkles className="w-3 h-3" />
                    <span>Powered by {currentModel}</span>
                </div>
            </div>
        </div>
    );
}
