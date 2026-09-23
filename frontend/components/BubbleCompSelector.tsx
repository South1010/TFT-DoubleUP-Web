'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { CompStat, getTierStyle } from '../utils/compTypes';
import { getChampion, getChampionName, getChampionIcon, getItemIcon, getItemName, getAugmentTierStyle, getAugmentIcon } from '../utils/setMaster';
import { Search, Sparkles, User, SlidersHorizontal, Filter, RotateCcw, Award, CheckCircle, X, ChevronDown } from 'lucide-react';

interface BubbleCompSelectorProps {
  comps: CompStat[];
  onSelectComp: (comp: CompStat) => void;
  selectedCompKey?: string | null;
  loading?: boolean;
}

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

export function getCostStyle(cost: number) {
  switch (cost) {
    case 1:
      return {
        border: 'border-slate-400',
        bg: 'bg-slate-100',
        text: 'text-slate-800',
        badge: 'bg-slate-200 text-slate-800 border-slate-300 font-bold',
        glow: 'shadow-slate-200'
      };
    case 2:
      return {
        border: 'border-emerald-500',
        bg: 'bg-emerald-50',
        text: 'text-emerald-800',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
        glow: 'shadow-emerald-200'
      };
    case 3:
      return {
        border: 'border-blue-500',
        bg: 'bg-blue-50',
        text: 'text-blue-800',
        badge: 'bg-blue-100 text-blue-800 border-blue-300 font-bold',
        glow: 'shadow-blue-200'
      };
    case 4:
      return {
        border: 'border-purple-500',
        bg: 'bg-purple-50',
        text: 'text-purple-800',
        badge: 'bg-purple-100 text-purple-800 border-purple-300 font-bold',
        glow: 'shadow-purple-200'
      };
    case 5:
    case 6:
    case 7:
      return {
        border: 'border-amber-500 ring-2 ring-amber-300',
        bg: 'bg-amber-50',
        text: 'text-amber-900',
        badge: 'bg-amber-100 text-amber-900 border-amber-400 font-black',
        glow: 'shadow-amber-200'
      };
    default:
      return {
        border: 'border-slate-300',
        bg: 'bg-slate-50',
        text: 'text-slate-700',
        badge: 'bg-slate-100 text-slate-700 border-slate-200 font-bold',
        glow: 'shadow-slate-100'
      };
  }
}

// Clean helper to remove all numbers (half and full width), counts, parentheses, and spaces from trait names
export function cleanTraitName(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/[0-9０-９]+/g, '')
    .replace(/[\(（].*?[\)）]/g, '')
    .replace(/[\s\u3000\u00a0]+/g, '')
    .trim();
}

export default function BubbleCompSelector({ comps = [], onSelectComp, selectedCompKey, loading }: BubbleCompSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrait, setSelectedTrait] = useState('ALL');
  const [selectedCarryChampion, setSelectedCarryChampion] = useState('ALL');
  const [selectedChampion, setSelectedChampion] = useState('ALL');
  const [selectedDedicatedAugment, setSelectedDedicatedAugment] = useState('ALL');
  const [selectedTierFilter, setSelectedTierFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('DEFAULT');
  const [poppingCompKey, setPoppingCompKey] = useState<string | null>(null);

  // Dropdown Open States
  const [openDropdown, setOpenDropdown] = useState<'CARRY' | 'CHAMPION' | 'AUGMENT' | null>(null);
  
  // Outer container ref for click-outside detection (without transparent backdrop overlay)
  const filterContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterContainerRef.current && !filterContainerRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 1. Grouped Traits (strip ALL numbers/counts, group into unique base trait names)
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

  // 2. Available Registered Carry Champions Only
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

  // 3. Available Registered Unit Champions (All units in compositions)
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

  // 4. Available Registered Dedicated Augments Only
  const availableDedicatedAugments = useMemo(() => {
    const augMap = new Map<string, AugOption>();
    comps.forEach((c) => {
      if (c.dedicated_augment && c.dedicated_augment.trim()) {
        let augName = c.dedicated_augment.trim();
        if (augName === '酒食傾物') augName = '捕食植物';
        if (!augMap.has(augName)) {
          const style = getAugmentTierStyle(augName);
          const icon = getAugmentIcon(augName, style.tier);
          augMap.set(augName, { name: augName, icon, style });
        }
      }
    });
    return Array.from(augMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'ja-JP'));
  }, [comps]);

  // Filter comps based on search and dropdown selections
  const filteredComps = useMemo(() => {
    return comps
      .filter((comp) => {
        const matchesTier = selectedTierFilter === 'ALL' || comp.tier === selectedTierFilter;

        // Grouped trait matching (matches "インフェルノ" regardless of count "2 インフェルノ", "3 インフェルノ", etc.)
        const matchesTrait =
          selectedTrait === 'ALL' ||
          (comp.traits_summary && comp.traits_summary.includes(selectedTrait));

        // Dedicated carry champion filter
        const matchesCarry =
          selectedCarryChampion === 'ALL' ||
          (comp.main_carry && (
            getChampionName(comp.main_carry.id || comp.main_carry.name) === selectedCarryChampion ||
            comp.main_carry.name?.includes(selectedCarryChampion)
          ));

        // Composition unit champion filter
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

        // Dedicated augment filter (Normalized)
        const compAug = comp.dedicated_augment === '酒食傾物' ? '捕食植物' : comp.dedicated_augment;
        const matchesDedicatedAugment =
          selectedDedicatedAugment === 'ALL' ||
          (compAug && compAug.includes(selectedDedicatedAugment));

        // Keyword query
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery =
          q === '' ||
          comp.display_name?.toLowerCase().includes(q) ||
          comp.main_carry?.name?.toLowerCase().includes(q) ||
          (compAug && compAug.toLowerCase().includes(q)) ||
          (comp.traits_summary && comp.traits_summary.toLowerCase().includes(q)) ||
          (comp.units_detail || []).some((u: any) => {
            const uName = typeof u === 'string' ? u : u.name || u.id;
            const master = getChampion(uName);
            return (master.name || uName || '').toLowerCase().includes(q);
          });

        return (
          matchesTier &&
          matchesTrait &&
          matchesCarry &&
          matchesChampion &&
          matchesDedicatedAugment &&
          matchesQuery
        );
      })
      .sort((a, b) => {
        if (sortBy === 'NAME') {
          return a.display_name.localeCompare(b.display_name, 'ja-JP');
        }
        if (sortBy === 'WIN_RATE') {
          return (b.win_rate || 0) - (a.win_rate || 0);
        }
        if (sortBy === 'TOP2_RATE') {
          return (b.top2_rate || 0) - (a.top2_rate || 0);
        }
        const tierWeight: { [key: string]: number } = { OP: 1, S: 2, A: 3, B: 4, C: 5 };
        const weightA = tierWeight[a.tier?.toUpperCase()] || 99;
        const weightB = tierWeight[b.tier?.toUpperCase()] || 99;
        if (weightA !== weightB) return weightA - weightB;
        return a.display_name.localeCompare(b.display_name, 'ja-JP');
      });
  }, [
    comps,
    selectedTierFilter,
    selectedTrait,
    selectedCarryChampion,
    selectedChampion,
    selectedDedicatedAugment,
    searchQuery,
    sortBy
  ]);

  // Group comps by Tier bands (OP, S, A, B, C)
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
    setSelectedCarryChampion('ALL');
    setSelectedChampion('ALL');
    setSelectedDedicatedAugment('ALL');
    setSortBy('DEFAULT');
    setSearchQuery('');
    setOpenDropdown(null);
  };

  const isFilterActive =
    selectedTierFilter !== 'ALL' ||
    selectedTrait !== 'ALL' ||
    selectedCarryChampion !== 'ALL' ||
    selectedChampion !== 'ALL' ||
    selectedDedicatedAugment !== 'ALL' ||
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
    const rawName = mainCarry.name || master.name || 'ユニット';
    const name = getChampionName(rawName);
    const icon = mainCarry.icon || master.icon || getChampionIcon(mainCarry.id || name);
    return { name, icon };
  };

  const resolveCarryItems = (comp: CompStat): { id: string; name: string; icon: string }[] => {
    // 1. Check best_items
    if (comp.best_items && Array.isArray(comp.best_items) && comp.best_items.length > 0) {
      const items = comp.best_items
        .map((item: any) => {
          if (!item) return null;
          if (typeof item === 'string') {
            return {
              id: item,
              name: getItemName(item),
              icon: getItemIcon(item)
            };
          }
          const id = item.id || item.name || '';
          const name = item.name || getItemName(id);
          const icon = item.icon || getItemIcon(id || name);
          return { id, name, icon };
        })
        .filter((i): i is { id: string; name: string; icon: string } => i !== null && Boolean(i.icon || i.name));

      if (items.length > 0) return items.slice(0, 3);
    }

    // 2. Fallback: Find main carry in units_detail
    const carryId = (comp.main_carry?.id || '').toLowerCase();
    const carryName = (comp.main_carry?.name || '').toLowerCase();
    const carryUnit = (comp.units_detail || []).find((u) => {
      const uid = (u.id || '').toLowerCase();
      const uname = (u.name || '').toLowerCase();
      return (
        (carryId && (uid === carryId || uid.includes(carryId))) ||
        (carryName && (uname === carryName || uname.includes(carryName)))
      );
    });

    if (carryUnit && Array.isArray(carryUnit.items) && carryUnit.items.length > 0) {
      return carryUnit.items
        .map((item: any) => {
          if (!item) return null;
          if (typeof item === 'string') {
            return {
              id: item,
              name: getItemName(item),
              icon: getItemIcon(item)
            };
          }
          const id = item.id || item.name || '';
          const name = item.name || getItemName(id);
          const icon = item.icon || getItemIcon(id || name);
          return { id, name, icon };
        })
        .filter((i): i is { id: string; name: string; icon: string } => i !== null && Boolean(i.icon || i.name))
        .slice(0, 3);
    }

    return [];
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white/80 backdrop-blur-md rounded-3xl border border-sky-200 shadow-md">
        <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-black text-slate-700">構成シャボン玉データをロード中... 🫧</p>
      </div>
    );
  }

  // Selected Champion & Augment objects for dropdown trigger display
  const selectedCarryObj = availableCarryChampions.find((c) => c.name === selectedCarryChampion);
  const selectedChampObj = availableChampions.find((c) => c.name === selectedChampion);
  const selectedAugObj = availableDedicatedAugments.find((a) => a.name === selectedDedicatedAugment);

  return (
    <div className="space-y-6 animate-fadeIn relative">
      
      {/* Filter & Search Bar Outer Container */}
      <div ref={filterContainerRef} className="p-4 sm:p-5 bg-white/95 backdrop-blur-md rounded-2xl border border-sky-200 shadow-md space-y-4 relative z-20">
        
        {/* Header summary bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-sky-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-100 text-sky-600 shadow-2xs">
              <Filter className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-black text-slate-900">シャボン玉 構成絞り込み・ソート</h3>
              <p className="text-[11px] text-slate-500 font-medium">シナジー・キャリー・全構成駒・専用オーグメントで自在に検索できます</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-3 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-900 font-black shadow-2xs">
              {filteredComps.length} / {comps.length} 構成表示
            </span>
            {isFilterActive && (
              <button
                onClick={resetFilters}
                className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold flex items-center gap-1 transition cursor-pointer shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5" /> 条件をリセット
              </button>
            )}
          </div>
        </div>

        {/* Filters Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          
          {/* 1. Keyword Search */}
          <div className="min-w-0">
            <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
              <Search className="w-3 h-3 text-sky-600" /> キーワード検索
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="構成名・ユニット名..."
                className="w-full pl-3 pr-8 py-2 rounded-xl bg-sky-50/60 border border-sky-200 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-bold shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* 2. Grouped Synergy (Trait) Filter */}
          <div className="min-w-0">
            <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" /> シナジー ({availableTraits.length})
            </label>
            <select
              value={selectedTrait}
              onChange={(e) => setSelectedTrait(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-sky-50/60 border border-sky-200 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-bold shadow-2xs cursor-pointer truncate"
            >
              <option value="ALL">すべてのシナジー ({availableTraits.length})</option>
              {availableTraits.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* 3. Main Carry Champion Filter (Custom 5-Column Grid Popover) */}
          <div className="min-w-0 relative">
            <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
              <Award className="w-3 h-3 text-amber-500" /> メインキャリー ({availableCarryChampions.length})
            </label>
            <button
              onClick={() => setOpenDropdown(openDropdown === 'CARRY' ? null : 'CARRY')}
              className="w-full px-3 py-2 rounded-xl bg-sky-50/60 border border-sky-200 text-xs font-bold text-slate-900 flex items-center justify-between shadow-2xs hover:bg-sky-100/50 transition cursor-pointer"
            >
              {selectedCarryObj ? (
                <div className="flex items-center gap-2 min-w-0 truncate">
                  <img
                    src={selectedCarryObj.icon}
                    alt={selectedCarryObj.name}
                    className={`w-5 h-5 rounded-md object-cover border ${getCostStyle(selectedCarryObj.cost).border} shrink-0`}
                  />
                  <span className="truncate">{selectedCarryObj.name}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[9px] ${getCostStyle(selectedCarryObj.cost).badge}`}>
                    {selectedCarryObj.cost}G
                  </span>
                </div>
              ) : (
                <span className="text-slate-700 truncate">すべてのキャリー ({availableCarryChampions.length})</span>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
            </button>

            {/* Carry Dropdown Popover (5-Column Grid Layout) */}
            {openDropdown === 'CARRY' && (
              <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-2 w-[340px] sm:w-[400px] max-h-80 overflow-y-auto bg-white/95 backdrop-blur-md rounded-2xl border-2 border-sky-300 shadow-2xl z-50 p-3 space-y-2 animate-fadeIn">
                <button
                  onClick={() => {
                    setSelectedCarryChampion('ALL');
                    setOpenDropdown(null);
                  }}
                  className={`w-full px-3 py-2 rounded-xl text-xs text-left font-bold flex items-center justify-between transition cursor-pointer ${
                    selectedCarryChampion === 'ALL' ? 'bg-sky-500 text-white font-black shadow-md' : 'hover:bg-sky-50 text-slate-700 bg-sky-50/50'
                  }`}
                >
                  <span>すべてのキャリー ({availableCarryChampions.length})</span>
                  {selectedCarryChampion === 'ALL' && <CheckCircle className="w-4 h-4 text-white" />}
                </button>

                <div className="h-px bg-slate-200/80 my-2" />

                {/* 5-Column Grid with Icon on Top and Name Directly Below */}
                <div className="grid grid-cols-5 gap-2">
                  {availableCarryChampions.map((c) => {
                    const style = getCostStyle(c.cost);
                    const isSelected = selectedCarryChampion === c.name;
                    return (
                      <button
                        key={c.name}
                        onClick={() => {
                          setSelectedCarryChampion(c.name);
                          setOpenDropdown(null);
                        }}
                        className={`p-1.5 rounded-xl text-center flex flex-col items-center justify-between transition group cursor-pointer border ${
                          isSelected
                            ? 'bg-sky-100 border-sky-500 ring-2 ring-sky-400 font-extrabold shadow-sm scale-105'
                            : 'bg-white hover:bg-sky-50/80 border-slate-200/80 hover:border-sky-300 shadow-2xs'
                        }`}
                      >
                        <div className="relative">
                          <img
                            src={c.icon}
                            alt={c.name}
                            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl border-2 ${style.border} object-cover shadow-xs group-hover:scale-105 transition-transform`}
                          />
                          <span className={`absolute -bottom-1 -right-1 px-1 py-0.2 rounded font-black text-[9px] shadow ${style.badge}`}>
                            {c.cost}G
                          </span>
                        </div>

                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-900 truncate w-full mt-1.5 leading-tight group-hover:text-sky-700">
                          {c.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 4. Composition Champion Filter (Custom 5-Column Grid Popover) */}
          <div className="min-w-0 relative">
            <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
              <User className="w-3 h-3 text-emerald-600" /> 構成チャンピオン ({availableChampions.length})
            </label>
            <button
              onClick={() => setOpenDropdown(openDropdown === 'CHAMPION' ? null : 'CHAMPION')}
              className="w-full px-3 py-2 rounded-xl bg-sky-50/60 border border-sky-200 text-xs font-bold text-slate-900 flex items-center justify-between shadow-2xs hover:bg-sky-100/50 transition cursor-pointer"
            >
              {selectedChampObj ? (
                <div className="flex items-center gap-2 min-w-0 truncate">
                  <img
                    src={selectedChampObj.icon}
                    alt={selectedChampObj.name}
                    className={`w-5 h-5 rounded-md object-cover border ${getCostStyle(selectedChampObj.cost).border} shrink-0`}
                  />
                  <span className="truncate">{selectedChampObj.name}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[9px] ${getCostStyle(selectedChampObj.cost).badge}`}>
                    {selectedChampObj.cost}G
                  </span>
                </div>
              ) : (
                <span className="text-slate-700 truncate">全チャンピオン ({availableChampions.length})</span>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
            </button>

            {/* Champion Dropdown Popover (5-Column Grid Layout) */}
            {openDropdown === 'CHAMPION' && (
              <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-2 w-[340px] sm:w-[400px] max-h-80 overflow-y-auto bg-white/95 backdrop-blur-md rounded-2xl border-2 border-sky-300 shadow-2xl z-50 p-3 space-y-2 animate-fadeIn">
                <button
                  onClick={() => {
                    setSelectedChampion('ALL');
                    setOpenDropdown(null);
                  }}
                  className={`w-full px-3 py-2 rounded-xl text-xs text-left font-bold flex items-center justify-between transition cursor-pointer ${
                    selectedChampion === 'ALL' ? 'bg-sky-500 text-white font-black shadow-md' : 'hover:bg-sky-50 text-slate-700 bg-sky-50/50'
                  }`}
                >
                  <span>すべてのチャンピオン ({availableChampions.length})</span>
                  {selectedChampion === 'ALL' && <CheckCircle className="w-4 h-4 text-white" />}
                </button>

                <div className="h-px bg-slate-200/80 my-2" />

                {/* 5-Column Grid with Icon on Top and Name Directly Below */}
                <div className="grid grid-cols-5 gap-2">
                  {availableChampions.map((c) => {
                    const style = getCostStyle(c.cost);
                    const isSelected = selectedChampion === c.name;
                    return (
                      <button
                        key={c.name}
                        onClick={() => {
                          setSelectedChampion(c.name);
                          setOpenDropdown(null);
                        }}
                        className={`p-1.5 rounded-xl text-center flex flex-col items-center justify-between transition group cursor-pointer border ${
                          isSelected
                            ? 'bg-sky-100 border-sky-500 ring-2 ring-sky-400 font-extrabold shadow-sm scale-105'
                            : 'bg-white hover:bg-sky-50/80 border-slate-200/80 hover:border-sky-300 shadow-2xs'
                        }`}
                      >
                        <div className="relative">
                          <img
                            src={c.icon}
                            alt={c.name}
                            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl border-2 ${style.border} object-cover shadow-xs group-hover:scale-105 transition-transform`}
                          />
                          <span className={`absolute -bottom-1 -right-1 px-1 py-0.2 rounded font-black text-[9px] shadow ${style.badge}`}>
                            {c.cost}G
                          </span>
                        </div>

                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-900 truncate w-full mt-1.5 leading-tight group-hover:text-sky-700">
                          {c.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 5. Dedicated Augment Filter (Custom Visual Dropdown) */}
          <div className="min-w-0 relative">
            <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
              <Award className="w-3 h-3 text-purple-600" /> 専用オーグメント ({availableDedicatedAugments.length})
            </label>
            <button
              onClick={() => setOpenDropdown(openDropdown === 'AUGMENT' ? null : 'AUGMENT')}
              className="w-full px-3 py-2 rounded-xl bg-sky-50/60 border border-sky-200 text-xs font-bold text-slate-900 flex items-center justify-between shadow-2xs hover:bg-sky-100/50 transition cursor-pointer"
            >
              {selectedAugObj ? (
                <div className="flex items-center gap-2 min-w-0 truncate">
                  <img
                    src={selectedAugObj.icon}
                    alt={selectedAugObj.name}
                    className="w-5 h-5 rounded-md object-contain bg-slate-900 p-0.5 shrink-0"
                  />
                  <span className="truncate">{selectedAugObj.name}</span>
                </div>
              ) : (
                <span className="text-slate-700 truncate">専用オーグメント ({availableDedicatedAugments.length})</span>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
            </button>

            {/* Augment Dropdown Popover */}
            {openDropdown === 'AUGMENT' && (
              <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-2 w-72 max-h-80 overflow-y-auto bg-white/95 backdrop-blur-md rounded-2xl border-2 border-sky-300 shadow-2xl z-50 p-2 space-y-1 animate-fadeIn">
                <button
                  onClick={() => {
                    setSelectedDedicatedAugment('ALL');
                    setOpenDropdown(null);
                  }}
                  className={`w-full px-3 py-2 rounded-xl text-xs text-left font-bold flex items-center justify-between transition cursor-pointer ${
                    selectedDedicatedAugment === 'ALL' ? 'bg-sky-500 text-white font-black shadow-md' : 'hover:bg-sky-50 text-slate-700 bg-sky-50/50'
                  }`}
                >
                  <span>すべての専用オーグメント ({availableDedicatedAugments.length})</span>
                  {selectedDedicatedAugment === 'ALL' && <CheckCircle className="w-4 h-4 text-white" />}
                </button>
                <div className="h-px bg-slate-200/80 my-1" />
                {availableDedicatedAugments.map((aug) => {
                  const isSelected = selectedDedicatedAugment === aug.name;
                  return (
                    <button
                      key={aug.name}
                      onClick={() => {
                        setSelectedDedicatedAugment(aug.name);
                        setOpenDropdown(null);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition group cursor-pointer ${
                        isSelected ? 'bg-sky-50 border border-sky-300 font-extrabold shadow-2xs' : 'hover:bg-sky-50/70'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={aug.icon}
                          alt={aug.name}
                          className="w-6 h-6 rounded-lg object-contain bg-slate-900 p-0.5 border border-slate-700 shadow-2xs shrink-0"
                        />
                        <span className="truncate text-slate-900 font-bold">{aug.name}</span>
                      </div>
                      <span className={`px-1.5 py-0.5 text-[9px] rounded-md shrink-0 font-black ${aug.style.badgeBg}`}>
                        {aug.style.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 6. Sort Order */}
          <div className="min-w-0">
            <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3 text-purple-600" /> 並び替え
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-sky-50/60 border border-sky-200 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-bold shadow-2xs cursor-pointer"
            >
              <option value="DEFAULT">標準順 (Tier順)</option>
              <option value="NAME">構成名 (五十音順)</option>
              <option value="TOP2_RATE">Top2率 (高い順)</option>
              <option value="WIN_RATE">勝率 (高い順)</option>
            </select>
          </div>

        </div>

        {/* Tier Quick Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
          <span className="text-[11px] font-bold text-slate-500 mr-1 shrink-0">Tier絞り込み:</span>
          {(['ALL', 'OP', 'S', 'A', 'B', 'C'] as const).map((tier) => {
            const isSelected = selectedTierFilter === tier;
            return (
              <button
                key={tier}
                onClick={() => setSelectedTierFilter(tier)}
                className={`px-3 py-1 rounded-full text-xs font-black transition flex items-center gap-1 shrink-0 cursor-pointer ${
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
                    const carryItems = resolveCarryItems(comp);
                    const isSelected = selectedCompKey === comp.comp_key;
                    const isPopping = poppingCompKey === comp.comp_key;
                    const dedicatedAug = comp.dedicated_augment === '酒食傾物' ? '捕食植物' : comp.dedicated_augment;

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
                          className={`w-44 h-44 md:w-48 md:h-48 rounded-full ${getBubbleThemeClass(
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

                          {/* Dedicated Augment Icon Badge (Top Right) */}
                          {dedicatedAug && (
                            <div
                              title={`専用オーグメント: ${dedicatedAug}`}
                              className="absolute top-1.5 right-1.5 p-1.5 bg-slate-900/95 text-amber-300 rounded-full border border-amber-400/80 shadow-md z-20 flex items-center justify-center"
                            >
                              <img
                                src={getAugmentIcon(dedicatedAug, getAugmentTierStyle(dedicatedAug).tier)}
                                alt={dedicatedAug}
                                className="w-4.5 h-4.5 md:w-5 md:h-5 rounded object-contain bg-slate-950 p-0.5 shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            </div>
                          )}

                          {/* Tier Badge */}
                          <span className={`absolute top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[11px] md:text-xs font-black shadow-xs border ${getTierStyle(comp.tier).badgeSolid}`}>
                            {comp.tier} Tier
                          </span>

                          {/* Carry Champion Icon & Equipped Items */}
                          <div className="relative mt-3.5 mb-1 flex flex-col items-center">
                            <div className="relative">
                              <img
                                src={carryIcon}
                                alt={carryName}
                                className="w-14 h-14 md:w-16 md:h-16 rounded-full border-2 border-white/95 object-cover shadow-md group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            </div>

                            {/* Carry Equipped Items */}
                            {carryItems.length > 0 && (
                              <div className="flex items-center justify-center gap-1 -mt-3.5 z-10">
                                {carryItems.map((item, iIdx) => (
                                  <div
                                    key={`${item.id || item.name}-${iIdx}`}
                                    title={item.name}
                                    className="w-5 h-5 md:w-6 md:h-6 rounded-md bg-slate-950/90 border border-amber-300/80 p-[1.5px] shadow-sm shrink-0 overflow-hidden"
                                  >
                                    {item.icon ? (
                                      <img
                                        src={item.icon}
                                        alt={item.name}
                                        className="w-full h-full object-cover rounded-xs"
                                        onError={(e) => {
                                          (e.target as HTMLElement).style.display = 'none';
                                        }}
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-slate-800 rounded-xs" />
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Comp Display Name & Dedicated Augment Label */}
                          <div className="w-full px-2 flex flex-col items-center mt-1">
                            <div className="font-black text-xs md:text-[13px] text-slate-950 truncate w-full drop-shadow-xs leading-tight tracking-tight">
                              {comp.display_name}
                            </div>
                            
                            {dedicatedAug ? (
                              <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900/90 text-amber-300 text-[9.5px] md:text-[10.5px] font-black border border-amber-400/60 shadow-2xs max-w-full truncate">
                                <Award className="w-3 h-3 text-amber-400 shrink-0" />
                                <span className="truncate">{dedicatedAug}</span>
                              </div>
                            ) : (
                              <span className="mt-0.5 text-[10px] md:text-[11px] text-slate-800 font-extrabold block truncate opacity-90">
                                {carryName}
                              </span>
                            )}
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
              検索キーワードや絞り込み条件（シナジー・キャリー・チャンピオン・専用オーグメント・Tier）を変更してください。
            </p>
            <button
              onClick={resetFilters}
              className="mt-2 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-sky-600 text-white text-xs font-black hover:bg-sky-700 transition shadow-md cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> 絞り込み条件をリセット
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
