'use client';

import React, { useState } from 'react';
import { Grid, Award, Sparkles, Zap, Users, BookmarkCheck, ArrowRight, Flame } from 'lucide-react';
import ItemIcon from './ItemIcon';
import TftHexBoard from './TftHexBoard';
import { calculateAllTeamTraits } from '../utils/traitHelpers';
import { CompStat, UnitDetail, getTierStyle } from '../utils/compTypes';
import { getChampion, getChampionIcon, getChampionName, getItemIcon, getAugmentTierStyle } from '../utils/setMaster';

interface CompInlineDetailProps {
  comp: CompStat;
}

export default function CompInlineDetail({ comp }: CompInlineDetailProps) {
  const [activeTab, setActiveTab] = useState<'BOARD' | 'GUIDE' | 'CARRIES' | 'ROSTER'>('BOARD');
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
  const { activeTraits, totalTraitsCount } = calculateAllTeamTraits(
    currentUnits,
    comp.traits_summary
  );

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

      {/* Inline Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 bg-sky-50 p-1.5 rounded-xl border border-sky-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('BOARD')}
          className={`py-2 px-4 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 shrink-0 ${
            activeTab === 'BOARD'
              ? 'bg-sky-500 text-white shadow-md'
              : 'text-slate-600 hover:text-sky-900 hover:bg-sky-100'
          }`}
        >
          <Grid className="w-4 h-4" /> 4×7 盤面配置 (レベル別)
        </button>

        <button
          onClick={() => setActiveTab('GUIDE')}
          className={`py-2 px-4 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 shrink-0 ${
            activeTab === 'GUIDE'
              ? 'bg-sky-500 text-white shadow-md'
              : 'text-slate-600 hover:text-sky-900 hover:bg-sky-100'
          }`}
        >
          <Award className="w-4 h-4 text-amber-300" /> 進行ガイド・オーグメント
        </button>

        <button
          onClick={() => setActiveTab('CARRIES')}
          className={`py-2 px-4 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 shrink-0 ${
            activeTab === 'CARRIES'
              ? 'bg-sky-500 text-white shadow-md'
              : 'text-slate-600 hover:text-sky-900 hover:bg-sky-100'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-400" /> 核心キャリー・アイテム構成
        </button>

        <button
          onClick={() => setActiveTab('ROSTER')}
          className={`py-2 px-4 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 shrink-0 ${
            activeTab === 'ROSTER'
              ? 'bg-sky-500 text-white shadow-md'
              : 'text-slate-600 hover:text-sky-900 hover:bg-sky-100'
          }`}
        >
          <Users className="w-4 h-4" /> 構成全ユニット ({comp.units_detail?.length || 0})
        </button>
      </div>

      {/* TAB 1: 4x7 Board Grid View */}
      {activeTab === 'BOARD' && renderBoardGrid()}

      {/* TAB 2: Guide & Augments */}
      {activeTab === 'GUIDE' && (
        <div className="space-y-4 p-5 bg-sky-50/60 rounded-2xl border border-sky-200">
          {/* Overview */}
          {comp.overview && (
            <div className="p-4 bg-white rounded-xl border border-sky-200 space-y-1 shadow-sm">
              <div className="text-xs font-bold text-sky-800 flex items-center gap-1.5 uppercase">
                <BookmarkCheck className="w-4 h-4 text-sky-600" /> 構成概要 (Comp Overview)
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">{comp.overview}</p>
            </div>
          )}

          {/* Dedicated Augment & Recommended Augments */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 space-y-2 shadow-sm">
              <div className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-600" /> 専用・キーオーグメント
              </div>
              {comp.dedicated_augment ? (() => {
                const style = getAugmentTierStyle(comp.dedicated_augment);
                return (
                  <div className={`text-xs font-extrabold px-3 py-2 rounded-lg border inline-flex items-center gap-2 ${style.cardSelectedBorder} ${style.cardSelectedBg} ${style.cardSelectedText} ${style.glow}`}>
                    <span className={`px-1.5 py-0.5 text-[9px] rounded shrink-0 ${style.badgeBg}`}>{style.label}</span>
                    <span>{comp.dedicated_augment}</span>
                  </div>
                );
              })() : (
                <div className="text-xs text-slate-500 italic">汎用強化オーグメント対応</div>
              )}
            </div>

            <div className="p-4 bg-white rounded-xl border border-sky-200 space-y-2 shadow-sm">
              <div className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-sky-600" /> おすすめオーグメント
              </div>
              <div className="flex flex-wrap gap-2">
                {comp.recommended_augments && comp.recommended_augments.length > 0 ? (
                  comp.recommended_augments.map((aug, idx) => {
                    const style = getAugmentTierStyle(aug);
                    return (
                      <span key={idx} className={`text-xs px-3 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 ${style.cardSelectedBorder} ${style.cardSelectedBg} ${style.cardSelectedText} ${style.glow}`}>
                        <span className={`px-1.5 py-0.2 text-[9px] rounded shrink-0 ${style.badgeBg}`}>{style.label}</span>
                        <span>{aug}</span>
                      </span>
                    );
                  })
                ) : (
                  <span className="text-xs text-slate-500">汎用オーグメント全般</span>
                )}
              </div>
            </div>
          </div>

          {/* Play Conditions */}
          {comp.play_conditions && (
            <div className="p-4 bg-white rounded-xl border border-sky-200 space-y-1 shadow-sm">
              <div className="text-xs font-bold text-sky-800 flex items-center gap-1.5 uppercase">
                <Flame className="w-4 h-4 text-amber-500" /> 狙う条件・分岐判断
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">{comp.play_conditions}</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Carries & Items */}
      {activeTab === 'CARRIES' && (
        <div className="space-y-4 p-5 bg-sky-50/60 rounded-2xl border border-sky-200">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" /> 核心キャリー ユニット & 装備アイテム推奨
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentUnits.filter(u => u.items && u.items.length > 0).map((u, idx) => {
              const cMaster = getChampion(u.id || u.name);
              const cName = getChampionName(u.id || u.name);
              const cIcon = u.icon || cMaster.icon || getChampionIcon(u.id || u.name);

              return (
                <div key={idx} className="p-4 bg-white rounded-xl border border-sky-200 shadow-sm flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img src={cIcon} alt={cName} className="w-12 h-12 rounded-xl border border-sky-300 object-cover shadow-sm" />
                    <div>
                      <div className="font-extrabold text-sm text-slate-900">{cName} (★{u.star})</div>
                      <span className="text-[10px] text-slate-500 font-bold">{u.cost} コスト</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {u.items?.map((item, iIdx) => (
                      <ItemIcon
                        key={iIdx}
                        id={item.id}
                        name={item.name}
                        icon={item.icon || getItemIcon(item.id || item.name)}
                        size="md"
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: Roster */}
      {activeTab === 'ROSTER' && (
        <div className="space-y-4 p-5 bg-sky-50/60 rounded-2xl border border-sky-200">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-600" /> 構成最終盤面 採用全ユニット
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {currentUnits.map((u, idx) => {
              const cMaster = getChampion(u.id || u.name);
              const cName = getChampionName(u.id || u.name);
              const cIcon = u.icon || cMaster.icon || getChampionIcon(u.id || u.name);

              return (
                <div key={idx} className="p-3 bg-white rounded-xl border border-sky-200 shadow-sm flex items-center gap-3">
                  <img src={cIcon} alt={cName} className="w-10 h-10 rounded-lg border border-sky-200 object-cover" />
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-slate-900 truncate">{cName}</div>
                    <div className="text-[10px] text-slate-500 font-semibold">{u.cost} コスト</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
