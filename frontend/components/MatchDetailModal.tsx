'use client';

import React, { useState } from 'react';
import { X, Grid, Users, Zap, Shield, Trophy, Clock, Sparkles, AlertCircle } from 'lucide-react';
import ItemIcon from './ItemIcon';
import TftHexBoard from './TftHexBoard';
import { calculateAllTeamTraits, UnitDetailWithTraits } from '../utils/traitHelpers';
import { getChampion, getChampionIcon, getChampionName, getItemIcon, getItemName } from '../utils/setMaster';

interface MainCarry {
  id: string;
  name: string;
  icon: string;
  cost: number;
}

interface Item {
  id: string;
  name: string;
  icon: string;
}

interface Participant extends UnitDetailWithTraits {
  puuid: string;
  placement: number;
  level: number;
  comp_key: string;
  display_name: string;
  traits_summary?: string;
  main_carry: MainCarry;
  units_detail?: {
    id: string;
    name: string;
    cost: number;
    icon: string;
    role: string;
    row: number;
    col: number;
    star: number;
    traits?: string[];
    items: Item[];
  }[];
}

export interface MatchLog {
  match_id: string;
  queue_id?: number;
  game_datetime: number;
  game_version: string;
  tft_set_number: number;
  participants: Participant[];
}

interface MatchDetailModalProps {
  match: MatchLog | null;
  onClose: () => void;
}

export default function MatchDetailModal({ match, onClose }: MatchDetailModalProps) {
  const [selectedPlayerIndex, setSelectedPlayerIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'BOARD' | 'ROSTER' | 'SYNERGIES'>('BOARD');
  const [hoveredUnit, setHoveredUnit] = useState<any>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  if (!match || !match.participants || match.participants.length === 0) return null;

  const activePlayer = match.participants[selectedPlayerIndex] || match.participants[0];
  const isSingleRank = match.queue_id === 1100 || match.match_id.includes('SOLO');

  const { activeTraits, inactiveTraits, totalTraitsCount } = calculateAllTeamTraits(
    activePlayer.units_detail,
    activePlayer.traits_summary
  );

  const isBloodthornsActive = activeTraits.some((t) =>
    t.name.includes('ブラッドソーン') ||
    t.name.includes('ブラックソーン') ||
    t.name.includes('Bloodthorns') ||
    t.name.includes('Blackthorn')
  );

  const costColor = (cost?: number | string | null) => {
    const c = Number(cost || 1);
    switch (c) {
      case 5: return 'border-amber-400 text-amber-400 bg-amber-500/10';
      case 4: return 'border-purple-400 text-purple-400 bg-purple-500/10';
      case 3: return 'border-cyan-400 text-cyan-400 bg-cyan-500/10';
      case 2: return 'border-emerald-400 text-emerald-400 bg-emerald-500/10';
      default: return 'border-slate-400 text-slate-300 bg-slate-500/10';
    }
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString('ja-JP', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  };

  const handleUnitMouseEnter = (e: React.MouseEvent, unit: any) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top - 10 });
    setHoveredUnit(unit);
  };

  const handleUnitMouseLeave = () => {
    setHoveredUnit(null);
  };

  // 4x7 Hexagonal TFT Board Representation for Selected Player
  const renderBoardGrid = () => {
    return (
      <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800/80 overflow-x-auto">
        <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
          <span className="font-bold flex items-center gap-1.5 text-cyan-300">
            <Grid className="w-4 h-4" /> {activePlayer.puuid} の最終盤面配置 (4×7 Grid)
          </span>
          <span className="text-[10px] text-slate-400 font-semibold">💡 ユニットホバーで個別シナジー・アイテムを表示</span>
        </div>

        {/* Active & Inactive Traits Bar */}
        <div className="mb-4 p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-bold text-slate-400 shrink-0 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> 発動:
          </span>
          <div className="flex items-center gap-1.5 flex-nowrap">
            {activeTraits.map((t, idx) => (
              <span
                key={idx}
                className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-lg border shrink-0 ${t.bgClass} ${t.borderClass} ${t.colorClass}`}
              >
                <span className={`px-1 rounded text-[9px] ${t.badgeBg}`}>{t.count}</span>
                <span>{t.name}</span>
              </span>
            ))}
            {inactiveTraits.length > 0 && (
              <>
                <span className="text-[10px] font-bold text-slate-500 shrink-0 ml-1">未発動:</span>
                {inactiveTraits.map((t, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-lg border border-slate-800 bg-slate-950/60 text-slate-400 opacity-75 shrink-0"
                  >
                    <span className="px-1 rounded text-[9px] bg-slate-800 text-slate-400">{t.count}/{t.minThreshold}</span>
                    <span>{t.name}</span>
                  </span>
                ))}
              </>
            )}
          </div>
        </div>

        {/* 4x7 Grid Container */}
        <TftHexBoard
          units={activePlayer.units_detail || []}
          onUnitMouseEnter={handleUnitMouseEnter}
          onUnitMouseLeave={handleUnitMouseLeave}
          theme="dark"
          isBloodthornsActive={isBloodthornsActive}
        />

        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-900">
          <span>Row 1: 最前衛 タンクライン</span>
          <span>Row 4: 最後衛 キャリーライン</span>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl overflow-hidden my-8">
        
        {/* Top Gradient Border */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 via-amber-400 to-purple-600" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Match Header Info */}
        <div className="border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-amber-400" />
            <div>
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2 font-mono">
                {match.match_id}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-3">
                <span>Set {match.tft_set_number} (Queue {match.queue_id || (isSingleRank ? 1100 : 1160)})</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" /> {formatDate(match.game_datetime)}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Player Roster Selector Bar */}
        <div className="mt-4 space-y-2">
          <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-cyan-300">
              <Users className="w-4 h-4" /> 参戦プレイヤー一覧 ({match.participants.length}名)
            </span>
            <span className="text-[10px] text-slate-500">プレイヤー選択で盤面配置を切替</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {match.participants.map((p, idx) => {
              const isSelected = idx === selectedPlayerIndex;
              const rankBadge =
                p.placement === 1 ? 'bg-amber-500 text-slate-950 font-black' :
                p.placement <= 4 ? 'bg-indigo-600 text-white font-bold' :
                'bg-slate-800 text-slate-400 font-medium';

              return (
                <button
                  key={p.puuid}
                  onClick={() => setSelectedPlayerIndex(idx)}
                  className={`p-2 rounded-xl border text-left transition flex flex-col justify-between ${
                    isSelected
                      ? 'border-cyan-500 bg-cyan-500/15 shadow-glow-cyan'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`px-1.5 py-0.2 rounded text-[9px] ${rankBadge}`}>
                      #{p.placement}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">Lv.{p.level}</span>
                  </div>
                  <div className="font-bold text-[11px] text-white truncate">{p.puuid}</div>
                  <div className="text-[9px] text-cyan-300 truncate mt-0.5">{p.display_name}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Player Detail Navigation Tabs */}
        <div className="flex items-center gap-2 mt-5 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('BOARD')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'BOARD'
                ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Grid className="w-4 h-4" /> #{activePlayer.placement}位 {activePlayer.puuid} の 4×7 盤面配置
          </button>
          <button
            onClick={() => setActiveTab('SYNERGIES')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'SYNERGIES'
                ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-400" /> 総シナジー ({totalTraitsCount} 種類)
          </button>
          <button
            onClick={() => setActiveTab('ROSTER')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'ROSTER'
                ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" /> 全構成駒・装備一覧
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="mt-5 space-y-5">

          {/* TAB 1: Board Grid View */}
          {activeTab === 'BOARD' && renderBoardGrid()}

          {/* TAB 2: Synergies View */}
          {activeTab === 'SYNERGIES' && (
            <div className="space-y-5 p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <h3 className="font-extrabold text-sm text-slate-100">
                    {activePlayer.puuid} のチームシナジー一覧
                  </h3>
                </div>
                <span className="text-xs font-bold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30">
                  発動中: {activeTraits.length} 種類 | 未発動: {inactiveTraits.length} 種類
                </span>
              </div>

              {/* Active Traits */}
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
                          {t.count >= 5 ? '超極強 (Tier 5+)' : t.count >= 3 ? '強力 (Tier 3+)' : '発動中'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Inactive Traits */}
              {inactiveTraits.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-slate-900">
                  <h4 className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <AlertCircle className="w-4 h-4 text-slate-500" /> ⚪ 未発動のシナジー ({inactiveTraits.length} 種類)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {inactiveTraits.map((t, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-xl border border-slate-800/80 bg-slate-950/60 opacity-80"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-xl bg-slate-800/90 text-slate-400 border border-slate-700 flex items-center justify-center text-xs font-black">
                            {t.count}/{t.minThreshold}
                          </span>
                          <div>
                            <div className="font-bold text-sm text-slate-300">{t.name}</div>
                            <span className="text-[10px] text-slate-500">必要駒数: 残り {t.minThreshold - t.count}体</span>
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

          {/* TAB 3: Full Roster View */}
          {activeTab === 'ROSTER' && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  {activePlayer.puuid} の配置全駒一覧 ({activePlayer.units_detail ? activePlayer.units_detail.length : 0} 駒)
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">💡 カーソル合わせで所持シナジー・装備詳細を表示</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[340px] overflow-y-auto pr-1">
                {activePlayer.units_detail && activePlayer.units_detail.map((unit: any) => (
                  <div
                    key={unit.id}
                    onMouseEnter={(e) => handleUnitMouseEnter(e, unit)}
                    onMouseLeave={handleUnitMouseLeave}
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
                        </div>
                        {unit.traits && unit.traits.length > 0 ? (
                          <div className="flex items-center gap-1 mt-0.5">
                            {unit.traits.map((tName: string, tIdx: number) => (
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
                        unit.items.map((item: any) => (
                          <ItemIcon key={item.id} name={item.name} icon={item.icon} size="sm" />
                        ))
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

      {/* Floating Hover Tooltip Card for Individual Unit Details */}
      {hoveredUnit && (
        <div
          style={{
            position: 'fixed',
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
          className="z-50 pointer-events-none min-w-[220px] bg-slate-950/95 border border-cyan-500/50 rounded-xl p-3 shadow-2xl backdrop-blur-md animate-fadeIn"
        >
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-2 mb-2">
            {hoveredUnit.icon && (
              <img
                src={hoveredUnit.icon}
                alt={hoveredUnit.name}
                className="w-9 h-9 rounded-lg border border-cyan-400 object-cover"
              />
            )}
            <div>
              <div className="font-extrabold text-sm text-cyan-300 flex items-center gap-1">
                {hoveredUnit.name}
                <span className="text-[10px] text-amber-300 font-bold bg-amber-500/20 px-1 rounded">
                  ★{hoveredUnit.star}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold">
                コスト {hoveredUnit.cost} | {hoveredUnit.role}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              ユニット固有シナジー (Traits)
            </div>
            {hoveredUnit.traits && hoveredUnit.traits.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {hoveredUnit.traits.map((t: string, idx: number) => (
                  <span
                    key={idx}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 font-bold"
                  >
                    {t}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-[10px] text-slate-500">シナジー情報なし</span>
            )}

            {hoveredUnit.items && hoveredUnit.items.length > 0 && (
              <div className="pt-2 border-t border-slate-900 mt-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  装備アイテム ({hoveredUnit.items.length})
                </div>
                <div className="flex items-center gap-1.5">
                  {hoveredUnit.items.map((item: any, iIdx: number) => (
                    <div key={item.id || iIdx} className="flex items-center gap-1 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                      <ItemIcon id={item.id} name={item.name} icon={item.icon} size="xs" />
                      <span className="text-[9px] text-slate-300 font-medium">{getItemName(item.name || item.id)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
