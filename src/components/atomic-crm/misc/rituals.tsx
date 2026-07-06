import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNotify } from "ra-core";

/** Ritual Mode — when the user completes something important, the screen burns. */
export const useRitual = () => {
  const [ritual, setRitual] = useState<{ active: boolean; type: string }>({ active: false, type: "" });

  const perform = useCallback((type: string = "completion") => {
    setRitual({ active: true, type });
    setTimeout(() => setRitual({ active: false, type: "" }), 2500);
  }, []);

  const RitualOverlay = ritual.active
    ? createPortal(
        <div className="fixed inset-0 z-[100] pointer-events-none">
          {/* Crimson flash */}
          <div className="absolute inset-0 bg-[#c41e3a] opacity-20 animate-in fade-in duration-200" />
          {/* Pentagram */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg viewBox="0 0 400 400" className="w-64 h-64 opacity-30 animate-in zoom-in-50 duration-500">
              <circle cx="200" cy="200" r="180" fill="none" stroke="#c41e3a" strokeWidth="2" opacity="0.4">
                <animate attributeName="r" values="180;190;180" dur="1s" repeatCount="2" />
              </circle>
              {[0, 72, 144, 216, 288].map((angle, i) => {
                const rad = (angle * Math.PI) / 180;
                const next = ((angle + 144) * Math.PI) / 180;
                return (
                  <line key={i}
                    x1={200 + 160 * Math.cos(rad)} y1={200 + 160 * Math.sin(rad)}
                    x2={200 + 160 * Math.cos(next)} y2={200 + 160 * Math.sin(next)}
                    stroke="#c41e3a" strokeWidth="2" opacity="0.5">
                    <animate attributeName="opacity" values="0.5;0.8;0.5" dur="0.8s" repeatCount="3" />
                  </line>
                );
              })}
            </svg>
          </div>
          {/* Text */}
          <div className="absolute inset-0 flex items-center justify-center pt-40">
            <p className="text-2xl font-black uppercase tracking-[0.3em] text-[#c41e3a] animate-in fade-in slide-in-from-bottom-4 duration-700">
              {ritual.type === "completion" ? "⛧ SEALED ⛧" : "⛧ WITNESSED ⛧"}
            </p>
          </div>
          {/* Blood drips from top */}
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute top-0 w-1 bg-gradient-to-b from-[#c41e3a] to-transparent opacity-50 animate-in slide-in-from-top duration-1000"
              style={{ left: `${15 + i * 14}%`, height: `${40 + Math.random() * 60}px`, animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>,
        document.body,
      )
    : null;

  return { perform, RitualOverlay };
};

/**
 * Possession Mode — Lucifer randomly interjects with observations.
 * Pass `messages` to limit frequency (e.g., once per session or per minute).
 */
const POSSESSION_PHRASES = [
  "I see you. Still avoiding that call, aren't you?",
  "The void noticed you haven't completed a todo in 3 hours. Just saying.",
  "Your goals are collecting dust. The abyss is patient but not THAT patient.",
  "You opened this app. Now actually DO something.",
  "The darkness observes your scrolling. It is... unimpressed.",
  "A demon somewhere is laughing at your productivity today.",
  "The ledger of souls shows a deficit in your account. Rectify this.",
  "I watched you create that task 2 weeks ago. It's still there. Waiting.",
  "The contract you made with yourself is bleeding. Seal it or break it.",
  "Every unchecked box is a soul left unclaimed. The void hungers.",
];

export const usePossession = () => {
  const notify = useNotify();

  useEffect(() => {
    const strike = () => {
      const phrase = POSSESSION_PHRASES[Math.floor(Math.random() * POSSESSION_PHRASES.length)];
      notify(`⛧ ${phrase}`, { type: "info", autoHideDuration: 6000 });
    };

    // First strike after 30-90 seconds
    const first = setTimeout(strike, 30000 + Math.random() * 60000);
    // Then every 3-8 minutes
    const interval = setInterval(strike, 180000 + Math.random() * 300000);

    return () => { clearTimeout(first); clearInterval(interval); };
  }, [notify]);
};

/**
 * Summoning Ritual — Konami-code style keyboard sequence.
 * Triggers a hidden screen effect and Lucifer message.
 */
const SUMMON_CODE = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight"];

export const useSummoning = (onSummon: () => void) => {
  useEffect(() => {
    let pos = 0;
    const handler = (e: KeyboardEvent) => {
      if (e.key === SUMMON_CODE[pos]) {
        pos++;
        if (pos === SUMMON_CODE.length) {
          pos = 0;
          onSummon();
        }
      } else {
        pos = 0;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onSummon]);
};
