'use client';

import React from 'react';

export function TalentNetworkHero() {
  return (
    <div className="flex flex-col items-center justify-center w-full max-w-[500px] mx-auto select-none">
      {/* Network / Constellation Diagram (360x330px canvas) */}
      <div className="relative w-[360px] h-[330px] flex items-center justify-center">
        {/* Soft atmospheric radial glow behind the center node */}
        <div
          className="absolute w-[260px] h-[260px] rounded-full pointer-events-none -z-0"
          style={{
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, rgba(59, 130, 246, 0.15) 50%, transparent 70%)',
            filter: 'blur(24px)',
          }}
        />

        {/* SVG Network Canvas (Orbit rings & connection lines) */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-0"
          viewBox="0 0 360 330"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Inner orbit guide circle */}
          <circle
            cx="180"
            cy="160"
            r="78"
            stroke="rgba(190, 220, 255, 0.22)"
            strokeWidth="1.2"
          />

          {/* Outer dashed orbit circle connecting all 5 nodes */}
          <circle
            cx="180"
            cy="160"
            r="120"
            stroke="rgba(190, 220, 255, 0.28)"
            strokeWidth="1.2"
            strokeDasharray="4 6"
          />

          {/* Connection Line: Center -> Node 1 (Top Checkmark) */}
          <line
            x1="180"
            y1="160"
            x2="180"
            y2="40"
            stroke="rgba(165, 215, 255, 0.5)"
            strokeWidth="1.5"
          />

          {/* Connection Line: Center -> Node 2 (Top-Right) */}
          <line
            x1="180"
            y1="160"
            x2="294"
            y2="123"
            stroke="rgba(165, 215, 255, 0.5)"
            strokeWidth="1.5"
          />

          {/* Connection Line: Center -> Node 3 (Bottom-Right) */}
          <line
            x1="180"
            y1="160"
            x2="251"
            y2="257"
            stroke="rgba(165, 215, 255, 0.5)"
            strokeWidth="1.5"
          />

          {/* Connection Line: Center -> Node 4 (Bottom-Left) */}
          <line
            x1="180"
            y1="160"
            x2="109"
            y2="257"
            stroke="rgba(165, 215, 255, 0.5)"
            strokeWidth="1.5"
          />

          {/* Connection Line: Center -> Node 5 (Top-Left) */}
          <line
            x1="180"
            y1="160"
            x2="66"
            y2="123"
            stroke="rgba(165, 215, 255, 0.5)"
            strokeWidth="1.5"
          />
        </svg>

        {/* Node 1: Top Checkmark Badge (Rounded squircle at 180, 40) */}
        <div
          className="absolute z-10 flex items-center justify-center transition-transform hover:scale-110 duration-300"
          style={{
            top: '18px',
            left: '158px',
            width: '44px',
            height: '44px',
            borderRadius: '13px',
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1.5px solid rgba(255, 255, 255, 0.4)',
            boxShadow: '0 4px 18px rgba(0, 0, 0, 0.25)',
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        {/* Node 2: Top-Right Candidate Avatar (at 294, 123) */}
        <div
          className="absolute z-10 flex items-center justify-center transition-transform hover:scale-110 duration-300"
          style={{
            top: '101px',
            left: '272px',
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1.5px solid rgba(255, 255, 255, 0.35)',
            boxShadow: '0 4px 18px rgba(0, 0, 0, 0.2)',
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="7.5" r="3.8" />
            <path d="M4 19.5c0-3.6 3.6-6 8-6s8 2.4 8 6" />
          </svg>
        </div>

        {/* Node 3: Bottom-Right Candidate Avatar (at 251, 257) */}
        <div
          className="absolute z-10 flex items-center justify-center transition-transform hover:scale-110 duration-300"
          style={{
            top: '235px',
            left: '229px',
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1.5px solid rgba(255, 255, 255, 0.35)',
            boxShadow: '0 4px 18px rgba(0, 0, 0, 0.2)',
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="7.5" r="3.8" />
            <path d="M4 19.5c0-3.6 3.6-6 8-6s8 2.4 8 6" />
          </svg>
        </div>

        {/* Node 4: Bottom-Left Candidate Avatar (at 109, 257) */}
        <div
          className="absolute z-10 flex items-center justify-center transition-transform hover:scale-110 duration-300"
          style={{
            top: '235px',
            left: '87px',
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1.5px solid rgba(255, 255, 255, 0.35)',
            boxShadow: '0 4px 18px rgba(0, 0, 0, 0.2)',
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="7.5" r="3.8" />
            <path d="M4 19.5c0-3.6 3.6-6 8-6s8 2.4 8 6" />
          </svg>
        </div>

        {/* Node 5: Top-Left Candidate Avatar (at 66, 123) */}
        <div
          className="absolute z-10 flex items-center justify-center transition-transform hover:scale-110 duration-300"
          style={{
            top: '101px',
            left: '44px',
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1.5px solid rgba(255, 255, 255, 0.35)',
            boxShadow: '0 4px 18px rgba(0, 0, 0, 0.2)',
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="7.5" r="3.8" />
            <path d="M4 19.5c0-3.6 3.6-6 8-6s8 2.4 8 6" />
          </svg>
        </div>

        {/* Central Core Node: Glowing Talent AI Hub (at 180, 160) */}
        <div
          className="absolute z-20 flex items-center justify-center transition-transform hover:scale-105 duration-300"
          style={{
            top: '122px',
            left: '142px',
            width: '76px',
            height: '76px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #5B52F2 0%, #4338CA 100%)',
            border: '2px solid rgba(255, 255, 255, 0.45)',
            boxShadow: '0 0 38px rgba(99, 102, 241, 0.7), 0 8px 24px rgba(10, 15, 45, 0.5)',
          }}
        >
          <svg
            width="34"
            height="34"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="7.5" r="3.8" />
            <path d="M4 19.5c0-3.8 3.6-6.2 8-6.2s8 2.4 8 6.2" />
          </svg>
        </div>
      </div>

      {/* Hero Headings matching Image 1 */}
      <div className="mt-8 text-center max-w-[460px] px-2">
        <h2
          className="text-2xl lg:text-[28px] font-bold tracking-tight mb-3"
          style={{ color: '#ffffff' }}
        >
          Contrata con la certeza de los datos
        </h2>
        <p
          className="text-sm leading-relaxed"
          style={{ color: 'rgba(255, 255, 255, 0.82)' }}
        >
          TalentIA analiza hojas de vida, conduce entrevistas y evalúa
          competencias con IA — para que tu equipo decida con evidencia, no con
          intuición.
        </p>
      </div>
    </div>
  );
}
