"use client";

import { Loader2, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Message = {
  id: number;
  role: "user" | "model";
  text: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const WELCOME_MESSAGE: Message = {
  id: 0,
  role: "model",
  text: "Halo! 👋 Saya asisten Markas iPhone. Mau tanya soal produk, harga, atau stok? Tinggal tanya aja!",
};

const SUGGESTED_PROMPTS = [
  "iPhone apa yang stoknya ada?",
  "Rekomendasi HP harga 15 jutaan",
  "Ada AirPods kosong?",
];

// ─── Sub-component: Chat bubble ───────────────────────────────────────────────

function ChatBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-blue-600 text-white"
            : "bg-white/10 text-white/90"
        }`}
      >
        {message.text}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1.5 rounded-2xl bg-white/10 px-4 py-3.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/50"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ChatWidget() {
  const [isOpen, setIsOpen]       = useState(false);
  const [messages, setMessages]   = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput]         = useState("");
  const [isSending, setIsSending] = useState(false);
  const [hasError, setHasError]   = useState(false);

  const messageIdRef = useRef(1);
  const scrollRef     = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLInputElement>(null);

  // ── Auto-scroll ke pesan terbaru ──
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isSending]);

  // ── Auto-focus saat widget dibuka ──
  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    const userMessage: Message = { id: ++messageIdRef.current, role: "user", text: trimmed };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");
    setIsSending(true);
    setHasError(false);

    try {
      const history = updatedMessages
        .filter((m) => m.id !== 0) // exclude welcome message dari context
        .map((m) => ({ role: m.role, text: m.text }));

      const res = await fetch("/api/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ message: trimmed, history: history.slice(0, -1) }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message ?? "Gagal mendapat jawaban");

      setMessages((prev) => [
        ...prev,
        { id: ++messageIdRef.current, role: "model", text: data.reply },
      ]);
    } catch {
      setHasError(true);
      setMessages((prev) => [
        ...prev,
        {
          id: ++messageIdRef.current,
          role: "model",
          text: "Maaf, lagi ada gangguan koneksi. Coba tanya lagi sebentar ya 🙏",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <>
      {/* ── Floating button ── */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={`fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full shadow-2xl transition-all duration-300 ${
          isOpen
            ? "bg-white/10 backdrop-blur-xl"
            : "bg-gradient-to-br from-blue-500 to-purple-600 hover:scale-105"
        }`}
        aria-label={isOpen ? "Tutup chat" : "Buka chat"}
      >
        {isOpen ? (
          <X size={24} className="text-white" />
        ) : (
          <MessageCircle size={26} className="text-white" />
        )}
      </button>

      {/* ── Chat window ── */}
      <div
        className={`fixed bottom-24 right-6 z-50 flex h-[min(600px,calc(100vh-140px))] w-[min(380px,calc(100vw-48px))] flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0c14] shadow-2xl transition-all duration-300 ${
          isOpen ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-white/10 bg-gradient-to-r from-blue-600/20 to-purple-600/20 px-5 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-500/30">
            <Sparkles size={18} className="text-blue-300" />
          </div>
          <div>
            <p className="font-black text-white">Asisten Markas iPhone</p>
            <p className="flex items-center gap-1.5 text-xs text-white/40">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
              Online • Siap membantu
            </p>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
          {messages.map((m) => <ChatBubble key={m.id} message={m} />)}
          {isSending && <TypingIndicator />}

          {/* Suggested prompts — hanya tampil di awal percakapan */}
          {messages.length === 1 && !isSending && (
            <div className="flex flex-wrap gap-2 pt-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-bold text-white/60 transition hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-blue-300"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="border-t border-white/10 p-4">
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-1 transition focus-within:border-blue-500/50">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tanya produk, harga, stok…"
              disabled={isSending}
              className="flex-1 bg-transparent py-3 text-sm text-white placeholder:text-white/30 outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isSending || !input.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-700 disabled:opacity-40"
            >
              {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}