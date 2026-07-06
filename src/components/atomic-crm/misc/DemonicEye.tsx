/** A brutalist demonic eye — SVG artwork for the dark aesthetic. */
export const DemonicEye = ({
  size = 200,
  className,
}: {
  size?: number;
  className?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Outer geometric frame — octagonal/ritual */}
    <polygon
      points="100,2 160,30 198,100 160,170 100,198 40,170 2,100 40,30"
      stroke="#c41e3a"
      strokeWidth="1.5"
      fill="none"
      opacity="0.6"
    />

    {/* Inner circle — the eye boundary */}
    <circle cx="100" cy="100" r="62" stroke="#c41e3a" strokeWidth="2" fill="none" />
    <circle cx="100" cy="100" r="58" stroke="#c41e3a" strokeWidth="0.5" fill="none" opacity="0.4" />

    {/* Upper eyelid — heavy, angular */}
    <path
      d="M38,100 Q38,40 100,35 Q162,40 162,100"
      stroke="#c41e3a"
      strokeWidth="3"
      fill="none"
    />
    <path
      d="M42,100 Q42,44 100,39 Q158,44 158,100"
      stroke="#1a1a1a"
      strokeWidth="6"
      fill="none"
      opacity="0.8"
    />

    {/* Lower eyelid — sharper */}
    <path
      d="M42,100 Q42,156 100,160 Q158,156 158,100"
      stroke="#c41e3a"
      strokeWidth="1.5"
      fill="none"
    />

    {/* Iris — crimson with inner glow */}
    <circle cx="100" cy="95" r="24" fill="#1a0a0a" stroke="#c41e3a" strokeWidth="1.5" />
    <circle cx="100" cy="95" r="18" fill="#2a0a0a" />
    <circle cx="100" cy="95" r="12" fill="#c41e3a" opacity="0.15" />

    {/* Pupil — vertical slit (demonic) */}
    <ellipse cx="100" cy="95" rx="4" ry="10" fill="#080808" />
    <ellipse cx="100" cy="95" rx="2" ry="7" fill="#0a0a0a" />

    {/* Pupil glow */}
    <ellipse cx="100" cy="93" rx="1.5" ry="2" fill="#c41e3a" opacity="0.4" />

    {/* Esoteric lines — radiating from eye */}
    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
      const rad = (angle * Math.PI) / 180;
      const x1 = 100 + 68 * Math.cos(rad);
      const y1 = 100 + 68 * Math.sin(rad);
      const x2 = 100 + 82 * Math.cos(rad);
      const y2 = 100 + 82 * Math.sin(rad);
      return (
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="#c41e3a"
          strokeWidth={i % 2 === 0 ? "1" : "0.5"}
          opacity={i % 3 === 0 ? "0.5" : "0.25"}
        />
      );
    })}

    {/* Corner sigils — small crosses/dots */}
    <circle cx="28" cy="28" r="2" fill="#c41e3a" opacity="0.4" />
    <circle cx="172" cy="28" r="2" fill="#c41e3a" opacity="0.4" />
    <circle cx="28" cy="172" r="2" fill="#c41e3a" opacity="0.4" />
    <circle cx="172" cy="172" r="2" fill="#c41e3a" opacity="0.4" />

    {/* Blood tear */}
    <path
      d="M100,122 Q100,140 98,148 Q96,155 100,158 Q104,155 102,148 Q100,140 100,122"
      fill="#c41e3a"
      opacity="0.6"
    />
  </svg>
);
