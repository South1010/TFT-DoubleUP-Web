'use client';

import React, { useState, useMemo } from 'react';
import { CompStat, getTierStyle } from '@/utils/compTypes';
import { getChampion, getChampionIcon } from '@/utils/setMaster';
import { Search, Sparkles, User, SlidersHorizontal, Filter, RotateCcw, Flame, CheckCircle, X } from 'lucide-react';

interface BubbleCompSelectorProps {
  comps: CompStat[];
  onSelectComp: (comp: CompStat) => void;
  selectedCompKey?: string | null;
  loading?: boolean;
}

export default function BubbleCompSelector({ comps = [], onSelectComp, selectedCompKey, loading }: BubbleCompSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrait, setSelectedTrait] = useState('ALL');
  const [selectedChampion, setSelectedChampion] = useState('ALL');
  const [selectedTierFilter, setSelectedTierFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('DEFAULT');
  const [poppingCompKey, setPoppingCompKey] = useState<string | null>(null);

  // Extract all traits dynamically
  const availableTraits = useMemo(() => {
    const traitSet = new Set<string>();
    comps.forEach((c) => {
      if (c.traits_summary) {
        c.traits_summary.split(',').forEach((part) => {
          const cleaned = part.replace(/^\d+\s*/, '').trim();
          if (cleaned) traitSet.add(cleaned);
        });
      }
    });
    return Array.from(traitSet).sort((a, b) => a.localeCompare(b, 'ja-JP'));
  }, [comps]);

  // Extract all champions dynamically
  const availableChampions = useMemo(() => {
    const champSet = new Set<string>();
    comps.forEach((c) => {
      if (c.main_carry?.name) {
        champSet.add(c.main_carry.name);
      }
      (c.units_detail || []).forEach((u: any) => {
        const uName = typeof u === 'string' ? u : u.name || u.id;
        if (uName) {
          const master = getChampion(uName);
          champSet.add(master.name || uName);
        }
      });
    });
    return Array.from(champSet).sort((a, b) => a.localeCompare(b, 'ja-JP'));
  }, [comps]);

  // Filter comps based on search and dropdown selections
  const filteredComps = useMemo(() => {
    return comps
      .filter((comp) => {
        const matchesTier = selectedTierFilter === 'ALL' || comp.tier === selectedTierFilter;

        const matchesTrait =
          selectedTrait === 'ALL' ||
          (comp.traits_summary && comp.traits_summary.includes(selectedTrait));

        const matchesChampion =
          selectedChampion === 'ALL' ||
          comp.main_carry?.name?.includes(selectedChampion) ||
          (comp.units_detail || []).some((u: any) => {
            const uName = typeof u === 'string' ? u : u.name || u.id;
            const master = getChampion(uName);
            return (master.name || uName || '').includes(selectedChampion);
          });

        const q = searchQuery.toLowerCase().trim();
        const matchesQuery =
          q === '' ||
          comp.display_name?.toLowerCase().includes(q) ||
          comp.main_carry?.name?.toLowerCase().includes(q) ||
          (comp.traits_summary && comp.traits_summary.toLowerCase().includes(q)) ||
          (comp.units_detail || []).some((u: any) => {
            const uName = typeof u === 'string' ? u : u.name || u.id;
            const master = getChampion(uName);
            return (master.name || uName || '').toLowerCase().includes(q);
          });

        return matchesTier && matchesTrait && matchesChampion && matchesQuery;
      })
      .sort((a, b) => {
        if (sortBy === 'NAME') {
          return a.display_name.localeCompare(b.display_name, 'ja-JP');
        }
        const tierWeight: { [key: string]: number } = { OP: 1, S: 2, A: 3, B: 4, C: 5 };
        const weightA = tierWeight[a.tier?.toUpperCase()] || 99;
        const weightB = tierWeight[b.tier?.toUpperCase()] || 99;
        if (weightA !== weightB) return weightA - weightB;
        return a.display_name.localeCompare(b.display_name, 'ja-JP');
      });
  }, [comps, selectedTierFilter, selectedTrait, selectedChampion, searchQuery, sortBy]);

  // Group comps by Tier bands (OP, S, A, B, C), excluding empty bands
  const tierBands = useMemo(() => {
    const op = filteredComps.filter((c) => c.tier === 'OP');
    const sTier = filteredComps.filter((c) => c.tier === 'S');
    const aTier = filteredComps.filter((c) => c.tier === 'A');
    const bTier = filteredComps.filter((c) => c.tier === 'B');
    const cTier = filteredComps.filter((c) => c.tier === 'C' || (!['OP', 'S', 'A', 'B'].includes(c.tier)));

    return [
      { key: 'OP', label: '🔥 OP Tier (最優先)', color: 'from-rose-500/20 to-red-500/10 border-rose-300 text-rose-900', items: op },
      { key: 'S', label: '⭐ S Tier (最強力)', color: 'from-amber-500/20 to-yellow-500/10 border-amber-300 text-amber-900', items: sTier },
      { key: 'A', label: '✨ A Tier (強力)', color: 'from-purple-500/20 to-indigo-500/10 border-purple-300 text-purple-900', items: aTier },
      { key: 'B', label: '🔷 B Tier (標準)', color: 'from-sky-500/20 to-blue-500/10 border-sky-300 text-sky-900', items: bTier },
      { key: 'C', label: '⚪ C Tier (状況特化)', color: 'from-slate-400/20 to-gray-500/10 border-slate-300 text-slate-800', items: cTier }
    ].filter((band) => band.items.length > 0);
  }, [filteredComps]);

  const resetFilters = () => {
    setSelectedTierFilter('ALL');
    setSelectedTrait('ALL');
    setSelectedChampion('ALL');
    setSortBy('DEFAULT');
    setSearchQuery('');
  };

  const isFilterActive =
    selectedTierFilter !== 'ALL' ||
    selectedTrait !== 'ALL' ||
    selectedChampion !== 'ALL' ||
    sortBy !== 'DEFAULT' ||
    searchQuery.trim() !== '';

  const handleBubbleClick = (comp: CompStat) => {
    setPoppingCompKey(comp.comp_key);
    setTimeout(() => {
      onSelectComp(comp);
      setPoppingCompKey(null);
    }, 280);
  };

  const getBubbleThemeClass = (tier: string) => {
    switch (tier?.toUpperCase()) {
      case 'OP': return 'bubble-tier-op';
      case 'S': return 'bubble-tier-s';
      case 'A': return 'bubble-tier-a';
      case 'B': return 'bubble-tier-b';
      case 'C': return 'bubble-tier-c';
      default: return 'bubble-tier-b';
    }
  };

  const getFloatAnimationClass = (index: number) => {
    const floatClasses = [
      'animate-bubble-float-1',
      'animate-bubble-float-2',
      'animate-bubble-float-3',
      'animate-bubble-float-4'
    ];
    return floatClasses[index % floatClasses.length];
  };

  const resolveCarryInfo = (mainCarry: { id?: string; name?: string; icon?: string }) => {
    if (!mainCarry) return { name: 'ユニット', icon: '' };
    const master = getChampion(mainCarry.id || mainCarry.name);
    const name = mainCarry.name || master.name || 'ユニット';
    const icon = mainCarry.icon || master.icon || getChampionIcon(mainCarry.id || name);
    return { name, icon };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white/80 backdrop-blur-md rounded-3xl border border-sky-200 shadow-md">
        <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-black text-slate-700">構成シャボン玉データをロード中... 🫧</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Filter & Search Bar */}
      <div className="p-4 bg-white/95 backdrop-blur-md rounded-2xl border border-sky-200 shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-sky-100 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-100 text-sky-600">
              <Filter className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-xs font-black text-slate-900">シャボン玉 構成絞り込み・検索</h3>
              <p className="text-[11px] text-slate-500 font-medium">下のシャボン玉をクリックするか、検索・ソートで構成を絞り込みます</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-900 font-black">
              {filteredComps.length} / {comps.length} 構成表示
            </span>
            {isFilterActive && (
              <button
                onClick={resetFilters}
                className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center gap-1 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" /> リセット
              </button>
            )}
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Keyword Search */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1 flex items-center gap-1">
              <Search className="w-3 h-3 text-sky-600" /> 検索
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="構成名・ユニット名・シナジー..."
                className="w-full pl-3 pr-8 py-1.5 rounded-xl bg-sky-50/50 border border-sky-200 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-bold shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Trait Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" /> シナジー
            </label>
            <select
              value={selectedTrait}
              onChange={(e) => setSelectedTrait(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-sky-50/50 border border-sky-200 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-bold shadow-2xs cursor-pointer"
            >
              <option value="ALL">すべてのシナジー ({availableTraits.length})</option>
              {availableTraits.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Champion Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1 flex items-center gap-1">
              <User className="w-3 h-3 text-emerald-600" /> チャンピオン
            </label>
            <select
              value={selectedChampion}
              onChange={(e) => setSelectedChampion(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-sky-50/50 border border-sky-200 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-bold shadow-2xs cursor-pointer"
            >
              <option value="ALL">すべてのチャンピオン ({availableChampions.length})</option>
              {availableChampions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1 flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3 text-purple-600" /> 並び替え
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-sky-50/50 border border-sky-200 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-bold shadow-2xs cursor-pointer"
            >
              <option value="DEFAULT">標準順 (Tier順)</option>
              <option value="NAME">構成名 (五十音順)</option>
            </select>
          </div>
        </div>

        {/* Quick Tier Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
          <span className="text-[11px] font-bold text-slate-400 mr-1 shrink-0">Tier絞り込み:</span>
          {(['ALL', 'OP', 'S', 'A', 'B', 'C'] as const).map((tier) => {
            const isSelected = selectedTierFilter === tier;
            return (
              <button
                key={tier}
                onClick={() => setSelectedTierFilter(tier)}
                className={`px-3 py-1 rounded-full text-xs font-black transition flex items-center gap-1 shrink-0 ${
                  isSelected
                    ? 'bg-sky-600 text-white shadow-md ring-2 ring-sky-300'
                    : 'bg-white text-slate-700 hover:bg-sky-50 border border-sky-200'
                }`}
              >
                <span>{tier === 'ALL' ? 'すべて' : `${tier} Tier`}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating Bubbles Tier Rows Display Container */}
      <div className="p-6 bg-gradient-to-b from-sky-200/50 via-sky-100/30 to-white/80 rounded-3xl border-2 border-sky-300/80 shadow-lg space-y-8 backdrop-blur-xl relative overflow-hidden">
        
        {/* Ambient background bubble lights */}
        <div className="absolute top-10 left-10 w-48 h-48 rounded-full bg-rose-300/20 blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-56 h-56 rounded-full bg-purple-300/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-1/4 w-64 h-64 rounded-full bg-sky-300/25 blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between border-b border-sky-200/80 pb-3 relative z-10">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="text-2xl">🫧</span> 構成一覧
            </h2>
            <p className="text-xs text-slate-600 font-semibold mt-0.5">
              上がOP Tier、下に向かってS, A, B, C Tier順に並んでいます。構成シャボン玉をクリックして選択してください。
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-sky-800 bg-white/80 px-3 py-1.5 rounded-full border border-sky-200 shadow-2xs">
            <span>✨ クリックで即座に展開</span>
          </div>
        </div>

        {tierBands.length > 0 ? (
          <div className="space-y-8 relative z-10">
            {tierBands.map((band) => (
              <div key={band.key} className="space-y-3">
                
                {/* Tier Row Label Header */}
                <div className="flex items-center gap-3">
                  <div className={`px-4 py-1.5 rounded-2xl bg-gradient-to-r ${band.color} border text-xs font-black shadow-xs flex items-center gap-1.5`}>
                    <span>{band.label}</span>
                    <span className="px-2 py-0.2 rounded-full bg-white/80 text-[10px] text-slate-900 font-extrabold shadow-2xs">
                      {band.items.length} 構成
                    </span>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-sky-300/60 to-transparent" />
                </div>

                {/* Bubbles Layout Grid / Flex */}
                <div className="flex flex-wrap gap-4 md:gap-6 justify-start items-center py-2 px-1">
                  {band.items.map((comp, idx) => {
                    const { name: carryName, icon: carryIcon } = resolveCarryInfo(comp.main_carry);
                    const isSelected = selectedCompKey === comp.comp_key;
                    const isPopping = poppingCompKey === comp.comp_key;

                    return (
                      <div
                        key={comp.comp_key}
                        onClick={() => handleBubbleClick(comp)}
                        className={`relative cursor-pointer group transition-all duration-300 transform select-none ${
                          isPopping
                            ? 'animate-bubble-pop'
                            : `animate-bubble-inflate ${getFloatAnimationClass(idx)}`
                        }`}
                        style={{
                          animationDelay: isPopping ? '0s' : `${(idx % 6) * 0.08}s`
                        }}
                      >
                        {/* Bubble Outer Circle */}
                        <div
                          className={`w-36 h-36 md:w-40 md:h-40 rounded-full ${getBubbleThemeClass(
                            comp.tier
                          )} transition-all duration-300 flex flex-col items-center justify-center p-3 relative text-center backdrop-blur-md ${
                            isSelected
                              ? 'ring-4 ring-sky-400 ring-offset-2 scale-105 shadow-2xl'
                              : ''
                          }`}
                        >
                          {/* Gloss Sheen Reflection */}
                          <div className="bubble-sheen" />

                          {/* Selected Check Badge */}
                          {isSelected && (
                            <span className="absolute -top-1 -right-1 p-1 bg-sky-600 text-white rounded-full shadow-md z-20">
                              <CheckCircle className="w-5 h-5" />
                            </span>
                          )}

                          {/* Tier Badge */}
                          <span className={`absolute top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-black shadow-xs border ${getTierStyle(comp.tier).badgeSolid}`}>
                            {comp.tier} Tier
                          </span>

                          {/* Carry Champion Icon */}
                          <div className="relative mt-3 mb-1">
                            <img
                              src={carryIcon}
                              alt={carryName}
                              className="w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-white/90 object-cover shadow-md group-hover:scale-110 transition-transform duration-300"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          </div>

                          {/* Comp Display Name */}
                          <div className="w-full px-1">
                            <div className="font-black text-[11px] md:text-xs text-slate-950 truncate drop-shadow-xs leading-tight">
                              {comp.display_name}
                            </div>
                            <span className="text-[9px] md:text-[10px] text-slate-800 font-extrabold block truncate opacity-90">
                              {carryName}
                            </span>
                          </div>

                          {/* Hover Inflate Glow Hint */}
                          <div className="absolute inset-0 rounded-full border-2 border-white/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-white/80 rounded-2xl border border-dashed border-sky-300 space-y-3 relative z-10">
            <p className="text-base font-black text-slate-800">
              条件に一致する構成が見つかりませんでした 🫧
            </p>
            <p className="text-xs text-slate-600 font-medium">
              検索キーワードや絞り込み条件（シナジー・チャンピオン・Tier）を変更してください。
            </p>
            <button
              onClick={resetFilters}
              className="mt-2 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-sky-600 text-white text-xs font-black hover:bg-sky-700 transition shadow-md"
            >
              <RotateCcw className="w-4 h-4" /> 絞り込み条件をリセット
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
