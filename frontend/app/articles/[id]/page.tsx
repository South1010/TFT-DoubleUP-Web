'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Tag, BookOpen, Grid, Sparkles, RefreshCw, Share2 } from 'lucide-react';
import TftHexBoard from '@/components/TftHexBoard';
import ItemIcon from '@/components/ItemIcon';
import { Article } from '@/utils/articleTypes';
import { FALLBACK_ARTICLES } from '@/utils/fallbackArticles';
import { calculateAllTeamTraits } from '@/utils/traitHelpers';
import { getChampion, getChampionIcon } from '@/utils/setMaster';

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const articleId = params?.id ? Number(params.id) : null;

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchArticle = async () => {
    if (!articleId) return;
    setLoading(true);
    let targetArticle: Article | null = null;
    try {
      const res = await fetch(`/api/articles/${articleId}?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
      });
      if (res.ok) {
        targetArticle = await res.json();
      }
    } catch (e) {
      console.error('Failed to fetch article from backend:', e);
    }

    if (!targetArticle && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('tft_custom_articles');
        if (saved) {
          const customList: Article[] = JSON.parse(saved);
          const found = customList.find(a => a.id === articleId);
          if (found) targetArticle = found;
        }
      } catch (e) {}
    }

    if (!targetArticle) {
      targetArticle = FALLBACK_ARTICLES.find(a => a.id === articleId) || FALLBACK_ARTICLES[0];
    }

    setArticle(targetArticle);
    setLoading(false);
  };

  useEffect(() => {
    fetchArticle();
  }, [articleId]);

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  // Board Data calculation
  const boardUnits = article?.board_data?.units || [];
  const { activeTraits } = calculateAllTeamTraits(boardUnits);

  const renderBoardComponent = () => {
    if (boardUnits.length === 0) {
      return null;
    }
    return (
      <section className="my-8 p-6 bg-gradient-to-b from-sky-100/90 via-sky-50/50 to-white rounded-3xl border border-sky-200 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-sky-200 pb-3">
          <div className="flex items-center gap-2 text-sm font-black text-sky-900">
            <Grid className="w-5 h-5 text-sky-600" />
            <span>解説TFTチーム構成盤面 ({article?.board_data?.display_name || 'おすすめ配置'})</span>
          </div>
          <span className="text-xs font-extrabold text-sky-700 bg-sky-100 px-2.5 py-1 rounded-full">
            配置ユニット: {boardUnits.length}体
          </span>
        </div>

        {/* Hex Board Component */}
        <div className="overflow-x-auto py-2">
          <TftHexBoard units={boardUnits} isInteractive={false} />
        </div>

        {/* Active Synergies Summary */}
        {activeTraits.length > 0 && (
          <div className="pt-2">
            <span className="text-xs font-extrabold text-slate-500 uppercase block mb-2">発動シナジー</span>
            <div className="flex flex-wrap items-center gap-2">
              {activeTraits.map((t, idx) => (
                <span
                  key={idx}
                  className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-xl border font-bold ${t.bgClass} ${t.borderClass} ${t.colorClass}`}
                >
                  <span className={`px-1.5 py-0.2 rounded text-[10px] ${t.badgeBg}`}>
                    {t.count}
                  </span>
                  <span>{t.name}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </section>
    );
  };

  // Helper to parse YouTube URLs, inline images, markdown, and inline board shortcodes
  const renderFormattedContent = (content: string) => {
    if (!content) return null;

    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/g;

    const lines = content.split('\n');
    return (
      <div className="space-y-4 text-slate-800 leading-relaxed font-medium">
        {lines.map((line, idx) => {
          const trimmed = line.trim();

          // Inline TFT Hex Board shortcode: [board] or [tft-board]
          if (trimmed === '[board]' || trimmed === '[tft-board]' || trimmed === '[board_data]') {
            return <div key={idx}>{renderBoardComponent()}</div>;
          }

          // YouTube Embed
          const ytMatch = [...trimmed.matchAll(youtubeRegex)];
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
            return <h3 key={idx} className="text-lg font-black text-slate-900 mt-6 mb-2">{trimmed.replace('### ', '')}</h3>;
          }
          if (trimmed.startsWith('## ')) {
            return <h2 key={idx} className="text-xl md:text-2xl font-black text-slate-900 mt-8 mb-3 pb-2 border-b border-sky-200">{trimmed.replace('## ', '')}</h2>;
          }
          if (trimmed.startsWith('# ')) {
            return <h1 key={idx} className="text-2xl md:text-3xl font-black text-slate-900 mt-10 mb-4">{trimmed.replace('# ', '')}</h1>;
          }

          // Bullet point lists
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            return (
              <li key={idx} className="ml-4 list-disc text-sm text-slate-700">
                {trimmed.replace(/^[-*]\s+/, '')}
              </li>
            );
          }

          if (!trimmed) return <br key={idx} />;

          return <p key={idx} className="text-sm md:text-base text-slate-700 leading-relaxed">{trimmed}</p>;
        })}
      </div>
    );
  };

  const hasInlineBoardTag = article?.content?.includes('[board]') || article?.content?.includes('[tft-board]');

  return (
    <main className="min-h-screen pb-20">
      
      {/* Top Header Navigation */}
      <div className="bg-white/80 border-b border-sky-200/80 backdrop-blur-md sticky top-16 md:top-20 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/articles"
            className="text-xs font-bold text-slate-600 hover:text-sky-600 flex items-center gap-1.5 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>記事一覧へ戻る</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: article?.title, url: window.location.href });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert('URLをコピーしました！');
                }
              }}
              className="p-2 rounded-xl border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 transition text-xs font-bold flex items-center gap-1"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>共有</span>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-32 text-center">
          <RefreshCw className="w-10 h-10 text-sky-500 animate-spin mx-auto mb-4" />
          <p className="text-sm font-bold text-slate-600">記事を読み込んでいます...</p>
        </div>
      ) : article ? (
        <article className="max-w-4xl mx-auto px-4 mt-8 space-y-8">
          
          {/* Article Header */}
          <header className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-3 py-1 rounded-lg bg-sky-500 text-white text-xs font-black shadow-xs">
                {article.category}
              </span>
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{formatDate(article.created_at)}</span>
              </span>
            </div>

            <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 leading-tight">
              {article.title}
            </h1>

            {article.summary && (
              <p className="text-sm md:text-base text-slate-600 bg-sky-50/80 p-4 rounded-2xl border border-sky-200/80 font-medium leading-relaxed">
                {article.summary}
              </p>
            )}
          </header>

          {/* Cover Image */}
          {article.cover_image && (
            <div className="rounded-3xl overflow-hidden border border-sky-200 shadow-md max-h-[450px]">
              <img
                src={article.cover_image}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Fallback TFT Hex Board Section (only if not embedded inline with [board] tag) */}
          {!hasInlineBoardTag && boardUnits.length > 0 && renderBoardComponent()}

          {/* Article Main Body Content */}
          <section className="bg-white glass-panel p-6 md:p-10 rounded-3xl border border-sky-200/80 shadow-sm">
            {renderFormattedContent(article.content)}
          </section>

          {/* Footer Navigation */}
          <footer className="pt-6 border-t border-sky-200 flex items-center justify-between">
            <Link
              href="/articles"
              className="px-4 py-2 bg-sky-500 text-white rounded-xl text-xs font-bold shadow-md hover:bg-sky-600 transition flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>記事一覧に戻る</span>
            </Link>
          </footer>

        </article>
      ) : (
        <div className="py-20 text-center">
          <p className="text-sm font-bold text-slate-600">記事が見つかりませんでした。</p>
        </div>
      )}

    </main>
  );
}
