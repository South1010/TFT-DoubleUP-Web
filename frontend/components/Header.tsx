'use client';

import React from 'react';
import Link from 'next/link';
import { HeartHandshake, Shield } from 'lucide-react';

export default function Header() {
  const handleLogoClick = () => {
    if (typeof window !== 'undefined' && window.location.pathname === '/') {
      window.dispatchEvent(new CustomEvent('reset-home-state'));
    }
  };

  // Hides Admin Portal button in production web site, shows only in development mode (or if NEXT_PUBLIC_SHOW_ADMIN=true)
  const showAdminButton =
    process.env.NODE_ENV === 'development' ||
    process.env.NEXT_PUBLIC_SHOW_ADMIN === 'true';

  return (
    <header className="sticky top-0 z-50 bg-white/85 border-b border-sky-200/80 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-center h-16 md:h-20">
          
          {/* Centered Logo */}
          <Link href="/" onClick={handleLogoClick} className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 via-cyan-500 to-blue-600 p-[2px] shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                <HeartHandshake className="w-5 h-5 text-sky-600 group-hover:rotate-12 transition-transform" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl md:text-2xl tracking-tight text-slate-900">
                  DoubleUp<span className="text-sky-600">.GG</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-sky-100 text-sky-700 border border-sky-300">
                  Set 18
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                TFT ダブルアップ専用 相性シミュレーター & 構成登録
              </p>
            </div>
          </Link>

          {/* Right: Admin Portal Button (Shown in Dev mode, hidden on Production Web deployment) */}
          {showAdminButton && (
            <div className="absolute right-0 flex items-center gap-3">
              <Link
                href="/admin"
                className="px-4 py-2 rounded-xl bg-white hover:bg-sky-50 text-sky-900 border border-sky-300 text-xs font-black flex items-center gap-1.5 shadow-sm transition hover:shadow-md hover:border-sky-400"
              >
                <Shield className="w-4 h-4 text-sky-600" />
                <span>管理者ポータル</span>
              </Link>
            </div>
          )}

        </div>
      </div>
    </header>
  );
}
