'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { BookOpen, Calendar, Search, Grid, Sparkles, ChevronRight, Tag, RefreshCw } from 'lucide-react';
import { Article } from '@/utils/articleTypes';
import { FALLBACK_ARTICLES } from '@/utils/fallbackArticles';

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchArticles = async () => {
    setLoading(true);
    let remoteArticles: Article[] = [];
    try {
      const res = await fetch(`/api/articles?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
      });
      if (res.ok) {
        remoteArticles = await res.json();
      }
    } catch (e) {
      console.error('Failed to load articles from backend:', e);
    }

    let localArticles: Article[] = [];
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('tft_custom_articles') : null;
      if (saved) {
        localArticles = JSON.parse(saved);
      }
    } catch (e) {}

    const mergedMap = new Map<number, Article>();
    const baseList = (remoteArticles && remoteArticles.length > 0) ? remoteArticles : FALLBACK_ARTICLES;
    baseList.forEach(a => mergedMap.set(a.id, a));
    localArticles.forEach(a => mergedMap.set(a.id, a));

    const resultList = Array.from(mergedMap.values()).sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
    setArticles(resultList);
    setLoading(false);
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const categories = ['ALL', '構成ガイド', 'アプデ・ニュース', 'プレイ日記', 'サーバー・システム'];

  const filteredArticles = useMemo(() => {
    return articles.filter(art => {
      const matchesCat = selectedCategory === 'ALL' || art.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        q === '' ||
        art.title?.toLowerCase().includes(q) ||
        art.summary?.toLowerCase().includes(q) ||
        art.category?.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [articles, selectedCategory, searchQuery]);

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <main className="min-h-screen pb-20">
      
      {/* Hero Banner Section */}
      <section className="py-12 md:py-16 border-b border-sky-200/80 bg-gradient-to-b from-sky-100/90 via-sky-50/50 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 border border-sky-300 text-sky-800 text-xs font-black">
                <BookOpen className="w-3.5 h-3.5 text-sky-600" />
                <span>TFT 攻略ナレッジ & ブログ</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                ダブルアップ <span className="text-sky-600">攻略記事・開発ブログ</span>
              </h1>
              <p className="text-sm text-slate-600 font-medium max-w-2xl">
                TFTダブルアップの最新環境メタ分析、戦術立ち回りガイド、アップデート情報、プレイ日記を掲載しています。インタラクティブ盤面解説付き記事も配信中！
              </p>
            </div>

            <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-sky-200 shadow-sm shrink-0">
              <div className="p-3 rounded-xl bg-sky-50 text-sky-600">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">公開記事数</p>
                <p className="text-2xl font-black text-slate-900">
                  {articles.length} <span className="text-xs text-slate-500 font-bold">Articles</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        
        {/* Filter Controls Bar */}
        <div className="glass-panel p-4 md:p-6 rounded-2xl border border-sky-200/80 shadow-sm space-y-4 bg-white/90">
          
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="記事タイトル、キーワードで検索..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-sky-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 font-medium transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md transition"
                >
                  クリア
                </button>
              )}
            </div>

            {/* Category Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {categories.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                      isActive
                        ? 'bg-sky-500 text-white shadow-md font-black'
                        : 'bg-white text-slate-700 hover:bg-sky-50 border border-sky-200/80'
                    }`}
                  >
                    {cat === 'ALL' ? '全カテゴリ' : cat}
                  </button>
                );
              })}
            </div>

          </div>

        </div>

        {/* Article Grid */}
        {loading ? (
          <div className="py-20 text-center glass-panel rounded-2xl border border-sky-200">
            <RefreshCw className="w-8 h-8 text-sky-500 animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-600">記事データを読み込んでいます...</p>
          </div>
        ) : filteredArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((art) => (
              <Link
                key={art.id}
                href={`/articles/${art.id}`}
                className="group glass-panel rounded-2xl border border-sky-200/80 overflow-hidden shadow-sm hover:shadow-md hover:border-sky-400 transition-all flex flex-col bg-white cursor-pointer"
              >
                {/* Cover Image */}
                <div className="relative h-48 w-full bg-slate-100 overflow-hidden shrink-0">
                  {art.cover_image ? (
                    <img
                      src={art.cover_image}
                      alt={art.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center p-6 text-white text-center">
                      <BookOpen className="w-12 h-12 opacity-80" />
                    </div>
                  )}

                  {/* Category Tag */}
                  <span className="absolute top-3 left-3 px-3 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-black shadow-md">
                    {art.category}
                  </span>

                  {/* TFT Board Indicator */}
                  {art.board_data && Object.keys(art.board_data).length > 0 && (
                    <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 text-[10px] font-black shadow-md flex items-center gap-1 border border-amber-300">
                      <Grid className="w-3 h-3" /> 構成盤面あり
                    </span>
                  )}
                </div>

                {/* Content Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatDate(art.created_at)}</span>
                    </div>

                    <h2 className="font-extrabold text-lg text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-2 leading-snug">
                      {art.title}
                    </h2>

                    <p className="text-xs text-slate-600 font-medium line-clamp-3 leading-relaxed">
                      {art.summary}
                    </p>
                  </div>

                  {/* Footer Action */}
                  <div className="pt-3 border-t border-sky-100 flex items-center justify-between text-xs font-bold text-sky-600 group-hover:text-sky-800">
                    <span>記事を読む</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center glass-panel rounded-2xl border border-sky-200 bg-white">
            <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-3 opacity-60" />
            <h3 className="text-base font-bold text-slate-800">一致する記事が見つかりませんでした</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              検索キーワードまたはカテゴリ条件を変更してお試しください。
            </p>
            <button
              onClick={() => {
                setSelectedCategory('ALL');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-sky-500 text-white rounded-xl text-xs font-bold shadow-md hover:bg-sky-600 transition"
            >
              条件をリセット
            </button>
          </div>
        )}

      </section>

    </main>
  );
}
