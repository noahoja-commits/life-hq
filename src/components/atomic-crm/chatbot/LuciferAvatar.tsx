/** Lucifer's avatar — a detailed Baphomet/demonic visage for the chatbot */

export const LuciferAvatar = ({ size = 40, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Outer pentagram ring */}
    <polygon points="60,4 92,28 112,60 92,92 60,116 28,92 8,60 28,28" fill="none" stroke="#c41e3a" strokeWidth="1.5" opacity="0.4" />
    {/* Face — angular, gaunt */}
    <ellipse cx="60" cy="58" rx="30" ry="38" fill="#0d0505" stroke="#3a1010" strokeWidth="1" />
    {/* Cheekbones — sharp */}
    <path d="M30,55 L22,50 Q18,48 20,52 L28,60" fill="#0a0202" stroke="#2a0808" strokeWidth="0.5" />
    <path d="M90,55 L98,50 Q102,48 100,52 L92,60" fill="#0a0202" stroke="#2a0808" strokeWidth="0.5" />
    {/* Eyes — deep set, glowing */}
    <ellipse cx="48" cy="52" rx="8" ry="5" fill="#020101" stroke="#5a1010" strokeWidth="1" />
    <ellipse cx="72" cy="52" rx="8" ry="5" fill="#020101" stroke="#5a1010" strokeWidth="1" />
    <ellipse cx="48" cy="52" rx="3" ry="5" fill="#c41e3a" opacity="0.6" />
    <ellipse cx="72" cy="52" rx="3" ry="5" fill="#c41e3a" opacity="0.6" />
    <circle cx="47" cy="50" r="1" fill="#fff" opacity="0.15" />
    <circle cx="71" cy="50" r="1" fill="#fff" opacity="0.15" />
    {/* Baphomet horns */}
    <path d="M38,30 Q30,10 22,-2 Q20,-6 26,-8 Q38,-2 42,16" fill="#0d0505" stroke="#5a1010" strokeWidth="1.5" />
    <path d="M82,30 Q90,10 98,-2 Q100,-6 94,-8 Q82,-2 78,16" fill="#0d0505" stroke="#5a1010" strokeWidth="1.5" />
    {/* Nose — angular */}
    <path d="M56,62 L60,68 L64,62" fill="none" stroke="#2a0808" strokeWidth="1" />
    {/* Mouth — cruel smile */}
    <path d="M42,82 Q50,88 60,86 Q70,88 78,82" fill="none" stroke="#3a1010" strokeWidth="1.5" />
    <path d="M44,82 Q60,90 76,82" fill="none" stroke="#1a0404" strokeWidth="0.5" />
    {/* Inverted cross on forehead */}
    <line x1="60" y1="16" x2="60" y2="24" stroke="#c41e3a" strokeWidth="1" opacity="0.5" />
    <line x1="56" y1="18" x2="64" y2="18" stroke="#c41e3a" strokeWidth="1" opacity="0.4" />
    {/* Soul glow aura */}
    <circle cx="60" cy="58" r="50" fill="none" stroke="#c41e3a" strokeWidth="0.3" opacity="0.15" />
  </svg>
);
