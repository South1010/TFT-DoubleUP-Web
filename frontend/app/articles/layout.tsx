import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '攻略記事・ブログ | DoubleUp.GG ⚔️ TFTダブルアップ',
  description: 'TFTダブルアップの最新環境メタ考察、ペア連携立ち回りガイド、セット更新情報、プレイ日記・戦術解説ブログ記事一覧。',
  alternates: {
    canonical: '/articles',
  },
  openGraph: {
    title: '攻略記事・ブログ | DoubleUp.GG ⚔️ TFTダブルアップ',
    description: 'TFTダブルアップのメタ構成ガイド・戦術解説・プレイ日記記事一覧',
    url: 'https://doubleup-gg.com/articles',
  },
};

export default function ArticlesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
