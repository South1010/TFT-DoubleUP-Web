'use client';

import React from 'react';
import { getChampion, getChampionIcon, getItem, getItemIcon } from '../utils/setMaster';
import { ArticleBoardData } from '../utils/articleTypes';
import TftHexBoard from './TftHexBoard';

interface ArticleRichContentProps {
  content: string;
  images?: { [key: string]: string };
  boardUnits?: any[];
  boardDisplayName?: string;
  boards?: { [key: string]: ArticleBoardData };
  renderCustomBoard?: (boardData?: ArticleBoardData, boardKey?: string) => React.ReactNode;
  className?: string;
}

// Cost styling helper for champion badge
const getChampCostStyle = (cost: number | string) => {
  const c = Number(cost);
  switch (c) {
    case 5:
      return {
        badgeBg: 'bg-amber-950/80 border-amber-500/50 hover:border-amber-400',
        text: 'text-amber-300',
        border: 'border-amber-400',
        costBg: 'bg-amber-500/30 text-amber-200 border-amber-400/50',
      };
    case 4:
      return {
        badgeBg: 'bg-purple-950/80 border-purple-500/50 hover:border-purple-400',
        text: 'text-purple-300',
        border: 'border-purple-400',
        costBg: 'bg-purple-500/30 text-purple-200 border-purple-400/50',
      };
    case 3:
      return {
        badgeBg: 'bg-sky-950/80 border-sky-500/50 hover:border-sky-400',
        text: 'text-sky-300',
        border: 'border-sky-400',
        costBg: 'bg-sky-500/30 text-sky-200 border-sky-400/50',
      };
    case 2:
      return {
        badgeBg: 'bg-emerald-950/80 border-emerald-500/50 hover:border-emerald-400',
        text: 'text-emerald-300',
        border: 'border-emerald-400',
        costBg: 'bg-emerald-500/30 text-emerald-200 border-emerald-400/50',
      };
    default:
      return {
        badgeBg: 'bg-slate-900/80 border-slate-600/60 hover:border-slate-400',
        text: 'text-slate-200',
        border: 'border-slate-400',
        costBg: 'bg-slate-700/50 text-slate-300 border-slate-500/40',
      };
  }
};

// Inline Champion Badge
export const InlineChampionBadge = ({ nameOrId }: { nameOrId: string }) => {
  const champ = getChampion(nameOrId);
  const icon = champ.icon || getChampionIcon(nameOrId);
  const costStyle = getChampCostStyle(champ.cost);

  return (
    <span
      className={`inline-flex items-center gap-1.5 align-middle mx-1 px-1.5 py-0.5 rounded-lg border shadow-sm backdrop-blur-sm transition-all duration-200 hover:scale-105 select-none ${costStyle.badgeBg}`}
      title={`${champ.name} (コスト: ${champ.cost})`}
    >
      <span className="relative w-5 h-5 flex-shrink-0 rounded overflow-hidden">
        {icon ? (
          <img
            src={icon}
            alt={champ.name}
            className={`w-full h-full object-cover rounded border ${costStyle.border}`}
          />
        ) : (
          <span className="w-full h-full bg-slate-700 rounded flex items-center justify-center text-[10px]">
            👤
          </span>
        )}
      </span>
      <span className={`text-xs font-bold leading-none ${costStyle.text}`}>
        {champ.name}
      </span>
      <span className={`text-[10px] font-black leading-none px-1 py-0.5 rounded border ${costStyle.costBg}`}>
        {champ.cost}
      </span>
    </span>
  );
};

// Inline Item Badge
export const InlineItemBadge = ({ nameOrId }: { nameOrId: string }) => {
  const item = getItem(nameOrId);
  const icon = item.icon || getItemIcon(nameOrId);

  return (
    <span
      className="inline-flex items-center gap-1.5 align-middle mx-1 px-1.5 py-0.5 rounded-lg bg-amber-950/70 border border-amber-500/40 hover:border-amber-400 shadow-sm backdrop-blur-sm transition-all duration-200 hover:scale-105 select-none"
      title={item.name}
    >
      <span className="relative w-5 h-5 flex-shrink-0 rounded overflow-hidden">
        {icon ? (
          <img
            src={icon}
            alt={item.name}
            className="w-full h-full object-cover rounded border border-amber-400/60"
          />
        ) : (
          <span className="w-full h-full bg-slate-700 rounded flex items-center justify-center text-[10px]">
            🗡️
          </span>
        )}
      </span>
      <span className="text-xs font-bold leading-none text-amber-200">
        {item.name}
      </span>
    </span>
  );
};

// Parse a single text line into React elements (supporting [c:name], [i:name])
export const parseInlineElements = (text: string): React.ReactNode[] => {
  if (!text) return [];

  // Match tags like [c:xxx], [champ:xxx], [champion:xxx], [i:xxx], [item:xxx]
  const tagRegex = /\[(c|champ|champion|チャンピオン|i|item|アイテム)[:：]\s*([^\]]+)\]/gi;
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(text)) !== null) {
    const matchIndex = match.index;
    if (matchIndex > lastIndex) {
      elements.push(text.slice(lastIndex, matchIndex));
    }

    const type = match[1].toLowerCase();
    const value = match[2].trim();
    const key = `inline-${matchIndex}-${value}`;

    if (type === 'c' || type === 'champ' || type === 'champion' || type === 'チャンピオン') {
      elements.push(<InlineChampionBadge key={key} nameOrId={value} />);
    } else {
      elements.push(<InlineItemBadge key={key} nameOrId={value} />);
    }

    lastIndex = tagRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex));
  }

  return elements;
};

export default function ArticleRichContent({
  content,
  images = {},
  boardUnits = [],
  boardDisplayName = '',
  boards = {},
  renderCustomBoard,
  className = ''
}: ArticleRichContentProps) {
  if (!content) return null;

  const lines = content.split('\n');

  return (
    <div className={`space-y-4 ${className}`}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // TFT Board Embed tag: [board], [board: 1], [board: 序盤], [盤面: 1], [tft-board: 2]
        const boardMatch = trimmed.match(/^\[(?:board|盤面|tft-board|board_data)\s*[:：]?\s*([^\]]+)?\]$/i);
        if (boardMatch) {
          const rawKey = boardMatch[1]?.trim();
          
          // Resolve target board
          let targetBoard: ArticleBoardData | undefined;
          let targetKey = rawKey || '1';

          if (boards && Object.keys(boards).length > 0) {
            if (rawKey) {
              // 1. Direct key match
              targetBoard = boards[rawKey] || boards[rawKey.toLowerCase()];
              // 2. Match by display_name
              if (!targetBoard) {
                targetBoard = Object.values(boards).find(b => b.display_name?.toLowerCase() === rawKey.toLowerCase());
              }
              // 3. Fallback to index if number
              if (!targetBoard && !isNaN(Number(rawKey))) {
                const idxNum = Number(rawKey) - 1;
                const boardValues = Object.values(boards);
                if (idxNum >= 0 && idxNum < boardValues.length) {
                  targetBoard = boardValues[idxNum];
                }
              }
            } else {
              // No key specified: pick first board or key "1"
              targetBoard = boards['1'] || Object.values(boards)[0];
            }
          }

          // Fallback to legacy boardUnits if targetBoard not resolved
          const effectiveUnits = targetBoard?.units || (targetBoard ? [] : boardUnits);
          const effectiveTitle = targetBoard?.display_name || boardDisplayName || (rawKey ? `構成盤面 ${rawKey}` : 'おすすめ構成盤面');

          if (renderCustomBoard && (targetBoard || (boardUnits && boardUnits.length > 0))) {
            return <div key={idx}>{renderCustomBoard(targetBoard, targetKey)}</div>;
          }

          if (effectiveUnits && effectiveUnits.length > 0) {
            return (
              <div key={idx} className="my-6 p-4 md:p-5 rounded-2xl bg-slate-900 border border-sky-400/40 shadow-xl overflow-hidden">
                <div className="flex items-center justify-between gap-2 mb-3 px-2 border-b border-sky-800/50 pb-2">
                  <span className="text-sm font-black text-sky-300 flex items-center gap-1.5">
                    <span>♞</span>
                    <span>{effectiveTitle}</span>
                  </span>
                  <span className="text-[11px] font-bold text-sky-300 bg-sky-950/80 border border-sky-500/40 px-2 py-0.5 rounded-full">
                    {effectiveUnits.length}体配置
                  </span>
                </div>
                <div className="overflow-x-auto pb-2 flex justify-center">
                  <TftHexBoard
                    key={`board-embed-${idx}-${targetKey}`}
                    units={effectiveUnits}
                    readOnly={true}
                    showItemIcons={true}
                    boardName={effectiveTitle}
                  />
                </div>
              </div>
            );
          }
          return null;
        }

        // YouTube Embed URL line
        const ytMatch = Array.from(trimmed.matchAll(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/g));
        if (ytMatch.length > 0) {
          const videoId = ytMatch[0][1];
          return (
            <div key={idx} className="my-6 rounded-2xl overflow-hidden border border-sky-200 shadow-md aspect-video bg-black">
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${videoId}`}
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          );
        }

        // Short Image Tag: [画像: 1] or [image: 1] or [img: 1]
        const shortImgMatch = trimmed.match(/^\[(?:画像|image|img)\s*[:：]?\s*([a-zA-Z0-9_-]+)\]$/i);
        if (shortImgMatch) {
          const imgKey = shortImgMatch[1];
          const imgSrc = images[imgKey];
          if (imgSrc) {
            return (
              <div key={idx} className="my-6 rounded-2xl overflow-hidden border border-sky-200 shadow-md">
                <img src={imgSrc} alt={`記事画像 ${imgKey}`} className="w-full object-cover max-h-[550px]" />
              </div>
            );
          }
        }

        // Markdown Image ![alt](url)
        const mdImgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
        if (mdImgMatch) {
          const altText = mdImgMatch[1] || '記事画像';
          const imgUrl = mdImgMatch[2];
          return (
            <div key={idx} className="my-6 rounded-2xl overflow-hidden border border-sky-200 shadow-md">
              <img src={imgUrl} alt={altText} className="w-full object-cover max-h-[550px]" />
            </div>
          );
        }

        // Standalone Image URL or Data URL line
        if (trimmed.startsWith('data:image/') || trimmed.match(/^https?:\/\/.*\.(jpeg|jpg|gif|png|webp|svg)(\?.*)?$/i)) {
          return (
            <div key={idx} className="my-6 rounded-2xl overflow-hidden border border-sky-200 shadow-md">
              <img src={trimmed} alt="Article Image" className="w-full object-cover max-h-[550px]" />
            </div>
          );
        }

        // Headings
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={idx} className="text-lg font-black text-slate-900 mt-6 mb-2">
              {parseInlineElements(trimmed.replace('### ', ''))}
            </h3>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={idx} className="text-xl md:text-2xl font-black text-slate-900 mt-8 mb-3 pb-2 border-b border-sky-200">
              {parseInlineElements(trimmed.replace('## ', ''))}
            </h2>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h1 key={idx} className="text-2xl md:text-3xl font-black text-slate-900 mt-10 mb-4">
              {parseInlineElements(trimmed.replace('# ', ''))}
            </h1>
          );
        }

        // Bullet point lists
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <li key={idx} className="ml-4 list-disc text-sm text-slate-700 leading-relaxed">
              {parseInlineElements(trimmed.replace(/^[-*]\s+/, ''))}
            </li>
          );
        }

        if (!trimmed) return <br key={idx} />;

        return (
          <p key={idx} className="text-sm md:text-base text-slate-700 leading-relaxed">
            {parseInlineElements(trimmed)}
          </p>
        );
      })}
    </div>
  );
}
