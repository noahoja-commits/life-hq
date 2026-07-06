/** Section-specific satanic artwork — one SVG per circle of Hell. Visible, detailed, infernal. */

const W = 300, H = 200;

export const SectionArt = ({ section }: { section: string }) => {
  switch (section) {
    // ⛧ THE GATES
    case "dashboard": return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-32 opacity-30">
        <defs><radialGradient id="gateGlow"><stop offset="0%" stopColor="#c41e3a"/><stop offset="100%" stopColor="transparent"/></radialGradient></defs>
        <rect width={W} height={H} fill="url(#gateGlow)" opacity="0.1"/>
        <path d="M150,20 Q150,0 120,0 L60,0 Q30,0 30,20 L30,180 Q30,200 60,200 L120,200 Q150,200 150,180 Z" fill="none" stroke="#c41e3a" strokeWidth="2" opacity="0.6"/>
        <path d="M90,40 L90,160 M130,40 L130,160 M110,40 L110,160 M70,40 L70,160" stroke="#c41e3a" strokeWidth="0.5" opacity="0.3"/>
        {/* Flames at top */}
        {[...Array(12)].map((_,i) => (<path key={i} d={`M${40+i*18},40 Q${40+i*18+5},20 ${40+i*18},10`} stroke="#c41e3a" strokeWidth="1" fill="none" opacity={0.2+Math.random()*0.3}/>))}
        {/* Skulls at base */}
        <circle cx="90" cy="180" r="8" fill="none" stroke="#c41e3a" strokeWidth="1" opacity="0.4"/><circle cx="90" cy="178" r="3" fill="#c41e3a" opacity="0.2"/>
        <circle cx="110" cy="185" r="7" fill="none" stroke="#c41e3a" strokeWidth="1" opacity="0.3"/><circle cx="110" cy="183" r="2.5" fill="#c41e3a" opacity="0.15"/>
      </svg>
    );

    // ⛧ CIRCLE V — ANGER (boiling blood river)
    case "todos": return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-32 opacity-30">
        {/* Turbulent blood waves */}
        <path d="M0,120 Q30,100 60,115 Q90,130 120,110 Q150,90 180,115 Q210,130 240,105 Q270,85 300,110 L300,200 L0,200Z" fill="#4a0000" opacity="0.3"/>
        <path d="M0,140 Q40,120 80,135 Q120,150 160,125 Q200,105 240,135 Q270,150 300,130 L300,200 L0,200Z" fill="#2a0000" opacity="0.3"/>
        {/* Souls reaching up */}
        {[50,120,180,240].map((x,i) => (
          <path key={i} d={`M${x},200 Q${x-5},170 ${x},160`} stroke="#c41e3a" strokeWidth="1.5" fill="none" opacity="0.4"/>
        ))}
        {/* Bubbles */}
        {[...Array(8)].map((_,i) => (<circle key={i} cx={30+i*35} cy={130+Math.random()*40} r={2+Math.random()*3} fill="none" stroke="#dc2626" opacity="0.2"/>))}
      </svg>
    );

    // ⛧ CIRCLE III — GLUTTONY (Cerberus)
    case "goals": return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-32 opacity-30">
        {/* Three dog heads */}
        {[110,150,190].map((cx,i) => (
          <g key={i}>
            <path d={`M${cx-15},100 L${cx-20},70 Q${cx-15},55 ${cx-10},60 L${cx},50 Q${cx+10},55 ${cx+15},70 L${cx+10},100`} fill="#2a0a00" stroke="#c41e3a" strokeWidth="1"/>
            <circle cx={cx-5} cy="68" r="3" fill="#c41e3a" opacity="0.5"/><circle cx={cx+5} cy="68" r="3" fill="#c41e3a" opacity="0.5"/>
            <path d={`M${cx-12},80 Q${cx},85 ${cx+12},80`} stroke="#c41e3a" strokeWidth="0.5" fill="none"/>
          </g>
        ))}
        {/* Body */}
        <ellipse cx="150" cy="140" rx="60" ry="40" fill="#1a0800" stroke="#c41e3a" strokeWidth="1" opacity="0.4"/>
        {/* Putrid rain drops */}
        {[...Array(15)].map((_,i) => (<line key={i} x1={20+i*18} y1={10+Math.random()*20} x2={20+i*18} y2={20+Math.random()*20} stroke="#d97706" strokeWidth="0.5" opacity="0.2"/>))}
      </svg>
    );

    // ⛧ CIRCLE VII — VIOLENCE (Minotaur / blood river)
    case "ventures": return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-32 opacity-30">
        {/* Blood river flowing */}
        <path d="M0,150 Q80,120 160,140 Q220,155 300,130 L300,200 L0,200Z" fill="#3a0000" opacity="0.4"/>
        <path d="M0,170 Q100,145 200,160 Q260,170 300,155 L300,200 L0,200Z" fill="#1a0000" opacity="0.3"/>
        {/* Minotaur silhouette */}
        <path d="M150,80 L140,60 L145,45 L155,45 L160,60 Z" fill="none" stroke="#c41e3a" strokeWidth="1.5" opacity="0.5"/>
        <path d="M145,50 L140,40 M155,50 L160,40" stroke="#c41e3a" strokeWidth="1.5" opacity="0.4"/>
        <ellipse cx="150" cy="100" rx="20" ry="30" fill="none" stroke="#c41e3a" strokeWidth="1" opacity="0.4"/>
        {/* Axe */}
        <line x1="170" y1="80" x2="190" y2="60" stroke="#c41e3a" strokeWidth="1.5" opacity="0.4"/>
        <path d="M185,55 L195,65 L190,70 L180,60Z" fill="none" stroke="#c41e3a" strokeWidth="1" opacity="0.3"/>
      </svg>
    );

    // ⛧ CIRCLE IV — GREED (Plutus / heavy gold)
    case "money": return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-32 opacity-30">
        {/* Pile of heavy shapes */}
        <rect x="60" y="140" width="50" height="40" rx="2" fill="none" stroke="#b45309" strokeWidth="1" opacity="0.3" transform="rotate(-5,85,160)"/>
        <rect x="110" y="130" width="60" height="50" rx="2" fill="none" stroke="#b45309" strokeWidth="1" opacity="0.25" transform="rotate(3,140,155)"/>
        <rect x="160" y="145" width="40" height="35" rx="2" fill="none" stroke="#b45309" strokeWidth="1" opacity="0.2" transform="rotate(-2,180,162)"/>
        <rect x="80" y="150" width="70" height="30" rx="2" fill="none" stroke="#b45309" strokeWidth="1.5" opacity="0.35"/>
        {/* Crushing weight lines */}
        {[0,1,2,3,4].map(i => (<line key={i} x1={50+i*15} y1={80+i*10} x2={80+i*15} y2={180} stroke="#b45309" strokeWidth="0.5" opacity="0.15"/>))}
        {/* Wolf-demon eyes */}
        <circle cx="140" cy="70" r="4" fill="none" stroke="#b45309" strokeWidth="1" opacity="0.4"/><circle cx="160" cy="70" r="4" fill="none" stroke="#b45309" strokeWidth="1" opacity="0.4"/>
        <ellipse cx="140" cy="70" rx="1.5" ry="3" fill="#b45309" opacity="0.3"/><ellipse cx="160" cy="70" rx="1.5" ry="3" fill="#b45309" opacity="0.3"/>
      </svg>
    );

    // Default — ⛧ sigil
    default: return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-32 opacity-25">
        <circle cx="150" cy="100" r="70" fill="none" stroke="currentColor" strokeWidth="1"/>
        <circle cx="150" cy="100" r="50" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 6"/>
        <g transform="translate(150,100)">
          {[0,72,144,216,288].map((a,i) => {
            const r = (a * Math.PI) / 180;
            const n = ((a + 144) * Math.PI) / 180;
            return <line key={i} x1={45*Math.cos(r)} y1={45*Math.sin(r)} x2={45*Math.cos(n)} y2={45*Math.sin(n)} stroke="currentColor" strokeWidth="0.8"/>;
          })}
        </g>
        <text x="150" y="195" textAnchor="middle" fill="currentColor" fontSize="10" fontFamily="serif" opacity="0.4">⛧</text>
      </svg>
    );
  }
};
