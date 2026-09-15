import json
import re

CHAMP_COST_MAP = {
  # 5-Cost
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

  # 4-Cost
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

  # 3-Cost
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

  # 2-Cost
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

  # 1-Cost
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
}

CHAMP_JP_NAMES = {
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
}

def getChampionName(idOrName):
  if not idOrName: return '未知のユニット'
  raw = idOrName.strip()
  cleaned = re.sub(r'^(TFT\d*_|DA_\d*_|DA_)', '', raw, flags=re.IGNORECASE)
  cleaned = re.sub(r'(_AD|_AP|Small|Base)$', '', cleaned, flags=re.IGNORECASE)
  cleaned = re.sub(r'\d+$', '', cleaned).strip()
  lowerCleaned = cleaned.lower()
  return CHAMP_JP_NAMES.get(lowerCleaned, cleaned or raw)

def getChampion(idOrName):
  if not idOrName: return {'id': '', 'name': '未知のユニット', 'cost': 1}
  raw = idOrName.strip()
  cleaned = re.sub(r'^(TFT\d*_|DA_\d*_|DA_)', '', raw, flags=re.IGNORECASE)
  cleaned = re.sub(r'(_AD|_AP|Small|Base)$', '', cleaned, flags=re.IGNORECASE)
  cleaned = re.sub(r'\d+$', '', cleaned).strip()
  key = raw.lower()
  cleanedKey = cleaned.lower()
  jpName = CHAMP_JP_NAMES.get(cleanedKey, cleaned)
  cost = CHAMP_COST_MAP.get(cleanedKey) or CHAMP_COST_MAP.get(key) or CHAMP_COST_MAP.get(jpName) or 1
  return {'id': idOrName, 'name': jpName, 'cost': cost}

def resolveUnitCost(unit):
  if not unit: return 1
  try:
    c = float(unit.get('cost', 0))
    if 1 <= c <= 5: return int(c)
  except Exception:
    pass

  idOrName = unit.get('id') or unit.get('name') or ''
  champMaster = getChampion(idOrName)
  masterCost = champMaster.get('cost')
  if masterCost and 1 <= masterCost <= 5:
    return int(masterCost)

  cleanIdOrName = re.sub(r'^(TFT18_|DA_18_|DA_|TFT_)', '', idOrName, flags=re.IGNORECASE)
  cleanIdOrName = re.sub(r'(_AD|_AP|Small|Base)$', '', cleanIdOrName, flags=re.IGNORECASE)
  cleanIdOrName = re.sub(r'\d+$', '', cleanIdOrName).strip()
  displayName = getChampionName(idOrName)

  mapCost = (
    CHAMP_COST_MAP.get(unit.get('name', '')) or
    CHAMP_COST_MAP.get(unit.get('id', '')) or
    CHAMP_COST_MAP.get(cleanIdOrName) or
    CHAMP_COST_MAP.get(cleanIdOrName.lower()) or
    CHAMP_COST_MAP.get(displayName) or
    CHAMP_COST_MAP.get(displayName.lower())
  )

  if mapCost:
    return int(mapCost)
  return 1

with open('backend/app/custom_comps_seed.json', 'r', encoding='utf-8') as f:
  seed_comps = json.load(f)

draven_comp = next(c for c in seed_comps if 'ドレイブン' in c['display_name'])
units = json.loads(draven_comp['units_detail_json'])

print("Testing units in Elderwood Draven comp:")
for u in units:
  cost = resolveUnitCost(u)
  champ_name = getChampionName(u.get('id') or u.get('name'))
  print(f"Unit: id={u.get('id')}, name={champ_name} => resolvedCost={cost}")
