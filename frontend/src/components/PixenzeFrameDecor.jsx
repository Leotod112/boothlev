export default function PixenzeFrameDecor({ width = 900, height = 1600 }) {
  const checkerCols = 18;
  const checkerRows = 2;
  const checkerSize = width / checkerCols;

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="pixenze-dots" width="38" height="38" patternUnits="userSpaceOnUse">
          <circle cx="7" cy="8" r="2.2" fill="#2e90bf" opacity="0.35" />
          <circle cx="26" cy="24" r="1.8" fill="#f7dd73" opacity="0.35" />
        </pattern>
        <filter id="pixenze-rough">
          <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" />
        </filter>
      </defs>

      <rect width={width} height={height} fill="#80c9ed" />
      <rect width={width} height={height} fill="url(#pixenze-dots)" />

      <path d="M0 0 C80 80 20 180 105 270 C25 380 95 505 10 635 L0 635 Z" fill="#fff0c7" stroke="#141414" strokeWidth="8" />
      <path d="M28 0 C108 85 58 178 135 265 C62 372 130 498 40 620" fill="none" stroke="#f47a36" strokeWidth="28" />
      <path d="M900 0 C818 88 875 192 790 285 C872 410 805 520 890 660 L900 660 Z" fill="#fff0c7" stroke="#141414" strokeWidth="8" />
      <path d="M870 0 C800 92 848 192 765 290 C836 412 775 525 858 660" fill="none" stroke="#e65237" strokeWidth="28" />

      <g filter="url(#pixenze-rough)">
        <path d="M165 405 C260 300 430 315 520 405 C640 515 780 450 865 345 L900 410 L900 1530 L0 1530 L0 455 C70 520 95 485 165 405Z" fill="#5db8e8" opacity="0.65" />
        <path d="M45 700 C160 640 250 695 340 625 C445 545 555 620 645 555 C745 490 825 515 900 455 L900 1580 L0 1580 L0 735Z" fill="#75c9ef" opacity="0.62" />
      </g>

      <g transform="translate(450 76)">
        {Array.from({ length: 18 }).map((_, i) => {
          const angle = (i * 20 * Math.PI) / 180;
          const x1 = Math.cos(angle) * 76;
          const y1 = Math.sin(angle) * 76;
          const x2 = Math.cos(angle + 0.09) * 170;
          const y2 = Math.sin(angle + 0.09) * 170;
          const x3 = Math.cos(angle - 0.09) * 170;
          const y3 = Math.sin(angle - 0.09) * 170;
          return <polygon key={i} points={`${x1},${y1} ${x2},${y2} ${x3},${y3}`} fill="#f6b63c" stroke="#141414" strokeWidth="4" />;
        })}
        <circle r="92" fill="#f5c74d" stroke="#141414" strokeWidth="8" />
        <path d="M-45 4 Q-24 -16 -2 4" fill="none" stroke="#141414" strokeWidth="7" strokeLinecap="round" />
        <path d="M18 4 Q40 -16 62 4" fill="none" stroke="#141414" strokeWidth="7" strokeLinecap="round" />
      </g>

      <g fill="#fff8dc" stroke="#141414" strokeWidth="7">
        <path d="M78 150 C80 100 155 104 165 142 C200 112 255 135 250 178 C300 183 302 238 250 244 L100 244 C50 240 40 175 78 150Z" />
        <path d="M658 150 C660 100 735 104 745 142 C780 112 835 135 830 178 C880 183 882 238 830 244 L680 244 C630 240 620 175 658 150Z" />
      </g>
      <g fill="#141414">
        <circle cx="124" cy="176" r="8" /><circle cx="198" cy="176" r="8" />
        <path d="M143 200 Q162 220 185 200" fill="none" stroke="#141414" strokeWidth="5" strokeLinecap="round" />
        <circle cx="704" cy="176" r="8" /><circle cx="778" cy="176" r="8" />
        <path d="M723 200 Q742 220 765 200" fill="none" stroke="#141414" strokeWidth="5" strokeLinecap="round" />
      </g>

      <rect x="78" y="185" width="744" height="185" rx="42" fill="#e95737" stroke="#fff0c7" strokeWidth="16" />
      <text x="450" y="286" textAnchor="middle" fontFamily="Arial Black, Impact, sans-serif" fontSize="88" fill="#fff0c7" stroke="#141414" strokeWidth="3" paintOrder="stroke">
        SYZHAABOOTH
      </text>
      <text x="450" y="330" textAnchor="middle" fontFamily="Arial Black, Impact, sans-serif" fontSize="28" letterSpacing="4" fill="#ffe27a" stroke="#141414" strokeWidth="2" paintOrder="stroke">
        KEEP SMILE iN YOUR MiND
      </text>

      <g stroke="#141414" strokeWidth="8" strokeLinecap="round" fill="none">
        <path d="M70 760 C170 720 120 650 225 610" />
        <path d="M830 760 C730 720 780 650 675 610" />
        <path d="M118 728 C86 696 76 664 95 642" /><path d="M150 690 C184 658 218 648 246 664" />
        <path d="M782 728 C814 696 824 664 805 642" /><path d="M750 690 C716 658 682 648 654 664" />
      </g>
      <g fill="#45a85a" stroke="#141414" strokeWidth="6">
        <ellipse cx="95" cy="642" rx="35" ry="18" transform="rotate(-35 95 642)" />
        <ellipse cx="246" cy="664" rx="38" ry="19" transform="rotate(25 246 664)" />
        <ellipse cx="805" cy="642" rx="35" ry="18" transform="rotate(35 805 642)" />
        <ellipse cx="654" cy="664" rx="38" ry="19" transform="rotate(-25 654 664)" />
      </g>

      <g stroke="#141414" strokeWidth="8">
        <path d="M-20 425 C20 332 115 345 170 405 C116 465 38 480 -20 425Z" fill="#f47a36" />
        <path d="M730 405 C790 320 890 340 935 420 C875 482 782 472 730 405Z" fill="#f47a36" />
        <path d="M25 1185 C95 1072 235 1095 292 1195 C205 1282 89 1265 25 1185Z" fill="#32c0c9" />
        <path d="M710 1205 C775 1090 912 1115 960 1215 C870 1295 768 1280 710 1205Z" fill="#f47a36" />
        <path d="M88 430 C112 510 76 575 48 640" fill="#fff0c7" />
        <path d="M825 430 C795 515 838 575 862 650" fill="#fff0c7" />
      </g>
      <g fill="#fff0c7">
        <circle cx="38" cy="390" r="17" /><circle cx="96" cy="382" r="19" /><circle cx="790" cy="385" r="18" /><circle cx="855" cy="390" r="20" />
      </g>
      <g fill="#b150d7" stroke="#141414" strokeWidth="5">
        <path d="M105 1165 C90 1140 126 1130 140 1155 C155 1130 190 1140 176 1165 C160 1192 140 1205 140 1205 C140 1205 122 1193 105 1165Z" />
        <path d="M186 1188 C170 1164 206 1154 220 1178 C236 1154 270 1166 256 1190 C240 1217 220 1230 220 1230 C220 1230 202 1216 186 1188Z" />
      </g>
      <ellipse cx="835" cy="1190" rx="46" ry="28" fill="#fff0c7" stroke="#141414" strokeWidth="7" />
      <circle cx="835" cy="1190" r="14" fill="#141414" />

      <g>
        {Array.from({ length: checkerCols * checkerRows }).map((_, i) => {
          const col = i % checkerCols;
          const row = Math.floor(i / checkerCols);
          const fill = (col + row) % 2 === 0 ? "#e95737" : "#fff0c7";
          return <rect key={i} x={col * checkerSize} y={height - (checkerRows - row) * checkerSize} width={checkerSize} height={checkerSize} fill={fill} stroke="#141414" strokeWidth="2" />;
        })}
      </g>
    </svg>
  );
}
