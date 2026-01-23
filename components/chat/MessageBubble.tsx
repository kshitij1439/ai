"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";

interface SearchSource {
    title: string;
    url: string;
    snippet: string;
}

interface Message {
    id: string;
    role: string;
    content: string;
    createdAt: string;
    sources?: SearchSource[];
}

interface MessageBubbleProps {
    message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
    const isUser = message.role === "user";

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
        });
    };

    // Process content to replace <1>, <2>, <3> with actual source links
    const addSourceLinks = (content: string, sources?: SearchSource[]) => {
        if (!sources || sources.length === 0) return content;

        let result = content;

        // Replace <1>, <2>, <3> etc. with markdown links
        sources.forEach((source, idx) => {
            const hasUrl = source.url && source.url.trim() !== "";
            const citationPattern = new RegExp(`<${idx + 1}>`, "g");

            if (hasUrl) {
                result = result.replace(
                    citationPattern,
                    `[<${idx + 1}>](${source.url} "${source.title}")`
                );
            } else {
                // Keep the citation but make it non-clickable
                result = result.replace(
                    citationPattern,
                    `<sup class="text-blue-400">[${idx + 1}]</sup>`
                );
            }
        });

        return result;
    };

    const processedContent = addSourceLinks(message.content, message.sources);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={`flex ${isUser ? "justify-end" : "justify-start"} my-2`}
        >
            <div
                className={`flex gap-3 max-w-[80%] ${
                    isUser ? "flex-row-reverse" : "flex-row"
                }`}
            >
                {/* Avatar */}
                <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isUser ? "bg-blue-600" : "bg-purple-600"
                    }`}
                >
                    <span className="text-white text-sm font-medium">
                        {isUser ? "U" : "AI"}
                    </span>
                </div>

                {/* Message Bubble */}
                <div className="flex flex-col min-w-0">
                    <div
                        className={`rounded-lg px-4 py-3 text-sm leading-relaxed overflow-x-auto ${
                            isUser
                                ? "bg-gray-700 text-gray-100"
                                : "bg-gray-800/80 text-gray-100 border border-gray-700"
                        }`}
                    >
                        <ReactMarkdown
                            components={{
                                code({
                                    className,
                                    children,
                                    node,
                                    ref,
                                    ...props
                                }) {
                                    const match = /language-(\w+)/.exec(
                                        className || ""
                                    );
                                    return match ? (
                                        <div className="overflow-x-auto my-2">
                                            <SyntaxHighlighter
                                                style={atomOneDark}
                                                language={match[1]}
                                                PreTag="div"
                                                showLineNumbers
                                                customStyle={{
                                                    margin: 0,
                                                    borderRadius: "0.375rem",
                                                    fontSize: "0.875rem",
                                                }}
                                                codeTagProps={{
                                                    style: {
                                                        whiteSpace: "pre",
                                                    },
                                                }}
                                            >
                                                {String(children).replace(
                                                    /\n$/,
                                                    ""
                                                )}
                                            </SyntaxHighlighter>
                                        </div>
                                    ) : (
                                        <code
                                            className={`px-1 py-0.5 rounded whitespace-nowrap ${
                                                isUser
                                                    ? "bg-blue-700 text-blue-100"
                                                    : "bg-black/50 text-gray-200"
                                            }`}
                                            {...props}
                                        >
                                            {children}
                                        </code>
                                    );
                                },
                                pre({ children, ...props }) {
                                    return (
                                        <pre
                                            className="overflow-x-auto"
                                            {...props}
                                        >
                                            {children}
                                        </pre>
                                    );
                                },
                                p({ children, ...props }) {
                                    return (
                                        <p
                                            className="mb-2 last:mb-0"
                                            {...props}
                                        >
                                            {children}
                                        </p>
                                    );
                                },
                                ul({ children, ...props }) {
                                    return (
                                        <ul
                                            className="list-disc list-inside mb-2"
                                            {...props}
                                        >
                                            {children}
                                        </ul>
                                    );
                                },
                                ol({ children, ...props }) {
                                    return (
                                        <ol
                                            className="list-decimal list-inside mb-2"
                                            {...props}
                                        >
                                            {children}
                                        </ol>
                                    );
                                },
                                strong({ children, ...props }) {
                                    return (
                                        <strong
                                            className="font-semibold text-gray-100"
                                            {...props}
                                        >
                                            {children}
                                        </strong>
                                    );
                                },
                                a({ href, children, ...props }) {
                                    // Check if this is a source citation link
                                    const isCitation =
                                        typeof children === "string" &&
                                        children.match(/<\d+>/);

                                    return (
                                        <a
                                            href={href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`${
                                                isCitation
                                                    ? "text-blue-400 hover:text-blue-300 no-underline font-semibold text-xs align-super hover:underline"
                                                    : "text-blue-400 hover:text-blue-300 underline inline-flex items-center gap-1 hover:gap-1.5 transition-all"
                                            }`}
                                            title={props.title}
                                            {...props}
                                        >
                                            {children}
                                            {!isCitation && (
                                                <ExternalLink className="w-3 h-3 inline" />
                                            )}
                                        </a>
                                    );
                                },
                            }}
                        >
                            {processedContent}
                        </ReactMarkdown>
                    </div>

                    <span
                        className={`text-xs text-gray-500 mt-1 ${
                            isUser ? "text-right" : "text-left"
                        }`}
                    >
                        {formatTime(message.createdAt)}
                    </span>
                </div>
            </div>
        </motion.div>
    );
}
