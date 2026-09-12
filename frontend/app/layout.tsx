import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import AmbientBubbleBackground from '@/components/AmbientBubbleBackground';

export const metadata: Metadata = {
  title: 'DoubleUp.GG ⚔️ TFT ダブルアップ特化 統計 & メタ分析',
  description: 'Teamfight Tactics (TFT) ダブルアップモード (Queue 1160) 専用のTop 100対戦データ解析・Meta Tierリスト・チャンピオン推奨アイテム・パートナーシナジー攻略サイト',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased selection:bg-cyan-500 selection:text-black relative">
        <AmbientBubbleBackground />
        <Header />
        <div className="relative z-10">
          {children}
        </div>
        <footer className="relative z-10 mt-20 py-8 border-t border-slate-800/80 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <p>DoubleUp.GG isn&apos;t endorsed by Riot Games and doesn&apos;t reflect the views or opinions of Riot Games.</p>
            <p className="text-slate-400 font-medium">TFT Double Up Queue: 1160 | CommunityDragon Data Sync Active</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
