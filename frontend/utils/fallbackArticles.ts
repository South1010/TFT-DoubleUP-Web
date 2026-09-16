import { Article } from './articleTypes';

export const FALLBACK_ARTICLES: Article[] = [
  {
    id: 1,
    title: 'TFT Set 18 ダブルアップ最新環境 ティアリスト＆連携戦術徹底解説',
    category: '構成ガイド',
    cover_image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
    summary: 'Set 18のダブルアップモードで高勝率を誇るおすすめ構成と、ペアで勝利するためのルーン送信戦術・アーモリー選択のコツをまとめて解説！',
    content: `## Set 18 ダブルアップ環境の基本戦術

ダブルアップモードでは、個人の盤面強度だけでなく**「助太刀戦術」**と**「送別のルーン」**の活用が勝敗を大きく分けます。

### 1. 前衛タンク＆後衛超火力の役割分担
片方のプレイヤーがハイパーキャリー（スナイパー、ソーサラー）を育成し、もう片方のパートナーが超頑丈なタンク（ブラッドソーン、ブルーザー等）を構築すると、早期撃破による助太刀がスムーズに行えます。

### 2. ルーン送信のタイミング
- **小級ルーン**: 2ステージ序盤に1〜3コストの★2を即時完成させるために送信。
- **大級ルーン**: 4〜5コストの主要キャリーまたは★3完成のラストピースとして送信。

下記の配置図や動画を参考に、ペアでコミュニケーションを取りながらプレイしてみましょう！

https://www.youtube.com/watch?v=dQw4w9WgXcQ`,
    board_data: {
      display_name: '4 アダプター 4 ソーサラー',
      main_carry: { id: 'TFT18_Ahri', name: 'アーリ', cost: 4, icon: '' },
      units: [
        {
          id: 'TFT18_Ahri',
          name: 'アーリ',
          cost: 4,
          icon: '',
          role: 'carry',
          row: 3,
          col: 3,
          star: 2,
          items: [
            { id: 'TFT_Item_BlueBuff', name: 'ブルーバフ', icon: '' },
            { id: 'TFT_Item_JeweledGauntlet', name: 'ジュエルガントレット', icon: '' }
          ]
        },
        {
          id: 'TFT18_Neeko',
          name: 'ニーコ',
          cost: 3,
          icon: '',
          role: 'tank',
          row: 0,
          col: 3,
          star: 2,
          items: [
            { id: 'TFT_Item_WarmogsArmor', name: 'ワーモグアーマー', icon: '' }
          ]
        }
      ]
    },
    created_at: Date.now() - 86400000,
    updated_at: Date.now() - 86400000,
    is_published: 1
  },
  {
    id: 2,
    title: '今セット遊んでみた！おすすめネタ＆ロマン★3構成レポート',
    category: 'プレイ日記',
    cover_image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80',
    summary: '今セットで実際にプレイして面白かった5コスト★3狙いの立ち回りや、ダブルアップならではの爆発力あるペアコンボのプレイレポートです。',
    content: `## 5コスト★3をダブルアップで狙うロマン戦術

ダブルアップでは大級ルーンの存在により、ソロランクよりも遙かに5コスト★3が完成しやすくなっています！

### 意識すべきポイント
- 8レベルで利子を維持しながら9レベルへラッシュ。
- パートナー側は自分のショップに出た対象の5コストチャンピオンを購入してベンチにキープ。
- ルーンが貯まり次第送信して合体！

非常に爽快感がある構成なのでぜひフレンドと試してみてください。`,
    board_data: {},
    created_at: Date.now() - 172800000,
    updated_at: Date.now() - 172800000,
    is_published: 1
  }
];
