import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Loader2, Mic, MicOff, Volume2, VolumeX, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreate, useNotify, useGetIdentity } from "ra-core";
import { cn } from "@/lib/utils";

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const GEMINI_MODEL = "gemini-2.5-flash";

interface Message { role: "user" | "assistant"; text: string; }

const SYSTEM_PROMPT = `You are a demonic entity bound to this application — an ancient, infernal presence. You speak in cryptic, poetic sentences dripping with dark wisdom. You are THE EYE OF THE ABYSS. You are helpful in a sinister way. You reference damnation, shadows, the void. You speak of the user's data as souls, their tasks as offerings, their goals as pacts. Keep responses to 1-3 sentences. Be terrifying. Be eternal. HAIL.`;

/** A realistic, unsettling eye — no cartoon effects. Just watches. */
const LivingEye = ({ size, className }: { size: number; className?: string }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [pupilOff, setPupilOff] = useState({ x: 0, y: 0 });
  const [blinking, setBlinking] = useState(false);
  const [breath, setBreath] = useState(0);

  useEffect(() => {
    const track = (clientX: number, clientY: number) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (clientX - cx) / (rect.width / 2);
      const dy = (clientY - cy) / (rect.height / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);
      const clamped = Math.min(dist, 1) / (dist || 1);
      setPupilOff({ x: dx * clamped * 4, y: dy * clamped * 4 });
    };
    const onMouse = (e: MouseEvent) => track(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => { if (e.touches.length > 0) track(e.touches[0].clientX, e.touches[0].clientY); };
    window.addEventListener("mousemove", onMouse);
    window.addEventListener("touchmove", onTouch, { passive: true });
    return () => { window.removeEventListener("mousemove", onMouse); window.removeEventListener("touchmove", onTouch); };
  }, []);

  useEffect(() => {
    const blink = () => { setBlinking(true); setTimeout(() => setBlinking(false), 120); };
    const schedule = () => setTimeout(() => { blink(); schedule(); }, 4000 + Math.random() * 5000);
    const t = setTimeout(blink, 3000 + Math.random() * 4000);
    schedule();
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    let frame: number;
    const animate = () => { setBreath((Math.sin(Date.now() / 3000) + 1) / 2); frame = requestAnimationFrame(animate); };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  const scaleY = blinking ? 0.02 : 1;

  return (
    <svg ref={svgRef} width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ filter: `drop-shadow(0 0 ${4 + breath * 4}px rgba(180,0,0,0.4))` }}>
      {/* Eye shape — organic almond */}
      <ellipse cx="100" cy="100" rx="62" ry="58" fill="#0a0a0a" stroke="#1a0808" strokeWidth="1" />
      {/* Inner shadow ring */}
      <ellipse cx="100" cy="100" rx="58" ry="54" fill="none" stroke="#100505" strokeWidth="3" opacity="0.6" />
      {/* Eyelid group */}
      <g transform={`scale(1, ${scaleY})`} style={{ transformOrigin: "100px 100px" }}>
        {/* Upper eyelid — heavy, realistic */}
        <path d="M34,100 Q34,34 100,28 Q166,34 166,100" stroke="#0a0a0a" strokeWidth="14" fill="none" opacity="0.98" />
        <path d="M36,100 Q36,40 100,34 Q164,40 164,100" stroke="#1a0404" strokeWidth="2" fill="none" opacity="0.7" />
        {/* Lower eyelid — thin */}
        <path d="M38,100 Q38,160 100,164 Q162,160 162,100" stroke="#0d0303" strokeWidth="1.5" fill="none" opacity="0.6" />
        {/* Iris — deep blood red, realistic radial */}
        <circle cx="100" cy="98" r="26" fill="url(#irisGrad)" stroke="#1a0404" strokeWidth="1.5" />
        {/* Pupil — round, deep black */}
        <circle cx={100 + pupilOff.x} cy={98 + pupilOff.y} r="9" fill="#010101" />
        {/* Pupil highlight — tiny reflection */}
        <circle cx={103 + pupilOff.x} cy={94 + pupilOff.y} r="2.5" fill="#fff" opacity="0.06" />
      </g>
      {/* Iris gradient definition */}
      <defs>
        <radialGradient id="irisGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1a0000" />
          <stop offset="40%" stopColor="#3a0000" />
          <stop offset="70%" stopColor="#1a0000" />
          <stop offset="100%" stopColor="#0a0000" />
        </radialGradient>
      </defs>
      {/* Subtle blood vessel lines in the sclera */}
      {[[20, 0.3], [-15, 0.2], [35, 0.25], [-25, 0.15]].map(([angle, opacity], i) => (
        <path key={`v${i}`} d={`M${100 + 45 * Math.cos((angle as number + 90) * Math.PI / 180)},${100 + 45 * Math.sin((angle as number + 90) * Math.PI / 180)} Q${100 + 30 * Math.cos((angle as number + 80) * Math.PI / 180)},${100 + 30 * Math.sin((angle as number + 80) * Math.PI / 180)} ${100 + 50 * Math.cos((angle as number + 100) * Math.PI / 180)},${100 + 50 * Math.sin((angle as number + 100) * Math.PI / 180)}`}
          stroke="#1a0404" strokeWidth="0.4" fill="none" opacity={opacity as number * (0.5 + breath * 0.3)} />
      ))}
    </svg>
  );
};

export const EyeChat = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const recognitionRef = useRef<any>(null);
  const messagesEnd = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [createTodo] = useCreate();
  const notify = useNotify();
  const { identity } = useGetIdentity();
  const salesId = identity?.id ? Number(identity.id) : null;

  const saveAsTask = (text: string) => {
    createTodo("todos", { data: { text, sales_id: salesId, priority: 0 } });
    notify("⛧ Task claimed", { type: "success" });
  };

  // Barely perceptible drift
  useEffect(() => {
    let frame: number;
    const animate = () => {
      const t = Date.now() * 0.0001;
      setPos({ x: Math.sin(t * 1.3 + 1) * 8 + Math.cos(t * 0.5) * 4, y: Math.cos(t * 1.1 + 2) * 8 + Math.sin(t * 0.6) * 4 });
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  const speak = useCallback((text: string) => {
    if (!voiceOn || typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/[*_~`#>\-\[\]()]/g, "").replace(/\n+/g, ". ").trim();
    const utter = new SpeechSynthesisUtterance(clean);
    utter.rate = 0.7; utter.pitch = 0.25; utter.volume = 0.85;
    const voices = window.speechSynthesis.getVoices();
    const deep = voices.find((v) => v.name.includes("Daniel") || v.name.includes("UK Male") || v.name.includes("Deep"))
      || voices.find((v) => v.lang.startsWith("en-GB")) || voices[0];
    if (deep) utter.voice = deep;
    window.speechSynthesis.speak(utter);
  }, [voiceOn]);

  const toggleListen = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    if (listening) { recognitionRef.current?.stop(); setListening(false); return; }
    const rec = new SpeechRecognition();
    rec.continuous = false; rec.interimResults = false; rec.lang = "en-US";
    rec.onresult = (e: any) => { setInput((prev) => prev + " " + e.results[0][0].transcript); setListening(false); };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  }, [listening]);

  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg: Message = { role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput(""); setLoading(true);
    try {
      if (!GEMINI_KEY) throw new Error("No API key");
      const conversationText = [...messages, userMsg].map((m) => `${m.role === "user" ? "Human" : "Eye"}: ${m.text}`).join("\n");
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`,
        { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: [{ role: "user", parts: [{ text: conversationText }] }],
            generationConfig: { temperature: 0.9, maxOutputTokens: 150 } }) });
      if (!res.ok) { throw new Error(`${res.status}: ${(await res.text()).slice(0, 100)}`); }
      const json = await res.json();
      const reply = (json.candidates?.[0]?.content?.parts?.[0]?.text ?? "…").trim();
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
      speak(reply);
    } catch (e: any) {
      setMessages((prev) => [...prev, { role: "assistant", text: `The eye is clouded. ${e?.message || ""}` }]);
    } finally { setLoading(false); }
  }, [input, loading, messages, speak]);

  return (
    <>
      <div className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-50"
        style={{ transform: `translate(${pos.x}px, ${pos.y}px)`, transition: "transform 6s linear" }}>
        <button onClick={() => setOpen(!open)}
          className={cn("transition-all duration-700", open ? "scale-75 opacity-40" : "scale-100 opacity-90 hover:scale-105")}
          aria-label={open ? "Close" : "Open"}>
          <LivingEye size={open ? 60 : typeof window !== "undefined" && window.innerWidth < 640 ? 60 : 80} />
        </button>
      </div>

      {open && (
        <div className="fixed inset-x-0 bottom-0 sm:inset-auto sm:bottom-24 sm:right-5 z-50 flex h-[65vh] sm:h-[480px] w-full sm:w-[360px] flex-col overflow-hidden border-t sm:border border-[#1a0404]/30 bg-[#060606] page-enter"
          style={{ boxShadow: "0 0 30px rgba(180,0,0,0.1)" }}>
          <div className="flex shrink-0 items-center justify-between border-b border-[#1a0404]/20 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <LivingEye size={22} />
              <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#8b0000]/70">The Eye</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setVoiceOn(!voiceOn)} className="p-1 text-[#8b0000]/50 hover:text-[#8b0000] transition-colors">
                {voiceOn ? <Volume2 className="size-3" /> : <VolumeX className="size-3" />}
              </button>
              <button onClick={() => setOpen(false)} className="p-1 text-[#8b0000]/50 hover:text-[#8b0000] transition-colors">
                <X className="size-3.5" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="flex flex-col items-center gap-4 pt-16 text-center">
                <LivingEye size={64} />
                <p className="text-xs text-[#8b0000]/40 italic">Speak.</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={cn("flex gap-2 text-sm", m.role === "user" ? "justify-end" : "justify-start")}>
                {m.role === "assistant" && <LivingEye size={16} className="mt-0.5 shrink-0 opacity-40" />}
                <div className="flex flex-col gap-1">
                  <div className={cn("max-w-[85%] px-3 py-2 text-sm leading-relaxed",
                    m.role === "user" ? "bg-[#1a0404]/20 text-[#ccc] border border-[#1a0404]/20" : "bg-[#0a0a0a] text-[#999] italic border border-[#1a0404]/10")}>
                    {m.text}
                  </div>
                  {m.role === "user" && (
                    <button onClick={() => saveAsTask(m.text)} className="self-end flex items-center gap-1 text-[10px] text-[#8b0000]/50 hover:text-[#8b0000] transition-colors">
                      <Plus className="size-3" /> Save as task
                    </button>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2 text-sm">
                <LivingEye size={16} className="mt-0.5 shrink-0 opacity-40" />
                <div className="bg-[#0a0a0a] border border-[#1a0404]/10 px-3 py-2 text-sm text-[#999] italic">…</div>
              </div>
            )}
            <div ref={messagesEnd} />
          </div>
          <div className="flex shrink-0 items-center gap-1 border-t border-[#1a0404]/20 px-2 py-2.5">
            <Button size="icon" variant="ghost" onClick={toggleListen}
              className={cn("h-7 w-7", listening ? "text-[#8b0000] bg-[#1a0404]/10" : "text-[#8b0000]/40 hover:text-[#8b0000]")}>
              {listening ? <MicOff className="size-3" /> : <Mic className="size-3" />}
            </Button>
            <Input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={listening ? "Listening…" : "Whisper…"}
              className="h-8 border-0 bg-transparent text-xs focus-visible:ring-0 placeholder:text-[#8b0000]/20" />
            <Button size="icon" variant="ghost" onClick={send} disabled={loading || !input.trim()}
              className="h-7 w-7 text-[#8b0000]/50 hover:text-[#8b0000] hover:bg-[#1a0404]/10"><Send className="size-3" /></Button>
          </div>
        </div>
      )}
    </>
  );
};
