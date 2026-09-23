'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HeartHandshake, Layers, Home as HomeIcon, Menu, ChevronDown, Check, BookOpen } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogoClick = () => {
    if (typeof window !== 'undefined' && window.location.pathname === '/') {
      window.dispatchEvent(new CustomEvent('reset-home-state'));
    }
  };

  const navItems = [
    {
      label: 'ホーム (シミュレーター)',
      href: '/',
      icon: HomeIcon,
      desc: 'ペア構成の相性シミュレーション & 分析'
    },
    {
      label: '登録構成一覧',
      href: '/comps',
      icon: Layers,
      desc: 'メタ構成一覧、ティア別フィルター & オーグメント'
    },
    {
      label: '記事・ブログ',
      href: '/articles',
      icon: BookOpen,
      desc: '環境解説・戦術ガイド・プレイ日記記事'
    },
  ];

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const activeItem = navItems.find((item) => item.href === pathname) || navItems[0];
  const ActiveIcon = activeItem.icon;

  return (
    <header className="sticky top-0 z-50 bg-white/90 border-b border-sky-200/80 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">

          {/* Left: Icon-only Menu Button */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`p-2.5 rounded-xl transition-all flex items-center gap-1.5 border shadow-2xs ${
                menuOpen
                  ? 'bg-sky-500 text-white border-sky-500 shadow-md ring-2 ring-sky-400/30'
                  : 'bg-white text-slate-800 border-sky-300 hover:bg-sky-50 hover:border-sky-400'
              }`}
              aria-expanded={menuOpen}
              aria-label="ナビゲーションメニューを開く"
            >
              <Menu className={`w-5 h-5 ${menuOpen ? 'text-white' : 'text-sky-600'}`} />
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${menuOpen ? 'rotate-180 text-white' : 'text-slate-400'}`} />
            </button>

            {/* Dropdown Menu Overlay */}
            {menuOpen && (
              <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl border border-sky-200 shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-black uppercase text-slate-400 tracking-wider border-b border-sky-100 mb-1">
                  ページナビゲーション
                </div>
                <div className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className={`w-full p-2.5 rounded-xl flex items-start gap-3 transition ${
                          isActive
                            ? 'bg-sky-500 text-white shadow-md'
                            : 'hover:bg-sky-50 text-slate-800'
                        }`}
                      >
                        <div className={`p-2 rounded-lg shrink-0 ${
                          isActive ? 'bg-white/20 text-white' : 'bg-sky-100 text-sky-600'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black leading-tight">{item.label}</span>
                            {isActive && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                          </div>
                          <p className={`text-[10px] mt-0.5 truncate ${
                            isActive ? 'text-sky-100' : 'text-slate-500'
                          }`}>
                            {item.desc}
                          </p>
                        </div>
                      </Link>
                    );
                  })}

                </div>
              </div>
            )}
          </div>

          {/* Center: Logo */}
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

          {/* Right: Actions */}
          {/* Right: Layout spacer (keeps logo centered) */}
          <div className="w-12 sm:w-16" />

        </div>
      </div>
    </header>
  );
}



