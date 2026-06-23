"use client";

interface Message {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex items-end gap-2 mb-4 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
          isUser
            ? "bg-primary-500 text-white"
            : "bg-gradient-to-br from-violet-500 to-primary-500 text-white"
        }`}
      >
        {isUser ? "ش" : "ی"}
      </div>

      <div
        className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-7 ${
          isUser
            ? "bg-primary-500 text-white rounded-tl-sm"
            : "bg-white text-slate-800 shadow-sm border border-slate-100 rounded-tr-sm"
        }`}
      >
        {message.isStreaming && !message.content ? (
          <div className="flex items-center gap-1 py-1">
            <span className="thinking-dot w-2 h-2 rounded-full bg-slate-400" />
            <span className="thinking-dot w-2 h-2 rounded-full bg-slate-400" />
            <span className="thinking-dot w-2 h-2 rounded-full bg-slate-400" />
          </div>
        ) : (
          <div className="whitespace-pre-wrap break-words">
            {message.content}
            {message.isStreaming && (
              <span className="inline-block w-0.5 h-4 bg-current animate-pulse mr-0.5 align-text-bottom" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
