'use client';

import React from 'react';
import { Users, Send, Gift, ShieldAlert, Zap, Trophy, HelpCircle, ArrowRight } from 'lucide-react';

export default function GuidePage() {
  const sections = [
    {
      icon: Send,
      title: '① 送別のルーン (Rune of Allegiance)',
      color: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
      description: '自分の盤面のチャンピオン（所持アイテムを含む）をパートナーのベンチへ送信する専用アイテム。',
      tips: [
        '【小級ルーン】1〜3コストのチャンピオンを送信可能。序盤の★2完成をサポート。',
        '【大級ルーン】4〜5コストや★3狙いのチャンピオンを送信可能。キャリー完成の最大のキーポイント。',
        '重要アイテム（インフィニティ・エッジ等）を持たせて送信すると、パートナーのベンチで解除されずにそのまま装備されます。',
      ],
    },
    {
      icon: Gift,
      title: '② ギフトアーモリー (Gift Armory)',
      color: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
      description: 'ステージ 2-5, 3-5, 5-2, 6-2 等で出現する、パートナーへ贈るプレゼント選択アーモリー。',
      tips: [
        '自分が選んだ選択肢が、パートナーの盤面に直接届きます。',
        'パートナーの現在の主要キャリー（物理/魔法/タンク）を確認してから選ぶのが勝率アップのコツ。',
        '素材アイテムよりも「完成品アイテム」や「オーグメント」「ゴールド補助」を重視。',
      ],
    },
    {
      icon: Zap,
      title: '③ 助太刀戦術 (Reinforcement Mechanics)',
      color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
      description: '自分の戦闘が終了すると、生き残ったユニットがそのままパートナーの戦闘盤面へ助太刀に向かいます。',
      tips: [
        '早めに相手を壊滅させる高火力構成（スナイパー、ソーサラー）は、パートナーの援護に即座に向かえます。',
        '前衛が超強固なタンク構成と、後衛超火力のコンボはダブルアップで最も相性が良いペアです。',
        '助太刀ユニットのオーグメント効果は一部引き継がれます。',
      ],
    },
    {
      icon: Trophy,
      title: '④ 共有体力 & 逆転のラストチャンス',
      color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
      description: 'ダブルアップではペアの体力が共有されます。',
      tips: [
        '体力が 0 になると、「ラストチャンス状態 (体力1)」に設定されます。',
        'ラストチャンス状態の時、どちらか片方でも敗北するとペア全体が脱落します。',
        '連勝ボーナス/連敗ボーナスは個別に計算されるため、片方が連敗利子・もう片方が連勝維持の戦術も有効です。',
      ],
    },
  ];

  return (
    <main className="min-h-screen pb-20">
      
      {/* Header Banner */}
      <section className="py-12 border-b border-slate-800 bg-hextech-glow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white">
                ダブルアップ <span className="text-gradient-gold">専用ギミック & 攻略ガイド</span>
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                チームファイトタクティクス Double Up (Queue ID 1160) の独自ルール・勝率を最大化する連携戦術解説
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Guide Content Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.map((section, idx) => {
            const Icon = section.icon;
            return (
              <div
                key={idx}
                className="glass-panel glass-panel-hover p-6 rounded-2xl border border-slate-800 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2.5 rounded-xl border ${section.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-bold text-white">{section.title}</h2>
                  </div>

                  <p className="text-xs text-slate-300 mb-4 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    {section.description}
                  </p>

                  <div className="space-y-2">
                    <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">立ち回りポイント</span>
                    <ul className="space-y-2">
                      {section.tips.map((tip, tIdx) => (
                        <li key={tIdx} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
                          <ArrowRight className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </section>

    </main>
  );
}
