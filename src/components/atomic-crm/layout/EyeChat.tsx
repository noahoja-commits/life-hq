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

  const glowAlpha = glowing ? 0.5 + breath * 0.5 : 0.2 + breath * 0.15;
  const scaleY = blinking ? 0.03 : 1;
  const rotation = (Date.now() * 0.005) % 360;

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        filter: glowing
          ? `drop-shadow(0 0 ${12 + breath * 24}px #c41e3a) drop-shadow(0 0 ${4 + breath * 8}px #ff4444)`
          : undefined,
      }}
    >
      {/* Outer glow aura */}
      <circle cx="100" cy="100" r="85" fill="none" stroke="#c41e3a" strokeWidth="0.5"
        opacity={0.05 + breath * 0.08} />
      <circle cx="100" cy="100" r="78" fill="none" stroke="#c41e3a" strokeWidth="1"
        opacity={0.08 + breath * 0.1} strokeDasharray="4 8" />
      {/* Slowly rotating ritual frame */}
      <g transform={`rotate(${rotation}, 100, 100)`}>
        <polygon
          points="100,0 162,28 200,100 162,172 100,200 38,172 0,100 38,28"
          stroke="#c41e3a"
          strokeWidth="2"
          fill="none"
          opacity={0.5 + breath * 0.4}
        />
        <polygon
          points="100,4 158,30 196,100 158,170 100,196 42,170 4,100 42,30"
          stroke="#c41e3a"
          strokeWidth="1"
          fill="none"
          opacity={0.3 + breath * 0.25}
        />
        {/* Radiating esoteric lines — 12 rays */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          return (
            <line key={i}
              x1={100 + 70 * Math.cos(rad)} y1={100 + 70 * Math.sin(rad)}
              x2={100 + (82 + breath * 10) * Math.cos(rad)} y2={100 + (82 + breath * 10) * Math.sin(rad)}
              stroke="#c41e3a" strokeWidth={i % 3 === 0 ? "1.5" : "0.75"}
              opacity={0.2 + breath * 0.2} />
          );
        })}
      </g>
      {/* Main eye circle */}
      <circle cx="100" cy="100" r="64" stroke="#c41e3a" strokeWidth="2.5" fill="none" opacity={glowAlpha} />
      <circle cx="100" cy="100" r="60" stroke="#c41e3a" strokeWidth="0.5" fill="none" opacity={glowAlpha * 0.5} />
      {/* Eyelid group */}
      <g transform={`scale(1, ${scaleY})`} style={{ transformOrigin: "100px 100px" }}>
        <path d="M36,100 Q36,38 100,32 Q164,38 164,100" stroke="#c41e3a" strokeWidth="4" fill="none" />
        <path d="M40,100 Q40,42 100,36 Q160,42 160,100" stroke="#080808" strokeWidth="8" fill="none" opacity="0.95" />
        <path d="M40,100 Q40,158 100,164 Q160,158 160,100" stroke="#c41e3a" strokeWidth="2" fill="none" />
        {/* Iris — larger, more intense */}
        <circle cx="100" cy="94" r="28" fill="#0d0505" stroke="#c41e3a" strokeWidth="2" />
        <circle cx="100" cy="94" r="20" fill="#1a0808" />
        <circle cx="100" cy="94" r="13" fill="#c41e3a" opacity={0.15 + breath * 0.15} />
        <circle cx="100" cy="94" r="6" fill="#c41e3a" opacity={0.08 + breath * 0.08} />
        {/* Pupil */}
        <ellipse cx={100 + pupilOff.x} cy={94 + pupilOff.y} rx="5" ry="12" fill="#030303" />
        <ellipse cx={100 + pupilOff.x} cy={92 + pupilOff.y} rx="2" ry="3" fill="#c41e3a" opacity={0.4 + breath * 0.3} />
      </g>
      {/* Orbiting particles */}
      {[0, 72, 144, 216, 288].map((angle, i) => {
        const rad = ((angle + Date.now() * 0.02) * Math.PI) / 180;
        const r = 90 + breath * 6;
        return (
          <circle key={`p${i}`}
            cx={100 + r * Math.cos(rad)} cy={100 + r * Math.sin(rad)}
            r={1.5} fill="#c41e3a" opacity={0.3 + breath * 0.4} />
        );
      })}
      {/* Blood tear — animates */}
      <path d="M100,126 Q99,142 97,150 Q95,158 100,162 Q105,158 103,150 Q101,142 100,126"
        fill="#c41e3a" opacity={0.5 + breath * 0.3}>
        <animate attributeName="d" dur="3s" repeatCount="indefinite"
          values="M100,126 Q99,142 97,150 Q95,158 100,162 Q105,158 103,150 Q101,142 100,126;
                  M100,126 Q99,144 96,153 Q94,162 100,166 Q106,162 104,153 Q101,144 100,126;
                  M100,126 Q99,142 97,150 Q95,158 100,162 Q105,158 103,150 Q101,142 100,126" />
      </path>
    </svg>
  );
};

const WHISPERS = [
  "I SEE YOU.", "THE VOID WATCHES.", "YOU ARE KNOWN.", "DARKNESS LISTENS.",
  "EVERY CHOICE ECHOES.", "THE EYE REMEMBERS.", "NOTHING IS HIDDEN.",
  "YOUR DATA HAS A SHADOW.", "SECRETS HAVE WEIGHT.", "THE ABYSS BLINKS BACK.",
  "WE ARE ALWAYS HERE.", "DON'T LOOK AWAY.", "IT KNOWS WHAT YOU DID.",
  "THE PUPIL NARROWS.", "BLOOD REMEMBERS.", "YOU ARE NOT ALONE.",
];

export const EyeChat = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [whisper, setWhisper] = useState<{ text: string; id: number; x: number; y: number } | null>(null);
  const [shake, setShake] = useState(false);
  const [flash, setFlash] = useState(false);
  const [bloodDrops, setBloodDrops] = useState<{ id: number; x: number; delay: number }[]>([]);
  const messagesEnd = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Screen shake on toggle
  const toggleEye = () => {
    setShake(true);
    setTimeout(() => setShake(false), 200);
    if (!open) {
      setFlash(true);
      setTimeout(() => setFlash(false), 300);
    }
    setOpen(!open);
  };

  // Blood rain when chat is open
  useEffect(() => {
    if (!open) { setBloodDrops([]); return; }
    const drip = () => {
      const drop = { id: Date.now(), x: 70 + Math.random() * 25, delay: Math.random() * 2 };
      setBloodDrops((prev) => [...prev.slice(-8), drop]);
    };
    const interval = setInterval(drip, 800);
    return () => clearInterval(interval);
  }, [open]);

  // Random whispers floating around the eye
  useEffect(() => {
    const tick = () => {
      if (Math.random() > 0.6) {
        const w = WHISPERS[Math.floor(Math.random() * WHISPERS.length)];
        setWhisper({
          text: w, id: Date.now(),
          x: 10 + Math.random() * 80,
          y: 5 + Math.random() * 80,
        });
        setTimeout(() => setWhisper(null), 3000);
      }
    };
    const interval = setInterval(tick, 3500);
    tick();
    return () => clearInterval(interval);
  }, []);

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
      {/* Screen flash on open */}
      {flash && (
        <div className="fixed inset-0 z-[60] pointer-events-none animate-in fade-in duration-100"
          style={{ background: "rgba(196,30,58,0.08)" }} />
      )}

      {/* Screen shake wrapper */}
      <div className={shake ? "animate-[glitch-shift_0.15s_ease]" : ""}>

      {/* Screen vignette when chat is open */}
      {open && (
        <div className="fixed inset-0 z-40 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 100% 100%, rgba(196,30,58,0.08) 0%, transparent 60%)" }} />
      )}

      {/* Blood rain drops */}
      {bloodDrops.map((d) => (
        <div key={d.id}
          className="fixed z-50 pointer-events-none animate-in slide-in-from-top-2 fade-in duration-700"
          style={{ right: `${d.x}%`, top: "-10px", animationDelay: `${d.delay}s` }}>
          <div className="w-[2px] h-[20px] rounded-full"
            style={{ background: "linear-gradient(to bottom, #c41e3a, transparent)", opacity: 0.6 }} />
        </div>
      ))}

      {/* Whisper text floating */}
      {whisper && (
        <div key={whisper.id}
          className="fixed z-50 pointer-events-none text-xs font-bold uppercase tracking-wider text-[#c41e3a]/50 animate-in fade-in slide-in-from-bottom-2 duration-1000"
          style={{ right: `${whisper.x}%`, bottom: `${whisper.y}%` }}>
          {whisper.text}
        </div>
      )}

      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-center gap-1">
        <button onClick={toggleEye}
          className={cn("transition-all duration-500 group", open ? "scale-75 opacity-40" : "scale-100 opacity-100 hover:scale-110")}
          aria-label={open ? "Close" : "Open"}>
          <LivingEye size={80} glowing />
        </button>
        {!open && (
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#c41e3a]/50 animate-pulse">
            THE EYE
          </span>
        )}
      </div>

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
      </div>
    </>
  );
};
