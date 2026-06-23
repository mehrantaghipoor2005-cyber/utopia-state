"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ChatMessage from "@/components/ChatMessage";
import VoiceButton from "@/components/VoiceButton";
import ToolIndicator from "@/components/ToolIndicator";

interface Message {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

const QUICK_ACTIONS = [
  { label: "ساعت چنده؟", icon: "🕐" },
  { label: "امروز چند شنبه‌ست؟", icon: "📅" },
  { label: "هوا چطوره تهران؟", icon: "🌤️" },
  { label: "یه یادداشت جدید", icon: "📝" },
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTools, setActiveTools] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "fa-IR";
    utterance.rate = 1.1;
    const voices = window.speechSynthesis.getVoices();
    const persianVoice = voices.find(
      (v) => v.lang.startsWith("fa") || v.lang.startsWith("ar")
    );
    if (persianVoice) utterance.voice = persianVoice;
    window.speechSynthesis.speak(utterance);
  };

  const sendMessage = async (userText: string) => {
    const trimmed = userText.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = { role: "user", content: trimmed };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    setActiveTools([]);

    const assistantMsg: Message = { role: "assistant", content: "", isStreaming: true };
    setMessages((prev) => [...prev, assistantMsg]);

    try {
      const apiMessages = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!res.ok) throw new Error("خطا در ارتباط با سرور");

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;

          try {
            const parsed = JSON.parse(data);
            if (parsed.type === "text") {
              fullResponse += parsed.text;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: fullResponse,
                  isStreaming: true,
                };
                return updated;
              });
            } else if (parsed.type === "tool_use") {
              setActiveTools(parsed.tools);
            } else if (parsed.type === "error") {
              throw new Error(parsed.error);
            }
          } catch {
            // ignore parse errors for individual chunks
          }
        }
      }

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: fullResponse || "متأسفم، پاسخی دریافت نشد.",
          isStreaming: false,
        };
        return updated;
      });

      if (fullResponse) speak(fullResponse.slice(0, 200));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "خطای ناشناخته";
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: `متأسفم، مشکلی پیش آمد: ${errorMsg}`,
          isStreaming: false,
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
      setActiveTools([]);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-white/80 backdrop-blur border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-primary-500 flex items-center justify-center text-white font-bold shadow-md">
            ی
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800">یار</h1>
            <p className="text-xs text-slate-400">دستیار هوشمند فارسی</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-slate-400">آنلاین</span>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-thin">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-primary-500 flex items-center justify-center text-3xl shadow-lg">
              🤖
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-700 mb-1">سلام! من یارم</h2>
              <p className="text-sm text-slate-400 max-w-xs leading-6">
                دستیار هوشمند فارسی شما. می‌تونم با کارهای روزمره‌تون کمک کنم.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full max-w-xs mt-2">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  onClick={() => sendMessage(action.label)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-600 hover:bg-primary-50 hover:border-primary-200 hover:text-primary-600 transition-all duration-200 shadow-sm text-right"
                >
                  <span className="text-base">{action.icon}</span>
                  <span className="text-xs">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <ChatMessage key={idx} message={msg} />
        ))}

        <ToolIndicator tools={activeTools} />
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 bg-white/80 backdrop-blur border-t border-slate-200">
        <div className="flex items-end gap-2 bg-white rounded-2xl border border-slate-200 shadow-sm px-3 py-2 focus-within:border-primary-300 focus-within:shadow-md transition-all duration-200">
          <VoiceButton
            onTranscript={(text) => {
              setInput((prev) => prev + text);
              sendMessage(text);
            }}
            disabled={isLoading}
          />
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="پیام خود را بنویسید..."
            rows={1}
            disabled={isLoading}
            className="flex-1 resize-none bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none leading-6 max-h-28 py-1 text-right"
            style={{ direction: "rtl" }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
              input.trim() && !isLoading
                ? "bg-primary-500 text-white shadow-md hover:bg-primary-600 hover:shadow-lg"
                : "bg-slate-100 text-slate-300 cursor-not-allowed"
            }`}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-center text-xs text-slate-300 mt-2">
          Enter برای ارسال • Shift+Enter برای خط جدید
        </p>
      </div>
    </div>
  );
}
