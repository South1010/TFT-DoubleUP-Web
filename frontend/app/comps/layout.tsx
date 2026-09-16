import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '登録構成一覧 | DoubleUp.GG ⚔️ TFTダブルアップ',
  description: 'TFTダブルアップ（Queue 1160）で登録されているメタチーム構成一覧。OP / S / A / B ティア別の立ち回り、メインキャリー、推奨オーグメント、パートナー相性ガイド。',
  alternates: {
    canonical: '/comps',
  },
  openGraph: {
    title: '登録構成一覧 | DoubleUp.GG ⚔️ TFTダブルアップ',
    description: 'TFTダブルアップ専用のメタチーム構成一覧と詳細ガイド',
    url: 'https://doubleup-gg.com/comps',
  },
};

export default function CompsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
