import React from "react";

interface InsigniaColegioProps {
  className?: string;
  size?: number;
}

export default function InsigniaColegio({ className = "", size = 120 }: InsigniaColegioProps) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size * 1.15}
        viewBox="0 0 400 460"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-lg filter transition-transform hover:scale-105 duration-300"
      >
        {/* Shield Outer Outline/Border in bright orange-green gradient style */}
        <path
          d="M200 450 C 350 370 380 200 380 70 C 380 50 300 40 200 10 C 100 40 20 50 20 70 C 20 200 50 370 200 450 Z"
          fill="#84cc16" /* Lime Green Base */
          stroke="#ea580c" /* Orange borders */
          strokeWidth="6"
        />
        
        {/* Shield Inner background - silver/grey gradient with lighting effect */}
        <path
          d="M200 436 C 334 360 364 200 364 80 C 364 65 290 55 200 25 C 110 55 36 65 36 80 C 36 200 66 360 200 436 Z"
          fill="url(#silverGradient)"
          stroke="#facc15" /* Gold/yellow border line */
          strokeWidth="4"
        />

        {/* Top Banner Area for School Name */}
        <path
          d="M 37 130 C 100 100 300 100 363 130 C 363 80 300 60 200 33 C 100 60 37 80 37 130 Z"
          fill="#a3e635" /* Soft lime green banner */
          stroke="#4d7c0f"
          strokeWidth="3"
        />

        {/* Arch line across the banner */}
        <path
          d="M 37 130 C 100 100 300 100 363 130"
          stroke="#ca8a04"
          strokeWidth="4"
          fill="none"
        />

        {/* Text "I.E.P. 'GENIOS DEL MILLENNIUM'" arched along the top */}
        <text y="78" fill="#15803d" fontWeight="900" fontSize="23" fontFamily="'Arial Black', sans-serif">
          <textPath href="#textPathTop" startOffset="50%" textAnchor="middle">
            I.E.P. "GENIOS DEL MILLENNIUM"
          </textPath>
        </text>

        {/* Custom text path along banner curvature */}
        <defs>
          <path
            id="textPathTop"
            d="M 45 106 C 110 78 290 78 355 106"
          />
          {/* Silver/grey gradient for shield background */}
          <linearGradient id="silverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f3f4f6" />
            <stop offset="30%" stopColor="#e5e7eb" />
            <stop offset="50%" stopColor="#d1d5db" />
            <stop offset="70%" stopColor="#9ca3af" />
            <stop offset="100%" stopColor="#e5e7eb" />
          </linearGradient>
          {/* Green initials gradient */}
          <linearGradient id="greenInitialsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#15803d" />
          </linearGradient>
          {/* Drop shadow for letters */}
          <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="3" dy="5" stdDeviation="4" floodColor="#000000" floodOpacity="0.4"/>
          </filter>
        </defs>

        {/* Entwined "G" and "M" calligraphy */}
        {/* Letter 'G' */}
        <path
          d="M 280 150 C 230 110, 100 150, 90 240 C 80 320, 160 380, 240 370 C 300 360, 310 310, 270 290 C 230 270, 190 280, 180 310 C 170 330, 220 350, 250 330"
          fill="none"
          stroke="url(#greenInitialsGradient)"
          strokeWidth="24"
          strokeLinecap="round"
          filter="url(#shadow)"
        />

        {/* Letter 'M' crossing and entwining with 'G' */}
        <path
          d="M 210 240 C 220 200, 240 140, 280 150 C 320 160, 310 240, 310 280 C 310 320, 340 370, 360 250"
          fill="none"
          stroke="url(#greenInitialsGradient)"
          strokeWidth="22"
          strokeLinecap="round"
          filter="url(#shadow)"
        />
        
        {/* Elegant loop connections */}
        <path
          d="M 170 250 C 140 350, 240 400, 280 270"
          fill="none"
          stroke="url(#greenInitialsGradient)"
          strokeWidth="20"
          strokeLinecap="round"
          filter="url(#shadow)"
        />
      </svg>
    </div>
  );
}
