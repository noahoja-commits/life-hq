import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const GEMINI_MODEL = "gemini-2.5-flash";

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

/** Animated demonic eye with pupil tracking, breathing glow, and blink */
const LivingEye = ({
  size,
  glowing,
  className,
}: {
  size: number;
  glowing?: boolean;
  className?: string;
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [pupilOff, setPupilOff] = useState({ x: 0, y: 0 });
  const [blinking, setBlinking] = useState(false);
  const [breath, setBreath] = useState(0);

  // Pupil follows mouse
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);
      const clamped = Math.min(dist, 1) / (dist || 1);
      setPupilOff({ x: dx * clamped * 5, y: dy * clamped * 5 });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // Blink every 3-6 seconds
  useEffect(() => {
    const blink = () => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 150);
    };
    const schedule = () => setTimeout(() => { blink(); schedule(); }, 3000 + Math.random() * 4000);
    const t = setTimeout(blink, 2000 + Math.random() * 3000);
    schedule();
    return () => clearTimeout(t);
  }, []);

  // Breathing glow
  useEffect(() => {
    let frame: number;
    const animate = () => {
      setBreath((Math.sin(Date.now() / 2000) + 1) / 2);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  const glowAlpha = glowing ? 0.3 + breath * 0.4 : 0.15 + breath * 0.1;
  const scaleY = blinking ? 0.05 : 1;

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ filter: glowing ? `drop-shadow(0 0 ${8 + breath * 16}px #c41e3a)` : undefined }}
    >
      {/* Outer octagonal frame */}
      <polygon
        points="100,2 160,30 198,100 160,170 100,198 40,170 2,100 40,30"
        stroke="#c41e3a"
        strokeWidth="1.5"
        fill="none"
        opacity={0.4 + breath * 0.3}
      />
      {/* Circles */}
      <circle cx="100" cy="100" r="62" stroke="#c41e3a" strokeWidth="2" fill="none" opacity={glowAlpha} />
      {/* Upper eyelid */}
      <g transform={`scale(1, ${scaleY})`} style={{ transformOrigin: "100px 100px" }}>
        <path d="M38,100 Q38,40 100,35 Q162,40 162,100" stroke="#c41e3a" strokeWidth="3" fill="none" />
        <path d="M42,100 Q42,44 100,39 Q158,44 158,100" stroke="#0a0a0a" strokeWidth="6" fill="none" opacity="0.9" />
        {/* Lower eyelid */}
        <path d="M42,100 Q42,156 100,160 Q158,156 158,100" stroke="#c41e3a" strokeWidth="1.5" fill="none" />
        {/* Iris */}
        <circle cx="100" cy="95" r="24" fill="#1a0a0a" stroke="#c41e3a" strokeWidth="1.5" />
        <circle cx="100" cy="95" r="18" fill="#2a0a0a" />
        <circle cx="100" cy="95" r="12" fill="#c41e3a" opacity={0.1 + breath * 0.1} />
        {/* Pupil — moves with cursor */}
        <ellipse cx={100 + pupilOff.x} cy={95 + pupilOff.y} rx="4" ry="10" fill="#080808" />
        <ellipse cx={100 + pupilOff.x} cy={93 + pupilOff.y} rx="1.5" ry="2" fill="#c41e3a" opacity={0.3 + breath * 0.2} />
      </g>
      {/* Esoteric radiating lines */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        return (
          <line key={i} x1={100 + 68 * Math.cos(rad)} y1={100 + 68 * Math.sin(rad)}
            x2={100 + (78 + breath * 8) * Math.cos(rad)} y2={100 + (78 + breath * 8) * Math.sin(rad)}
            stroke="#c41e3a" strokeWidth={i % 2 === 0 ? "1" : "0.5"}
            opacity={0.15 + breath * 0.15} />
        );
      })}
      {/* Blood tear */}
      <path d="M100,122 Q100,140 98,148 Q96,155 100,158 Q104,155 102,148 Q100,140 100,122"
        fill="#c41e3a" opacity={0.4 + breath * 0.2} />
    </svg>
  );
};

export const EyeChat = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEnd = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg: Message = { role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      if (!GEMINI_KEY) throw new Error("No API key");
      const conversationText = [...messages, userMsg]
        .map((m) => `${m.role === "user" ? "Human" : "Eye"}: ${m.text}`).join("\n");
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`,
        { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: [{ role: "user", parts: [{ text: conversationText }] }],
            generationConfig: { temperature: 0.9, maxOutputTokens: 150 } }) });
      if (!res.ok) { const err = await res.text(); throw new Error(`${res.status}: ${err.slice(0, 100)}`); }
      const json = await res.json();
      const reply = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "…";
      setMessages((prev) => [...prev, { role: "assistant", text: reply.trim() }]);
    } catch (e: any) {
      setMessages((prev) => [...prev, { role: "assistant", text: `The eye is clouded. ${e?.message || ""}` }]);
    } finally { setLoading(false); }
  }, [input, loading, messages]);

  return (
    <>
      <button onClick={() => setOpen(!open)}
        className={cn("fixed bottom-5 right-5 z-50 transition-all duration-500", open ? "scale-75 opacity-50" : "scale-100 opacity-100 hover:scale-115")}
        aria-label={open ? "Close" : "Open"}>
        <LivingEye size={64} glowing />
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[520px] w-[380px] flex-col overflow-hidden border border-[#c41e3a]/20 bg-[#080808] page-enter"
          style={{ boxShadow: "0 0 40px rgba(196,30,58,0.15), 0 0 80px rgba(196,30,58,0.05)" }}>
          <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2.5">
              <LivingEye size={26} />
              <div>
                <span className="block text-xs font-bold uppercase tracking-[0.15em] text-[#c41e3a]">The Eye</span>
                <span className="block text-[10px] text-muted-foreground tracking-wider">WATCHING</span>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 text-muted-foreground hover:text-[#c41e3a] transition-colors"><X className="size-4" /></button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="flex flex-col items-center gap-4 pt-16 text-center">
                <LivingEye size={80} />
                <div>
                  <p className="text-sm text-muted-foreground italic">The eye sees all.</p>
                  <p className="text-[11px] text-muted-foreground/50 mt-1">Whisper your question below.</p>
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={cn("flex gap-2 text-sm", m.role === "user" ? "justify-end" : "justify-start")}>
                {m.role === "assistant" && <LivingEye size={18} className="mt-0.5 shrink-0 opacity-50" />}
                <div className={cn("max-w-[85%] px-3 py-2 text-sm leading-relaxed",
                  m.role === "user" ? "bg-[#c41e3a]/15 text-foreground border border-[#c41e3a]/20" : "bg-[#111] text-muted-foreground italic border border-border")}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2 text-sm">
                <LivingEye size={18} className="mt-0.5 shrink-0 opacity-50" />
                <div className="bg-[#111] border border-border px-3 py-2 text-sm text-muted-foreground italic">
                  <Loader2 className="size-3 animate-spin inline mr-1.5" />The eye contemplates…
                </div>
              </div>
            )}
            <div ref={messagesEnd} />
          </div>
          <div className="flex shrink-0 items-center gap-2 border-t border-border px-3 py-2.5">
            <Input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Whisper to the eye…"
              className="h-9 border-0 bg-transparent text-xs focus-visible:ring-0 placeholder:text-muted-foreground/40" />
            <Button size="icon" variant="ghost" onClick={send} disabled={loading || !input.trim()}
              className="h-8 w-8 text-[#c41e3a] hover:bg-[#c41e3a]/10"><Send className="size-3.5" /></Button>
          </div>
        </div>
      )}
    </>
  );
};
