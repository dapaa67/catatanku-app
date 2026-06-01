"use client";

import { useState, useEffect, useRef } from "react";
import { Bot, Send, Sparkles, Loader2, ThumbsUp, ThumbsDown, RotateCcw, Copy, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Message = {
  role: "user" | "assistant";
  content: string;
};

// Ubah teks AI jadi tampilan rapi
function formatAIMessage(text: string) {
  const paragraphs = text.split(/\n{2,}/);

  return (
    <div className="flex flex-col gap-3">
      {paragraphs.map((para, pi) => {
        const lines = para.split("\n");
        const isList = lines.every(l => l.trim().startsWith("-") || l.trim() === "");

        if (isList) {
          const items = lines.filter(l => l.trim().startsWith("-"));
          return (
            <ul key={pi} className="flex flex-col gap-1.5">
              {items.map((item, ii) => {
                const content = item.replace(/^-\s*/, "");
                return (
                  <li key={ii} className="flex items-start gap-2.5">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    <span className="text-slate-700 text-sm leading-relaxed">
                      {highlightRupiah(content)}
                    </span>
                  </li>
                );
              })}
            </ul>
          );
        }

        // Render teks baris per baris
        return (
          <div key={pi} className="flex flex-col gap-1.5">
            {lines.map((line, li) => {
              if (line.trim() === "") return null;
              if (line.trim().startsWith("-")) {
                const content = line.replace(/^-\s*/, "");
                return (
                  <div key={li} className="flex items-start gap-2.5">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    <span className="text-slate-700 text-sm leading-relaxed">
                      {highlightRupiah(content)}
                    </span>
                  </div>
                );
              }
              return (
                <p key={li} className="text-slate-700 text-sm leading-relaxed">
                  {highlightRupiah(line)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// Highlight angka Rupiah dengan warna hijau
function highlightRupiah(text: string) {
  const parts = text.split(/(Rp[\s]?[\d.,]+)/g);
  return parts.map((part, i) =>
    /^Rp/.test(part)
      ? <span key={i} className="font-semibold text-emerald-600">{part}</span>
      : part
  );
}

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
    // Ambil nama user
    const fetchUser = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const name = user.user_metadata?.name || user.email?.split("@")[0] || "Pengguna";
          // Huruf kapital di awal kata
          setUserName(name.split(" ")[0].charAt(0).toUpperCase() + name.split(" ")[0].slice(1));
        }
      } catch (e) {}
    };
    fetchUser();

    // Cek sesi login
    let sid = localStorage.getItem("catatanku_chat_session");
    if (!sid) {
      sid = crypto.randomUUID();
      localStorage.setItem("catatanku_chat_session", sid);
    }
    setSessionId(sid);

    // Kembalikan riwayat chat
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

    // Kembalikan ukuran awal input teks
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    try {
      const res = await fetch(`/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, message: messageToSend }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Kalau ada error field dari server, tampilkan pesannya langsung
        throw new Error(data.error || "Terjadi kesalahan");
      }

      const rawReply: string = data.reply || "";
      // Hanya flag sebagai 'server sibuk' jika ada indikasi eksplisit 503 / UNAVAILABLE dari HuggingFace
      const isServerError =
        rawReply.includes("UNAVAILABLE") || rawReply.includes("503") ||
        rawReply.includes("high demand");

      setMessages(prev => [...prev, {
        role: "assistant",
        content: isServerError
          ? "Maaf, server AI lagi overload nih. Tunggu sebentar terus coba lagi ya! 🙏"
          : rawReply.replace(/\*\*/g, "").replace(/^\* /gm, "- "),
      }]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: err?.message?.includes("login")
          ? "Sesi kamu habis nih bro. Coba refresh halaman dulu ya!"
          : "Aduh, koneksi ke AI-nya lagi gangguan. Coba lagi ya! 😅",
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
    <div className="w-full h-full flex flex-col md:items-center md:justify-center md:py-6">
      <div className="flex flex-col w-full h-full md:max-w-4xl md:h-[calc(100vh-80px)] md:max-h-[850px] bg-slate-50 md:bg-white md:border md:border-slate-200 md:rounded-[2.5rem] md:shadow-sm relative overflow-hidden">

        {/* Tombol reset percakapan, muncul saat ada pesan */}
        {!isEmpty && (
          <div className="absolute top-4 right-4 md:right-6 z-10 animate-in fade-in duration-300">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-[10px] md:text-xs font-semibold text-slate-400 hover:text-primary transition-colors px-3 py-1.5 rounded-xl hover:bg-primary/5 cursor-pointer bg-white/80 backdrop-blur-sm shadow-sm md:shadow-none md:bg-transparent"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        )}

        {/* Area chat yang bisa di-scroll */}
        <div className="flex-1 overflow-y-auto w-full relative">
          <div className={`max-w-3xl mx-auto px-4 sm:px-6 md:py-8 flex flex-col gap-6 min-h-full ${!isEmpty ? 'pt-16 pb-6' : 'py-6'}`}>

          {isEmpty ? (
            // Halaman awal saat belum ada percakapan
            <div className="flex flex-col items-center justify-center flex-1 min-h-[60vh] text-center mt-8 md:mt-0">
              <div className="bg-primary/10 p-4 md:p-5 rounded-3xl mb-4 md:mb-6">
                <Sparkles className="w-8 h-8 md:w-9 md:h-9 text-primary" />
              </div>
              <h1 className="text-xl md:text-3xl font-bold text-slate-800 mb-2 px-4">
                Halo {userName}, apa yang Anda pikirkan?
              </h1>
              <p className="text-slate-500 text-xs md:text-sm mb-8 md:mb-10 max-w-xs leading-relaxed px-4">
                Tanyakan apapun tentang keuangan, tips menabung, atau strategi budgeting.
              </p>

              {/* Tombol Rekomendasi Chat */}
              <div className="flex flex-wrap gap-2 justify-center px-2">
                {SUGGESTION_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSend(prompt)}
                    className="text-[10px] md:text-xs font-semibold px-4 py-2.5 rounded-full bg-white text-primary border border-primary/25 hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

          ) : (
            // Tampilkan daftar pesan
            <>
              {messages.map((msg, i) => (
                <div key={i} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {msg.role === "user" ? (
                    // Pesan user, rata kanan
                    <div className="flex justify-end">
                      <div className="bg-primary text-white text-sm font-medium px-5 py-3 rounded-3xl rounded-br-lg max-w-[78%] leading-relaxed shadow-sm">
                        {msg.content}
                      </div>
                    </div>
                  ) : (
                    // Respons AI, rata kiri dengan format rapi
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <div className="bg-primary/10 p-1.5 rounded-lg">
                          <Bot className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <span className="text-xs font-bold text-primary">AI CatatanKu</span>
                      </div>
                      <div className="pl-1">
                        {formatAIMessage(msg.content)}
                      </div>
                      {/* Tombol aksi: copy, feedback */}
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

              {/* Indikator Mengetik AI */}
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

        {/* Input bar di bawah layar */}
        <div className="shrink-0 bg-slate-50 md:bg-white px-4 pt-2 pb-4 md:pb-6 border-t md:border-t-0 border-slate-200/50">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-2 md:gap-3 bg-white md:bg-slate-50 rounded-3xl px-4 md:px-5 py-2.5 md:py-3 border border-slate-200 md:border-transparent shadow-sm focus-within:border-primary/30 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
            
            {/* Textarea auto-resize untuk input pesan */}
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
              placeholder={isEmpty ? "Tanya AI CatatanKu..." : "Ketik pesan..."}
              className="flex-1 bg-transparent text-xs md:text-sm text-slate-700 placeholder:text-slate-400 outline-none font-medium resize-none overflow-y-auto py-1.5 md:py-2 min-h-[32px] max-h-[100px] md:max-h-[120px] scrollbar-hide"
            />

            {/* Tombol kirim pesan */}
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="shrink-0 w-8 h-8 md:w-9 md:h-9 bg-primary hover:bg-primary/90 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-full flex items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed mb-0.5"
            >
              {isLoading
                ? <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" />
                : <Send className="w-3.5 h-3.5 md:w-4 md:h-4 ml-0.5" />
              }
            </button>

          </div>
          <p className="text-[9px] md:text-[10px] text-slate-400 text-center mt-2 md:mt-3 font-medium px-4">
            AI dapat membuat kesalahan. Selalu verifikasi informasi keuangan penting.
          </p>
        </div>
      </div>

    </div>
    </div>
  );
}
