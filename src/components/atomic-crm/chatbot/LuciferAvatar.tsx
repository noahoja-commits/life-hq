/** Baphomet — a proper demonic goat avatar for Lucifer */
export const LuciferAvatar = ({ size = 72 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="bg${size}" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#1a0808" />
        <stop offset="100%" stopColor="#040000" />
      </radialGradient>
      <radialGradient id="eyeGlow${size}" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#cc0000" />
        <stop offset="60%" stopColor="#660000" />
        <stop offset="100%" stopColor="#110000" />
      </radialGradient>
      <filter id="glow${size}">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>

    {/* Background circle */}
    <circle cx="50" cy="50" r="48" fill="#040404" stroke="#1a0404" strokeWidth="1.5" />

    {/* Horns — curved, goat-like */}
    <path d="M30,35 Q15,5 8,10 Q2,14 10,25" stroke="#1a1a1a" strokeWidth="3" fill="none" />
    <path d="M30,35 Q15,5 8,10 Q2,14 10,25" stroke="#080808" strokeWidth="1" fill="none" />
    <path d="M70,35 Q85,5 92,10 Q98,14 90,25" stroke="#1a1a1a" strokeWidth="3" fill="none" />
    <path d="M70,35 Q85,5 92,10 Q98,14 90,25" stroke="#080808" strokeWidth="1" fill="none" />

    {/* Goat head — angular, menacing */}
    <path d="M30,35 Q28,55 35,70 Q40,78 50,80 Q60,78 65,70 Q72,55 70,35" fill="#0a0606" stroke="#1a0404" strokeWidth="1.5" />
    {/* Snout */}
    <path d="M38,68 Q42,82 50,84 Q58,82 62,68" fill="#060404" stroke="#1a0404" strokeWidth="1" />

    {/* Eyes — glowing goat slits */}
    <ellipse cx="38" cy="50" rx="10" ry="6" fill="url(#eyeGlow${size})" opacity="0.9" />
    <ellipse cx="62" cy="50" rx="10" ry="6" fill="url(#eyeGlow${size})" opacity="0.9" />
    {/* Pupils — vertical slits */}
    <rect x="36" y="46" width="4" height="8" rx="2" fill="#000" />
    <rect x="60" y="46" width="4" height="8" rx="2" fill="#000" />
    {/* Eye glow */}
    <ellipse cx="38" cy="50" rx="12" ry="8" fill="none" stroke="#cc0000" strokeWidth="1" opacity="0.3" filter="url(#glow${size})" />
    <ellipse cx="62" cy="50" rx="12" ry="8" fill="none" stroke="#cc0000" strokeWidth="1" opacity="0.3" filter="url(#glow${size})" />

    {/* Goat ears — pointed, swept back */}
    <path d="M28,42 Q18,32 14,38 Q18,44 28,45" fill="#0a0606" stroke="#1a0404" strokeWidth="0.5" />
    <path d="M72,42 Q82,32 86,38 Q82,44 72,45" fill="#0a0606" stroke="#1a0404" strokeWidth="0.5" />

    {/* Inverted cross on forehead */}
    <line x1="50" y1="38" x2="50" y2="48" stroke="#c41e3a" strokeWidth="1.5" opacity="0.6" />
    <line x1="46" y1="42" x2="54" y2="42" stroke="#c41e3a" strokeWidth="1.5" opacity="0.6" />

    {/* Beard — wispy, malevolent */}
    <path d="M40,78 Q44,92 48,90 M50,80 Q50,94 50,92 M60,78 Q56,92 52,90" stroke="#1a0404" strokeWidth="0.8" fill="none" opacity="0.5" />

    {/* Mouth line */}
    <path d="M42,72 Q50,76 58,72" stroke="#1a0404" strokeWidth="0.8" fill="none" />

    {/* Pentagram frame ring */}
    <circle cx="50" cy="50" r="46" fill="none" stroke="#1a0404" strokeWidth="0.5" opacity="0.4" />
    {/* Pentagram points */}
    {[0, 72, 144, 216, 288].map((a, i) => {
      const rad = (a * Math.PI) / 180;
      const rad2 = ((a + 144) * Math.PI) / 180;
      return <line key={i} x1={50 + 44 * Math.cos(rad)} y1={50 + 44 * Math.sin(rad)} x2={50 + 44 * Math.cos(rad2)} y2={50 + 44 * Math.sin(rad2)} stroke="#1a0404" strokeWidth="0.3" opacity="0.3" />;
    })}
  </svg>
);
