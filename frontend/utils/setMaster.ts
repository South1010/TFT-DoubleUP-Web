import set18Data from '../tft_set_18.json';
import setMasterData from '../tft_set_master.json';
import itemIconMapData from './item_icon_map.json';
import champIconMapData from './champ_icon_map.json';
import itemNameJpMapData from './item_name_jp_map.json';

const itemIconMap = itemIconMapData as Record<string, string>;
const champIconMap = champIconMapData as Record<string, string>;
const itemNameJpMap = itemNameJpMapData as Record<string, string>;

export interface MasterChampion {
  id: string;
  name: string;
  cost: number;
  traits: string[];
  icon: string;
  skill?: {
    name: string;
    type: string;
    description: string;
  };
}

export interface MasterItem {
  id: string;
  name: string;
  icon: string;
  desc?: string;
}

export interface MasterAugment {
  id: string;
  name: string;
  icon: string;
  tier?: string;
  desc?: string;
}

export interface MasterTrait {
  id: string;
  name: string;
  icon: string;
  description?: string;
  champions?: string[];
}

// Japanese/Key to English TFT Champion Name Mapping
const CHAMP_ENGLISH_NAMES: { [jpOrKey: string]: string } = {
  "ラックス": "Lux", "lux": "Lux",
  "タリック": "Taric", "taric": "Taric",
  "ザイラ": "Zyra", "zyra": "Zyra",
  "ドレイヴン": "Draven", "draven": "Draven",
  "マルファイト": "Malphite", "malphite": "Malphite",
  "マオカイ": "Maokai", "maokai": "Maokai",
  "アルーン": "Alune", "alune": "Alune",
  "アイバーン": "Ivern", "ivern": "Ivern",
  "コグ＝マウ": "KogMaw", "コグマウ": "KogMaw", "kogmaw": "KogMaw",
  "アカリ": "Akali", "akali": "Akali",
  "ヴァルス": "Varus", "varus": "Varus",
  "シェン": "Shen", "shen": "Shen",
  "アムム": "Amumu", "amumu": "Amumu",
  "ケネン": "Kennen", "kennen": "Kennen",
  "オーン": "Ornn", "ornn": "Ornn",
  "ザヤ": "Xayah", "xayah": "Xayah",
  "アリスター": "Alistar", "alistar": "Alistar",
  "ルブラン": "Leblanc", "leblanc": "Leblanc",
  "ヘカリム": "Hecarim", "hecarim": "Hecarim",
  "エズリアル": "Ezreal", "ezreal": "Ezreal",
  "ナー": "Gnar", "gnar": "Gnar", "gnarsmall": "Gnar",
  "コブコ": "Kobuko", "kobuko": "Kobuko",
  "ベイガー": "Veigar", "veigar": "Veigar",
  "ティーモ": "Teemo", "teemo": "Teemo",
  "ラムス": "Rammus", "rammus": "Rammus",
  "トリスターナ": "Tristana", "tristana": "Tristana",
  "レオナ": "Leona", "leona": "Leona",
  "ケイル": "Kayle", "kayle": "Kayle",
  "セジュアニ": "Sejuani", "sejuani": "Sejuani",
  "ケイトリン": "Caitlyn", "caitlyn": "Caitlyn",
  "ワーウィック": "Warwick", "warwick": "Warwick",
  "アジール": "Azir", "azir": "Azir",
  "カシオペア": "Cassiopeia", "cassiopeia": "Cassiopeia",
  "カ＝ジックス": "Khazix", "カジックス": "Khazix", "khazix": "Khazix",
  "アンベッサ": "Ambessa", "ambessa": "Ambessa",
  "イラオイ": "Illaoi", "illaoi": "Illaoi",
  "エコー": "Ekko", "ekko": "Ekko",
  "エリス": "Elise", "elise": "Elise",
  "ガレン": "Garen", "garen": "Garen",
  "コーキ": "Corki", "corki": "Corki",
  "セヴィカ": "Sevika", "sevika": "Sevika",
  "マルザハール": "Malzahar", "malzahar": "Malzahar",
  "モルデカイザー": "Mordekaiser", "mordekaiser": "Mordekaiser",
  "ランブル": "Rumble", "rumble": "Rumble",
  "ビクター": "Viktor", "viktor": "Viktor",
  "メル": "Mel", "mel": "Mel",
  "マスター・イー": "MasterYi", "マスターイー": "MasterYi", "masteryi": "MasterYi", "masteryi_ad": "MasterYi", "masteryi_ap": "MasterYi",
  "ラカン": "Rakan", "rakan": "Rakan",
  "リリア": "Lillia", "lillia": "Lillia",
  "ジンクス": "Jinx", "jinx": "Jinx",
  "ヴァイ": "Vi", "vi": "Vi",
  "シルコ": "Silco", "silco": "Silco",
  "ハイマーディンガー": "Heimerdinger", "heimerdinger": "Heimerdinger",
  "ジェイス": "Jayce", "jayce": "Jayce",
  "スウェイン": "Swain", "swain": "Swain",
  "ブラッドミア": "Vladimir", "vladimir": "Vladimir",
  "セト": "Sett", "sett": "Sett",
  "トランドル": "Trundle", "trundle": "Trundle",
  "サイオン": "Sion", "sion": "Sion",
  "ジグス": "Ziggs", "ziggs": "Ziggs",
  "レル": "Rell", "rell": "Rell",
  "ゼリ": "Zeri", "zeri": "Zeri",
  "カルマ": "Karma", "karma": "Karma",
  "ヨリック": "Yorick", "yorick": "Yorick",
  "カミール": "Camille", "camille": "Camille",
  "シンダーリング": "Cinderling", "cinderling": "Cinderling",
  "レク＝サイ": "RekSai", "レクサイ": "RekSai", "reksai": "RekSai",
  "小石": "Sentry", "sentry": "Sentry", "pebbles": "Sentry",
  "グロンプ": "Gromp", "gromp": "Gromp",
  "スカトルクラブ": "ScuttleCrab", "スカトル": "ScuttleCrab", "scuttlecrab": "ScuttleCrab", "scuttle": "ScuttleCrab",
  "マークウルフ": "Murkwolf", "murkwolf": "Murkwolf",
  "ユナラ": "Yunara", "yunara": "Yunara",
  "ダイアナ": "Diana", "diana": "Diana",
  "フィドルスティックス": "Fiddlesticks", "フィドルステックス": "Fiddlesticks", "fiddlesticks": "Fiddlesticks",
  "ママ鳥": "MamaBird", "mamabird": "MamaBird",
  "レンガー": "Rengar", "rengar": "Rengar",
  "アーリ": "Ahri", "ahri": "Ahri",
  "アフェリオス": "Aphelios", "aphelios": "Aphelios",
  "シヴィア": "Sivir", "sivir": "Sivir",
  "ソラカ": "Soraka", "soraka": "Soraka",
  "ニダリー": "Nidalee", "nidalee": "Nidalee",
  "ブランブルバック": "Brambleback", "brambleback": "Brambleback",
  "モルガナ": "Morgana", "morgana": "Morgana",
  "守護神": "Sentinel", "sentinel": "Sentinel",
  "アッシュ": "Ashe", "ashe": "Ashe",
  "エルダードラゴン": "ElderDragon", "elderdragon": "ElderDragon",
  "クルーグ": "Krug", "krug": "Krug"
};

/**
 * Returns an official TFT Set 18 champion icon URL from CommunityDragon
 */
export function getChampionIcon(idOrName?: string): string {
  if (!idOrName) return '';

  const raw = idOrName.trim();
  const cleaned = raw
    .replace(/^(TFT18_|DA_18_|DA_|TFT_)/i, '')
    .replace(/(_AD|_AP|Small|Base)$/i, '')
    .trim();

  const lowerRaw = raw.toLowerCase();
  const lowerCleaned = cleaned.toLowerCase();

  const found =
    champIconMap[raw] ||
    champIconMap[cleaned] ||
    champIconMap[lowerRaw] ||
    champIconMap[lowerCleaned];

  if (found) {
    return found;
  }

  const englishName = CHAMP_ENGLISH_NAMES[cleaned] || CHAMP_ENGLISH_NAMES[lowerCleaned] || cleaned;
  const lowerEng = englishName.toLowerCase();

  return `https://raw.communitydragon.org/latest/game/assets/characters/tft18_${lowerEng}/tft18_${lowerEng}_square.png`;
}

const ITEM_ICON_KEYS: { [key: string]: string } = {
  // Infinity Edge
  "TFT_Item_InfinityEdge": "tft_item_infinityedge.png",
  "インフィニティ・エッジ": "tft_item_infinityedge.png",
  "インフィニティエッジ": "tft_item_infinityedge.png",
  "インフィニティ エッジ": "tft_item_infinityedge.png",
  "infinityedge": "tft_item_infinityedge.png",

  // Guinsoo's Rageblade
  "TFT_Item_GuinsoosRageblade": "tft_item_guinsoosrageblade.png",
  "グインサー・レイジブレード": "tft_item_guinsoosrageblade.png",
  "グインサーレイジブレード": "tft_item_guinsoosrageblade.png",
  "グインサー レイジブレード": "tft_item_guinsoosrageblade.png",
  "guinsoosrageblade": "tft_item_guinsoosrageblade.png",

  // Last Whisper
  "TFT_Item_LastWhisper": "tft_item_lastwhisper.png",
  "ラスト リスパー": "tft_item_lastwhisper.png",
  "ラストリスパー": "tft_item_lastwhisper.png",
  "lastwhisper": "tft_item_lastwhisper.png",

  // Blue Buff
  "TFT_Item_BlueBuff": "tft_item_bluebuff.png",
  "ブルーバフ": "tft_item_bluebuff.png",
  "bluebuff": "tft_item_bluebuff.png",

  // Jeweled Gauntlet
  "TFT_Item_JeweledGauntlet": "tft_item_jeweledgauntlet.png",
  "ジュエル ガントレット": "tft_item_jeweledgauntlet.png",
  "ジュエルガントレット": "tft_item_jeweledgauntlet.png",
  "jeweledgauntlet": "tft_item_jeweledgauntlet.png",

  // Rabadon's Deathcap
  "TFT_Item_RabadonsDeathcap": "tft_item_rabadonsdeathcap.png",
  "ラバドン デスキャップ": "tft_item_rabadonsdeathcap.png",
  "ラバドンデスキャップ": "tft_item_rabadonsdeathcap.png",
  "rabadonsdeathcap": "tft_item_rabadonsdeathcap.png",

  // Warmog's Armor
  "TFT_Item_WarmogsArmor": "tft_item_warmogsarmor.png",
  "ワーモグ・アーマー": "tft_item_warmogsarmor.png",
  "ワーモグアーマー": "tft_item_warmogsarmor.png",
  "ワーモグ アーマー": "tft_item_warmogsarmor.png",
  "warmogsarmor": "tft_item_warmogsarmor.png",

  // Bramble Vest
  "TFT_Item_BrambleVest": "tft_item_bramblevest.png",
  "ブランブル ベスト": "tft_item_bramblevest.png",
  "ブランブルベスト": "tft_item_bramblevest.png",
  "bramblevest": "tft_item_bramblevest.png",

  // Dragon's Claw
  "TFT_Item_DragonsClaw": "tft_item_dragonsclaw.png",
  "ドラゴン クロウ": "tft_item_dragonsclaw.png",
  "ドラゴンクロウ": "tft_item_dragonsclaw.png",
  "dragonsclaw": "tft_item_dragonsclaw.png",

  // Gargoyle Stoneplate
  "TFT_Item_GargoyleStoneplate": "tft_item_gargoylestoneplate.png",
  "TFT_Item_CorruptedGargoyleStoneplate": "tft_item_gargoylestoneplate.png",
  "ガーゴイル ストーンプレート": "tft_item_gargoylestoneplate.png",
  "ガーゴイルストーンプレート": "tft_item_gargoylestoneplate.png",
  "gargoylestoneplate": "tft_item_gargoylestoneplate.png",

  // Sunfire Cape (CDragon internal asset is tft_item_redbuff.png)
  "TFT_Item_SunfireCape": "tft_item_redbuff.png",
  "SunfireCape": "tft_item_redbuff.png",
  "サンファイア・ケープ": "tft_item_redbuff.png",
  "サンファイアケープ": "tft_item_redbuff.png",
  "サンファイア ケープ": "tft_item_redbuff.png",
  "sunfirecape": "tft_item_redbuff.png",

  // Giant Slayer (CDragon internal asset is tft_item_madredsbloodrazor.png)
  "TFT_Item_GiantSlayer": "tft_item_madredsbloodrazor.png",
  "GiantSlayer": "tft_item_madredsbloodrazor.png",
  "ジャイアント スレイヤー": "tft_item_madredsbloodrazor.png",
  "ジャイアントスレイヤー": "tft_item_madredsbloodrazor.png",
  "giantslayer": "tft_item_madredsbloodrazor.png",

  // Red Buff
  "TFT_Item_RedBuff": "tft_item_rapidfirecannon.png",
  "レッドバフ": "tft_item_rapidfirecannon.png",
  "redbuff": "tft_item_rapidfirecannon.png",

  // Spear of Shojin
  "TFT_Item_SpearOfShojin": "tft_item_spearofshojin.png",
  "ショウジンの矛": "tft_item_spearofshojin.png",
  "ショウジン": "tft_item_spearofshojin.png",
  "spearofshojin": "tft_item_spearofshojin.png",

  // Void Staff (replaces Statikk Shiv)
  "TFT_Item_VoidStaff": "tft_item_voidstaff.png",
  "VoidStaff": "tft_item_voidstaff.png",
  "ヴォイド スタッフ": "tft_item_voidstaff.png",
  "ヴォイドスタッフ": "tft_item_voidstaff.png",
  "voidstaff": "tft_item_voidstaff.png",

  // Morellonomicon
  "TFT_Item_Morellonomicon": "tft_item_morellonomicon.png",
  "モレロノミコン": "tft_item_morellonomicon.png",
  "モレロ": "tft_item_morellonomicon.png",
  "morellonomicon": "tft_item_morellonomicon.png",

  // Crownguard
  "TFT_Item_Crownguard": "tft_item_crownguard.png",
  "クラウンガード": "tft_item_crownguard.png",
  "crownguard": "tft_item_crownguard.png",

  // Steadfast Heart
  "TFT_Item_SteadfastHeart": "tft_item_nightharvester.png",
  "TFT_Item_NightHarvester": "tft_item_nightharvester.png",
  "揺るがぬ心": "tft_item_nightharvester.png",
  "ステッドファスト ハート": "tft_item_nightharvester.png",
  "ステッドファストハート": "tft_item_nightharvester.png",
  "steadfastheart": "tft_item_nightharvester.png",

  // Titan's Resolve
  "TFT_Item_TitansResolve": "tft_item_titansresolve.png",
  "タイタン ハンガー": "tft_item_titansresolve.png",
  "タイタンハンガー": "tft_item_titansresolve.png",
  "タイタン": "tft_item_titansresolve.png",
  "titansresolve": "tft_item_titansresolve.png",

  // Hextech Gunblade
  "TFT_Item_HextechGunblade": "tft_item_hextechgunblade.png",
  "ヘックステック ガンブレード": "tft_item_hextechgunblade.png",
  "ヘックステックガンブレード": "tft_item_hextechgunblade.png",
  "ガンブレード": "tft_item_hextechgunblade.png",
  "hextechgunblade": "tft_item_hextechgunblade.png",

  // Archangel's Staff (アークエンジェル スタッフ)
  "TFT_Item_ArchangelsStaff": "tft_item_archangelsstaff.png",
  "アークエンジェル スタッフ": "tft_item_archangelsstaff.png",
  "アークエンジェルスタッフ": "tft_item_archangelsstaff.png",
  "アークエンジェル": "tft_item_archangelsstaff.png",
  "大天使のスタッフ": "tft_item_archangelsstaff.png",
  "大天使": "tft_item_archangelsstaff.png",
  "archangelsstaff": "tft_item_archangelsstaff.png",

  // Edge of Night / Guardian Angel
  "TFT_Item_EdgeOfNight": "tft_item_guardianangel.png",
  "TFT_Item_GuardianAngel": "tft_item_guardianangel.png",
  "ナイト エッジ": "tft_item_guardianangel.png",
  "ナイトエッジ": "tft_item_guardianangel.png",
  "edgeofnight": "tft_item_guardianangel.png",

  // Hand of Justice / Unstable Concoction
  "TFT_Item_HandOfJustice": "tft_item_unstableconcoction.png",
  "TFT_Item_UnstableConcoction": "tft_item_unstableconcoction.png",
  "ハンド オブ ジャスティス": "tft_item_unstableconcoction.png",
  "ハンドオブジャスティス": "tft_item_unstableconcoction.png",
  "handofjustice": "tft_item_unstableconcoction.png",

  // Spirit Visage (replaces Redemption, CDragon asset is tft_item_spiritvisagerr.png)
  "TFT_Item_SpiritVisage": "tft_item_spiritvisagerr.png",
  "SpiritVisage": "tft_item_spiritvisagerr.png",
  "スピリット ビサージュ": "tft_item_spiritvisagerr.png",
  "スピリットビサージュ": "tft_item_spiritvisagerr.png",
  "spiritvisage": "tft_item_spiritvisagerr.png",

  // Quicksilver
  "TFT_Item_Quicksilver": "tft_item_quicksilver.png",
  "クイックシルバー": "tft_item_quicksilver.png",
  "quicksilver": "tft_item_quicksilver.png",

  // Runaan's Hurricane / Kraken's Wrath (クラーケンの怒り)
  "TFT_Item_RunaansHurricane": "tft_item_krakenslayer.png",
  "TFT_Item_KrakenSlayer": "tft_item_krakenslayer.png",
  "クラーケンの怒り": "tft_item_krakenslayer.png",
  "クラーケン": "tft_item_krakenslayer.png",
  "krakenslayer": "tft_item_krakenslayer.png",
  "ルナーン ハリケーン": "tft_item_krakenslayer.png",
  "ルナーンハリケーン": "tft_item_krakenslayer.png",
  "runaanshurricane": "tft_item_krakenslayer.png",

  // Thief's Gloves
  "TFT_Item_ThiefsGloves": "tft_item_thiefsgloves.png",
  "盗賊のグローブ": "tft_item_thiefsgloves.png",
  "盗賊": "tft_item_thiefsgloves.png",
  "thiefsgloves": "tft_item_thiefsgloves.png",

  // Sterak's Gage
  "TFT_Item_SteraksGage": "tft_item_steraksgage.png",
  "ステラックの手篭手": "tft_item_steraksgage.png",
  "ステラックの篭手": "tft_item_steraksgage.png",
  "ステラック": "tft_item_steraksgage.png",
  "steraksgage": "tft_item_steraksgage.png",

  // Ionic Spark
  "TFT_Item_IonicSpark": "tft_item_ionicspark.png",
  "イオニック スパーク": "tft_item_ionicspark.png",
  "イオニックスパーク": "tft_item_ionicspark.png",
  "ionicspark": "tft_item_ionicspark.png",

  // Adaptive Helm
  "TFT_Item_AdaptiveHelm": "tft_item_adaptivehelm.png",
  "アダプティブ ヘルム": "tft_item_adaptivehelm.png",
  "アダプティブヘルム": "tft_item_adaptivehelm.png",
  "adaptivehelm": "tft_item_adaptivehelm.png",

  "TFT_Item_Bloodthirster": "tft_item_bloodthirster.png",
  "ブラッドサースター": "tft_item_bloodthirster.png",
  "bloodthirster": "tft_item_bloodthirster.png",

  // Protector's Vow
  "TFT_Item_ProtectorsVow": "tft_item_frozenheart.png",
  "TFT_Item_FrozenHeart": "tft_item_frozenheart.png",
  "ProtectorsVow": "tft_item_frozenheart.png",
  "プロテクターの誓い": "tft_item_frozenheart.png",
  "プロテクター の 誓い": "tft_item_frozenheart.png",
  "protectorsvow": "tft_item_frozenheart.png",
  "frozenheart": "tft_item_frozenheart.png",

  // Striker's Flail
  "TFT_Item_StrikerFlail": "tft_item_powergauntlet.png",
  "TFT_Item_PowerGauntlet": "tft_item_powergauntlet.png",
  "StrikerFlail": "tft_item_powergauntlet.png",
  "ストライカーフレイル": "tft_item_powergauntlet.png",
  "ストライカー フレイル": "tft_item_powergauntlet.png",
  "strikerflail": "tft_item_powergauntlet.png",
  "powergauntlet": "tft_item_powergauntlet.png",

  // Deathblade
  "TFT_Item_Deathblade": "tft_item_deathblade.png",
  "Deathblade": "tft_item_deathblade.png",
  "デスブレード": "tft_item_deathblade.png",
  "デス ブレード": "tft_item_deathblade.png",
  "deathblade": "tft_item_deathblade.png",

  // Evenshroud
  "TFT_Item_Evenshroud": "tft_item_spectralgauntlet.png",
  "Evenshroud": "tft_item_spectralgauntlet.png",
  "イーブンシュラウド": "tft_item_spectralgauntlet.png",
  "イーブン シュラウド": "tft_item_spectralgauntlet.png",
  "evenshroud": "tft_item_spectralgauntlet.png",

  // Flora Fatalis Emblem
  "TFT18_Item_FloraFatalisEmblem": "https://raw.communitydragon.org/latest/game/assets/ux/traiticons/trait_icon_18_florafatalis.png",
  "TFT_Item_FloraFatalisEmblem": "https://raw.communitydragon.org/latest/game/assets/ux/traiticons/trait_icon_18_florafatalis.png",
  "DA_18_EmblemFloraFatalis": "https://raw.communitydragon.org/latest/game/assets/ux/traiticons/trait_icon_18_florafatalis.png",
  "DA_18_EmblemFloraFatalisAugment": "https://raw.communitydragon.org/latest/game/assets/ux/traiticons/trait_icon_18_florafatalis.png",
  "FloraFatalisEmblem": "https://raw.communitydragon.org/latest/game/assets/ux/traiticons/trait_icon_18_florafatalis.png",
  "フローラ・ファターリスの紋章": "https://raw.communitydragon.org/latest/game/assets/ux/traiticons/trait_icon_18_florafatalis.png",
  "フローラファターリスの紋章": "https://raw.communitydragon.org/latest/game/assets/ux/traiticons/trait_icon_18_florafatalis.png",
  "florafatalisemblem": "https://raw.communitydragon.org/latest/game/assets/ux/traiticons/trait_icon_18_florafatalis.png",

  // Fae Emblem
  "TFT18_Item_FaeEmblem": "https://raw.communitydragon.org/latest/game/assets/ux/traiticons/trait_icon_18_fae.png",
  "TFT_Item_FaeEmblem": "https://raw.communitydragon.org/latest/game/assets/ux/traiticons/trait_icon_18_fae.png",
  "DA_18_EmblemFae": "https://raw.communitydragon.org/latest/game/assets/ux/traiticons/trait_icon_18_fae.png",
  "FaeEmblem": "https://raw.communitydragon.org/latest/game/assets/ux/traiticons/trait_icon_18_fae.png",
  "Fae Emblem": "https://raw.communitydragon.org/latest/game/assets/ux/traiticons/trait_icon_18_fae.png",
  "faeemblem": "https://raw.communitydragon.org/latest/game/assets/ux/traiticons/trait_icon_18_fae.png",
  "フェイの紋章": "https://raw.communitydragon.org/latest/game/assets/ux/traiticons/trait_icon_18_fae.png"
};

/**
 * Returns a valid CommunityDragon item icon URL
 */
export function getItemIcon(idOrName?: string): string {
  if (!idOrName) return '';

  const raw = idOrName.trim();
  const cleaned = raw
    .replace(/^TFT\d*_Item_/i, '')
    .replace(/^TFT_Item_/i, '')
    .replace(/^TFT18_Item_/i, '')
    .trim();
  const lower = raw.toLowerCase();
  const lowerCleaned = cleaned.toLowerCase();
  const noSpace = lower.replace(/[\s・\-_]/g, '');
  const noSpaceCleaned = lowerCleaned.replace(/[\s・\-_]/g, '');

  const mapped =
    ITEM_ICON_KEYS[raw] ||
    ITEM_ICON_KEYS[cleaned] ||
    ITEM_ICON_KEYS[lower] ||
    ITEM_ICON_KEYS[lowerCleaned] ||
    ITEM_ICON_KEYS[noSpace] ||
    ITEM_ICON_KEYS[noSpaceCleaned] ||
    itemIconMap[raw] ||
    itemIconMap[cleaned] ||
    itemIconMap[lower] ||
    itemIconMap[lowerCleaned] ||
    itemIconMap[noSpace] ||
    itemIconMap[noSpaceCleaned];

  if (mapped) {
    if (mapped.startsWith('http://') || mapped.startsWith('https://')) {
      return mapped;
    }
    return `https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hexcore/${mapped}`;
  }

  return `https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hexcore/tft_item_${lowerCleaned}.png`;
}

// Master Augment Icon Maps from setMasterData & reverse lookup
const augmentMasterIconByNameMap = new Map<string, string>();
const augmentMasterIconByIdMap = new Map<string, string>();

((setMasterData as any).items || []).forEach((item: any) => {
  if (item.name && item.icon) {
    augmentMasterIconByNameMap.set(item.name.trim().toLowerCase(), item.icon);
    if (item.id) {
      augmentMasterIconByIdMap.set(item.id.trim().toLowerCase(), item.icon);
    }
  }
});

const reverseItemNameJpMap = new Map<string, string>();
Object.entries(itemNameJpMapData as Record<string, string>).forEach(([engKey, jpName]) => {
  if (jpName && !reverseItemNameJpMap.has(jpName.trim().toLowerCase())) {
    reverseItemNameJpMap.set(jpName.trim().toLowerCase(), engKey.trim());
  }
});

/**
 * Returns an official TFT Augment icon URL from CommunityDragon
 */
export function getAugmentIcon(idOrName?: string, tier?: string): string {
  if (!idOrName) return 'https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/augments/hexcore/tft_augment_generic_gold.png';

  const raw = idOrName.trim();
  const lower = raw.toLowerCase();
  const cleaned = raw
    .replace(/^(TFT\d*_Augment_|TFT_Augment_|DA_\d*_Augment_|DA_Augment_|DA_|Augment_)/i, '')
    .trim();
  const lowerCleaned = cleaned.toLowerCase();

  // 1. Direct match in tft_set_master.json items icon map
  const fromMasterByName = augmentMasterIconByNameMap.get(lower) || augmentMasterIconByNameMap.get(lowerCleaned);
  if (fromMasterByName) return fromMasterByName;

  const fromMasterById = augmentMasterIconByIdMap.get(lower) || augmentMasterIconByIdMap.get(lowerCleaned);
  if (fromMasterById) return fromMasterById;

  // 2. Direct match in itemIconMap
  const fromItemIconMap = itemIconMap[raw] || itemIconMap[cleaned] || itemIconMap[lower] || itemIconMap[lowerCleaned];
  if (fromItemIconMap) return fromItemIconMap;

  // 3. Reverse lookup in itemNameJpMap -> itemIconMap or augmentMasterIconByIdMap
  const engKey = reverseItemNameJpMap.get(lower) || reverseItemNameJpMap.get(lowerCleaned);
  if (engKey) {
    const lowerEngKey = engKey.toLowerCase();
    const fromReverseIcon =
      augmentMasterIconByIdMap.get(lowerEngKey) ||
      augmentMasterIconByNameMap.get(lowerEngKey) ||
      itemIconMap[engKey] ||
      itemIconMap[lowerEngKey];
    if (fromReverseIcon) return fromReverseIcon;
  }

  // 4. Fallback based on tier
  const tierLower = (tier || '').toLowerCase();
  if (tierLower.includes('silver') || tierLower.includes('1') || tierLower.includes('i')) {
    return 'https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/augments/hexcore/tft_augment_generic_silver.png';
  }
  if (tierLower.includes('prismatic') || tierLower.includes('3') || tierLower.includes('iii')) {
    return 'https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/augments/hexcore/tft_augment_generic_prismatic.png';
  }

  return 'https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/augments/hexcore/tft_augment_generic_gold.png';
}

export type AugmentTier = 'silver' | 'gold' | 'prismatic';

export interface AugmentTierStyle {
  tier: AugmentTier;
  label: string;
  badgeBg: string;
  badgeText: string;
  cardBorder: string;
  cardBg: string;
  cardText: string;
  cardSelectedBorder: string;
  cardSelectedBg: string;
  cardSelectedText: string;
  glow: string;
}

export function getAugmentTier(idOrName?: string, tierInput?: string): AugmentTier {
  if (!idOrName && !tierInput) return 'gold';
  let t = (tierInput || '').toLowerCase();

  if (!t && idOrName) {
    const key = idOrName.toLowerCase();
    const found = augmentMap.get(key) || augmentByNameMap.get(key);
    if (found && found.tier) {
      t = found.tier.toLowerCase();
    }
  }

  if (
    t.includes('silver') ||
    t === '1' ||
    t === 'i' ||
    (idOrName && (idOrName.endsWith(' I') || idOrName.includes(' I ')))
  ) {
    return 'silver';
  }

  if (
    t.includes('prismatic') ||
    t.includes('rainbow') ||
    t === '3' ||
    t === 'iii' ||
    t.includes('虹') ||
    (idOrName && (idOrName.endsWith(' III') || idOrName.includes(' III ') || idOrName.includes('++')))
  ) {
    return 'prismatic';
  }

  return 'gold';
}

export function getAugmentTierStyle(idOrName?: string, tierInput?: string): AugmentTierStyle {
  const isEmblem = idOrName && (idOrName.includes('紋章') || idOrName.toLowerCase().includes('emblem'));

  if (isEmblem) {
    return {
      tier: 'prismatic',
      label: '紋章',
      badgeBg: 'bg-purple-600 text-purple-100 font-black border border-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.6)]',
      badgeText: 'text-purple-300',
      cardBorder: 'border-purple-500/80',
      cardBg: 'bg-gradient-to-r from-purple-950/90 via-slate-900 to-purple-950/90 hover:border-purple-400 hover:from-purple-900/80 hover:to-purple-900/80',
      cardText: 'text-purple-200 font-black drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]',
      cardSelectedBorder: 'border-purple-400 ring-2 ring-purple-400/90',
      cardSelectedBg: 'bg-gradient-to-r from-purple-900 via-purple-950 to-purple-900',
      cardSelectedText: 'text-purple-100 font-black drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]',
      glow: 'shadow-[0_0_14px_rgba(168,85,247,0.5)]'
    };
  }

  const tier = getAugmentTier(idOrName, tierInput);

  if (tier === 'silver') {
    return {
      tier: 'silver',
      label: 'SILVER',
      badgeBg: 'bg-slate-200 text-slate-900 border border-slate-100 font-extrabold shadow-[0_0_6px_rgba(255,255,255,0.4)]',
      badgeText: 'text-slate-300',
      cardBorder: 'border-slate-500/70',
      cardBg: 'bg-slate-900/90 hover:bg-slate-800 hover:border-slate-300',
      cardText: 'text-slate-200',
      cardSelectedBorder: 'border-slate-200 ring-2 ring-slate-300/80',
      cardSelectedBg: 'bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800',
      cardSelectedText: 'text-white font-extrabold',
      glow: 'shadow-[0_0_10px_rgba(203,213,225,0.3)]'
    };
  }

  if (tier === 'prismatic') {
    return {
      tier: 'prismatic',
      label: '虹',
      badgeBg: 'bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-400 text-white font-black shadow-[0_0_8px_rgba(236,72,153,0.7)]',
      badgeText: 'text-pink-300',
      cardBorder: 'border-pink-500/60',
      cardBg: 'bg-gradient-to-r from-purple-950/40 via-slate-900 to-pink-950/40 hover:border-pink-400 hover:from-purple-950/70 hover:to-pink-950/70',
      cardText: 'text-purple-100',
      cardSelectedBorder: 'border-pink-400 ring-2 ring-pink-400',
      cardSelectedBg: 'bg-gradient-to-r from-purple-900 via-pink-900 to-purple-900',
      cardSelectedText: 'text-white font-black',
      glow: 'shadow-[0_0_16px_rgba(236,72,153,0.45)]'
    };
  }

  // Default: Gold
  return {
    tier: 'gold',
    label: 'GOLD',
    badgeBg: 'bg-amber-400 text-slate-950 border border-amber-300 font-black shadow-[0_0_6px_rgba(245,158,11,0.5)]',
    badgeText: 'text-amber-300',
    cardBorder: 'border-amber-400',
    cardBg: 'bg-slate-900 hover:bg-slate-800 hover:border-amber-300',
    cardText: 'text-amber-300 font-black drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]',
    cardSelectedBorder: 'border-amber-400 ring-2 ring-amber-400',
    cardSelectedBg: 'bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950',
    cardSelectedText: 'text-amber-300 font-black drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]',
    glow: 'shadow-[0_0_12px_rgba(245,158,11,0.5)]'
  };
}

// PVE Dummy/Chest Keywords to filter out from playable champion lists
const PVE_KEYWORDS = [
  "ダミー", "宝箱", "金床", "Dummy", "Chest", "ArmoryKey"
];

// Pre-indexed fast lookup maps
const championMap = new Map<string, MasterChampion>();
const championByNameMap = new Map<string, MasterChampion>();

const itemMap = new Map<string, MasterItem>();
const itemByNameMap = new Map<string, MasterItem>();

const augmentMap = new Map<string, MasterAugment>();
const augmentByNameMap = new Map<string, MasterAugment>();

const traitMap = new Map<string, MasterTrait>();
const traitByNameMap = new Map<string, MasterTrait>();

// Set 18 Champion Cost Map (Authoritative)
export const CHAMP_COST_MAP: { [key: string]: number } = {
  // 5-Cost
  "アイバーン": 5, "ivern": 5,
  "アッシュ": 5, "ashe": 5,
  "アルーン": 5, "alune": 5,
  "エルダードラゴン": 5, "elderdragon": 5,
  "ケネン": 5, "kennen": 5,
  "タリック": 5, "taric": 5,
  "ドレイヴン": 5, "draven": 5,
  "ナー": 5, "gnar": 5, "gnarsmall": 5,
  "マオカイ": 5, "maokai": 5,
  "ラックス": 5, "lux": 5,

  // 4-Cost
  "アフェリオス": 4, "aphelios": 4,
  "アムム": 4, "amumu": 4,
  "アーリ": 4, "ahri": 4,
  "エズリアル": 4, "ezreal": 4,
  "ザイラ": 4, "zyra": 4,
  "シヴィア": 4, "sivir": 4,
  "セト": 4, "sett": 4,
  "ソラカ": 4, "soraka": 4,
  "ニダリー": 4, "nidalee": 4,
  "ブランブルバック": 4, "brambleback": 4,
  "マルファイト": 4, "malphite": 4,
  "モルガナ": 4, "morgana": 4,
  "リリア": 4, "lillia": 4,
  "守護神": 4, "sentinel": 4,

  // 3-Cost
  "アジール": 3, "azir": 3,
  "カシオペア": 3, "cassiopeia": 3,
  "カ＝ジックス": 3, "カジックス": 3, "khazix": 3,
  "クルーグ": 3, "krug": 3,
  "コグ＝マウ": 3, "コグマウ": 3, "kogmaw": 3,
  "ダイアナ": 3, "diana": 3,
  "トリスターナ": 3, "tristana": 3,
  "フィドルスティックス": 3, "fiddlesticks": 3, "fiddlesticks18": 3,
  "ヘカリム": 3, "hecarim": 3,
  "マスター・イー": 3, "マスターイー": 3, "masteryi": 3,
  "ママ鳥": 3, "mamabird": 3,
  "ラムス": 3, "rammus": 3,
  "レンガー": 3, "rengar": 3,
  "ヴァイ": 3, "vi": 3,

  // 2-Cost
  "アリスター": 2, "alistar": 2,
  "エリス": 2, "elise": 2,
  "グロンプ": 2, "gromp": 2,
  "ケイトリン": 2, "caitlyn": 2,
  "ケイル": 2, "kayle": 2,
  "シェン": 2, "shen": 2,
  "スカトルクラブ": 2, "scuttlecrab": 2, "scuttle": 2,
  "セジュアニ": 2, "sejuani": 2,
  "ティーモ": 2, "teemo": 2,
  "マークウルフ": 2, "murkwolf": 2,
  "ユナラ": 2, "yunara": 2,
  "ルブラン": 2, "leblanc": 2,
  "ワーウィック": 2, "warwick": 2,

  // 1-Cost
  "アカリ": 1, "akali": 1,
  "オーン": 1, "ornn": 1,
  "カミール": 1, "camille": 1,
  "カルマ": 1, "karma": 1,
  "コブコ": 1, "kobuko": 1,
  "ザヤ": 1, "xayah": 1,
  "シンダーリング": 1, "cinderling": 1,
  "ヨリック": 1, "yorick": 1,
  "ラカン": 1, "rakan": 1,
  "レオナ": 1, "leona": 1,
  "レク＝サイ": 1, "reksai": 1,
  "ヴァルス": 1, "varus": 1,
  "小石": 1, "sentry": 1
};

// 1. Initialize Set 18 Champions
(set18Data.champions || []).forEach((c: any) => {
  const engName = CHAMP_ENGLISH_NAMES[c.name] || c.name;
  const cost = c.cost || CHAMP_COST_MAP[c.name] || CHAMP_COST_MAP[engName.toLowerCase()] || 1;
  const iconUrl = getChampionIcon(c.name);
  const generatedId = `TFT18_${c.name}`;

  const champObj: MasterChampion = {
    id: generatedId,
    name: c.name,
    cost: cost,
    traits: c.traits || [],
    icon: iconUrl,
    skill: c.skill
  };

  const keysToRegister = [
    generatedId.toLowerCase(),
    c.name.toLowerCase(),
    engName.toLowerCase(),
    `tft18_${engName.toLowerCase()}`,
    `da_18_${engName.toLowerCase()}`,
    `da_${engName.toLowerCase()}18`,
    `da_18_${engName.toLowerCase()}_ad`,
    `da_18_${engName.toLowerCase()}_ap`
  ];

  keysToRegister.forEach(k => {
    championMap.set(k, champObj);
    championByNameMap.set(k, champObj);
  });
});

// 2. Initialize Set 18 Traits (Origins + Classes)
const allTraitsRaw = [
  ...((set18Data.traits as any)?.origins || []),
  ...((set18Data.traits as any)?.classes || [])
];

allTraitsRaw.forEach((t: any) => {
  const traitObj: MasterTrait = {
    id: `TFT18_Trait_${t.name}`,
    name: t.name,
    icon: `https://raw.communitydragon.org/latest/game/assets/ux/traiticons/trait_icon_18_${t.name.toLowerCase()}.png`,
    description: t.description || '',
    champions: t.champions || []
  };
  traitMap.set(traitObj.id.toLowerCase(), traitObj);
  traitByNameMap.set(t.name.toLowerCase(), traitObj);
});

// 3. Initialize Set 18 Augments
((set18Data as any).augments || []).forEach((a: any) => {
  const iconUrl = getAugmentIcon(a.name, a.tier);
  const augObj: MasterAugment = {
    id: `TFT18_Augment_${a.name}`,
    name: a.name,
    tier: a.tier || 'Gold',
    icon: iconUrl,
    desc: a.description || ''
  };
  augmentMap.set(augObj.id.toLowerCase(), augObj);
  augmentByNameMap.set(a.name.toLowerCase(), augObj);
});

// 4. Initialize Standard Equipment Items
const STANDARD_SET_ITEMS: MasterItem[] = [
  { id: "TFT_Item_InfinityEdge", name: "インフィニティ・エッジ", icon: getItemIcon("TFT_Item_InfinityEdge"), desc: "物理ダメージ+35%、クリティカル率+35%" },
  { id: "TFT_Item_GuinsoosRageblade", name: "グインサー・レイジブレード", icon: getItemIcon("TFT_Item_GuinsoosRageblade"), desc: "通常攻撃ごとに攻撃速度が5%増加する。" },
  { id: "TFT_Item_LastWhisper", name: "ラスト リスパー", icon: getItemIcon("TFT_Item_LastWhisper"), desc: "物理ダメージを与えると、3秒間30%の物理防御低下を付与する。" },
  { id: "TFT_Item_BlueBuff", name: "ブルーバフ", icon: getItemIcon("TFT_Item_BlueBuff"), desc: "最大マナが10減少する。キルまたはアシスト時にマナを10回復する。" },
  { id: "TFT_Item_JeweledGauntlet", name: "ジュエル ガントレット", icon: getItemIcon("TFT_Item_JeweledGauntlet"), desc: "スキルがクリティカル判定を持つようになり、魔力+35%、クリティカル率+35%獲得。" },
  { id: "TFT_Item_RabadonsDeathcap", name: "ラバドン デスキャップ", icon: getItemIcon("TFT_Item_RabadonsDeathcap"), desc: "魔力+50、さらに20%の追加ダメージ増加。" },
  { id: "TFT_Item_WarmogsArmor", name: "ワーモグ・アーマー", icon: getItemIcon("TFT_Item_WarmogsArmor"), desc: "体力+800、最大体力が12%増加。" },
  { id: "TFT_Item_BrambleVest", name: "ブランブル ベスト", icon: getItemIcon("TFT_Item_BrambleVest"), desc: "物理防御+55、受けるクリティカルダメージを軽減。" },
  { id: "TFT_Item_DragonsClaw", name: "ドラゴン クロウ", icon: getItemIcon("TFT_Item_DragonsClaw"), desc: "魔法防御+65、2秒ごとに最大体力の5%を回復。" },
  { id: "TFT_Item_GargoyleStoneplate", name: "ガーゴイル ストーンプレート", icon: getItemIcon("TFT_Item_GargoyleStoneplate"), desc: "自身を攻撃対象とする敵1体につき、防御力・魔法防御が+15増加。" },
  { id: "TFT_Item_SunfireCape", name: "サンファイア・ケープ", icon: getItemIcon("TFT_Item_SunfireCape"), desc: "2秒ごとに周囲の敵を燃焼させ、負傷と火傷ダメージを与える。" },
  { id: "TFT_Item_GiantSlayer", name: "ジャイアント スレイヤー", icon: getItemIcon("TFT_Item_GiantSlayer"), desc: "体力が1750以上の高体力の敵に対して与えるダメージが25%増加。" },
  { id: "TFT_Item_RedBuff", name: "レッドバフ", icon: getItemIcon("TFT_Item_RedBuff"), desc: "攻撃速度+40%、通常攻撃に燃焼効果を付与。" },
  { id: "TFT_Item_SpearOfShojin", name: "ショウジンの矛", icon: getItemIcon("TFT_Item_SpearOfShojin"), desc: "通常攻撃ごとに追加でマナを5回復する。" },
  { id: "TFT_Item_VoidStaff", name: "ヴォイドスタッフ", icon: getItemIcon("TFT_Item_VoidStaff"), desc: "魔力+30、攻撃またはスキルで敵の魔法防御を30%減少させる。" },
  { id: "TFT_Item_Morellonomicon", name: "モレロノミコン", icon: getItemIcon("TFT_Item_Morellonomicon"), desc: "魔法スキルダメージを与えた際、燃焼と負傷を付与する。" },
  { id: "TFT_Item_Crownguard", name: "クラウンガード", icon: getItemIcon("TFT_Item_Crownguard"), desc: "戦闘開始時、耐久値シールドを獲得し、シールド消滅時に魔力を獲得。" },
  { id: "TFT_Item_SteadfastHeart", name: "揺るがぬ心", icon: getItemIcon("TFT_Item_SteadfastHeart"), desc: "受けるダメージを8%軽減し、体力が50%以上で軽減率が15%に増加。" },
  { id: "TFT_Item_TitansResolve", name: "巨人の誓い", icon: getItemIcon("TFT_Item_TitansResolve"), desc: "ダメージを与えるか受けるとスタックを獲得し、攻撃力・魔力・防御力が増加。" },
  { id: "TFT_Item_HextechGunblade", name: "ヘックステック ガンブレード", icon: getItemIcon("TFT_Item_HextechGunblade"), desc: "与えたダメージの20%分、最も体力が低い味方を回復。" },
  { id: "TFT_Item_ArchangelsStaff", name: "アークエンジェル スタッフ", icon: getItemIcon("TFT_Item_ArchangelsStaff"), desc: "5秒ごとに魔力が+20増加する。" },
  { id: "TFT_Item_EdgeOfNight", name: "ナイト エッジ", icon: getItemIcon("TFT_Item_EdgeOfNight"), desc: "体力が60%以下になると一時的にステルス状態になり、デバフを解除。" },
  { id: "TFT_Item_HandOfJustice", name: "ハンド オブ ジャスティス", icon: getItemIcon("TFT_Item_HandOfJustice"), desc: "攻撃力・魔力+15%、オムニヴァンプ+15%。毎ラウンド効果が強化。" },
  { id: "TFT_Item_SpiritVisage", name: "スピリットビサージュ", icon: getItemIcon("TFT_Item_SpiritVisage"), desc: "魔法防御+25、1秒ごとに最大体力の2.5%を回復する。" },
  { id: "TFT_Item_Quicksilver", name: "クイックシルバー", icon: getItemIcon("TFT_Item_Quicksilver"), desc: "戦闘開始から14秒間、行動阻害効果を無効化し攻撃速度が増加。" },
  { id: "TFT_Item_RunaansHurricane", name: "クラーケンの怒り", icon: getItemIcon("TFT_Item_RunaansHurricane"), desc: "通常攻撃が近くの敵にも矢を放ち、物理ダメージを与える。" },
  { id: "TFT_Item_ThiefsGloves", name: "盗賊のグローブ", icon: getItemIcon("TFT_Item_ThiefsGloves"), desc: "毎ラウンド、ランダムな完成アイテムを2つ一時的に獲得する。" },
  { id: "TFT_Item_SteraksGage", name: "ステラックの篭手", icon: getItemIcon("TFT_Item_SteraksGage"), desc: "体力が60%以下になると最大体力が増加し、物理攻撃力が増加。" },
  { id: "TFT_Item_IonicSpark", name: "イオニック スパーク", icon: getItemIcon("TFT_Item_IonicSpark"), desc: "周囲の敵の魔法防御を低下させ、スキル使用時に魔法ダメージを与える。" },
  { id: "TFT_Item_AdaptiveHelm", name: "アダプティブ ヘルム", icon: getItemIcon("TFT_Item_AdaptiveHelm"), desc: "前衛配置時は防御力増加、後衛配置時は魔力とマナ獲得速度が増加。" },
  { id: "TFT_Item_Bloodthirster", name: "ブラッドサースター", icon: getItemIcon("TFT_Item_Bloodthirster"), desc: "オムニヴァンプ+20%。体力が40%以下になるとシールドを獲得。" },
  { id: "TFT_Item_ProtectorsVow", name: "プロテクターの誓い", icon: getItemIcon("TFT_Item_ProtectorsVow"), desc: "初期マナ+45、物理防御+20。体力が40%以下になると最大体力の25%のシールドを獲得。" },
  { id: "TFT_Item_StrikerFlail", name: "ストライカーフレイル", icon: getItemIcon("TFT_Item_StrikerFlail"), desc: "攻撃速度+15%、クリティカル率+20%。通常攻撃またはスキル発動で追加物理ダメージを与える。" },
  { id: "TFT_Item_Deathblade", name: "デスブレード", icon: getItemIcon("TFT_Item_Deathblade"), desc: "物理攻撃力+55%、5%の追加ダメージを与える。" },
  { id: "TFT_Item_Evenshroud", name: "イーブンシュラウド", icon: getItemIcon("TFT_Item_Evenshroud"), desc: "体力+150、魔法防御+20。周囲2マスの敵の物理防御を30%低下させる。" },
  { id: "TFT18_Item_FloraFatalisEmblem", name: "フローラ・ファターリスの紋章", icon: getItemIcon("TFT18_Item_FloraFatalisEmblem"), desc: "フローラ・ファターリス特性を獲得する。" },
  { id: "TFT18_Item_FaeEmblem", name: "フェイの紋章", icon: getItemIcon("TFT18_Item_FaeEmblem"), desc: "フェイ特性を獲得する。" },
  { id: "DA_18_EmblemFae", name: "フェイの紋章", icon: getItemIcon("DA_18_EmblemFae"), desc: "フェイ特性を獲得する。" }
];

STANDARD_SET_ITEMS.forEach(i => {
  itemMap.set(i.id.toLowerCase(), i);
  itemByNameMap.set(i.name.toLowerCase(), i);
});

// Load items from set18Data if present
((set18Data as any).items || []).forEach((i: any) => {
  const iconUrl = i.icon || getItemIcon(i.id || i.name);
  const itemObj: MasterItem = {
    id: i.id || `TFT18_Item_${i.name}`,
    name: i.name,
    icon: iconUrl,
    desc: i.description || i.desc || ''
  };
  itemMap.set(itemObj.id.toLowerCase(), itemObj);
  itemByNameMap.set(i.name.toLowerCase(), itemObj);
});

const CHAMP_JP_NAMES: { [key: string]: string } = {
  "lux": "ラックス", "taric": "タリック", "zyra": "ザイラ", "draven": "ドレイヴン",
  "malphite": "マルファイト", "maokai": "マオカイ", "alune": "アルーン", "ivern": "アイバーン",
  "kogmaw": "コグ＝マウ", "akali": "アカリ", "varus": "ヴァルス", "shen": "シェン",
  "amumu": "アムム", "kennen": "ケネン", "ornn": "オーン", "xayah": "ザヤ",
  "alistar": "アリスター", "leblanc": "ルブラン", "hecarim": "ヘカリム", "ezreal": "エズリアル",
  "gnar": "ナー", "gnarsmall": "ナー", "kobuko": "コブコ", "veigar": "ベイガー",
  "teemo": "ティーモ", "rammus": "ラムス", "tristana": "トリスターナ", "leona": "レオナ",
  "kayle": "ケイル", "sejuani": "セジュアニ", "caitlyn": "ケイトリン", "warwick": "ワーウィック",
  "azir": "アジール", "cassiopeia": "カシオペア", "khazix": "カ＝ジックス", "ambessa": "アンベッサ",
  "illaoi": "イラオイ", "ekko": "エコー", "elise": "エリス", "garen": "ガレン",
  "corki": "コーキ", "sevika": "セヴィカ", "malzahar": "マルザハール", "mordekaiser": "モルデカイザー",
  "rumble": "ランブル", "viktor": "ビクター", "mel": "メル", "masteryi": "マスター・イー",
  "rakan": "ラカン", "lillia": "リリア", "jinx": "ジンクス", "vi": "ヴァイ",
  "silco": "シルコ", "heimerdinger": "ハイマーディンガー", "jayce": "ジェイス", "swain": "スウェイン",
  "vladimir": "ブラッドミア", "sett": "セト", "trundle": "トランドル", "sion": "サイオン",
  "ziggs": "ジグス", "rell": "レル", "zeri": "ゼリ", "fiddlesticks": "フィドルスティックス",
  "soraka": "ソラカ", "morgana": "モルガナ", "ashe": "アッシュ", "yorick": "ヨリック",
  "reksai": "レク＝サイ", "yunara": "ユナラ", "karma": "カルマ", "camille": "カミール",
  "cinderling": "シンダーリング", "sentry": "小石", "gromp": "グロンプ",
  "scuttlecrab": "スカトルクラブ", "scuttle": "スカトルクラブ", "murkwolf": "マークウルフ",
  "diana": "ダイアナ", "mamabird": "ママ鳥", "rengar": "レンガー", "ahri": "アーリ",
  "aphelios": "アフェリオス", "sivir": "シヴィア", "nidalee": "ニダリー",
  "brambleback": "ブランブルバック", "sentinel": "守護神", "elderdragon": "エルダードラゴン",
  "krug": "クルーグ"
};

export function getChampionName(idOrName?: string): string {
  if (!idOrName) return '未知のユニット';
  const raw = idOrName.trim();
  const cleaned = raw
    .replace(/^TFT\d*_/i, '')
    .replace(/^DA_\d*_/i, '')
    .replace(/^DA_/i, '')
    .replace(/(_AD|_AP|Small|Base)$/i, '')
    .replace(/\d+$/g, '')
    .trim();
  const lowerCleaned = cleaned.toLowerCase();

  const master = getChampion(idOrName);
  if (master && master.name && !master.name.startsWith('TFT') && !master.name.startsWith('DA_') && !/\d+$/.test(master.name)) {
    return master.name;
  }

  if (CHAMP_JP_NAMES[lowerCleaned]) {
    return CHAMP_JP_NAMES[lowerCleaned];
  }

  const lowerRawCleaned = raw.toLowerCase().replace(/^tft\d*_|^da_\d*_|^da_|_ad|_ap|small|base|\d+$/gi, '').trim();
  if (CHAMP_JP_NAMES[lowerRawCleaned]) {
    return CHAMP_JP_NAMES[lowerRawCleaned];
  }

  return cleaned || raw;
}

/**
 * チャンピオンIDまたは名前からSet 18マスタデータを高速取得
 */
export function getChampion(idOrName?: string): MasterChampion {
  if (!idOrName) {
    return { id: '', name: '未知のユニット', cost: 1, traits: [], icon: '' };
  }
  const raw = idOrName.trim();
  const cleaned = raw
    .replace(/^TFT\d*_/i, '')
    .replace(/^DA_\d*_/i, '')
    .replace(/^DA_/i, '')
    .replace(/(_AD|_AP|Small|Base)$/i, '')
    .replace(/\d+$/g, '')
    .trim();
  const key = raw.toLowerCase();
  const cleanedKey = cleaned.toLowerCase();
  const found = championMap.get(key) || championByNameMap.get(key) || championMap.get(cleanedKey) || championByNameMap.get(cleanedKey);
  const fallbackIcon = getChampionIcon(idOrName);
  const jpName = CHAMP_JP_NAMES[cleanedKey] || (found ? found.name : cleaned);

  const cost = (found && found.cost) || CHAMP_COST_MAP[cleanedKey] || CHAMP_COST_MAP[key] || CHAMP_COST_MAP[jpName] || 1;

  if (found) {
    return {
      ...found,
      cost,
      name: jpName || found.name,
      icon: found.icon || fallbackIcon
    };
  }

  return {
    id: idOrName,
    name: jpName,
    cost,
    traits: [],
    icon: fallbackIcon
  };
}

/**
 * アイテムIDまたは英語名・内部IDから日本語名を高速取得
 */
export function getItemName(idOrName?: string): string {
  if (!idOrName) return '';
  const raw = idOrName.trim();
  const cleaned = raw
    .replace(/^TFT\d*_Item_/i, '')
    .replace(/^TFT_Item_/i, '')
    .replace(/^TFT18_Item_/i, '')
    .trim();
  const lowerRaw = raw.toLowerCase();
  const lowerCleaned = cleaned.toLowerCase();

  if (itemNameJpMap[raw]) return itemNameJpMap[raw];
  if (itemNameJpMap[cleaned]) return itemNameJpMap[cleaned];
  if (itemNameJpMap[lowerRaw]) return itemNameJpMap[lowerRaw];
  if (itemNameJpMap[lowerCleaned]) return itemNameJpMap[lowerCleaned];

  const found = itemMap.get(lowerRaw) || itemByNameMap.get(lowerRaw) || itemMap.get(lowerCleaned) || itemByNameMap.get(lowerCleaned);
  if (found && found.name && !found.name.startsWith('TFT_Item_') && !found.name.startsWith('TFT18_Item_')) {
    return found.name;
  }

  return cleaned;
}

/**
 * アイテムIDまたは名前からSet 18マスタデータを高速取得
 */
export function getItem(idOrName?: string): MasterItem {
  if (!idOrName) {
    return { id: '', name: '', icon: '' };
  }
  const raw = idOrName.trim();
  const lower = raw.toLowerCase();
  const cleaned = raw
    .replace(/^TFT\d*_Item_/i, '')
    .replace(/^TFT_Item_/i, '')
    .replace(/^TFT18_Item_/i, '')
    .trim();
  const lowerCleaned = cleaned.toLowerCase();

  const found = itemMap.get(lower) || itemByNameMap.get(lower) || itemMap.get(lowerCleaned) || itemByNameMap.get(lowerCleaned);
  const fallbackIcon = getItemIcon(idOrName);
  const jpName = getItemName(idOrName);

  if (found) {
    return {
      ...found,
      name: jpName || found.name,
      icon: found.icon || fallbackIcon
    };
  }

  return {
    id: idOrName,
    name: jpName || cleaned,
    icon: fallbackIcon
  };
}

/**
 * オーグメントIDまたは名前からSet 18マスタデータを高速取得
 */
export function getAugment(idOrName?: string): MasterAugment {
  if (!idOrName) {
    return { id: '', name: '', icon: getAugmentIcon() };
  }
  const key = idOrName.toLowerCase();
  const found = augmentMap.get(key) || augmentByNameMap.get(key);
  const fallbackIcon = getAugmentIcon(idOrName, found?.tier);
  if (found) {
    return {
      ...found,
      icon: found.icon || fallbackIcon
    };
  }

  return {
    id: idOrName,
    name: getItemName(idOrName) || idOrName,
    icon: fallbackIcon
  };
}

/**
 * 特性（シナジー）IDまたは名前からSet 18マスタデータを高速取得
 */
export function getTrait(idOrName?: string): MasterTrait {
  if (!idOrName) {
    return { id: '', name: '', icon: '' };
  }
  const key = idOrName.toLowerCase();
  const found = traitMap.get(key) || traitByNameMap.get(key);
  if (found) return found;

  return {
    id: idOrName,
    name: idOrName,
    icon: ''
  };
}

/**
 * 有効なSet18プレイ可能チャンピオン一覧を取得 (コスト順 & あいうえお順)
 */
export function getAllChampions(): MasterChampion[] {
  const all = Array.from(new Set(championMap.values()));
  const filtered = all.filter(c => {
    if (c.cost > 6) return false;
    return !PVE_KEYWORDS.some(k => c.name.includes(k) || c.id.includes(k));
  });

  filtered.sort((a, b) => {
    if (a.cost !== b.cost) return a.cost - b.cost;
    return a.name.localeCompare(b.name, 'ja-JP');
  });

  return filtered;
}

/**
 * 有効なSet18アイテム一覧を取得
 */
export function getAllItems(): MasterItem[] {
  const all = Array.from(new Set(itemMap.values()));
  return all.filter(i => i.name);
}

/**
 * 有効なSet18オーグメント一覧を取得 (シルバー→ゴールド→虹 順、かつ各レアリティ内であいうえお順)
 */
export function getAllAugments(): MasterAugment[] {
  const all = Array.from(new Set(augmentMap.values()));
  const filtered = all.filter(a => a.name);

  const tierOrder: Record<AugmentTier, number> = {
    silver: 1,
    gold: 2,
    prismatic: 3
  };

  filtered.sort((a, b) => {
    const tierA = getAugmentTier(a.name, a.tier);
    const tierB = getAugmentTier(b.name, b.tier);
    const orderA = tierOrder[tierA];
    const orderB = tierOrder[tierB];

    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return a.name.localeCompare(b.name, 'ja-JP');
  });

  return filtered;
}

/**
 * 有効なSet18特性（シナジー）一覧を取得
 */
export function getAllTraits(): MasterTrait[] {
  const all = Array.from(new Set(traitMap.values()));
  return all.filter(t => t.name);
}
