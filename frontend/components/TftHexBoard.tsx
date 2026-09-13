'use client';

import React from 'react';
import ItemIcon from './ItemIcon';
import { UnitDetail } from '../utils/compTypes';
import { getChampion, getChampionIcon, getChampionName, getItemIcon, CHAMP_COST_MAP } from '../utils/setMaster';

interface TftHexBoardProps {
  units: UnitDetail[];
  onUnitMouseEnter?: (e: React.MouseEvent, unit: UnitDetail) => void;
  onUnitMouseLeave?: () => void;
  className?: string;
  theme?: 'dark' | 'light';
  isBloodthornsActive?: boolean;
}

export default function TftHexBoard({
  units,
  onUnitMouseEnter,
  onUnitMouseLeave,
  className = '',
  theme = 'light',
  isBloodthornsActive,
}: TftHexBoardProps) {
  // Map units by row_col string key
  const unitsMap: { [key: string]: UnitDetail } = {};
  units.forEach((u) => {
    unitsMap[`${u.row}_${u.col}`] = u;
  });

  const rows = [0, 1, 2, 3];
  const cols = [0, 1, 2, 3, 4, 5, 6];

  // Auto-detect Bloodthorns / Blackthorn trait if not explicitly passed
  const hasBloodthorns =
    isBloodthornsActive ??
    units.some((u) => {
      const champ = getChampion(u.id || u.name);
      const traits = [...(u.traits || []), ...(champ.traits || [])];
      return traits.some(
        (t) =>
          t &&
          (t.includes('ブラッドソーン') ||
            t.includes('ブラックソーン') ||
            t.includes('Bloodthorns') ||
            t.includes('Blackthorn'))
      );
    });

  // Robustly resolve champion unit cost (1-5) even if cost is string, missing, or unparsed
  const resolveUnitCost = (unit?: UnitDetail | null): number => {
    if (!unit) return 1;

    // 1. Direct unit.cost if valid number
    const parsedUnitCost = Number(unit.cost);
    if (!isNaN(parsedUnitCost) && parsedUnitCost >= 1 && parsedUnitCost <= 5) {
      return parsedUnitCost;
    }

    // 2. Lookup champ from master data
    const idOrName = unit.id || unit.name;
    const champMaster = getChampion(idOrName);
    const parsedMasterCost = Number(champMaster?.cost);
    if (!isNaN(parsedMasterCost) && parsedMasterCost >= 1 && parsedMasterCost <= 5) {
      return parsedMasterCost;
    }

    // 3. Fallback direct map lookup in CHAMP_COST_MAP
    const cleanIdOrName = (idOrName || '')
      .replace(/^(TFT18_|DA_18_|DA_|TFT_)/i, '')
      .replace(/(_AD|_AP|Small|Base)$/i, '')
      .trim();

    const displayName = getChampionName(idOrName);

    const mapCost =
      CHAMP_COST_MAP[unit.name] ||
      CHAMP_COST_MAP[unit.id] ||
      CHAMP_COST_MAP[cleanIdOrName] ||
      CHAMP_COST_MAP[cleanIdOrName.toLowerCase()] ||
      CHAMP_COST_MAP[displayName] ||
      CHAMP_COST_MAP[displayName.toLowerCase()];

    if (mapCost) {
      return Number(mapCost);
    }

    return 1;
  };

  // Helper for Cost Border Colors (OP.GG Style with High-Visibility Glow)
  const getCostBorderGradient = (cost: number | string) => {
    const c = Number(cost);
    switch (c) {
      case 5:
        return 'bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.85)] ring-1 ring-amber-300/80';
      case 4:
        return 'bg-gradient-to-br from-purple-400 via-purple-500 to-indigo-600 shadow-[0_0_12px_rgba(168,85,247,0.85)] ring-1 ring-purple-300/80';
      case 3:
        return 'bg-gradient-to-br from-cyan-300 via-sky-400 to-blue-500 shadow-[0_0_12px_rgba(6,182,212,0.85)] ring-1 ring-cyan-300/80';
      case 2:
        return 'bg-gradient-to-br from-emerald-300 via-emerald-400 to-green-500 shadow-[0_0_12px_rgba(16,185,129,0.85)] ring-1 ring-emerald-300/80';
      case 1:
      default:
        return 'bg-gradient-to-br from-slate-300 via-slate-400 to-slate-500 shadow-[0_0_8px_rgba(148,163,184,0.5)] ring-1 ring-slate-300/60';
    }
  };

  // Helper for Star Color matching Champion Cost
  const getStarColorStyle = (cost: number | string) => {
    const c = Number(cost);
    switch (c) {
      case 5:
        return 'text-amber-300 drop-shadow-[0_1.5px_2px_rgba(0,0,0,1)]';
      case 4:
        return 'text-purple-300 drop-shadow-[0_1.5px_2px_rgba(0,0,0,1)]';
      case 3:
        return 'text-cyan-300 drop-shadow-[0_1.5px_2px_rgba(0,0,0,1)]';
      case 2:
        return 'text-emerald-300 drop-shadow-[0_1.5px_2px_rgba(0,0,0,1)]';
      case 1:
      default:
        return 'text-slate-200 drop-shadow-[0_1.5px_2px_rgba(0,0,0,1)]';
    }
  };

  // Star Rating Badge Component (INSIDE Hexagon Top Peak)
  const renderStars = (starCount: number, cost: number) => {
    if (!starCount || starCount <= 1) return null;

    const starColorClass = getStarColorStyle(cost);
    const outlineStyle =
      '[-webkit-text-stroke:0.8px_#000] [-webkit-text-fill-color:currentColor] font-black leading-none';

    if (starCount === 3) {
      return (
        <div className="absolute top-1.5 inset-x-0 z-20 flex items-center justify-center gap-0.5 pointer-events-none">
          <span className={`text-[15px] ${starColorClass} ${outlineStyle}`}>★</span>
          <span className={`text-[15px] ${starColorClass} ${outlineStyle}`}>★</span>
          <span className={`text-[15px] ${starColorClass} ${outlineStyle}`}>★</span>
        </div>
      );
    }

    // 2-Star
    return (
      <div className="absolute top-1.5 inset-x-0 z-20 flex items-center justify-center gap-0.5 pointer-events-none">
        <span className={`text-[15px] ${starColorClass} ${outlineStyle}`}>★</span>
        <span className={`text-[15px] ${starColorClass} ${outlineStyle}`}>★</span>
      </div>
    );
  };

  const isDark = theme === 'dark';

  // Pointy-topped hexagon clip path (Top point at 50% 0%, Bottom point at 50% 100%)
  const hexClipPath = '[clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)]';

  return (
    <div
      className={`min-w-[670px] select-none py-7 px-4 overflow-x-auto flex flex-col items-center justify-center ${className}`}
    >
      <div className="flex flex-col items-start">
        {rows.map((rowIdx) => {
          const isOffset = rowIdx % 2 === 1;
          const marginTopClass = rowIdx > 0 ? '-mt-[20px]' : '';

          return (
            <div
              key={rowIdx}
              className={`flex items-center gap-[5px] ${marginTopClass} ${
                isOffset ? 'pl-[45px]' : ''
              }`}
            >
              {cols.map((colIdx) => {
                const unit = unitsMap[`${rowIdx}_${colIdx}`];
                const champMaster = unit ? getChampion(unit.id || unit.name) : null;
                const displayCost = resolveUnitCost(unit);
                const unitIcon = unit
                  ? unit.icon || champMaster?.icon || getChampionIcon(unit.id || unit.name)
                  : null;
                const displayName = unit ? getChampionName(unit.id || unit.name) : '';

                // Bloodthorns Sacrifice Hex Check: Position 3-4 (rowIdx 2, colIdx 3)
                const isSacrificeHex = hasBloodthorns && rowIdx === 2 && colIdx === 3;

                const getBorderClass = () => {
                  if (isSacrificeHex) {
                    return 'bg-gradient-to-br from-red-600 via-rose-600 to-crimson-600 shadow-[0_0_18px_rgba(225,29,72,0.95)] animate-pulse ring-2 ring-rose-400';
                  }
                  if (unit) {
                    return `${getCostBorderGradient(displayCost)} shadow-md`;
                  }
                  return isDark ? 'bg-slate-700/80' : 'bg-sky-200/90';
                };

                const getInnerBgClass = () => {
                  if (isSacrificeHex && !unit) {
                    return 'bg-gradient-to-b from-rose-950/95 via-red-950/90 to-slate-950 border border-rose-500/50';
                  }
                  if (unit) {
                    return 'bg-slate-900';
                  }
                  return isDark ? 'bg-[#1b1c24]/95' : 'bg-slate-900/85';
                };

                return (
                  <div
                    key={colIdx}
                    onMouseEnter={(e) => unit && onUnitMouseEnter && onUnitMouseEnter(e, unit)}
                    onMouseLeave={() => unit && onUnitMouseLeave && onUnitMouseLeave()}
                    className={`relative w-[84px] h-[96px] shrink-0 group transition-transform duration-200 ${
                      unit || isSacrificeHex ? 'hover:scale-105 hover:z-30 cursor-pointer' : 'z-0'
                    }`}
                  >
                    {/* Outer Pointy-Topped Hexagon (Cost Border Gradient / Bloodthorns Sacrifice Border) */}
                    <div
                      className={`w-full h-full p-[3.5px] transition-all duration-200 ${hexClipPath} ${getBorderClass()}`}
                    >
                      {/* Inner Pointy-Topped Hexagon Container */}
                      <div
                        className={`w-full h-full relative overflow-hidden flex flex-col items-center justify-center ${hexClipPath} ${getInnerBgClass()}`}
                      >
                        {unit ? (
                          <>
                            {/* Star Rating Badges (INSIDE Hexagon Top Peak) */}
                            {renderStars(unit.star || 1, displayCost)}

                            {/* Bloodthorns Sacrifice Unit Badge (Centered horizontally at top-[20px] inside hex) */}
                            {isSacrificeHex && (
                              <div className="absolute top-[20px] inset-x-0 flex justify-center z-20 pointer-events-none">
                                <span className="px-1.5 py-0.2 text-[8px] font-black rounded-full bg-red-950/95 text-rose-300 border border-rose-500 shadow-lg ring-1 ring-rose-400/60 backdrop-blur-xs animate-pulse">
                                  🩸 生贄マス
                                </span>
                              </div>
                            )}

                            {/* Champion Portrait Image */}
                            {unitIcon ? (
                              <img
                                src={unitIcon}
                                alt={displayName}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = getChampionIcon(unit.name);
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
                                {displayName}
                              </div>
                            )}

                            {/* Dark Overlay Gradient for Text & Items Readability */}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/20 to-transparent pointer-events-none" />

                            {/* Champion Name (FIXED Position: Slightly Below Center, regardless of items) */}
                            <span className="absolute top-[52%] -translate-y-1/2 inset-x-0 px-0.5 text-[11px] font-black text-white text-center leading-tight tracking-tight truncate drop-shadow-[0_1.5px_3px_rgba(0,0,0,1)] z-10 pointer-events-none">
                              {displayName}
                            </span>
                          </>
                        ) : isSacrificeHex ? (
                          /* Bloodthorns Sacrifice Hex Empty Cell Placeholder (3-4) */
                          <div className="w-full h-full flex flex-col items-center justify-center p-1 text-center pointer-events-none space-y-0.5">
                            <span className="text-[14px] drop-shadow-[0_0_6px_rgba(244,63,94,1)] animate-bounce">
                              🩸
                            </span>
                            <span className="text-[9.5px] font-black text-rose-300 tracking-tighter drop-shadow-[0_1px_3px_rgba(0,0,0,1)] leading-tight">
                              生贄マス
                            </span>
                            <span className="text-[8px] font-mono font-bold text-rose-400/80">
                              (3-4)
                            </span>
                          </div>
                        ) : (
                          /* Standard Empty Cell Placeholder */
                          <div className="w-full h-full flex items-center justify-center pointer-events-none opacity-40">
                            <span className="text-[9.5px] font-mono font-bold text-slate-400">
                              {rowIdx + 1}-{colIdx + 1}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Equipped Item Icons - HIGH Z-INDEX LAYER (z-30) OUTSIDE clip-path TO PREVENT CLIPPING */}
                    {unit && unit.items && unit.items.length > 0 && (
                      <div className="absolute bottom-[3px] left-1/2 -translate-x-1/2 z-30 flex items-center justify-center gap-0.5 pointer-events-none">
                        {unit.items.slice(0, 3).map((item, iIdx) => {
                          const itemIconSrc = item.icon || getItemIcon(item.id || item.name);
                          return (
                            <div
                              key={iIdx}
                              className="w-[20px] h-[20px] rounded-[3px] border border-slate-950 shadow-lg overflow-hidden bg-slate-950 shrink-0 ring-1 ring-black/60"
                            >
                              <img
                                src={itemIconSrc}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
