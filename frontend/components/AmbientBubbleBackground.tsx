'use client';

import React from 'react';

interface BubbleConfig {
  id: number;
  left: string; // e.g. "8%"
  size: string; // e.g. "w-16 h-16"
  theme: string; // Tailwind class gradient
  duration: string; // e.g. "16s"
  delay: string; // e.g. "2s"
}

export default function AmbientBubbleBackground() {
  const bubbles: BubbleConfig[] = [
    {
      id: 1,
      left: '5%',
      size: 'w-16 h-16 md:w-20 md:h-20',
      theme: 'bg-gradient-to-tr from-sky-400/30 via-cyan-300/25 to-blue-400/20 border-sky-300/60 shadow-sky-400/20',
      duration: '15s',
      delay: '0s'
    },
    {
      id: 2,
      left: '18%',
      size: 'w-12 h-12 md:w-16 md:h-16',
      theme: 'bg-gradient-to-tr from-rose-400/30 via-pink-300/25 to-red-400/20 border-rose-300/60 shadow-rose-400/20',
      duration: '18s',
      delay: '4s'
    },
    {
      id: 3,
      left: '32%',
      size: 'w-20 h-20 md:w-24 md:h-24',
      theme: 'bg-gradient-to-tr from-purple-400/30 via-indigo-300/25 to-purple-500/20 border-purple-300/60 shadow-purple-400/20',
      duration: '21s',
      delay: '1s'
    },
    {
      id: 4,
      left: '48%',
      size: 'w-14 h-14 md:w-18 md:h-18',
      theme: 'bg-gradient-to-tr from-amber-300/35 via-yellow-200/25 to-amber-400/20 border-amber-300/60 shadow-amber-400/20',
      duration: '14s',
      delay: '7s'
    },
    {
      id: 5,
      left: '62%',
      size: 'w-16 h-16 md:w-22 md:h-22',
      theme: 'bg-gradient-to-tr from-sky-400/30 via-blue-300/25 to-cyan-400/20 border-sky-300/60 shadow-sky-400/20',
      duration: '19s',
      delay: '3s'
    },
    {
      id: 6,
      left: '76%',
      size: 'w-12 h-12 md:w-16 md:h-16',
      theme: 'bg-gradient-to-tr from-emerald-400/30 via-teal-300/25 to-emerald-500/20 border-emerald-300/60 shadow-emerald-400/20',
      duration: '17s',
      delay: '9s'
    },
    {
      id: 7,
      left: '88%',
      size: 'w-20 h-20 md:w-24 md:h-24',
      theme: 'bg-gradient-to-tr from-rose-400/30 via-pink-300/25 to-rose-500/20 border-rose-300/60 shadow-rose-400/20',
      duration: '22s',
      delay: '2s'
    },
    {
      id: 8,
      left: '12%',
      size: 'w-24 h-24 md:w-28 md:h-28',
      theme: 'bg-gradient-to-tr from-amber-400/25 via-yellow-300/20 to-orange-400/15 border-amber-300/50 shadow-amber-400/15',
      duration: '25s',
      delay: '11s'
    },
    {
      id: 9,
      left: '40%',
      size: 'w-10 h-10 md:w-14 md:h-14',
      theme: 'bg-gradient-to-tr from-cyan-400/35 via-sky-300/25 to-blue-400/20 border-cyan-300/60 shadow-cyan-400/20',
      duration: '13s',
      delay: '5s'
    },
    {
      id: 10,
      left: '68%',
      size: 'w-14 h-14 md:w-18 md:h-18',
      theme: 'bg-gradient-to-tr from-purple-400/30 via-pink-300/25 to-purple-500/20 border-purple-300/60 shadow-purple-400/20',
      duration: '16s',
      delay: '13s'
    },
    {
      id: 11,
      left: '94%',
      size: 'w-16 h-16 md:w-20 md:h-20',
      theme: 'bg-gradient-to-tr from-sky-400/30 via-cyan-300/25 to-blue-400/20 border-sky-300/60 shadow-sky-400/20',
      duration: '20s',
      delay: '8s'
    }
  ];

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {bubbles.map((b) => (
        <div
          key={b.id}
          className={`absolute rounded-full border backdrop-blur-[2px] shadow-lg animate-ambient-bubble ${b.size} ${b.theme}`}
          style={{
            left: b.left,
            // @ts-ignore
            '--bubble-duration': b.duration,
            '--bubble-delay': b.delay
          }}
        >
          {/* Inner Light Reflection Sheen */}
          <div className="absolute top-[8%] left-[12%] w-[42%] h-[26%] rounded-full bg-gradient-to-b from-white/80 to-transparent" />
        </div>
      ))}
    </div>
  );
}
