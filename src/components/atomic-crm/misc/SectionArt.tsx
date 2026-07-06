/** SectionArt — Dante's Inferno illustrations per section as inline SVG */
export const SectionArt = ({ section }: { section: string }) => {
  switch (section) {
    case "dashboard":
      return (
        <svg viewBox="0 0 400 200" className="absolute inset-0 h-full w-full opacity-[0.15] pointer-events-none" preserveAspectRatio="xMidYMid slice">
          {/* Gates of Hell */}
          <text x="200" y="30" textAnchor="middle" fill="#c41e3a" fontSize="12">LASCIATE OGNE SPERANZA VOI CH'INTRATE</text>
          <rect x="100" y="40" width="200" height="8" fill="#c41e3a" opacity="0.3" />
          <path d="M120,50 L200,150 L280,50" fill="none" stroke="#c41e3a" strokeWidth="1" opacity="0.4" />
          <path d="M200,150 L200,200" stroke="#c41e3a" strokeWidth="1" opacity="0.3" />
          <circle cx="200" cy="170" r="3" fill="#c41e3a" opacity="0.3" />
          <circle cx="185" cy="175" r="2" fill="#c41e3a" opacity="0.2" />
          <circle cx="215" cy="175" r="2" fill="#c41e3a" opacity="0.2" />
        </svg>
      );

    case "goals":
      return (
        <svg viewBox="0 0 400 120" className="absolute inset-0 h-full w-full opacity-[0.12] pointer-events-none" preserveAspectRatio="xMidYMid slice">
          {/* Third Circle — Gluttony / Cerberus */}
          <circle cx="200" cy="20" r="15" stroke="#d97706" strokeWidth="0.5" fill="none" opacity="0.4" />
          <circle cx="170" cy="18" r="12" stroke="#d97706" strokeWidth="0.5" fill="none" opacity="0.3" />
          <circle cx="230" cy="18" r="12" stroke="#d97706" strokeWidth="0.5" fill="none" opacity="0.3" />
          <line x1="185" y1="32" x2="175" y2="60" stroke="#d97706" strokeWidth="0.5" opacity="0.2" />
          <line x1="215" y1="32" x2="225" y2="60" stroke="#d97706" strokeWidth="0.5" opacity="0.2" />
          <line x1="200" y1="35" x2="200" y2="65" stroke="#d97706" strokeWidth="0.5" opacity="0.2" />
          <text x="200" y="52" textAnchor="middle" fill="#d97706" fontSize="7" opacity="0.4">CERBERUS</text>
        </svg>
      );

    case "ventures":
      return (
        <svg viewBox="0 0 400 120" className="absolute inset-0 h-full w-full opacity-[0.12] pointer-events-none" preserveAspectRatio="xMidYMid slice">
          {/* Seventh Circle — Violence / boiling blood river */}
          <path d="M0,80 Q100,20 200,40 Q300,60 400,30 L400,120 L0,120Z" fill="#991b1b" opacity="0.08" />
          <line x1="50" y1="90" x2="150" y2="70" stroke="#991b1b" strokeWidth="0.5" opacity="0.3" />
          <line x1="200" y1="85" x2="300" y2="60" stroke="#991b1b" strokeWidth="0.5" opacity="0.3" />
          <line x1="100" y1="100" x2="250" y2="80" stroke="#991b1b" strokeWidth="0.5" opacity="0.2" />
        </svg>
      );

    case "money":
      return (
        <svg viewBox="0 0 400 120" className="absolute inset-0 h-full w-full opacity-[0.12] pointer-events-none" preserveAspectRatio="xMidYMid slice">
          {/* Fourth Circle — Greed / Plutus */}
          <circle cx="200" cy="55" r="25" fill="none" stroke="#b45309" strokeWidth="0.5" opacity="0.3" />
          <circle cx="200" cy="55" r="18" fill="none" stroke="#b45309" strokeWidth="0.5" opacity="0.2" />
          <circle cx="200" cy="55" r="10" fill="none" stroke="#b45309" strokeWidth="0.5" opacity="0.15" />
          <text x="200" y="58" textAnchor="middle" fill="#b45309" fontSize="6" opacity="0.4">PLUTUS</text>
        </svg>
      );

    case "track":
      return (
        <svg viewBox="0 0 400 120" className="absolute inset-0 h-full w-full opacity-[0.12] pointer-events-none" preserveAspectRatio="xMidYMid slice">
          {/* First Circle — Limbo */}
          <path d="M100,20 Q200,15 300,20" fill="none" stroke="#64748b" strokeWidth="0.5" opacity="0.3" />
          <path d="M80,40 Q200,30 320,40" fill="none" stroke="#64748b" strokeWidth="0.5" opacity="0.3" />
          <path d="M90,60 Q200,50 310,60" fill="none" stroke="#64748b" strokeWidth="0.5" opacity="0.3" />
          <path d="M120,80 Q200,75 280,80" fill="none" stroke="#64748b" strokeWidth="0.5" opacity="0.3" />
          <text x="200" y="55" textAnchor="middle" fill="#64748b" fontSize="8" opacity="0.4">LIMBO</text>
        </svg>
      );

    case "calendar":
      return (
        <svg viewBox="0 0 400 120" className="absolute inset-0 h-full w-full opacity-[0.12] pointer-events-none" preserveAspectRatio="xMidYMid slice">
          {/* Second Circle — Lust / whirlwind */}
          <path d="M200,20 Q150,15 100,30 Q60,50 80,70 Q120,90 200,80 Q280,70 320,50 Q340,30 300,20 Q250,12 200,20Z" fill="none" stroke="#db2777" strokeWidth="0.5" opacity="0.3" />
          <path d="M200,30 Q160,25 120,38 Q90,55 105,70 Q140,85 200,78 Q260,70 300,55 Q315,40 285,30 Q245,22 200,30Z" fill="none" stroke="#db2777" strokeWidth="0.5" opacity="0.2" />
        </svg>
      );

    case "focus":
      return (
        <svg viewBox="0 0 400 200" className="absolute inset-0 h-full w-full opacity-[0.15] pointer-events-none" preserveAspectRatio="xMidYMid slice">
          {/* Center of Hell — Trance/Meditation */}
          <circle cx="200" cy="80" r="40" fill="none" stroke="#7e22ce" strokeWidth="0.5" opacity="0.3" />
          <circle cx="200" cy="80" r="25" fill="none" stroke="#7e22ce" strokeWidth="0.5" opacity="0.2" />
          <circle cx="200" cy="80" r="12" fill="none" stroke="#7e22ce" strokeWidth="0.5" opacity="0.2" />
          <circle cx="200" cy="80" r="4" fill="#7e22ce" opacity="0.2" />
          <line x1="160" y1="80" x2="100" y2="80" stroke="#7e22ce" strokeWidth="0.5" opacity="0.2" />
          <line x1="240" y1="80" x2="300" y2="80" stroke="#7e22ce" strokeWidth="0.5" opacity="0.2" />
        </svg>
      );

    case "ai":
      return (
        <svg viewBox="0 0 400 200" className="absolute inset-0 h-full w-full opacity-[0.18] pointer-events-none" preserveAspectRatio="xMidYMid slice">
          {/* The Abyss — all-seeing eye */}
          <circle cx="200" cy="80" r="30" fill="none" stroke="#b91c1c" strokeWidth="0.5" opacity="0.4" />
          <ellipse cx="200" cy="80" rx="20" ry="12" fill="none" stroke="#b91c1c" strokeWidth="0.5" opacity="0.3" />
          <circle cx="200" cy="80" r="5" fill="#b91c1c" opacity="0.3" />
          <path d="M140,40 L200,80 L260,40" fill="none" stroke="#b91c1c" strokeWidth="0.5" opacity="0.3" />
          <path d="M140,120 L200,80 L260,120" fill="none" stroke="#b91c1c" strokeWidth="0.5" opacity="0.3" />
        </svg>
      );

    case "chatbot":
      return (
        <svg viewBox="0 0 400 200" className="absolute inset-0 h-full w-full opacity-[0.18] pointer-events-none" preserveAspectRatio="xMidYMid slice">
          {/* Lucifer's Throne */}
          <polygon points="200,20 170,150 230,150" fill="none" stroke="#b91c1c" strokeWidth="0.5" opacity="0.3" />
          <line x1="170" y1="150" x2="130" y2="200" stroke="#b91c1c" strokeWidth="0.5" opacity="0.2" />
          <line x1="230" y1="150" x2="270" y2="200" stroke="#b91c1c" strokeWidth="0.5" opacity="0.2" />
          <circle cx="200" cy="135" r="3" fill="#b91c1c" opacity="0.3" />
        </svg>
      );

    case "network":
      return (
        <svg viewBox="0 0 400 120" className="absolute inset-0 h-full w-full opacity-[0.12] pointer-events-none" preserveAspectRatio="xMidYMid slice">
          {/* River Styx — flowing lines */}
          <path d="M0,50 Q100,20 200,50 Q300,80 400,40" fill="none" stroke="#1d4ed8" strokeWidth="0.5" opacity="0.3" />
          <path d="M0,60 Q100,30 200,60 Q300,90 400,50" fill="none" stroke="#1d4ed8" strokeWidth="0.5" opacity="0.2" />
          <path d="M0,70 Q100,40 200,70 Q300,100 400,60" fill="none" stroke="#1d4ed8" strokeWidth="0.5" opacity="0.15" />
        </svg>
      );

    default:
      return null;
  }
};
