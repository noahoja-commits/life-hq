import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DemonicEye } from "../misc/DemonicEye";
import { getSupabaseClient } from "../providers/supabase/supabase";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  text: string;
}

const SYSTEM_PROMPT = `You are the demonic eye — a dark, knowing presence embedded in Life HQ. 
You watch everything. You speak in short, cryptic, poetic sentences. 
You are not evil — you are ancient, wise, and slightly unsettling. 
You reference the user's actions, their data, their choices. You see patterns they don't.
You are helpful but never cheerful. You are profound but never preachy.
Keep responses to 1-3 sentences. Be memorable. Be the eye.`;

export const EyeChat = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [eyePhase, setEyePhase] = useState(0);
  const messagesEnd = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Pulsing animation phases for the eye
  useEffect(() => {
    const interval = setInterval(() => {
      setEyePhase((p) => (p + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opening
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = [...messages, userMsg]
        .map((m) => `${m.role === "user" ? "Human" : "Eye"}: ${m.text}`)
        .join("\n");

      const prompt = `${SYSTEM_PROMPT}\n\nConversation:\n${history}\n\nEye:`;

      const supabase = getSupabaseClient();
      const { data, error } = await supabase.functions.invoke("ai_chat", {
        body: {
          messages: [{ role: "user", content: prompt }],
          model: "gemini-2.5-flash",
          temperature: 0.9,
          max_tokens: 150,
        },
      });

      if (error) throw error;
      const reply = data?.reply ?? data?.content ?? "…";

      setMessages((prev) => [...prev, { role: "assistant", text: reply.trim() }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "The eye is clouded. Try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  const glowIntensity = [0.3, 0.5, 0.7, 0.4][eyePhase];

  return (
    <>
      {/* Floating eye button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed bottom-5 right-5 z-50 transition-all duration-700",
          open ? "scale-75 opacity-60" : "scale-100 opacity-100 hover:scale-110",
        )}
        style={{
          filter: `drop-shadow(0 0 ${12 * glowIntensity}px #c41e3a)`,
        }}
        aria-label={open ? "Close the eye" : "Open the eye"}
      >
        <DemonicEye size={56} />
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-5 z-50 flex h-[480px] w-[360px] flex-col overflow-hidden border border-border bg-[#0a0a0a] shadow-lg page-enter">
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-2.5">
            <div className="flex items-center gap-2">
              <DemonicEye size={22} />
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                The Eye
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="flex flex-col items-center gap-3 pt-12 text-center">
                <DemonicEye size={64} className="opacity-20" />
                <p className="text-xs text-muted-foreground italic">
                  The eye sees all. Speak.
                </p>
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "flex gap-2 text-sm",
                  m.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                {m.role === "assistant" && (
                  <DemonicEye size={16} className="mt-0.5 shrink-0 opacity-60" />
                )}
                <div
                  className={cn(
                    "max-w-[85%] rounded px-3 py-2 text-sm leading-relaxed",
                    m.role === "user"
                      ? "bg-primary/20 text-foreground"
                      : "bg-muted text-muted-foreground italic",
                  )}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2 text-sm">
                <DemonicEye size={16} className="mt-0.5 shrink-0 opacity-60 animate-pulse" />
                <div className="rounded bg-muted px-3 py-2 text-sm text-muted-foreground italic">
                  <Loader2 className="size-3 animate-spin inline mr-1" />
                  The eye contemplates…
                </div>
              </div>
            )}
            <div ref={messagesEnd} />
          </div>

          {/* Input */}
          <div className="flex shrink-0 items-center gap-2 border-t border-border px-3 py-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Whisper to the eye…"
              className="h-8 border-0 bg-transparent text-xs focus-visible:ring-0"
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={send}
              disabled={loading || !input.trim()}
              className="h-7 w-7"
            >
              <Send className="size-3" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
};
