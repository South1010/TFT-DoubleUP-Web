'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import CompInlineDetail from '@/components/CompInlineDetail';
import BubbleCompSelector from '@/components/BubbleCompSelector';
import { CompStat, PartnerCompSummary, getTierStyle } from '@/utils/compTypes';
import { getChampion, getChampionIcon, getAugmentTierStyle, getAugmentIcon } from '@/utils/setMaster';
import { FALLBACK_COMPS } from '@/utils/fallbackComps';
import {
  Zap,
  ArrowRight,
  RotateCcw,
  Sparkles,
  ChevronDown,
  Layers,
  CheckCircle2,
  Award
} from 'lucide-react';

export default function Home() {
  const [comps, setComps] = useState<CompStat[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selection Flow States: isSelectorExpanded controls whether the bubble selector is open
  const [isSelectorExpanded, setIsSelectorExpanded] = useState<boolean>(false);
  const [selectedMyCompKey, setSelectedMyCompKey] = useState<string | null>(null);
  const [selectedPartnerCompKey, setSelectedPartnerCompKey] = useState<string | null>(null);

  const selectorSectionRef = useRef<HTMLDivElement>(null);
  const detailsSectionRef = useRef<HTMLDivElement>(null);
  const partnerDetailsRef = useRef<HTMLDivElement>(null);

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
      console.error('API Error, using fallback comps:', e);
      setComps(FALLBACK_COMPS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComps();

    const handleResetHomeState = () => {
      setSelectedMyCompKey(null);
      setSelectedPartnerCompKey(null);
      setIsSelectorExpanded(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('reset-home-state', handleResetHomeState);
    return () => {
      window.removeEventListener('reset-home-state', handleResetHomeState);
    };
  }, []);

  const selectedMyComp = comps.find(c => c.comp_key === selectedMyCompKey);
  const selectedPartnerComp = comps.find(c => c.comp_key === selectedPartnerCompKey);

  // Strictly sort recommended partner comps by Tier weight (OP -> S -> A -> B -> C)
  const sortedPartnerComps = useMemo(() => {
    if (!selectedMyComp) return [];

    let pList: (CompStat | PartnerCompSummary)[] = [];
    if (selectedMyComp.partner_comps && selectedMyComp.partner_comps.length > 0) {
      pList = selectedMyComp.partner_comps.map(p => {
        const full = comps.find(c => c.comp_key === p.comp_key);
        return full || p;
      });
    } else if (selectedMyComp.partner_comp_keys && selectedMyComp.partner_comp_keys.length > 0) {
      pList = selectedMyComp.partner_comp_keys
        .map(key => comps.find(c => c.comp_key === key))
        .filter((c): c is CompStat => Boolean(c));
    }

    if (pList.length === 0) return [];

    const TIER_WEIGHTS: Record<string, number> = { OP: 1, S: 2, A: 3, B: 4, C: 5 };
    const getWeight = (tier?: string) => {
      if (!tier) return 99;
      return TIER_WEIGHTS[tier.toUpperCase()] || 99;
    };

    return [...pList].sort((a, b) => {
      const wA = getWeight(a.tier);
      const wB = getWeight(b.tier);
      if (wA !== wB) return wA - wB;

      const top2A = a.top2_rate || 0;
      const top2B = b.top2_rate || 0;
      if (top2A !== top2B) return top2B - top2A;

      return (a.display_name || '').localeCompare(b.display_name || '', 'ja-JP');
    });
  }, [selectedMyComp, comps]);

  const handleOpenSelector = () => {
    setIsSelectorExpanded(true);
    setTimeout(() => {
      selectorSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleSelectMyComp = (comp: CompStat) => {
    setSelectedMyCompKey(comp.comp_key);
    setSelectedPartnerCompKey(null);
    setIsSelectorExpanded(false);
    setTimeout(() => {
      detailsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  };

  const handleSelectPartnerComp = (partnerKey: string) => {
    setSelectedPartnerCompKey(partnerKey);
    setTimeout(() => {
      partnerDetailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  };

  const handleReselectPartner = () => {
    setSelectedPartnerCompKey(null);
  };

  const handleReselect = () => {
    setSelectedMyCompKey(null);
    setSelectedPartnerCompKey(null);
    setIsSelectorExpanded(true);
    setTimeout(() => {
      selectorSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const resolveCarryInfo = (mainCarry: { id?: string; name?: string; icon?: string }) => {
    if (!mainCarry) return { name: 'ユニット', icon: '' };
    const master = getChampion(mainCarry.id || mainCarry.name);
    const name = mainCarry.name || master.name || 'ユニット';
    const icon = mainCarry.icon || master.icon || getChampionIcon(mainCarry.id || name);
    return { name, icon };
  };

  return (
    <main className="min-h-screen pb-20">
      
      {/* Initial State: Perfectly centered horizontally & vertically across all viewport sizes */}
      {!isSelectorExpanded && !selectedMyComp && (
        <section className="relative overflow-hidden min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 bg-gradient-to-b from-sky-100/70 via-sky-50/50 to-transparent animate-fadeIn">
          <div className="flex flex-col items-center justify-center text-center w-full max-w-7xl mx-auto py-8">
            <button
              onClick={handleOpenSelector}
              className="px-10 py-5 sm:px-12 sm:py-6 rounded-3xl bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-black text-xl sm:text-2xl md:text-3xl shadow-2xl hover:shadow-sky-500/40 hover:scale-105 transition-all duration-300 flex items-center gap-3.5 border-4 border-white/80 ring-4 ring-sky-300/50 cursor-pointer select-none"
            >
              <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-amber-300 animate-pulse" />
              <span>構成を選択する</span>
              <ChevronDown className="w-7 h-7 sm:w-8 sm:h-8 animate-bounce" />
            </button>
          </div>
        </section>
      )}

      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

        {/* --- PART 1: BUBBLE COMP SELECTOR SECTION --- */}
        {/* Rendered ONLY after clicking '構成を選択する' (isSelectorExpanded is true) */}
        {isSelectorExpanded && !selectedMyComp && (
          <section ref={selectorSectionRef} className="space-y-6 animate-fadeIn scroll-mt-24">
            <BubbleCompSelector
              comps={comps}
              selectedCompKey={selectedMyCompKey}
              onSelectComp={handleSelectMyComp}
              loading={loading}
            />
          </section>
        )}


        {/* --- PART 2: SELECTED COMP & PARTNER RECOMMENDATION FLOW --- */}
        {selectedMyComp && (
          <section ref={detailsSectionRef} className="space-y-8 animate-fadeIn scroll-mt-24">
            
            {/* Top Reselect Navigation Bar */}
            <div className="p-4 bg-gradient-to-r from-sky-500 via-sky-600 to-indigo-600 rounded-2xl text-white shadow-lg flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-white/20 backdrop-blur-md">
                  <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                </span>
                <div>
                  <div className="text-xs font-bold text-sky-100">選択完了</div>
                  <div className="text-sm font-black">{selectedMyComp.display_name} を選択中</div>
                </div>
              </div>

              <button
                onClick={handleReselect}
                className="px-4 py-2 rounded-xl bg-white text-sky-900 hover:bg-sky-50 text-xs font-black transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-sky-600" />
                新たに構成を選びなおす
              </button>
            </div>

            {/* Side-by-Side 2-Column Responsive Layout: My Selected Comp on Left, Recommended Partner on Right */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">

              {/* LEFT COLUMN: Player 1 (Your Selected Comp Board & Details) */}
              <div className="space-y-4 min-w-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-sky-600" />
                    1. あなたの選択構成ボード＆詳細
                  </h2>
                  <span className="px-3 py-1 rounded-full bg-sky-100 text-sky-900 font-black text-xs border border-sky-300">
                    Player 1 盤面
                  </span>
                </div>

                <CompInlineDetail comp={selectedMyComp} />
              </div>

              {/* RIGHT COLUMN: Player 2 (Recommended Partner Comps List OR Selected Partner Board) */}
              <div className="space-y-4 min-w-0">
                {!selectedPartnerComp ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                          <Zap className="w-5 h-5 text-amber-500" />
                          2. 【相性抜群】おすすめ相方構成 パートナー
                        </h3>
                        <p className="text-xs text-slate-600 font-medium mt-0.5">
                          「{selectedMyComp.display_name}」とシナジー相性の良いおすすめ構成一覧です。
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 font-black text-xs border border-emerald-300 shrink-0">
                        Player 2 盤面
                      </span>
                    </div>

                    {/* Recommended Partner Selection Cards */}
                    {sortedPartnerComps && sortedPartnerComps.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {sortedPartnerComps.map((partnerKeyObj) => {
                          const partnerFullComp = comps.find(c => c.comp_key === partnerKeyObj.comp_key);
                          const dedicatedAug = partnerKeyObj.dedicated_augment || partnerFullComp?.dedicated_augment;
                          const { name: pCarryName, icon: pCarryIcon } = resolveCarryInfo(partnerKeyObj.main_carry);

                          return (
                            <div
                              key={partnerKeyObj.comp_key}
                              onClick={() => handleSelectPartnerComp(partnerKeyObj.comp_key)}
                              className="p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 shadow-sm hover:shadow-md group bg-white border-sky-200 hover:border-emerald-300 hover:bg-emerald-50/30 relative overflow-hidden"
                            >
                              <div className="flex items-center justify-between gap-1 flex-wrap">
                                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-bold">
                                  <Zap className="w-3 h-3 text-emerald-600" /> 相性ベストマッチ
                                </div>
                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${getTierStyle(partnerKeyObj.tier).badge}`}>
                                  {partnerKeyObj.tier} Tier
                                </span>
                              </div>

                              <div className="flex items-start gap-3">
                                <img
                                  src={pCarryIcon}
                                  alt={pCarryName}
                                  className="w-11 h-11 rounded-xl border-2 border-emerald-400/60 object-cover shadow-sm shrink-0 mt-0.5"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                                <div className="min-w-0 flex-1 space-y-1">
                                  <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-emerald-700 transition truncate">
                                    {partnerKeyObj.display_name}
                                  </h4>
                                  <p className="text-[11px] text-slate-500 truncate font-medium">
                                    {partnerKeyObj.traits_summary}
                                  </p>

                                  {/* Dedicated Augment Badge on Partner Card */}
                                  {dedicatedAug && (
                                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-900 text-amber-300 text-[10px] font-black border border-amber-400/60 shadow-xs max-w-full">
                                      <img
                                        src={getAugmentIcon(dedicatedAug, getAugmentTierStyle(dedicatedAug).tier)}
                                        alt={dedicatedAug}
                                        className="w-3.5 h-3.5 rounded object-contain bg-slate-950 p-0.5 shrink-0"
                                      />
                                      <span className="truncate">専用: {dedicatedAug}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="pt-1.5 flex items-center justify-end border-t border-slate-100/80">
                                <span className="text-xs font-extrabold text-emerald-600 group-hover:text-emerald-700 flex items-center gap-1 transition-all duration-200 group-hover:translate-x-1">
                                  この相方構成を表示 <ArrowRight className="w-3.5 h-3.5" />
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-6 text-center text-slate-500 bg-sky-50/50 rounded-2xl border border-sky-200 space-y-2">
                        <p className="text-xs font-bold text-slate-700">現在この構成に対する専用相方ペア構成は登録されていません</p>
                        <p className="text-[10px] text-slate-500">管理者ポータルからいつでも新しい相性ペアを追加登録・リンク可能です</p>
                      </div>
                    )}
                  </>
                ) : (
                  /* Selected Recommended Partner Comp Details & Board Grid */
                  <div ref={partnerDetailsRef} className="space-y-4 animate-fadeIn scroll-mt-24">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                          <Zap className="w-5 h-5 text-emerald-500" />
                          2. 相方の選択構成ボード＆詳細
                        </h3>
                        <p className="text-xs text-slate-600 font-medium mt-0.5">
                          おすすめパートナー: <span className="font-extrabold text-emerald-700">{selectedPartnerComp.display_name}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleReselectPartner}
                          className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 font-extrabold text-xs transition border border-emerald-300 shadow-sm flex items-center gap-1.5 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                          相方を変更する
                        </button>
                        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 font-black text-xs border border-emerald-300 shrink-0">
                          Player 2 盤面
                        </span>
                      </div>
                    </div>

                    <CompInlineDetail comp={selectedPartnerComp} />
                  </div>
                )}
              </div>

            </div>

            {/* Bottom Reselect Floating Action Bar */}
            <div className="pt-6 flex justify-center">
              <button
                onClick={handleReselect}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-black text-sm shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2 border-2 border-sky-300 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>新たに構成を選びなおす (シャボン玉画面へ)</span>
              </button>
            </div>

          </section>
        )}

      </div>

    </main>
  );
}
