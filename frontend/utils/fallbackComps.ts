import { CompStat } from './compTypes';

export const FALLBACK_COMPS: CompStat[] = [
  {
    comp_key: "1160_6_Elderwood_DA_18_Ezreal",
    display_name: "6 エルダーウッド エズリアル & ザヤ",
    tier: "OP",
    avg_placement: 1.45,
    top2_rate: 88.0,
    win_rate: 52.0,
    sample_size: 1850,
    traits_summary: "6 エルダーウッド, 2 ヴァンガード, 2 ラピッドファイア",
    main_carry: {
      id: "TFT13_Ezreal",
      name: "エズリアル",
      cost: 5,
      icon: "https://raw.communitydragon.org/latest/game/assets/characters/tft13_ezreal/skins/base/images/tft13_ezreal.png"
    },
    best_items: [
      { id: "TFT_Item_InfinityEdge", name: "インフィニティ エッジ", icon: "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hextech/tft_item_infinityedge.png" },
      { id: "TFT_Item_GuinsoosRageblade", name: "グインソー レイジブレード", icon: "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hextech/tft_item_guinsoosrageblade.png" },
      { id: "TFT_Item_LastWhisper", name: "ラスト ウィスパー", icon: "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hextech/tft_item_lastwhisper.png" }
    ],
    units_detail: [
      { id: "TFT13_Ezreal", name: "エズリアル", cost: 5, icon: "https://raw.communitydragon.org/latest/game/assets/characters/tft13_ezreal/skins/base/images/tft13_ezreal.png", role: "メインキャリー", row: 3, col: 6, star: 2, items: [] },
      { id: "TFT13_Gnar", name: "ナー", cost: 2, icon: "https://raw.communitydragon.org/latest/game/assets/characters/tft13_gnar/skins/base/images/tft13_gnar.png", role: "フロントライン", row: 0, col: 3, star: 2, items: [] }
    ],
    partner_comps: [
      {
        comp_key: "1160_5_Sprykin_DA_18_Veigar",
        display_name: "5 スプライキン ベイガー & ティーモ",
        tier: "S",
        traits_summary: "5 スプライキン, 4 ソーサラー",
        main_carry: {
          id: "TFT13_Veigar",
          name: "ベイガー",
          cost: 4,
          icon: "https://raw.communitydragon.org/latest/game/assets/characters/tft13_veigar/skins/base/images/tft13_veigar.png"
        }
      }
    ]
  },
  {
    comp_key: "1160_5_Sprykin_DA_18_Veigar",
    display_name: "5 スプライキン ベイガー & ティーモ★3",
    tier: "S",
    avg_placement: 1.82,
    top2_rate: 79.5,
    win_rate: 44.0,
    sample_size: 1420,
    traits_summary: "5 スプライキン, 4 ソーサラー, 2 センチネル",
    main_carry: {
      id: "TFT13_Veigar",
      name: "ベイガー",
      cost: 4,
      icon: "https://raw.communitydragon.org/latest/game/assets/characters/tft13_veigar/skins/base/images/tft13_veigar.png"
    },
    best_items: [
      { id: "TFT_Item_BlueBuff", name: "ブルーバフ", icon: "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hextech/tft_item_bluebuff.png" },
      { id: "TFT_Item_JeweledGauntlet", name: "ジュエル ガントレット", icon: "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hextech/tft_item_jeweledgauntlet.png" },
      { id: "TFT_Item_RabadonsDeathcap", name: "ラバドン デスキャップ", icon: "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hextech/tft_item_rabadonsdeathcap.png" }
    ],
    units_detail: [
      { id: "TFT13_Veigar", name: "ベイガー", cost: 4, icon: "https://raw.communitydragon.org/latest/game/assets/characters/tft13_veigar/skins/base/images/tft13_veigar.png", role: "メインキャリー", row: 3, col: 6, star: 3, items: [] }
    ],
    partner_comps: [
      {
        comp_key: "1160_6_Elderwood_DA_18_Ezreal",
        display_name: "6 エルダーウッド エズリアル & ザヤ",
        tier: "OP",
        traits_summary: "6 エルダーウッド, 2 ヴァンガード",
        main_carry: {
          id: "TFT13_Ezreal",
          name: "エズリアル",
          cost: 5,
          icon: "https://raw.communitydragon.org/latest/game/assets/characters/tft13_ezreal/skins/base/images/tft13_ezreal.png"
        }
      }
    ]
  },
  {
    comp_key: "1160_5_Coven_DA_18_LeBlanc",
    display_name: "5 コヴン ルブラン & モルガナ",
    tier: "S",
    avg_placement: 1.95,
    top2_rate: 76.0,
    win_rate: 41.5,
    sample_size: 1280,
    traits_summary: "5 コヴN, 3 Invoker, 2 バスティオン",
    main_carry: {
      id: "TFT13_LeBlanc",
      name: "ルブラン",
      cost: 5,
      icon: "https://raw.communitydragon.org/latest/game/assets/characters/tft13_leblanc/skins/base/images/tft13_leblanc.png"
    },
    best_items: [
      { id: "TFT_Item_Shojin", name: "ショウジンの矛", icon: "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hextech/tft_item_spearofshojin.png" }
    ],
    units_detail: [
      { id: "TFT13_LeBlanc", name: "ルブラン", cost: 5, icon: "https://raw.communitydragon.org/latest/game/assets/characters/tft13_leblanc/skins/base/images/tft13_leblanc.png", role: "メインキャリー", row: 3, col: 6, star: 2, items: [] }
    ]
  },
  {
    comp_key: "1160_5_Blossom_Ahri",
    display_name: "5 ブロッサム アーリ & アッシュ",
    tier: "A",
    avg_placement: 2.15,
    top2_rate: 68.0,
    win_rate: 35.0,
    sample_size: 980,
    traits_summary: "5 ブロッサム, 3 ソーサラー",
    main_carry: {
      id: "TFT13_Ahri",
      name: "アーリ",
      cost: 3,
      icon: "https://raw.communitydragon.org/latest/game/assets/characters/tft13_ahri/skins/base/images/tft13_ahri.png"
    },
    best_items: [
      { id: "TFT_Item_BlueBuff", name: "ブルーバフ", icon: "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hextech/tft_item_bluebuff.png" }
    ],
    units_detail: [
      { id: "TFT13_Ahri", name: "アーリ", cost: 3, icon: "https://raw.communitydragon.org/latest/game/assets/characters/tft13_ahri/skins/base/images/tft13_ahri.png", role: "メインキャリー", row: 3, col: 6, star: 3, items: [] }
    ]
  },
  {
    comp_key: "1160_5_Blackthorn_Azir",
    display_name: "5 ブラックソーン アジール & マルファイト",
    tier: "B",
    avg_placement: 2.45,
    top2_rate: 55.0,
    win_rate: 28.0,
    sample_size: 750,
    traits_summary: "5 ブラックソーン, 2 センチネル",
    main_carry: {
      id: "TFT13_Azir",
      name: "アジール",
      cost: 5,
      icon: "https://raw.communitydragon.org/latest/game/assets/characters/tft13_azir/skins/base/images/tft13_azir.png"
    },
    best_items: [
      { id: "TFT_Item_GuinsoosRageblade", name: "グインソー レイジブレード", icon: "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hextech/tft_item_guinsoosrageblade.png" }
    ],
    units_detail: [
      { id: "TFT13_Azir", name: "アジール", cost: 5, icon: "https://raw.communitydragon.org/latest/game/assets/characters/tft13_azir/skins/base/images/tft13_azir.png", role: "メインキャリー", row: 3, col: 6, star: 2, items: [] }
    ]
  },
  {
    comp_key: "1160_4_Academy_Lux",
    display_name: "4 アカデミー ラックス & ジェイス",
    tier: "C",
    avg_placement: 2.85,
    top2_rate: 42.0,
    win_rate: 20.0,
    sample_size: 520,
    traits_summary: "4 アカデミー, 2 ソーサラー",
    main_carry: {
      id: "TFT13_Lux",
      name: "ラックス",
      cost: 1,
      icon: "https://raw.communitydragon.org/latest/game/assets/characters/tft13_lux/skins/base/images/tft13_lux.png"
    },
    best_items: [
      { id: "TFT_Item_BlueBuff", name: "ブルーバフ", icon: "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hextech/tft_item_bluebuff.png" }
    ],
    units_detail: [
      { id: "TFT13_Lux", name: "ラックス", cost: 1, icon: "https://raw.communitydragon.org/latest/game/assets/characters/tft13_lux/skins/base/images/tft13_lux.png", role: "メインキャリー", row: 3, col: 6, star: 3, items: [] }
    ]
  }
];
