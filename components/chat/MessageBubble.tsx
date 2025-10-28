"use client";

interface Message {
  id: string;
  role: string;
  content: string;
  createdAt: string;
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

  return (
    <div className={` flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`flex gap-3 max-w-[80%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        {/* Avatar */}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            isUser ? "bg-blue-600" : "bg-gray-600"
          }`}
        >
          <span className="text-white text-sm font-medium">
            {isUser ? "U" : "AI"}
          </span>
        </div>

        {/* Message Content */}
        <div className="flex flex-col">
          <div
            className={`rounded-lg px-4 py-2 ${
              isUser
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-800 border border-gray-200"
            }`}
          >
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          </div>
          <span
            className={`text-xs text-gray-400 mt-1 ${
              isUser ? "text-right" : "text-left"
            }`}
          >
            {formatTime(message.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}