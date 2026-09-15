'use client';

import React, { useState } from 'react';
import { Grid, Award, Sparkles, Zap, BookmarkCheck, Flame } from 'lucide-react';
import TftHexBoard from './TftHexBoard';
import { calculateAllTeamTraits } from '../utils/traitHelpers';
import { CompStat, UnitDetail, getTierStyle } from '../utils/compTypes';
import { getChampionIcon, getAugmentTierStyle, getAugmentIcon } from '../utils/setMaster';

interface CompInlineDetailProps {
  comp: CompStat;
}

export default function CompInlineDetail({ comp }: CompInlineDetailProps) {
  const [selectedLevel, setSelectedLevel] = useState<string>('FINAL');

  // Determine active board units based on level tab selection
  let currentUnits: UnitDetail[] = comp.units_detail || [];
  if (selectedLevel !== 'FINAL' && comp.level_boards && comp.level_boards[selectedLevel]) {
    currentUnits = comp.level_boards[selectedLevel];
  } else if (selectedLevel !== 'FINAL' && comp.level_boards) {
    const availableLvls = Object.keys(comp.level_boards).map(Number).sort((a, b) => a - b);
    const targetLvl = Number(selectedLevel);
    const closest = availableLvls.reverse().find(l => l <= targetLvl);
    if (closest && comp.level_boards[closest.toString()]) {
      currentUnits = comp.level_boards[closest.toString()];
    }
  }

  // Calculate traits for current displayed board
  const { activeTraits } = calculateAllTeamTraits(
    currentUnits,
    comp.traits_summary
  );

  const isBloodthornsActive = activeTraits.some((t) =>
    t.name.includes('ブラッドソーン') ||
    t.name.includes('ブラックソーン') ||
    t.name.includes('Bloodthorns') ||
    t.name.includes('Blackthorn')
  );

  const levelTabs = ['FINAL', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div className="p-6 bg-white rounded-2xl border border-sky-200 shadow-md space-y-6 animate-fadeIn">

      {/* Selected Comp Banner Header */}
      <div className="p-5 bg-gradient-to-r from-sky-100/90 via-sky-50 to-white rounded-xl border border-sky-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <img
              src={comp.main_carry.icon || getChampionIcon(comp.main_carry.id || comp.main_carry.name)}
              alt={comp.main_carry.name}
              className="w-16 h-16 rounded-2xl border-2 border-sky-500 object-cover shadow-md"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <span className={`absolute -bottom-2 -right-2 px-2 py-0.5 rounded font-black text-xs shadow ${getTierStyle(comp.tier).badgeSolid}`}>
              {comp.tier}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-200 text-sky-900 text-[10px] font-extrabold">
                あなたの選択構成
              </span>
              {comp.reroll_level && (
                <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-extrabold border border-indigo-200">
                  {comp.reroll_level}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-black text-slate-900">{comp.display_name}</h2>
            <p className="text-xs text-slate-600 font-medium mt-1">{comp.traits_summary}</p>
          </div>
        </div>
      </div>

      {/* Vertical Stacked Layout: Board Grid on Top, Guide & Augments on Bottom */}
      <div className="space-y-5">
        
        {/* TOP SECTION: 4x7 Hexagonal Board View */}
        <div className="space-y-4 p-4 sm:p-5 bg-gradient-to-b from-sky-100/80 via-sky-50/40 to-white rounded-2xl border border-sky-200 shadow-sm overflow-hidden">
          
          {/* Level Selector Tabs */}
          <div className="flex items-center justify-between gap-2 border-b border-sky-200/80 pb-3 flex-wrap">
            <div className="flex items-center gap-2 text-xs font-black text-sky-900">
              <Grid className="w-4 h-4 text-sky-600" />
              <span>盤面配置 (レベル別):</span>
            </div>
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-sky-200 shadow-2xs flex-wrap">
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
          <div className="p-3 bg-white rounded-xl border border-sky-200 shadow-xs flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-600 shrink-0 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" /> 発動中シナジー ({activeTraits.length}):
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
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

        {/* BOTTOM SECTION: Dedicated & Recommended Augments + Overview */}
        <div className="space-y-4">
          
          {/* Dedicated Augment & Recommended Augments Container */}
          <div className="p-4 bg-sky-50/70 rounded-2xl border border-sky-200 space-y-4 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Dedicated / Key Augment */}
              <div className="p-4 bg-slate-900 rounded-2xl border border-amber-500/40 space-y-2 shadow-md flex flex-col justify-center">
                <div className="text-xs font-black text-amber-400 flex items-center gap-1.5 uppercase tracking-wide">
                  <Award className="w-4 h-4 text-amber-400" /> 専用・キーオーグメント
                </div>
                {comp.dedicated_augment ? (() => {
                  const style = getAugmentTierStyle(comp.dedicated_augment);
                  const iconUrl = getAugmentIcon(comp.dedicated_augment, style.tier);
                  return (
                    <div className={`text-xs font-black px-3.5 py-2 rounded-xl border inline-flex items-center gap-2.5 shadow-md ${style.cardSelectedBorder} ${style.cardSelectedBg} ${style.cardSelectedText} ${style.glow}`}>
                      <img src={iconUrl} alt={comp.dedicated_augment} className="w-7 h-7 rounded-lg object-contain bg-slate-950/80 p-0.5 border border-white/20 shrink-0 shadow-sm" />
                      <span className={`px-2 py-0.5 text-[10px] rounded-md shrink-0 font-black ${style.badgeBg}`}>{style.label}</span>
                      <span className="text-sm font-black truncate">{comp.dedicated_augment}</span>
                    </div>
                  );
                })() : (
                  <div className="text-xs text-slate-400 italic font-medium py-1">汎用強化オーグメント対応</div>
                )}
              </div>

              {/* Recommended Augments */}
              <div className="p-4 bg-slate-900 rounded-2xl border border-sky-400/30 space-y-2 shadow-md">
                <div className="text-xs font-black text-sky-400 flex items-center gap-1.5 uppercase tracking-wide">
                  <Sparkles className="w-4 h-4 text-sky-400" /> おすすめオーグメント
                </div>
                <div className="flex flex-wrap gap-2">
                  {comp.recommended_augments && comp.recommended_augments.length > 0 ? (
                    comp.recommended_augments.map((aug, idx) => {
                      const style = getAugmentTierStyle(aug);
                      const iconUrl = getAugmentIcon(aug, style.tier);
                      return (
                        <div key={idx} className={`text-xs px-3 py-1.5 rounded-xl border font-extrabold flex items-center gap-2 shadow-sm transition-all hover:scale-105 ${style.cardSelectedBorder} ${style.cardSelectedBg} ${style.cardSelectedText} ${style.glow}`}>
                          <img src={iconUrl} alt={aug} className="w-6 h-6 rounded-lg object-contain bg-slate-950/80 p-0.5 border border-white/20 shrink-0 shadow-sm" />
                          <span className={`px-1.5 py-0.5 text-[9px] rounded-md shrink-0 font-black ${style.badgeBg}`}>{style.label}</span>
                          <span className="truncate max-w-[180px] font-bold">{aug}</span>
                        </div>
                      );
                    })
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">汎用オーグメント全般</span>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Comp Overview & Play Conditions */}
          {(comp.overview || comp.play_conditions) && (
            <div className={`grid grid-cols-1 ${comp.overview && comp.play_conditions ? 'md:grid-cols-2' : ''} gap-4`}>
              {comp.overview && (
                <div className="p-4 bg-white rounded-2xl border border-sky-200 space-y-1 shadow-sm">
                  <div className="text-xs font-bold text-sky-800 flex items-center gap-1.5 uppercase">
                    <BookmarkCheck className="w-4 h-4 text-sky-600" /> 構成概要 (Comp Overview)
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">{comp.overview}</p>
                </div>
              )}

              {comp.play_conditions && (
                <div className="p-4 bg-white rounded-2xl border border-sky-200 space-y-1 shadow-sm">
                  <div className="text-xs font-bold text-sky-800 flex items-center gap-1.5 uppercase">
                    <Flame className="w-4 h-4 text-amber-500" /> 狙う条件・分岐判断
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">{comp.play_conditions}</p>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
