'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Tag, BookOpen, Grid, Sparkles, RefreshCw, Share2 } from 'lucide-react';
import TftHexBoard from '@/components/TftHexBoard';
import ItemIcon from '@/components/ItemIcon';
import { Article, ArticleBoardData } from '@/utils/articleTypes';
import { FALLBACK_ARTICLES } from '@/utils/fallbackArticles';
import ArticleRichContent from '@/components/ArticleRichContent';
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

    // Check if explicitly deleted
    if (typeof window !== 'undefined') {
      try {
        const delSaved = localStorage.getItem('tft_deleted_articles');
        if (delSaved) {
          const delList: number[] = JSON.parse(delSaved);
          if (articleId && delList.includes(articleId)) {
            targetArticle = null;
            setArticle(null);
            setLoading(false);
            return;
          }
        }
      } catch (e) {}
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
      targetArticle = FALLBACK_ARTICLES.find(a => a.id === articleId) || null;
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

  const renderBoardComponent = (boardData?: ArticleBoardData, boardKey?: string) => {
    const units = boardData?.units || article?.board_data?.units || [];
    if (units.length === 0) {
      return null;
    }
    const displayName = boardData?.display_name || article?.board_data?.display_name || (boardKey ? `構成盤面 ${boardKey}` : 'おすすめ構成盤面');
    const { activeTraits } = calculateAllTeamTraits(units);

    return (
      <section className="my-8 p-6 bg-gradient-to-b from-sky-100/90 via-sky-50/50 to-white rounded-3xl border border-sky-200 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-sky-200 pb-3">
          <div className="flex items-center gap-2 text-sm font-black text-sky-900">
            <Grid className="w-5 h-5 text-sky-600" />
            <span>解説TFTチーム構成盤面 ({displayName})</span>
          </div>
          <span className="text-xs font-extrabold text-sky-700 bg-sky-100 px-2.5 py-1 rounded-full">
            配置ユニット: {units.length}体
          </span>
        </div>

        {/* Hex Board Component */}
        <div className="overflow-x-auto py-2">
          <TftHexBoard units={units} isInteractive={false} />
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

          {/* Article Main Body Content (Boards are embedded inline where [board] tags are written) */}
          <section className="bg-white glass-panel p-6 md:p-10 rounded-3xl border border-sky-200/80 shadow-sm">
            <ArticleRichContent
              content={article.content}
              images={article.images || article.board_data?.images || {}}
              boards={article.boards || (article.board_data ? { "1": article.board_data } : {})}
              boardUnits={article.board_data?.units || []}
              boardDisplayName={article.board_data?.display_name || article.title}
              renderCustomBoard={renderBoardComponent}
            />
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
