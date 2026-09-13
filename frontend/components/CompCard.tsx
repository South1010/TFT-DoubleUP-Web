'use client';

import React from 'react';
import { ChevronRight, HeartHandshake, Award } from 'lucide-react';
import ItemIcon from './ItemIcon';
import { parseTraitsSummary } from '../utils/traitHelpers';
import { CompStat } from '../utils/compTypes';
import { getChampion, getChampionIcon } from '../utils/setMaster';

interface CompCardProps {
  comp: CompStat;
  isSingleRank?: boolean;
  onSelect: (comp: CompStat) => void;
}

export default function CompCard({ comp, isSingleRank = false, onSelect }: CompCardProps) {
  const getTierBadgeStyle = (tier: string) => {
    switch (tier?.toUpperCase()) {
      case 'OP':
        return 'bg-gradient-to-r from-rose-600 via-red-600 to-rose-500 text-white font-black shadow-md shadow-rose-500/30 border border-rose-400';
      case 'S':
        return 'bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20 border border-amber-300';
      case 'A':
        return 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white font-black shadow-md shadow-purple-500/20 border border-purple-400';
      case 'B':
        return 'bg-gradient-to-br from-sky-500 to-blue-600 text-white font-black shadow-md shadow-sky-500/20 border border-sky-400';
      case 'C':
        return 'bg-gradient-to-br from-slate-500 to-slate-700 text-slate-100 font-bold border border-slate-400';
      default:
        return 'bg-slate-700 text-slate-200 font-bold';
    }
  };

  const getCostBorder = (cost: number | string) => {
    const c = Number(cost);
    switch (c) {
      case 5: return 'border-amber-400';
      case 4: return 'border-purple-400';
      case 3: return 'border-cyan-400';
      case 2: return 'border-emerald-400';
      default: return 'border-slate-500';
    }
  };

  const parsedTraits = parseTraitsSummary(comp.traits_summary);
  const partnerCount = comp.partner_comps ? comp.partner_comps.length : 0;

  const mainCarryMaster = getChampion(comp.main_carry.id || comp.main_carry.name);
  const mainCarryName = comp.main_carry.name || mainCarryMaster.name;
  const mainCarryIcon = comp.main_carry.icon || mainCarryMaster.icon || getChampionIcon(comp.main_carry.id || mainCarryName);
  const mainCarryCost = comp.main_carry.cost || mainCarryMaster.cost;

  return (
    <div
      onClick={() => onSelect(comp)}
      className="group relative glass-panel glass-panel-hover rounded-2xl p-5 cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5"
    >
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        
        {/* Left: Tier Badge & Comp Info */}
        <div className="flex items-start gap-4 min-w-[300px]">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg tracking-wider shrink-0 transition-transform group-hover:scale-105 shadow-md ${getTierBadgeStyle(comp.tier)}`}>
            {comp.tier}
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-lg text-slate-900 group-hover:text-sky-600 transition-colors">
                {comp.display_name}
              </h3>

              {comp.reroll_level && (
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
                  {comp.reroll_level}
                </span>
              )}

              {partnerCount > 0 && !isSingleRank && (
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold flex items-center gap-1">
                  <HeartHandshake className="w-3 h-3 text-emerald-600" /> 相性ペア{partnerCount}件
                </span>
              )}
            </div>

            {/* Total Active Synergy Traits Badges */}
            {parsedTraits.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {parsedTraits.map((t, idx) => (
                  <span
                    key={idx}
                    className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg border transition ${t.bgClass} ${t.borderClass} ${t.colorClass}`}
                  >
                    <span className={`px-1 py-0.2 rounded text-[10px] ${t.badgeBg}`}>
                      {t.count}
                    </span>
                    <span>{t.name}</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">{comp.sample_size} 試合分析データ</p>
            )}
          </div>
        </div>

        {/* Center: Main Carry & Best Items */}
        <div className="flex items-center gap-4 bg-sky-50/80 p-2.5 rounded-xl border border-sky-200/80">
          <div className="relative">
            {mainCarryIcon ? (
              <img
                src={mainCarryIcon}
                alt={mainCarryName}
                className={`w-12 h-12 rounded-xl border-2 object-cover ${getCostBorder(mainCarryCost)}`}
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-sky-100 border border-sky-300 flex items-center justify-center font-bold text-xs text-slate-700">
                {mainCarryName}
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 text-[9px] font-black rounded bg-slate-900 text-sky-300 border border-sky-400">
              コスト{mainCarryCost}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase font-bold mb-1">推奨アイテム</span>
            <div className="flex items-center gap-1.5">
              {comp.best_items.map((item, idx) => (
                <ItemIcon key={`${item.id}-${idx}`} name={item.name} icon={item.icon} size="sm" />
              ))}
            </div>
          </div>
        </div>

        {/* Right Action Button */}
        <div className="flex items-center justify-end w-full lg:w-auto pt-2 lg:pt-0">
          <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center group-hover:bg-sky-500 group-hover:text-white transition-colors shadow-sm">
            <ChevronRight className="w-5 h-5" />
          </div>
        </div>

      </div>
    </div>
  );
}
