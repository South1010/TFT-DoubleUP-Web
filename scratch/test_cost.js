const set18Data = require('../frontend/tft_set_18.json');
const itemIconMapData = require('../frontend/utils/item_icon_map.json');
const champIconMapData = require('../frontend/utils/champ_icon_map.json');
const itemNameJpMapData = require('../frontend/utils/item_name_jp_map.json');

// Copy CHAMP_COST_MAP from setMaster.ts
const CHAMP_COST_MAP = {
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

const CHAMP_JP_NAMES = {
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

function getChampionName(idOrName) {
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

  if (CHAMP_JP_NAMES[lowerCleaned]) {
    return CHAMP_JP_NAMES[lowerCleaned];
  }
  return cleaned || raw;
}

function getChampion(idOrName) {
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
  const jpName = CHAMP_JP_NAMES[cleanedKey] || cleaned;

  const cost = CHAMP_COST_MAP[cleanedKey] || CHAMP_COST_MAP[key] || CHAMP_COST_MAP[jpName] || 1;

  return {
    id: idOrName,
    name: jpName,
    cost,
    traits: [],
    icon: ''
  };
}

function resolveUnitCost(unit) {
  if (!unit) return 1;

  const parsedUnitCost = Number(unit.cost);
  if (!isNaN(parsedUnitCost) && parsedUnitCost >= 1 && parsedUnitCost <= 5) {
    return parsedUnitCost;
  }

  const idOrName = unit.id || unit.name;
  const champMaster = getChampion(idOrName);
  const parsedMasterCost = Number(champMaster?.cost);
  if (!isNaN(parsedMasterCost) && parsedMasterCost >= 1 && parsedMasterCost <= 5) {
    return parsedMasterCost;
  }

  const cleanIdOrName = (idOrName || '')
    .replace(/^(TFT18_|DA_18_|DA_|TFT_)/i, '')
    .replace(/(_AD|_AP|Small|Base)$/i, '')
    .replace(/\d+$/g, '')
    .trim();

  const displayName = getChampionName(idOrName);

  const mapCost =
    CHAMP_COST_MAP[unit.name || ''] ||
    CHAMP_COST_MAP[unit.id || ''] ||
    CHAMP_COST_MAP[cleanIdOrName] ||
    CHAMP_COST_MAP[cleanIdOrName.toLowerCase()] ||
    CHAMP_COST_MAP[displayName] ||
    CHAMP_COST_MAP[displayName.toLowerCase()];

  if (mapCost) {
    return Number(mapCost);
  }

  return 1;
}

const seedComps = require('../backend/app/custom_comps_seed.json');
const dravenComp = seedComps.find(c => c.display_name.includes('ドレイブン'));
const units = JSON.parse(dravenComp.units_detail_json);

console.log('Testing units in Elderwood Draven comp:');
units.forEach(u => {
  const cost = resolveUnitCost(u);
  const champName = getChampionName(u.id || u.name);
  console.log(`Unit: id=${u.id}, name=${champName} => resolvedCost=${cost}`);
});
