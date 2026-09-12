'use client';

import React, { useEffect, useState, useRef } from 'react';
import CompInlineDetail from '@/components/CompInlineDetail';
import BubbleCompSelector from '@/components/BubbleCompSelector';
import { CompStat, getTierStyle } from '@/utils/compTypes';
import { getChampion, getChampionIcon } from '@/utils/setMaster';
import { FALLBACK_COMPS } from '@/utils/fallbackComps';
import {
  Zap,
  ArrowRight,
  RotateCcw,
  Sparkles,
  ChevronDown,
  Layers,
  CheckCircle2
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">

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

            {/* 1. Selected Primary Composition Inline Details & Board Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-sky-600" />
                  1. あなた（または相方）の選択構成ボード＆詳細
                </h2>
                <span className="text-xs text-slate-500 font-medium">盤面レベル別エディタ</span>
              </div>

              <CompInlineDetail comp={selectedMyComp} />
            </div>


            {/* 2. Recommended Partner Comps Section */}
            <div className="space-y-4 pt-4 border-t border-sky-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" />
                    2. 【相性抜群】おすすめ相方構成 パートナー
                  </h3>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    「{selectedMyComp.display_name}」とシナジー相性の良いおすすめ構成一覧です。クリックすると下に詳細ボードが表示されます。
                  </p>
                </div>
              </div>

              {selectedMyComp.partner_comps && selectedMyComp.partner_comps.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedMyComp.partner_comps.map((partnerKeyObj) => {
                    const isPartnerSelected = selectedPartnerCompKey === partnerKeyObj.comp_key;
                    const { name: pCarryName, icon: pCarryIcon } = resolveCarryInfo(partnerKeyObj.main_carry);

                    return (
                      <div
                        key={partnerKeyObj.comp_key}
                        onClick={() => handleSelectPartnerComp(partnerKeyObj.comp_key)}
                        className={`p-6 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md group ${
                          isPartnerSelected
                            ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-300'
                            : 'bg-white border-sky-200 hover:border-emerald-300 hover:bg-emerald-50/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold">
                            <Zap className="w-3.5 h-3.5 text-emerald-600" /> 相性ベストマッチ
                          </div>
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-black border ${getTierStyle(partnerKeyObj.tier).badge}`}>
                            {partnerKeyObj.tier} Tier
                          </span>
                        </div>

                        <div className="flex items-center gap-4">
                          <img
                            src={pCarryIcon}
                            alt={pCarryName}
                            className="w-14 h-14 rounded-2xl border-2 border-emerald-400/60 object-cover shadow-sm shrink-0"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <div>
                            <h4 className="text-base font-extrabold text-slate-900 group-hover:text-emerald-700 transition">
                              {partnerKeyObj.display_name}
                            </h4>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                              {partnerKeyObj.traits_summary}
                            </p>
                          </div>
                        </div>

                        <div className="pt-2 flex items-center justify-end border-t border-slate-100/80">
                          <span className="text-sm font-extrabold text-emerald-600 group-hover:text-emerald-700 flex items-center gap-1.5 transition-all duration-200 group-hover:translate-x-1">
                            {isPartnerSelected ? '選択中 (下部に表示)' : '相方の盤面を見る'} <ArrowRight className="w-4 h-4" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 bg-sky-50/50 rounded-2xl border border-sky-200 space-y-2">
                  <p className="text-sm font-bold text-slate-700">現在この構成に対する専用相方ペア構成は登録されていません</p>
                  <p className="text-xs text-slate-500">管理者ポータルからいつでも新しい相性ペアを追加登録・リンク可能です</p>
                </div>
              )}
            </div>


            {/* 3. Selected Recommended Partner Comp Details & Board Grid */}
            {selectedPartnerComp && (
              <div ref={partnerDetailsRef} className="space-y-4 pt-6 border-t-2 border-emerald-300 animate-fadeIn scroll-mt-24">
                <div className="p-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 rounded-2xl text-white shadow-md flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <span className="p-2 rounded-xl bg-white/20 backdrop-blur-md">
                      <Zap className="w-5 h-5 text-amber-300" />
                    </span>
                    <div>
                      <div className="text-xs font-bold text-emerald-100">おすすめ相方構成の詳細</div>
                      <div className="text-sm font-black">{selectedPartnerComp.display_name}</div>
                    </div>
                  </div>

                  <button
                    onClick={handleReselect}
                    className="px-4 py-2 rounded-xl bg-white text-emerald-950 hover:bg-emerald-50 text-xs font-black transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 text-emerald-700" />
                    新たに構成を選びなおす
                  </button>
                </div>

                <CompInlineDetail comp={selectedPartnerComp} />
              </div>
            )}

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
