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

  // Robustly resolve champion unit cost (1-5) even if cost is missing, string, or set to 1 in DB
  const resolveUnitCost = (unit?: UnitDetail | null): number => {
    if (!unit) return 1;

    const idOrName = unit.id || unit.name || '';
    const cleanIdOrName = idOrName
      .replace(/^(TFT18_|DA_18_|DA_|TFT_)/i, '')
      .replace(/(_AD|_AP|Small|Base)$/i, '')
      .replace(/\d+$/g, '')
      .trim();

    const displayName = getChampionName(idOrName);

    // 1. Authoritative lookup in Set 18 CHAMP_COST_MAP
    const mapCost =
      CHAMP_COST_MAP[unit.name || ''] ||
      CHAMP_COST_MAP[unit.id || ''] ||
      CHAMP_COST_MAP[cleanIdOrName] ||
      CHAMP_COST_MAP[cleanIdOrName.toLowerCase()] ||
      CHAMP_COST_MAP[displayName] ||
      CHAMP_COST_MAP[displayName.toLowerCase()];

    if (mapCost && !isNaN(Number(mapCost))) {
      return Number(mapCost);
    }

    // 2. Lookup champ from master data (getChampion)
    const champMaster = getChampion(idOrName);
    const parsedMasterCost = Number(champMaster?.cost);
    if (!isNaN(parsedMasterCost) && parsedMasterCost >= 1 && parsedMasterCost <= 5) {
      return parsedMasterCost;
    }

    // 3. Fallback to direct unit.cost if valid
    const parsedUnitCost = Number(unit.cost);
    if (!isNaN(parsedUnitCost) && parsedUnitCost >= 1 && parsedUnitCost <= 5) {
      return parsedUnitCost;
    }

    return 1;
  };

  // Helper for Cost Border Colors (OP.GG Style with Guaranteed Inline CSS Styles)
  const getCostBorderStyle = (cost: number | string): React.CSSProperties => {
    const c = Number(cost);
    switch (c) {
      case 5:
        return {
          background: 'linear-gradient(135deg, #fde047 0%, #f59e0b 50%, #d97706 100%)',
          boxShadow: '0 0 14px rgba(245, 158, 11, 0.95)',
        };
      case 4:
        return {
          background: 'linear-gradient(135deg, #e879f9 0%, #a855f7 50%, #6366f1 100%)',
          boxShadow: '0 0 14px rgba(168, 85, 247, 0.95)',
        };
      case 3:
        return {
          background: 'linear-gradient(135deg, #67e8f9 0%, #0284c7 50%, #2563eb 100%)',
          boxShadow: '0 0 14px rgba(6, 182, 212, 0.95)',
        };
      case 2:
        return {
          background: 'linear-gradient(135deg, #6ee7b7 0%, #10b981 50%, #15803d 100%)',
          boxShadow: '0 0 14px rgba(16, 185, 129, 0.95)',
        };
      case 1:
      default:
        return {
          background: 'linear-gradient(135deg, #cbd5e1 0%, #64748b 50%, #334155 100%)',
          boxShadow: '0 0 8px rgba(148, 163, 184, 0.6)',
        };
    }
  };

  // Helper for Star Color matching Champion Cost (Explicit inline CSS)
  const getStarStyle = (cost: number | string): React.CSSProperties => {
    const c = Number(cost);
    let color = '#e2e8f0';
    if (c === 5) color = '#fde047'; // Vibrant Gold
    else if (c === 4) color = '#e879f9'; // Vibrant Purple
    else if (c === 3) color = '#38bdf8'; // Vibrant Cyan Blue
    else if (c === 2) color = '#34d399'; // Vibrant Emerald Green

    return {
      color: color,
      WebkitTextFillColor: color,
      WebkitTextStroke: '1px #000000',
      filter: 'drop-shadow(0px 1.5px 2px rgba(0, 0, 0, 1)) drop-shadow(0px 0px 2px rgba(0,0,0,0.9))',
    };
  };

  // Star Rating Badge Component (INSIDE Hexagon Top Peak)
  const renderStars = (starCount: number, cost: number) => {
    if (!starCount || starCount <= 1) return null;

    const style = getStarStyle(cost);

    if (starCount === 3) {
      return (
        <div className="absolute top-1.5 inset-x-0 z-20 flex items-center justify-center gap-0.5 pointer-events-none">
          <span style={style} className="text-[16px] font-black leading-none">★</span>
          <span style={style} className="text-[16px] font-black leading-none">★</span>
          <span style={style} className="text-[16px] font-black leading-none">★</span>
        </div>
      );
    }

    // 2-Star
    return (
      <div className="absolute top-1.5 inset-x-0 z-20 flex items-center justify-center gap-0.5 pointer-events-none">
        <span style={style} className="text-[16px] font-black leading-none">★</span>
        <span style={style} className="text-[16px] font-black leading-none">★</span>
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
                      style={
                        isSacrificeHex
                          ? {
                              background:
                                'linear-gradient(135deg, #dc2626 0%, #e11d48 50%, #9f1239 100%)',
                              boxShadow: '0 0 18px rgba(225, 29, 72, 0.95)',
                            }
                          : unit
                          ? getCostBorderStyle(displayCost)
                          : undefined
                      }
                      className={`w-full h-full p-[3.5px] transition-all duration-200 ${hexClipPath} ${
                        isSacrificeHex
                          ? 'animate-pulse ring-2 ring-rose-400'
                          : unit
                          ? ''
                          : isDark
                          ? 'bg-slate-700/80'
                          : 'bg-sky-200/90'
                      }`}
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
