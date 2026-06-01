"use client";

import { useState, useEffect, useRef } from "react";
import { Bot, Send, Sparkles, Loader2, ThumbsUp, ThumbsDown, RotateCcw, Copy, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const FASTAPI_BASE = "https://yobby15-catatanku-fastapi.hf.space";

const SUGGESTION_PROMPTS = [
  "Tips menabung efektif setiap bulan?",
  "Apa itu budgeting 50/30/20?",
  "Cara agar tidak boros?",
  "Bedanya investasi dan menabung?",
];

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [userName, setUserName] = useState("Pengguna");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Get user name
    const fetchUser = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const name = user.user_metadata?.name || user.email?.split("@")[0] || "Pengguna";
          // Capitalize first word only
          setUserName(name.split(" ")[0].charAt(0).toUpperCase() + name.split(" ")[0].slice(1));
        }
      } catch (e) {}
    };
    fetchUser();

    // Session
    let sid = localStorage.getItem("catatanku_chat_session");
    if (!sid) {
      sid = crypto.randomUUID();
      localStorage.setItem("catatanku_chat_session", sid);
    }
    setSessionId(sid);

    // Restore history
    const savedMessages = localStorage.getItem("catatanku_chat_history");
    if (savedMessages) {
      try { setMessages(JSON.parse(savedMessages)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("catatanku_chat_history", JSON.stringify(messages));
    }
  }, [messages]);

  const handleSend = async (text?: string) => {
    const messageToSend = (text ?? input).trim();
    if (!messageToSend || isLoading || !sessionId) return;

    setMessages(prev => [...prev, { role: "user", content: messageToSend }]);
    setInput("");
    setIsLoading(true);

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    try {
      const res = await fetch(`/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, message: messageToSend }),
      });

      if (!res.ok) throw new Error();

      const data = await res.json();
      const rawReply: string = data.reply || "";
      const isServerError =
        rawReply.includes("UNAVAILABLE") || rawReply.includes("503") ||
        rawReply.includes("high demand") || (rawReply.includes("error") && rawReply.includes("code"));

      setMessages(prev => [...prev, {
        role: "assistant",
        content: isServerError
          ? "Maaf, server AI sedang sibuk. Coba lagi dalam beberapa saat ya! 🙏"
          : rawReply.replace(/\*\*/g, "").replace(/^\* /gm, "- "),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Maaf, saya sedang tidak bisa menjawab. Silakan coba lagi.",
      }]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleReset = async () => {
    if (!sessionId) return;
    try { await fetch(`${FASTAPI_BASE}/api/chat/${sessionId}`, { method: "DELETE" }); } catch {}
    const newSid = crypto.randomUUID();
    localStorage.setItem("catatanku_chat_session", newSid);
    localStorage.removeItem("catatanku_chat_history");
    setSessionId(newSid);
    setMessages([]);
  };

  const handleCopy = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-screen bg-slate-50 relative">

      {/* ── RESET BUTTON (top right, only visible when chatting) ── */}
      {!isEmpty && (
        <div className="absolute top-4 right-6 z-10 animate-in fade-in duration-300">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-primary transition-colors px-3 py-1.5 rounded-xl hover:bg-primary/5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      )}

      {/* ── SCROLLABLE CHAT AREA ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6 min-h-full">

          {isEmpty ? (
            /* ── Welcome / Empty State ── */
            <div className="flex flex-col items-center justify-center flex-1 min-h-[60vh] text-center">
              <div className="bg-primary/10 p-5 rounded-3xl mb-6">
                <Sparkles className="w-9 h-9 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">
                Halo {userName}, apa yang Anda pikirkan?
              </h1>
              <p className="text-slate-500 text-sm mb-10 max-w-xs leading-relaxed">
                Tanyakan apapun tentang keuangan, tips menabung, atau strategi budgeting.
              </p>

              {/* Suggestion Chips */}
              <div className="flex flex-wrap gap-2 justify-center">
                {SUGGESTION_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSend(prompt)}
                    className="text-xs font-semibold px-4 py-2.5 rounded-full bg-white text-primary border border-primary/25 hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

          ) : (
            /* ── Messages ── */
            <>
              {messages.map((msg, i) => (
                <div key={i} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {msg.role === "user" ? (
                    /* User bubble — right aligned pill */
                    <div className="flex justify-end">
                      <div className="bg-primary text-white text-sm font-medium px-5 py-3 rounded-3xl rounded-br-lg max-w-[78%] leading-relaxed shadow-sm">
                        {msg.content}
                      </div>
                    </div>
                  ) : (
                    /* AI response — left aligned, plain text */
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <div className="bg-primary/10 p-1.5 rounded-lg">
                          <Bot className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <span className="text-xs font-bold text-primary">AI CatatanKu</span>
                      </div>
                      <p className="text-slate-700 text-sm leading-relaxed pl-1 whitespace-pre-wrap">
                        {msg.content}
                      </p>
                      {/* Action row */}
                      <div className="flex items-center gap-1 pl-1">
                        <button
                          onClick={() => handleCopy(msg.content, i)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer"
                          title="Salin"
                        >
                          {copiedIndex === i ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button className="p-1.5 rounded-lg text-slate-400 hover:text-green-500 hover:bg-green-50 transition-colors cursor-pointer" title="Bagus">
                          <ThumbsUp className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-50 transition-colors cursor-pointer" title="Kurang bagus">
                          <ThumbsDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <div className="animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="bg-primary/10 p-1.5 rounded-lg">
                      <Bot className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="text-xs font-bold text-primary">AI CatatanKu</span>
                  </div>
                  <div className="flex items-center gap-1.5 pl-1">
                    <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
            </>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── INPUT BAR (Gemini pill) ── */}
      <div className="shrink-0 bg-slate-50 px-4 pt-2 pb-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-end gap-3 bg-white rounded-3xl px-5 py-3 border border-slate-200 shadow-md focus-within:border-primary/30 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
            
            {/* Input */}
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={e => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder={isEmpty ? "Tanya AI CatatanKu..." : "Lanjut bertanya..."}
              className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none font-medium resize-none overflow-y-auto py-1.5 min-h-[32px] max-h-[120px]"
            />

            {/* Send button */}
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="shrink-0 w-8 h-8 bg-primary hover:bg-primary/90 disabled:bg-slate-100 text-white disabled:text-slate-300 rounded-full flex items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              {isLoading
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Send className="w-3.5 h-3.5" />
              }
            </button>

          </div>
          <p className="text-[10px] text-slate-400 text-center mt-2.5 font-medium">
            AI dapat membuat kesalahan. Selalu verifikasi informasi keuangan penting.
          </p>
        </div>
      </div>

    </div>
  );
}
