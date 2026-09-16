'use client';

import React, { useState } from 'react';
import { X, HeartHandshake, Grid, Users, Zap, Sparkles, AlertCircle, BookmarkCheck, ArrowRight, ShieldAlert, Award } from 'lucide-react';
import ItemIcon from './ItemIcon';
import TftHexBoard from './TftHexBoard';
import { calculateAllTeamTraits } from '../utils/traitHelpers';
import { CompStat, UnitDetail, getTierStyle } from '../utils/compTypes';
import { getChampion, getChampionIcon, getChampionName, getItemIcon, getItemName, getAugmentTierStyle, getAugmentIcon } from '../utils/setMaster';

interface CompDetailModalProps {
  comp: CompStat | null;
  onClose: () => void;
  onSelectComp?: (compKey: string) => void;
}

export default function CompDetailModal({ comp, onClose, onSelectComp }: CompDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'BOARD' | 'PARTNERS' | 'GUIDE' | 'SYNERGIES' | 'ROSTER'>('BOARD');
  const [selectedLevel, setSelectedLevel] = useState<string>('FINAL');

  if (!comp) return null;

  const isSingleRank = comp.queue_id === 1100 || comp.comp_key.startsWith('1100_');

  // Determine active board units based on level tab selection
  let currentUnits: UnitDetail[] = comp.units_detail || [];
  if (selectedLevel !== 'FINAL' && comp.level_boards && comp.level_boards[selectedLevel]) {
    currentUnits = comp.level_boards[selectedLevel];
  } else if (selectedLevel !== 'FINAL' && comp.level_boards) {
    // If exact level board not found, pick the closest lower level board available or fallback
    const availableLvls = Object.keys(comp.level_boards).map(Number).sort((a, b) => a - b);
    const targetLvl = Number(selectedLevel);
    const closest = availableLvls.reverse().find(l => l <= targetLvl);
    if (closest && comp.level_boards[closest.toString()]) {
      currentUnits = comp.level_boards[closest.toString()];
    }
  }

  // Calculate traits for the current displayed board
  const { activeTraits, inactiveTraits, totalTraitsCount } = calculateAllTeamTraits(
    currentUnits,
    comp.traits_summary
  );

  const costColor = (cost: number | string) => {
    const c = Number(cost);
    switch (c) {
      case 5: return 'border-amber-400 text-amber-400 bg-amber-500/10';
      case 4: return 'border-purple-400 text-purple-400 bg-purple-500/10';
      case 3: return 'border-cyan-400 text-cyan-400 bg-cyan-500/10';
      case 2: return 'border-emerald-400 text-emerald-400 bg-emerald-500/10';
      default: return 'border-slate-400 text-slate-300 bg-slate-500/10';
    }
  };

  const isBloodthornsActive = activeTraits.some((t) =>
    t.name.includes('ブラッドソーン') ||
    t.name.includes('ブラックソーン') ||
    t.name.includes('Bloodthorns') ||
    t.name.includes('Blackthorn')
  );

  // 4x7 Hexagonal Board Representation
  const renderBoardGrid = () => {
    const levelTabs = ['FINAL', '3', '4', '5', '6', '7', '8', '9'];

    return (
      <div className="p-6 bg-gradient-to-b from-sky-100/80 via-sky-50/40 to-white rounded-2xl border border-sky-200 shadow-sm overflow-x-auto space-y-4">
        
        {/* Level Selector Tabs */}
        <div className="flex items-center justify-between gap-2 border-b border-sky-200/80 pb-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs font-black text-sky-900">
            <Grid className="w-4 h-4 text-sky-600" />
            <span>プレイヤーレベル別 盤面配置:</span>
          </div>
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-sky-200 shadow-2xs overflow-x-auto">
            {levelTabs.map((lvl) => {
              const hasCustomBoard = lvl === 'FINAL' || (comp.level_boards && comp.level_boards[lvl]);
              return (
                <button
                  key={lvl}
                  onClick={() => setSelectedLevel(lvl)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    selectedLevel === lvl
                      ? 'bg-sky-500 text-white shadow-md font-black'
                      : hasCustomBoard
                      ? 'text-slate-700 hover:bg-sky-50'
                      : 'text-slate-400 hover:text-slate-600 opacity-60'
                  }`}
                >
                  {lvl === 'FINAL' ? '完成形 (Lv8-9)' : `Lv.${lvl}`}
                  {hasCustomBoard && lvl !== 'FINAL' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Traits summary bar */}
        <div className="p-3 bg-white rounded-xl border border-sky-200 shadow-xs flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-bold text-slate-600 shrink-0 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-500" /> 発動中シナジー ({activeTraits.length}):
          </span>
          <div className="flex items-center gap-1.5 flex-nowrap">
            {activeTraits.map((t, idx) => (
              <span
                key={idx}
                className={`inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-lg border shrink-0 ${t.bgClass} ${t.borderClass} ${t.colorClass}`}
              >
                <span className={`px-1 rounded text-[9px] ${t.badgeBg}`}>{t.count}</span>
                <span>{t.name}</span>
              </span>
            ))}
          </div>
        </div>

        {/* 4x7 Hex Grid Container */}
        <TftHexBoard
          units={currentUnits}
          theme="light"
          isBloodthornsActive={isBloodthornsActive}
        />

        <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold pt-2.5 border-t border-sky-200/80">
          <span>Row 1: 最前衛 タンクライン</span>
          <span>Row 4: 最後衛 キャリーライン</span>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white border border-sky-200 rounded-2xl p-6 shadow-2xl overflow-hidden my-8 text-slate-900">
        
        {/* Header decoration bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-sky-400 via-cyan-500 to-indigo-500" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-slate-500 hover:text-slate-900 border border-sky-200 transition shadow-sm"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-4 border-b border-sky-100 pb-4">
          <div className={`px-3 py-1.5 rounded-xl font-black text-xl border shadow-sm ${getTierStyle(comp.tier).badge}`}>
            {comp.tier} Tier
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900">
                {comp.display_name}
              </h2>
              {comp.reroll_level && (
                <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
                  {comp.reroll_level}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {isSingleRank
                ? `Set 18 シングルランク (Queue 1100) メタ分析 (サンプル数: ${comp.sample_size}試合)`
                : `Set 18 ダブルアップ (Queue 1160) メタ分析 (サンプル数: ${comp.sample_size}試合)`}
            </p>
          </div>
        </div>

        {/* Main Navigation Tabs */}
        <div className="flex items-center gap-1.5 mt-4 bg-sky-50/80 p-1.5 rounded-xl border border-sky-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('BOARD')}
            className={`py-2 px-3.5 rounded-lg text-xs font-extrabold transition flex items-center justify-center gap-1.5 shrink-0 ${
              activeTab === 'BOARD'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-600 hover:text-sky-900 hover:bg-sky-100'
            }`}
          >
            <Grid className="w-4 h-4" /> 4×7 盤面配置
          </button>
          
          <button
            onClick={() => setActiveTab('PARTNERS')}
            className={`py-2 px-3.5 rounded-lg text-xs font-extrabold transition flex items-center justify-center gap-1.5 shrink-0 ${
              activeTab === 'PARTNERS'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-600 hover:text-sky-900 hover:bg-sky-100'
            }`}
          >
            <HeartHandshake className="w-4 h-4 text-emerald-600" /> 相性が良い構成 ({comp.partner_comps ? comp.partner_comps.length : 0})
          </button>

          <button
            onClick={() => setActiveTab('GUIDE')}
            className={`py-2 px-3.5 rounded-lg text-xs font-extrabold transition flex items-center justify-center gap-1.5 shrink-0 ${
              activeTab === 'GUIDE'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-600 hover:text-sky-900 hover:bg-sky-100'
            }`}
          >
            <Award className="w-4 h-4 text-amber-500" /> 進行・条件・オーグメント
          </button>

          <button
            onClick={() => setActiveTab('SYNERGIES')}
            className={`py-2 px-3.5 rounded-lg text-xs font-extrabold transition flex items-center justify-center gap-1.5 shrink-0 ${
              activeTab === 'SYNERGIES'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-600 hover:text-sky-900 hover:bg-sky-100'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-500" /> 総シナジー ({totalTraitsCount})
          </button>

          <button
            onClick={() => setActiveTab('ROSTER')}
            className={`py-2 px-3.5 rounded-lg text-xs font-extrabold transition flex items-center justify-center gap-1.5 shrink-0 ${
              activeTab === 'ROSTER'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-600 hover:text-sky-900 hover:bg-sky-100'
            }`}
          >
            <Users className="w-4 h-4" /> 構成全駒一覧
          </button>
        </div>

        {/* Content Body */}
        <div className="mt-5 space-y-5">

          {/* TAB 1: 4x7 Board Grid View */}
          {activeTab === 'BOARD' && renderBoardGrid()}

          {/* TAB 2: Recommended Partner Comps for Double Up */}
          {activeTab === 'PARTNERS' && (
            <div className="space-y-4 p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-extrabold text-sm text-emerald-300 flex items-center gap-2">
                    <HeartHandshake className="w-5 h-5 text-emerald-400" />
                    ダブルアップ 相性が最高の相方構成 (Recommended Partner Comps)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    この構成と同時にプレイすることでAD/AP物理魔法バランスや前衛タンク受容性が高まり、Top2勝利率が格段に向上するペア編成です。
                  </p>
                </div>
              </div>

              {comp.partner_comps && comp.partner_comps.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {comp.partner_comps.map((partner) => (
                    <div
                      key={partner.comp_key}
                      onClick={() => onSelectComp && onSelectComp(partner.comp_key)}
                      className="p-4 bg-slate-900 rounded-xl border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-850 transition cursor-pointer flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${getTierStyle(partner.tier).badge}`}>
                            {partner.tier} Tier
                          </span>
                          <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition">
                            構成詳細を見る <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          {partner.main_carry.icon ? (
                            <img
                              src={partner.main_carry.icon}
                              alt={partner.main_carry.name}
                              className="w-10 h-10 rounded-xl border border-emerald-400/40 object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-xs">
                              {partner.main_carry.name}
                            </div>
                          )}
                          <div>
                            <div className="font-extrabold text-sm text-white group-hover:text-emerald-300 transition">
                              {partner.display_name}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                              {partner.traits_summary || '主要シナジー表記あり'}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 flex items-center justify-between">
                        <span>💡 相方ペア連携推奨</span>
                        <span className="text-cyan-400 font-semibold">シナジー相互補完</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800">
                  <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                  <p className="text-xs">現在この構成に対する専用相方構成は未設定です。</p>
                  <p className="text-[10px] text-slate-600 mt-1">管理者ポータルからいつでも新しい相性ペアを追加できます。</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Strategy, Augments & Progression */}
          {activeTab === 'GUIDE' && (
            <div className="space-y-4 p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
              
              {/* Overview */}
              {comp.overview && (
                <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1">
                  <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5 uppercase">
                    <BookmarkCheck className="w-4 h-4 text-cyan-400" /> 構成概要 (Comp Overview)
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">{comp.overview}</p>
                </div>
              )}

              {/* Dedicated Augment & Recommended Augments */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-900 rounded-xl border border-amber-500/40 space-y-1.5 shadow-md">
                  <div className="text-xs font-black text-amber-400 flex items-center gap-1.5 uppercase">
                    <Award className="w-4 h-4 text-amber-400" /> 専用・キーオーグメント
                  </div>
                  {comp.dedicated_augment ? (() => {
                    const style = getAugmentTierStyle(comp.dedicated_augment);
                    const iconUrl = getAugmentIcon(comp.dedicated_augment, style.tier);
                    return (
                      <div className={`text-xs font-extrabold px-3 py-1.5 rounded-lg border inline-flex items-center gap-2 shadow-sm ${style.cardSelectedBorder} ${style.cardSelectedBg} ${style.cardSelectedText} ${style.glow}`}>
                        <img src={iconUrl} alt={comp.dedicated_augment} className="w-6 h-6 rounded-lg object-contain bg-slate-950/80 p-0.5 border border-white/20 shrink-0 shadow-sm" />
                        <span className={`px-1.5 py-0.5 text-[9px] rounded-md shrink-0 font-black ${style.badgeBg}`}>{style.label}</span>
                        <span className="font-bold">{comp.dedicated_augment}</span>
                      </div>
                    );
                  })() : (
                    <div className="text-xs text-slate-400 italic font-medium">汎用強化オーグメント対応</div>
                  )}
                </div>

                <div className="p-3.5 bg-slate-900 rounded-xl border border-sky-400/30 space-y-1.5 shadow-md">
                  <div className="text-xs font-black text-sky-400 flex items-center gap-1.5 uppercase">
                    <Sparkles className="w-4 h-4 text-sky-400" /> おすすめオーグメント
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {comp.recommended_augments && comp.recommended_augments.length > 0 ? (
                      comp.recommended_augments.map((aug, idx) => {
                        const style = getAugmentTierStyle(aug);
                        const iconUrl = getAugmentIcon(aug, style.tier);
                        return (
                          <div key={idx} className={`text-[11px] px-2.5 py-1 rounded-lg border font-extrabold flex items-center gap-1.5 shadow-xs transition-all hover:scale-105 ${style.cardSelectedBorder} ${style.cardSelectedBg} ${style.cardSelectedText} ${style.glow}`}>
                            <img src={iconUrl} alt={aug} className="w-5 h-5 rounded-md object-contain bg-slate-950/80 p-0.5 border border-white/20 shrink-0 shadow-sm" />
                            <span className={`px-1.5 py-0.5 text-[9px] rounded-md shrink-0 font-black ${style.badgeBg}`}>{style.label}</span>
                            <span className="truncate max-w-[170px] font-bold">{aug}</span>
                          </div>
                        );
                      })
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">汎用オーグメント全般</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Play Conditions */}
              {comp.play_conditions && (
                <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1">
                  <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-emerald-400" /> プレイ条件・挑戦タイミング
                  </div>
                  <p className="text-xs text-slate-300">{comp.play_conditions}</p>
                </div>
              )}

              {/* Progression Guide */}
              {comp.progression_guide && (
                <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                    <HeartHandshake className="w-4 h-4 text-indigo-400" /> 進行・レベルアップ解説
                  </div>
                  <div className="text-xs text-slate-200 whitespace-pre-line leading-relaxed font-sans bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                    {comp.progression_guide}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 4: Active & Inactive Synergy Traits Breakdown */}
          {activeTab === 'SYNERGIES' && (
            <div className="space-y-5 p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <h3 className="font-extrabold text-sm text-slate-100">
                    発動中 & 未発動シナジー一覧
                  </h3>
                </div>
                <span className="text-xs font-bold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30">
                  発動中: {activeTraits.length} 種類 | 未発動: {inactiveTraits.length} 種類
                </span>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <Zap className="w-4 h-4 text-emerald-400" /> 🟢 発動中のシナジー ({activeTraits.length} 種類)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeTraits.map((t, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition ${t.bgClass} ${t.borderClass}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shadow ${t.badgeBg}`}>
                          {t.count}
                        </span>
                        <div>
                          <div className={`font-bold text-base ${t.colorClass}`}>{t.name}</div>
                          <span className="text-[10px] text-slate-400">シナジーレベル: Tier {t.count}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${t.borderClass} ${t.colorClass}`}>
                          {t.count >= 6 ? '超極強 (Tier 6+)' : t.count >= 4 ? '強力 (Tier 4)' : '発動中'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {inactiveTraits.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-slate-900">
                  <h4 className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <AlertCircle className="w-4 h-4 text-slate-500" /> ⚪ 未発動・段階不足のシナジー ({inactiveTraits.length} 種類)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {inactiveTraits.map((t, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-xl border border-slate-800/80 bg-slate-950/60 opacity-80 hover:opacity-100 transition"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-xl bg-slate-800/90 text-slate-400 border border-slate-700 flex items-center justify-center text-xs font-black">
                            {t.count}/{t.minThreshold}
                          </span>
                          <div>
                            <div className="font-bold text-sm text-slate-300">{t.name}</div>
                            <span className="text-[10px] text-slate-500">発動に必要な駒数: 残り {t.minThreshold - t.count}体</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-900 text-slate-500 border border-slate-800">
                            未発動
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 5: Full Champions Roster View */}
          {activeTab === 'ROSTER' && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  全構成チャンピオン一覧 ({currentUnits.length} 駒)
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">💡 カーソル合わせで所持シナジー・装備詳細を表示</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[340px] overflow-y-auto pr-1">
                {currentUnits.map((unit) => (
                  <div
                    key={unit.id}
                    className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800 hover:border-slate-700 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        {unit.icon ? (
                          <img
                            src={unit.icon}
                            alt={unit.name}
                            className={`w-11 h-11 rounded-xl border-2 object-cover ${costColor(unit.cost)}`}
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-slate-300">
                            {unit.name}
                          </div>
                        )}
                        <span className="absolute -bottom-1 -right-1 px-1 text-[8px] font-bold rounded bg-slate-900 text-cyan-300 border border-cyan-500/40">
                          コスト{unit.cost}
                        </span>
                      </div>

                      <div>
                        <div className="font-bold text-sm text-white flex items-center gap-1.5">
                          {unit.name}
                          <span className="text-[10px] text-amber-300 font-bold bg-amber-500/20 px-1 rounded">
                            ★{unit.star}
                          </span>
                        </div>
                        {unit.traits && unit.traits.length > 0 ? (
                          <div className="flex items-center gap-1 mt-0.5">
                            {unit.traits.map((tName, tIdx) => (
                              <span key={tIdx} className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300 border border-cyan-500/20 font-medium">
                                {tName}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-cyan-300 font-semibold">{unit.role}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {unit.items && unit.items.length > 0 ? (
                        unit.items.map((item: any, idx: number) => {
                          const itemKey = typeof item === 'string' ? item : (item.id || item.name || '');
                          const itemName = typeof item === 'object' && item.name ? item.name : (getItemName(itemKey) || itemKey);
                          const itemIcon = typeof item === 'object' && item.icon ? item.icon : getItemIcon(itemKey);
                          return (
                            <ItemIcon key={`${itemKey}-${idx}`} name={itemName} icon={itemIcon} size="sm" />
                          );
                        })
                      ) : (
                        <span className="text-[10px] text-slate-600">装備なし</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer Close Button */}
        <div className="mt-5 pt-3 border-t border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
          >
            閉じる
          </button>
        </div>

      </div>

    </div>
  );
}
