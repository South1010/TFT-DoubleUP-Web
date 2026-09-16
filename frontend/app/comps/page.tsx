'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Layers, Search, Filter, Sparkles, Trophy, ArrowUpDown, RefreshCw, RotateCcw, ChevronDown, Check, User } from 'lucide-react';
import CompCard from '@/components/CompCard';
import CompDetailModal from '@/components/CompDetailModal';
import { CompStat } from '@/utils/compTypes';
import { FALLBACK_COMPS } from '@/utils/fallbackComps';
import { cleanTraitName } from '@/components/BubbleCompSelector';
import { getChampion, getChampionName, getChampionIcon, getAugmentTierStyle, getAugmentIcon } from '@/utils/setMaster';

interface ChampOption {
  name: string;
  icon: string;
  cost: number;
}

interface AugOption {
  name: string;
  icon: string;
  style: any;
}

export default function CompsPage() {
  const [comps, setComps] = useState<CompStat[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State (Identical to Simulator logic)
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [selectedTrait, setSelectedTrait] = useState<string>('ALL');
  const [selectedCarryChampion, setSelectedCarryChampion] = useState<string>('ALL');
  const [selectedChampion, setSelectedChampion] = useState<string>('ALL');
  const [selectedDedicatedAugment, setSelectedDedicatedAugment] = useState<string>('ALL');
  const [onlyDedicatedAugments, setOnlyDedicatedAugments] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('TIER');

  const [selectedComp, setSelectedComp] = useState<CompStat | null>(null);

  const fetchComps = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/comps?queue_id=1160&_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
      });
      if (res.ok) {
        const data: CompStat[] = await res.json();
        if (data && data.length > 0) {
          setComps(data);
        } else {
          setComps(FALLBACK_COMPS);
        }
      } else {
        setComps(FALLBACK_COMPS);
      }
    } catch (e) {
      console.error('Failed to load registered comps, using fallback:', e);
      setComps(FALLBACK_COMPS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComps();
  }, []);

  // 1. Available Traits list
  const availableTraits = useMemo(() => {
    const traitSet = new Set<string>();
    comps.forEach((c) => {
      if (c.traits_summary) {
        c.traits_summary.split(',').forEach((part) => {
          const cleaned = cleanTraitName(part);
          if (cleaned) traitSet.add(cleaned);
        });
      }
    });
    return Array.from(traitSet).sort((a, b) => a.localeCompare(b, 'ja-JP'));
  }, [comps]);

  // 2. Available Carry Champions
  const availableCarryChampions = useMemo(() => {
    const carryMap = new Map<string, ChampOption>();
    comps.forEach((c) => {
      if (c.main_carry) {
        const rawIdOrName = c.main_carry.id || c.main_carry.name || '';
        if (rawIdOrName) {
          const master = getChampion(rawIdOrName);
          const cleanName = getChampionName(rawIdOrName) || master.name;
          const icon = master.icon || c.main_carry.icon || getChampionIcon(rawIdOrName);
          const cost = master.cost || (c.main_carry.cost && c.main_carry.cost > 1 ? c.main_carry.cost : 1);
          if (cleanName && cleanName !== '未知のユニット' && !carryMap.has(cleanName)) {
            carryMap.set(cleanName, { name: cleanName, icon, cost });
          }
        }
      }
    });
    return Array.from(carryMap.values()).sort((a, b) => {
      if (a.cost !== b.cost) return a.cost - b.cost;
      return a.name.localeCompare(b.name, 'ja-JP');
    });
  }, [comps]);

  // 3. Available All Unit Champions
  const availableChampions = useMemo(() => {
    const champMap = new Map<string, ChampOption>();
    comps.forEach((c) => {
      if (c.main_carry) {
        const rawIdOrName = c.main_carry.id || c.main_carry.name || '';
        if (rawIdOrName) {
          const master = getChampion(rawIdOrName);
          const cleanName = getChampionName(rawIdOrName) || master.name;
          const icon = master.icon || c.main_carry.icon || getChampionIcon(rawIdOrName);
          const cost = master.cost || (c.main_carry.cost && c.main_carry.cost > 1 ? c.main_carry.cost : 1);
          if (cleanName && cleanName !== '未知のユニット' && !champMap.has(cleanName)) {
            champMap.set(cleanName, { name: cleanName, icon, cost });
          }
        }
      }
      (c.units_detail || []).forEach((u: any) => {
        const rawUnit = typeof u === 'string' ? u : (u.id || u.name || '');
        if (rawUnit) {
          const master = getChampion(rawUnit);
          const cleanName = getChampionName(rawUnit) || master.name;
          const icon = master.icon || (typeof u === 'object' && u.icon) || getChampionIcon(rawUnit);
          const unitCost = master.cost || (typeof u === 'object' && u.cost && u.cost > 1 ? u.cost : 1);
          if (cleanName && cleanName !== '未知のユニット' && !champMap.has(cleanName)) {
            champMap.set(cleanName, { name: cleanName, icon, cost: unitCost });
          }
        }
      });
    });
    return Array.from(champMap.values()).sort((a, b) => {
      if (a.cost !== b.cost) return a.cost - b.cost;
      return a.name.localeCompare(b.name, 'ja-JP');
    });
  }, [comps]);

  // 4. Available Dedicated Augments List
  const availableDedicatedAugments = useMemo(() => {
    const augMap = new Map<string, AugOption>();
    comps.forEach((c) => {
      if (c.dedicated_augment && c.dedicated_augment.trim()) {
        const augName = c.dedicated_augment.trim();
        if (!augMap.has(augName)) {
          const style = getAugmentTierStyle(augName);
          const icon = getAugmentIcon(augName, style.tier);
          augMap.set(augName, { name: augName, icon, style });
        }
      }
    });
    return Array.from(augMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'ja-JP'));
  }, [comps]);

  const tierWeight: Record<string, number> = { OP: 1, S: 2, A: 3, B: 4, C: 5 };

  // Filter & Sort Pipeline
  const filteredAndSortedComps = useMemo(() => {
    let result = comps.filter((comp) => {
      // Tier filter
      const matchesTier = selectedTier === 'ALL' || comp.tier?.toUpperCase() === selectedTier.toUpperCase();

      // Trait filter
      const matchesTrait =
        selectedTrait === 'ALL' ||
        (comp.traits_summary && comp.traits_summary.includes(selectedTrait));

      // Carry Champion filter
      const matchesCarry =
        selectedCarryChampion === 'ALL' ||
        (comp.main_carry && (
          getChampionName(comp.main_carry.id || comp.main_carry.name) === selectedCarryChampion ||
          comp.main_carry.name?.includes(selectedCarryChampion)
        ));

      // Unit Champion filter
      const matchesChampion =
        selectedChampion === 'ALL' ||
        (comp.main_carry && (
          getChampionName(comp.main_carry.id || comp.main_carry.name) === selectedChampion ||
          comp.main_carry.name?.includes(selectedChampion)
        )) ||
        (comp.units_detail || []).some((u: any) => {
          const uRaw = typeof u === 'string' ? u : u.id || u.name;
          return (
            getChampionName(uRaw) === selectedChampion ||
            (typeof u === 'object' && u.name && u.name.includes(selectedChampion))
          );
        });

      // Dedicated Augment filter
      const matchesDedicatedAugment =
        selectedDedicatedAugment === 'ALL' ||
        (comp.dedicated_augment && comp.dedicated_augment.includes(selectedDedicatedAugment));

      // Only dedicated augment toggle
      const matchesOnlyDedicated =
        !onlyDedicatedAugments || Boolean(comp.dedicated_augment?.trim());

      // Keyword query
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        q === '' ||
        comp.display_name?.toLowerCase().includes(q) ||
        comp.main_carry?.name?.toLowerCase().includes(q) ||
        comp.main_carry?.id?.toLowerCase().includes(q) ||
        comp.overview?.toLowerCase().includes(q) ||
        comp.traits_summary?.toLowerCase().includes(q) ||
        comp.dedicated_augment?.toLowerCase().includes(q);

      return (
        matchesTier &&
        matchesTrait &&
        matchesCarry &&
        matchesChampion &&
        matchesDedicatedAugment &&
        matchesOnlyDedicated &&
        matchesQuery
      );
    });

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'TIER':
        case 'DEFAULT': {
          const wA = tierWeight[a.tier?.toUpperCase()] || 99;
          const wB = tierWeight[b.tier?.toUpperCase()] || 99;
          if (wA !== wB) return wA - wB;
          return (a.display_name || '').localeCompare(b.display_name || '', 'ja-JP');
        }
        case 'NAME':
          return (a.display_name || '').localeCompare(b.display_name || '', 'ja-JP');
        case 'TOP2_RATE':
          return (b.top2_rate || 0) - (a.top2_rate || 0);
        case 'WIN_RATE':
          return (b.win_rate || 0) - (a.win_rate || 0);
        case 'AVG_PLACEMENT':
          return (a.avg_placement || 99) - (b.avg_placement || 99);
        case 'SAMPLE_SIZE':
          return (b.sample_size || 0) - (a.sample_size || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [
    comps,
    selectedTier,
    selectedTrait,
    selectedCarryChampion,
    selectedChampion,
    selectedDedicatedAugment,
    onlyDedicatedAugments,
    searchQuery,
    sortBy
  ]);

  const tierCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: comps.length, OP: 0, S: 0, A: 0, B: 0, C: 0 };
    comps.forEach((c) => {
      const t = c.tier?.toUpperCase() || 'C';
      if (counts[t] !== undefined) {
        counts[t]++;
      }
    });
    return counts;
  }, [comps]);

  const hasActiveFilters =
    selectedTier !== 'ALL' ||
    selectedTrait !== 'ALL' ||
    selectedCarryChampion !== 'ALL' ||
    selectedChampion !== 'ALL' ||
    selectedDedicatedAugment !== 'ALL' ||
    onlyDedicatedAugments ||
    searchQuery.trim() !== '' ||
    sortBy !== 'TIER';

  const resetAllFilters = () => {
    setSelectedTier('ALL');
    setSelectedTrait('ALL');
    setSelectedCarryChampion('ALL');
    setSelectedChampion('ALL');
    setSelectedDedicatedAugment('ALL');
    setOnlyDedicatedAugments(false);
    setSearchQuery('');
    setSortBy('TIER');
  };

  return (
    <main className="min-h-screen pb-20">
      
      {/* Hero Banner Section */}
      <section className="py-12 md:py-16 border-b border-sky-200/80 bg-gradient-to-b from-sky-100/90 via-sky-50/50 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 border border-sky-300 text-sky-800 text-xs font-black">
                <Layers className="w-3.5 h-3.5 text-sky-600" />
                <span>TFT Set 18 Double Up メタ構成データベース</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                登録メタ構成 <span className="text-sky-600">全データベース一覧</span>
              </h1>
              <p className="text-sm text-slate-600 font-medium max-w-2xl">
                ダブルアップモード（Queue ID 1160）で分析・登録されているすべてのチーム構成一覧です。シミュレーター同様の高度な絞り込み・ソート、専用オーグメント検索に対応しています。
              </p>
            </div>

            <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-sky-200 shadow-sm shrink-0">
              <div className="p-3 rounded-xl bg-sky-50 text-sky-600">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">登録構成数</p>
                <p className="text-2xl font-black text-slate-900">
                  {comps.length} <span className="text-xs text-slate-500 font-bold">Comps</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        
        {/* Controls Bar: Search, Advanced Filters & Sorting */}
        <div className="glass-panel p-4 md:p-6 rounded-2xl border border-sky-200/80 shadow-sm space-y-5 bg-white/90">
          
          {/* Top Row: Search Box & Sort Dropdown */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="構成名、キャリー名、専用オーグメントで検索..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-sky-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 font-medium transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md transition"
                >
                  クリア
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 shrink-0">
              <ArrowUpDown className="w-4 h-4 text-sky-600" />
              <span className="text-xs font-bold text-slate-600 whitespace-nowrap">並び替え:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="py-2.5 px-3 rounded-xl border border-sky-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/30 transition shadow-2xs"
              >
                <option value="TIER">ティア順 (OP → C)</option>
                <option value="NAME">構成名順 (五十音順)</option>
                <option value="TOP2_RATE">Top 2率が高い順</option>
                <option value="WIN_RATE">勝率が高い順</option>
                <option value="AVG_PLACEMENT">平均順位が良い順</option>
                <option value="SAMPLE_SIZE">分析試合数が多い順</option>
              </select>
            </div>

          </div>

          {/* Middle Row: Advanced Dropdown Filters (Matching Simulator) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
            
            {/* 1. Trait Filter */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">シナジーで絞り込み</label>
              <select
                value={selectedTrait}
                onChange={(e) => setSelectedTrait(e.target.value)}
                className="w-full py-2 px-3 rounded-xl border border-sky-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/30 transition"
              >
                <option value="ALL">すべてのシナジー</option>
                {availableTraits.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* 2. Carry Champion Filter */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">キャリーチャンピオン</label>
              <select
                value={selectedCarryChampion}
                onChange={(e) => setSelectedCarryChampion(e.target.value)}
                className="w-full py-2 px-3 rounded-xl border border-sky-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/30 transition"
              >
                <option value="ALL">すべてのキャリー</option>
                {availableCarryChampions.map((c) => (
                  <option key={c.name} value={c.name}>★{c.cost} {c.name}</option>
                ))}
              </select>
            </div>

            {/* 3. Unit Champion Filter */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">構成に含まれるユニット</label>
              <select
                value={selectedChampion}
                onChange={(e) => setSelectedChampion(e.target.value)}
                className="w-full py-2 px-3 rounded-xl border border-sky-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/30 transition"
              >
                <option value="ALL">すべてのユニット</option>
                {availableChampions.map((c) => (
                  <option key={c.name} value={c.name}>★{c.cost} {c.name}</option>
                ))}
              </select>
            </div>

            {/* 4. Dedicated Augment Filter */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1 flex items-center justify-between">
                <span>専用オーグメント</span>
                <Sparkles className="w-3 h-3 text-amber-500" />
              </label>
              <select
                value={selectedDedicatedAugment}
                onChange={(e) => setSelectedDedicatedAugment(e.target.value)}
                className="w-full py-2 px-3 rounded-xl border border-amber-300 bg-amber-50/50 text-xs font-bold text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition"
              >
                <option value="ALL">すべてのオーグメント</option>
                {availableDedicatedAugments.map((aug) => (
                  <option key={aug.name} value={aug.name}>{aug.name}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Bottom Row: Tier Filter Tabs & Dedicated Augments Quick Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-sky-100">
            
            {/* Tier Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <span className="text-xs font-bold text-slate-500 mr-1 shrink-0">ティア:</span>
              {['ALL', 'OP', 'S', 'A', 'B', 'C'].map((t) => {
                const count = tierCounts[t] || 0;
                const isActive = selectedTier === t;
                return (
                  <button
                    key={t}
                    onClick={() => setSelectedTier(t)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                      isActive
                        ? 'bg-sky-500 text-white shadow-md font-black'
                        : 'bg-slate-50 text-slate-700 hover:bg-sky-50 border border-sky-200/80'
                    }`}
                  >
                    <span>{t === 'ALL' ? 'すべて' : `${t}`}</span>
                    <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-black ${
                      isActive ? 'bg-white/30 text-white' : 'bg-sky-100 text-sky-700'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick Toggle: Only Dedicated Augment Comps */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setOnlyDedicatedAugments(!onlyDedicatedAugments)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 border ${
                  onlyDedicatedAugments
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-400 shadow-md shadow-amber-500/20'
                    : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>専用オーグメント有り構成のみ</span>
              </button>

              {/* Reset All Filters Button */}
              {hasActiveFilters && (
                <button
                  onClick={resetAllFilters}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 flex items-center gap-1 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>リセット</span>
                </button>
              )}
            </div>

          </div>

        </div>

        {/* Results Counter & Refresh Status */}
        <div className="flex items-center justify-between px-2">
          <p className="text-xs font-bold text-slate-600">
            表示中: <span className="text-sky-600 font-black">{filteredAndSortedComps.length}</span> / {comps.length} 件の構成
          </p>
          <button
            onClick={fetchComps}
            disabled={loading}
            className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>データ再取得</span>
          </button>
        </div>

        {/* Comps List Grid */}
        {loading ? (
          <div className="py-20 text-center glass-panel rounded-2xl border border-sky-200">
            <RefreshCw className="w-8 h-8 text-sky-500 animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-600">構成データを読み込んでいます...</p>
          </div>
        ) : filteredAndSortedComps.length > 0 ? (
          <div className="space-y-3.5">
            {filteredAndSortedComps.map((comp) => (
              <CompCard
                key={comp.comp_key}
                comp={comp}
                onSelect={(selected) => setSelectedComp(selected)}
              />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center glass-panel rounded-2xl border border-sky-200 bg-white">
            <Filter className="w-10 h-10 text-slate-400 mx-auto mb-3 opacity-60" />
            <h3 className="text-base font-bold text-slate-800">条件に一致する構成が見つかりませんでした</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              選択中の絞り込み条件または検索キーワードを変更してお試しください。
            </p>
            <button
              onClick={resetAllFilters}
              className="px-4 py-2 bg-sky-500 text-white rounded-xl text-xs font-bold shadow-md hover:bg-sky-600 transition"
            >
              すべてのフィルターをリセット
            </button>
          </div>
        )}

      </section>

      {/* Comp Detail Modal */}
      {selectedComp && (
        <CompDetailModal
          comp={selectedComp}
          onClose={() => setSelectedComp(null)}
        />
      )}

    </main>
  );
}
