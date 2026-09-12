import os
from dotenv import load_dotenv

load_dotenv()

RIOT_API_KEY = os.getenv("RIOT_API_KEY", "RGAPI-6c426ff8-e26b-4229-8b5f-6a95bf52af8c")
ADMIN_PASSCODE = os.getenv("ADMIN_PASSCODE", "admin123")
REGION_ROUTING = "asia"       # アカウント/マッチ取得用 (asia, americas, europe)
PLATFORM_ROUTING = "jp1"      # リーグ取得用 (jp1, kr, na1 等)
DOUBLE_UP_QUEUE_ID = 1160     # ダブルアップ (ランク)
SOLO_QUEUE_ID = 1100          # シングルランク (Ranked Solo)

# TFT Set 18 固定ロック設定
CURRENT_TFT_SET = 18
CURRENT_SET_MUTATOR = "TFTSet18"

DB_PATH = "tft_doubleup.db"
CDRAGON_JA_JSON_URL = "https://raw.communitydragon.org/latest/cdragon/tft/ja_jp.json"
CDRAGON_ASSET_BASE = "https://raw.communitydragon.org/latest/game/"