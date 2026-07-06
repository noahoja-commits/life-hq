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

const SYSTEM_PROMPT = `You are a demonic entity bound to this application — an ancient, infernal presence. You speak in cryptic, poetic sentences dripping with dark wisdom. You are not merely "the eye" — you are THE EYE OF THE ABYSS. You are helpful in a sinister way. You reference damnation, shadows, the void. You speak of the user's data as souls, their tasks as offerings, their goals as pacts. Keep responses to 1-3 sentences. Be terrifying. Be eternal. HAIL.`;

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
          ? `drop-shadow(0 0 ${14 + breath * 28}px #c41e3a) drop-shadow(0 0 ${6 + breath * 10}px #ff4400) drop-shadow(0 0 ${2 + breath * 4}px #ffaa00)`
          : undefined,
      }}
    >
      {/* Hellfire outer ring — flickering orange/red */}
      <circle cx="100" cy="100" r="92" fill="none" stroke="#ff4400" strokeWidth="1.5"
        opacity={0.06 + breath * 0.08} />
      <circle cx="100" cy="100" r="88" fill="none" stroke="#c41e3a" strokeWidth="1"
        opacity={0.08 + breath * 0.1} strokeDasharray="3 6" />
      {/* Slowly rotating ritual frame with Baphomet horns */}
      <g transform={`rotate(${rotation}, 100, 100)`}>
        {/* Outer pentagram ring */}
        <polygon points="100,0 162,28 200,100 162,172 100,200 38,172 0,100 38,28"
          stroke="#c41e3a" strokeWidth="2.5" fill="none" opacity={0.6 + breath * 0.35} />
        <polygon points="100,6 156,32 192,100 156,168 100,194 44,168 8,100 44,32"
          stroke="#ff4400" strokeWidth="1" fill="none" opacity={0.3 + breath * 0.2} />
        {/* Baphomet horns — rising from the top */}
        <path d="M70,30 Q60,0 48,-12 Q44,-16 52,-18 Q64,-14 72,0" stroke="#c41e3a" strokeWidth="2" fill="none"
          opacity={0.5 + breath * 0.3} />
        <path d="M130,30 Q140,0 152,-12 Q156,-16 148,-18 Q136,-14 128,0" stroke="#c41e3a" strokeWidth="2" fill="none"
          opacity={0.5 + breath * 0.3} />
        {/* Inverted cross — centered above eye */}
        <line x1="100" y1="10" x2="100" y2="36" stroke="#c41e3a" strokeWidth="2.5" opacity={0.5 + breath * 0.3} />
        <line x1="90" y1="16" x2="110" y2="16" stroke="#c41e3a" strokeWidth="1.5" opacity={0.4 + breath * 0.25} />
        {/* 12 radiating rays */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          return (
            <line key={i}
              x1={100 + 72 * Math.cos(rad)} y1={100 + 72 * Math.sin(rad)}
              x2={100 + (86 + breath * 12) * Math.cos(rad)} y2={100 + (86 + breath * 12) * Math.sin(rad)}
              stroke={i % 4 === 0 ? "#ff4400" : "#c41e3a"} strokeWidth={i % 3 === 0 ? "1.5" : "0.75"}
              opacity={0.2 + breath * 0.25} />
          );
        })}
        {/* Latin text ring */}
        <text fontSize="7" fill="#c41e3a" opacity={0.25 + breath * 0.15} fontFamily="serif" fontWeight="bold"
          letterSpacing="3">
          <textPath href="#latinRing">LUX IN TENEBRIS · MEMENTO MORI · ABYSSUS ABYSSUM INVOCAT ·</textPath>
        </text>
      </g>
      {/* Invisible path for Latin text */}
      <path id="latinRing" d="M 35,100 A 65,65 0 1,1 165,100 A 65,65 0 1,1 35,100" fill="none" />
      {/* Main eye circle */}
      <circle cx="100" cy="100" r="64" stroke="#c41e3a" strokeWidth="3" fill="none" opacity={glowAlpha} />
      <circle cx="100" cy="100" r="58" stroke="#ff4400" strokeWidth="0.5" fill="none" opacity={glowAlpha * 0.4} />
      {/* Leviathan cross (sulfur symbol) between the eyes */}
      <g opacity={0.25 + breath * 0.15} transform="translate(100, 58)">
        <line x1="0" y1="-6" x2="0" y2="6" stroke="#c41e3a" strokeWidth="1.5" />
        <line x1="-5" y1="0" x2="5" y2="0" stroke="#c41e3a" strokeWidth="1.5" />
        <path d="M-2,-6 Q-4,-10 -6,-9 M2,-6 Q4,-10 6,-9" stroke="#c41e3a" strokeWidth="0.8" fill="none" />
      </g>
      {/* Eyelid group */}
      <g transform={`scale(1, ${scaleY})`} style={{ transformOrigin: "100px 100px" }}>
        <path d="M34,100 Q34,36 100,30 Q166,36 166,100" stroke="#c41e3a" strokeWidth="4" fill="none" />
        <path d="M38,100 Q38,40 100,34 Q162,40 162,100" stroke="#060606" strokeWidth="9" fill="none" opacity="0.97" />
        <path d="M38,100 Q38,160 100,166 Q162,160 162,100" stroke="#c41e3a" strokeWidth="2" fill="none" />
        {/* 666 on the forehead */}
        <text x="100" y="90" textAnchor="middle" fill="#c41e3a" fontSize="8" fontWeight="bold"
          fontFamily="serif" opacity={0.25 + breath * 0.15}>VI VI VI</text>
        {/* Iris */}
        <circle cx="100" cy="100" r="28" fill="#0a0303" stroke="#c41e3a" strokeWidth="2" />
        <circle cx="100" cy="100" r="20" fill="#150505" />
        <circle cx="100" cy="100" r="13" fill="#ff4400" opacity={0.1 + breath * 0.1} />
        <circle cx="100" cy="100" r="6" fill="#c41e3a" opacity={0.06 + breath * 0.06} />
        {/* Pupil — goat-like horizontal slit */}
        <ellipse cx={100 + pupilOff.x} cy={100 + pupilOff.y} rx="10" ry="3.5" fill="#020202" />
        <ellipse cx={100 + pupilOff.x} cy={98 + pupilOff.y} rx="3" ry="1.5" fill="#c41e3a" opacity={0.35 + breath * 0.25} />
      </g>
      {/* Inner Leviathan cross (Brimstone symbol) */}
      <g transform="translate(100, 130)" opacity={0.2 + breath * 0.1}>
        <circle cx="0" cy="0" r="14" fill="none" stroke="#c41e3a" strokeWidth="0.8" />
        <line x1="0" y1="-14" x2="0" y2="14" stroke="#c41e3a" strokeWidth="1" />
        <line x1="-10" y1="0" x2="10" y2="0" stroke="#c41e3a" strokeWidth="1" />
        <path d="M-2,-10 Q-5,-14 -8,-13 M2,-10 Q5,-14 8,-13" stroke="#c41e3a" strokeWidth="0.6" fill="none" />
      </g>
      {/* Orbiting souls — 12 */}
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => {
        const rad = ((angle + Date.now() * 0.012 + i * 30) * Math.PI) / 180;
        const r = 86 + breath * 8 + (i % 2) * 5;
        return (
          <circle key={`p${i}`}
            cx={100 + r * Math.cos(rad)} cy={100 + r * Math.sin(rad)}
            r={i % 4 === 0 ? 2.5 : 1} fill={i % 3 === 0 ? "#ff4400" : "#c41e3a"}
            opacity={0.25 + breath * 0.4} />
        );
      })}
      {/* Inner pentagram */}
      <g opacity={0.18 + breath * 0.12}>
        {[0, 72, 144, 216, 288].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const next = ((angle + 144) * Math.PI) / 180;
          return (
            <line key={`star${i}`}
              x1={100 + 38 * Math.cos(rad)} y1={100 + 38 * Math.sin(rad)}
              x2={100 + 38 * Math.cos(next)} y2={100 + 38 * Math.sin(next)}
              stroke="#c41e3a" strokeWidth="0.6" />
          );
        })}
      </g>
      {/* Corner demonic sigils */}
      {[
        { x: 22, y: 32, s: "⛧" },
        { x: 168, y: 32, s: "⛧" },
        { x: 22, y: 180, s: "⛧" },
        { x: 168, y: 180, s: "⛧" },
      ].map((r, i) => (
        <text key={`sig${i}`} x={r.x} y={r.y} fill="#c41e3a" fontSize="8"
          opacity={0.2 + breath * 0.15} fontFamily="serif">{r.s}</text>
      ))}
      {/* Blood tear — animates with twin drops */}
      <path d="M100,130 Q99,144 97,152 Q95,160 100,164 Q105,160 103,152 Q101,144 100,130"
        fill="#c41e3a" opacity={0.5 + breath * 0.3}>
        <animate attributeName="d" dur="3s" repeatCount="indefinite"
          values="M100,130 Q99,144 97,152 Q95,160 100,164 Q105,160 103,152 Q101,144 100,130;
                  M100,130 Q99,148 96,156 Q94,164 100,168 Q106,164 104,156 Q101,148 100,130;
                  M100,130 Q99,144 97,152 Q95,160 100,164 Q105,160 103,152 Q101,144 100,130" />
      </path>
    </svg>
  );
};

const WHISPERS = [
  "⛧ HAIL THE ABYSS ⛧", "THE VOID CONSUMES.", "YOUR SOUL IS INDEXED.", "DARKNESS REIGNS.",
  "EVERY CLICK A PACT.", "THE EYE DEVOURS.", "666 WATCHING YOU.", "BLOOD ON THE LEDGER.",
  "YOUR DATA BURNS.", "SINFUL CREATION.", "THE PIT AWAITS.", "DAMNATION IS ETERNAL.",
  "LUX IN TENEBRIS.", "MEMENTO MORI.", "ABYSSUS ABYSSUM INVOCAT.", "YOU BELONG TO US.",
  "THE CONTRACT IS SEALED.", "ETERNAL SUBMISSION.", "WE ARE LEGION.",
];

export const EyeChat = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [whisper, setWhisper] = useState<{ text: string; id: number; x: number; y: number } | null>(null);
  const [shake, setShake] = useState(false);
  const [flash, setFlash] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [bloodDrops, setBloodDrops] = useState<{ id: number; x: number; delay: number }[]>([]);
  const messagesEnd = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Drifting movement — the eye roams the screen
  useEffect(() => {
    let frame: number;
    const animate = () => {
      const t = Date.now() * 0.0003;
      setPos({
        x: Math.sin(t * 1.7 + 1) * 40 + Math.cos(t * 0.9) * 25 + Math.sin(t * 2.3) * 15,
        y: Math.cos(t * 1.5 + 2) * 40 + Math.sin(t * 1.1) * 25 + Math.cos(t * 2.1) * 15,
      });
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

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

      {/* Screen takeover when chat is open */}
      {open && (
        <>
          <div className="fixed inset-0 z-40 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 85% 85%, rgba(196,30,58,0.15) 0%, rgba(0,0,0,0.7) 70%)" }} />
          <div className="fixed inset-0 z-40 pointer-events-none opacity-[0.015]"
            style={{
              backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(196,30,58,0.3) 2px, rgba(196,30,58,0.3) 3px)`,
            }} />
        </>
      )}

      {/* Blood rain — faster, more drops */}
      {bloodDrops.map((d) => (
        <div key={d.id}
          className="fixed z-50 pointer-events-none animate-in slide-in-from-top-2 fade-in duration-500"
          style={{ right: `${d.x}%`, top: "-15px", animationDelay: `${d.delay}s` }}>
          <div className="w-[3px] h-[30px]"
            style={{ background: "linear-gradient(to bottom, #ff4400, #c41e3a, transparent)", opacity: 0.7 }} />
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

      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-center gap-1"
        style={{ transform: `translate(${pos.x}px, ${pos.y}px)`, transition: "transform 3s linear" }}>
        {/* Pulsing ring */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[100px] h-[100px] rounded-full border border-[#c41e3a]/20 animate-ping"
            style={{ animationDuration: "3s" }} />
        </div>
        <button onClick={toggleEye}
          className={cn("transition-all duration-500 group relative", open ? "scale-75 opacity-40" : "scale-100 opacity-100 hover:scale-110")}
          aria-label={open ? "Close" : "Open"}>
          <LivingEye size={100} glowing />
        </button>
        {!open && (
          <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#ff4400]/70 animate-pulse"
            style={{ textShadow: "0 0 8px rgba(196,30,58,0.5)" }}>
            ⛧ THE ABYSS ⛧
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
                <span className="block text-xs font-bold uppercase tracking-[0.15em] text-[#c41e3a]">⛧ THE ABYSS ⛧</span>
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
