# プロジェクト指示書: TFT ダブルアップ特化型 統計・メタ分析Webサイト (DoubleUp.GG)

## 1. プロジェクト概要 & ゴール
チームファイトタクティクス（TFT）の特殊対戦モード「ダブルアップ（Double Up: Queue ID 1160）」において、上位プレイヤー（Top 100）の対戦履歴データをRiot Games APIから自動収集し、OP.GGやTactics.toolsのような「強い構成（Tierリスト）」「チャンピオン別おすすめアイテム」「平均順位・Top2率」を可視化するWebアプリケーションを構築します。

---

## 2. システム構成 & 技術スタック
- **Backend / Crawler**: Python (FastAPI, Requests, SQLite, APScheduler / Cron)
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide Icons
- **Data Source**:
  - Riot Games API (`TFT-LEAGUE-V1`, `TFT-MATCH-V1`, `ACCOUNT-V1`)
  - CommunityDragon (日本語名称・チャンピオン/アイテム画像・シナジーマスタ)
- **Database**: SQLite (軽量・ローカル即時稼働設計)

---

## 3. ディレクトリ構成
```text
tft-doubleup-stats/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI エントリポイント
│   │   ├── config.py            # APIキー、定数設定
│   │   ├── database.py          # SQLite接続 & スキーマ初期化
│   │   ├── models.py            # Pydantic & DBモデル
│   │   ├── services/
│   │   │   ├── riot_api.py      # Riot API クライアント (RateLimit制御付)
│   │   │   ├── cdragon.py       # CommunityDragon マスタ同期 & 画像URL解決
│   │   │   ├── crawler.py       # Top100取得 & 試合収集ワーカー
│   │   │   └── aggregator.py    # 構成判定 & 統計集計エンジン
│   │   └── routers/
│   │       ├── stats.py         # 構成ランキング・アイテム統計 API
│   │       └── system.py        # クロール手動実行・ステータス確認 API
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx             # メタ構成 Tierリスト画面
│   │   └── champions/
│   │       └── page.tsx         # チャンピオン & 推奨アイテム一覧画面
│   ├── components/
│   │   ├── CompCard.tsx         # 構成カード (ユニット、アイテム、シナジー表示)
│   │   ├── ItemIcon.tsx         # ツールチップ付きアイテムアイコン
│   │   └── Header.tsx
│   ├── lib/
│   │   └── api.ts               # FastAPI呼び出しクライアント
│   ├── package.json
│   └── tailwind.config.ts
└── README.md
```

---

## 4. データベース設計 (SQLite)

### ① `matches` (収集済み試合ログ)
- `match_id` (TEXT, PK): 試合ID (例: JP1_12345678)
- `game_datetime` (INTEGER): 試合日時 (UNIXタイムスタンプ)
- `game_version` (TEXT): パッチバージョン
- `tft_set_number` (INTEGER): セット番号

### ② `participants` (プレイヤー別戦績)
- `id` (INTEGER, PK, AutoIncrement)
- `match_id` (TEXT): FK -> matches.match_id
- `puuid` (TEXT): プレイヤーPUUID
- `placement` (INTEGER): 順位 (1〜4位ペア換算、または1〜8)
- `level` (INTEGER): 最終レベル
- `traits_json` (TEXT): 発動シナジー (JSON文字列)
- `units_json` (TEXT): 所持チャンピオン・星数・アイテム (JSON文字列)
- `comp_key` (TEXT): 構成判定キー (例: `TFT13_Jinx_6_Rebel`)

### ③ `aggregated_comps` (集計済み構成統計キャッシュ)
- `comp_key` (TEXT, PK)
- `display_name` (TEXT): 日本語構成名 (例: 6 反乱軍 ジンクス)
- `main_carry_id` (TEXT): メインキャリーチャンピオンID
- `traits_summary` (TEXT): 主要シナジー表示用
- `sample_size` (INTEGER): サンプル試合数
- `avg_placement` (REAL): 平均順位
- `top2_rate` (REAL): Top2率 (%)
- `win_rate` (REAL): 1位率 (%)
- `tier` (TEXT): "S", "A", "B", "C"
- `best_items_json` (TEXT): キャリーの推奨アイテム3種ランキング

---

## 5. バックエンド実装コード一式

### `backend/requirements.txt`
```text
fastapi>=0.110.0
uvicorn>=0.28.0
requests>=2.31.0
pydantic>=2.6.0
python-dotenv>=1.0.0
```

### `backend/app/config.py`
```python
import os
from dotenv import load_dotenv

load_dotenv()

RIOT_API_KEY = os.getenv("RIOT_API_KEY", "RGAPI-YOUR-KEY-HERE")
REGION_ROUTING = "asia"       # アカウント/マッチ取得用 (asia, americas, europe)
PLATFORM_ROUTING = "jp1"      # リーグ取得用 (jp1, kr, na1 等)
DOUBLE_UP_QUEUE_ID = 1160     # ダブルアップ (ランク)

DB_PATH = "tft_doubleup.db"
CDRAGON_JA_JSON_URL = "https://raw.communitydragon.org/latest/cdragon/tft/ja_jp.json"
CDRAGON_ASSET_BASE = "https://raw.communitydragon.org/latest/game/"
```

### `backend/app/database.py`
```python
import sqlite3
from app.config import DB_PATH

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS matches (
        match_id TEXT PRIMARY KEY,
        game_datetime INTEGER,
        game_version TEXT,
        tft_set_number INTEGER
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS participants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        match_id TEXT,
        puuid TEXT,
        placement INTEGER,
        level INTEGER,
        traits_json TEXT,
        units_json TEXT,
        comp_key TEXT,
        FOREIGN KEY(match_id) REFERENCES matches(match_id)
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS aggregated_comps (
        comp_key TEXT PRIMARY KEY,
        display_name TEXT,
        main_carry_id TEXT,
        traits_summary TEXT,
        sample_size INTEGER,
        avg_placement REAL,
        top2_rate REAL,
        win_rate REAL,
        tier TEXT,
        best_items_json TEXT
    )
    ''')
    
    conn.commit()
    conn.close()
```

### `backend/app/services/cdragon.py`
```python
import requests
from app.config import CDRAGON_JA_JSON_URL, CDRAGON_ASSET_BASE

class CDragonMaster:
    def __init__(self):
        self.champions = {}
        self.items = {}
        self.traits = {}
        self.load_master()

    def _format_url(self, path: str) -> str:
        if not path:
            return ""
        p = path.lower()
        for ext in [".dds", ".tex"]:
            if p.endswith(ext):
                p = p[:-len(ext)] + ".png"
                break
        return f"{CDRAGON_ASSET_BASE}{p.lstrip('/')}"

    def load_master(self):
        try:
            res = requests.get(CDRAGON_JA_JSON_URL, timeout=15)
            res.raise_for_status()
            data = res.json()

            for s in data.get("setData", []):
                for c in s.get("champions", []):
                    if c.get("apiName"):
                        self.champions[c["apiName"]] = {
                            "name": c.get("name"),
                            "cost": c.get("cost", 1),
                            "icon": self._format_url(c.get("icon", ""))
                        }
                for t in s.get("traits", []):
                    if t.get("apiName"):
                        self.traits[t["apiName"]] = {
                            "name": t.get("name"),
                            "icon": self._format_url(t.get("icon", ""))
                        }

            for item in data.get("items", []):
                if item.get("apiName"):
                    self.items[item["apiName"]] = {
                        "name": item.get("name"),
                        "icon": self._format_url(item.get("icon", "")),
                        "desc": item.get("desc", "")
                    }
        except Exception as e:
            print(f"Failed to load CDragon data: {e}")

cdragon = CDragonMaster()
```

### `backend/app/services/riot_api.py`
```python
import time
import requests
from app.config import RIOT_API_KEY, REGION_ROUTING, PLATFORM_ROUTING, DOUBLE_UP_QUEUE_ID

HEADERS = {"X-Riot-Token": RIOT_API_KEY}

def safe_request(url: str, params: dict = None):
    while True:
        res = requests.get(url, headers=HEADERS, params=params)
        if res.status_code == 429:
            retry_after = int(res.headers.get("Retry-After", 5))
            print(f"Rate limited. Waiting {retry_after}s...")
            time.sleep(retry_after)
            continue
        if res.status_code == 404:
            return None
        res.raise_for_status()
        time.sleep(0.06) # 1秒あたり最大16リクエストに抑える安全策
        return res.json()

def get_double_up_top_players(count: int = 100) -> list[str]:
    # ダブルアップ ランキング一覧取得
    url = f"https://{PLATFORM_ROUTING}.api.riotgames.com/tft/league/v1/rated-ladders/pairs/top"
    data = safe_request(url)
    if not data:
        return []
    # puuid を抽出
    puuids = [entry.get("puuid") for entry in data[:count] if entry.get("puuid")]
    return puuids

def get_recent_matches(puuid: str, count: int = 10) -> list[str]:
    url = f"https://{REGION_ROUTING}.api.riotgames.com/tft/match/v1/matches/by-puuid/{puuid}/ids"
    return safe_request(url, params={"count": count}) or []

def get_match_detail(match_id: str):
    url = f"https://{REGION_ROUTING}.api.riotgames.com/tft/match/v1/matches/{match_id}"
    return safe_request(url)
```

### `backend/app/services/crawler.py` & `aggregator.py`
```python
import json
from collections import defaultdict
from app.database import get_connection
from app.config import DOUBLE_UP_QUEUE_ID
from app.services.riot_api import get_double_up_top_players, get_recent_matches, get_match_detail
from app.services.cdragon import cdragon

def determine_comp_key(units: list, traits: list) -> tuple[str, str, str]:
    # メインキャリー決定 (アイテムが2個以上 or 3コスト以上★2で最もコスト高い)
    best_carry = None
    max_score = -1
    for u in units:
        cid = u.get("character_id", "")
        tier = u.get("tier", 1)
        item_count = len(u.get("itemNames", []))
        cost = cdragon.champions.get(cid, {}).get("cost", 1)
        
        score = (cost * 10) + (tier * 5) + (item_count * 8)
        if score > max_score:
            max_score = score
            best_carry = cid

    # メイン特性決定
    best_trait = "Unknown"
    max_trait_tier = 0
    active_traits = []
    for t in traits:
        if t.get("tier_current", 0) > 0:
            name = cdragon.traits.get(t["name"], {}).get("name", t["name"])
            active_traits.append(f"{t['num_units']} {name}")
            if t.get("tier_current", 0) > max_trait_tier:
                max_trait_tier = t.get("tier_current", 0)
                best_trait = f"{t['num_units']}_{t['name']}"

    carry_name = cdragon.champions.get(best_carry, {}).get("name", best_carry)
    display_name = f"{best_trait.split('_')[-1]} {carry_name}"
    comp_key = f"{best_trait}_{best_carry}"
    return comp_key, display_name, best_carry or ""

def crawl_and_save():
    conn = get_connection()
    cursor = conn.cursor()
    top_puuids = get_double_up_top_players(50)
    print(f"Fetched {len(top_puuids)} top players.")

    match_ids_to_fetch = set()
    for puuid in top_puuids:
        ids = get_recent_matches(puuid, count=5)
        match_ids_to_fetch.update(ids)

    print(f"Total unique matches to process: {len(match_ids_to_fetch)}")

    for mid in match_ids_to_fetch:
        cursor.execute("SELECT match_id FROM matches WHERE match_id = ?", (mid,))
        if cursor.fetchone():
            continue

        detail = get_match_detail(mid)
        if not detail or detail.get("info", {}).get("queue_id") != DOUBLE_UP_QUEUE_ID:
            continue

        info = detail["info"]
        cursor.execute(
            "INSERT INTO matches VALUES (?, ?, ?, ?)",
            (mid, info.get("game_datetime"), info.get("game_version"), info.get("tft_set_number"))
        )

        for p in info.get("participants", []):
            units = p.get("units", [])
            traits = p.get("traits", [])
            comp_key, _, _ = determine_comp_key(units, traits)

            cursor.execute('''
            INSERT INTO participants (match_id, puuid, placement, level, traits_json, units_json, comp_key)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                mid, p.get("puuid"), p.get("placement"), p.get("level"),
                json.dumps(traits), json.dumps(units), comp_key
            ))

    conn.commit()
    conn.close()
    aggregate_statistics()

def aggregate_statistics():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT comp_key, placement, units_json, traits_json FROM participants")
    rows = cursor.fetchall()

    comp_stats = defaultdict(lambda: {"placements": [], "units": [], "items": defaultdict(int), "traits": None})

    for r in rows:
        key = r["comp_key"]
        placement = r["placement"]
        units = json.loads(r["units_json"])
        traits = json.loads(r["traits_json"])

        comp_stats[key]["placements"].append(placement)
        comp_stats[key]["traits"] = traits
        for u in units:
            for item in u.get("itemNames", []):
                comp_stats[key]["items"][(u.get("character_id"), item)] += 1

    cursor.execute("DELETE FROM aggregated_comps")

    for key, data in comp_stats.items():
        sample_size = len(data["placements"])
        if sample_size < 3: # 少数データは除外
            continue

        avg_placement = sum(data["placements"]) / sample_size
        top2_count = sum(1 for p in data["placements"] if p <= 2)
        win_count = sum(1 for p in data["placements"] if p == 1)

        top2_rate = round((top2_count / sample_size) * 100, 1)
        win_rate = round((win_count / sample_size) * 100, 1)

        # Tier 算出
        if avg_placement <= 3.8 and top2_rate >= 60.0:
            tier = "S"
        elif avg_placement <= 4.2 and top2_rate >= 50.0:
            tier = "A"
        elif avg_placement <= 4.6:
            tier = "B"
        else:
            tier = "C"

        parts = key.split("_")
        carry_id = parts[-1] if len(parts) > 1 else ""
        carry_name = cdragon.champions.get(carry_id, {}).get("name", carry_id)
        display_name = f"{carry_name} キャリー構成"

        # 推奨アイテム Top 3
        carry_items = sorted(
            [(item, count) for (cid, item), count in data["items"].items() if cid == carry_id],
            key=lambda x: x[1], reverse=True
        )[:3]
        best_items = [i[0] for i in carry_items]

        cursor.execute('''
        INSERT OR REPLACE INTO aggregated_comps 
        (comp_key, display_name, main_carry_id, traits_summary, sample_size, avg_placement, top2_rate, win_rate, tier, best_items_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            key, display_name, carry_id, "", sample_size,
            round(avg_placement, 2), top2_rate, win_rate, tier, json.dumps(best_items)
        ))

    conn.commit()
    conn.close()
```

### `backend/app/main.py`
```python
from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import json
from app.database import init_db, get_connection
from app.services.crawler import crawl_and_save
from app.services.cdragon import cdragon

app = FastAPI(title="TFT Double Up Stats API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()

@app.get("/api/comps")
def get_comps():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM aggregated_comps ORDER BY avg_placement ASC")
    rows = cursor.fetchall()
    conn.close()

    result = []
    for r in rows:
        best_items_raw = json.loads(r["best_items_json"])
        best_items = [
            {
                "id": iid,
                "name": cdragon.items.get(iid, {}).get("name", iid),
                "icon": cdragon.items.get(iid, {}).get("icon", "")
            }
            for iid in best_items_raw
        ]
        
        carry_info = cdragon.champions.get(r["main_carry_id"], {})

        result.append({
            "comp_key": r["comp_key"],
            "display_name": r["display_name"],
            "tier": r["tier"],
            "avg_placement": r["avg_placement"],
            "top2_rate": r["top2_rate"],
            "win_rate": r["win_rate"],
            "sample_size": r["sample_size"],
            "main_carry": {
                "id": r["main_carry_id"],
                "name": carry_info.get("name", r["main_carry_id"]),
                "cost": carry_info.get("cost", 1),
                "icon": carry_info.get("icon", "")
            },
            "best_items": best_items
        })
    return result

@app.post("/api/crawl")
def trigger_crawl(background_tasks: BackgroundTasks):
    background_tasks.add_task(crawl_and_save)
    return {"status": "Crawler started in background"}
```

---

## 6. フロントエンド実装コード一式 (Next.js 14 App Router)

### `frontend/app/page.tsx`
```tsx
'use client';

import React, { useEffect, useState } from 'react';

interface MainCarry {
  id: string;
  name: string;
  cost: number;
  icon: string;
}

interface Item {
  id: string;
  name: string;
  icon: string;
}

interface CompStat {
  comp_key: string;
  display_name: string;
  tier: string;
  avg_placement: number;
  top2_rate: number;
  win_rate: number;
  sample_size: number;
  main_carry: MainCarry;
  best_items: Item[];
}

export default function Home() {
  const [comps, setComps] = useState<CompStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [crawling, setCrawling] = useState(false);

  const fetchComps = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:8000/api/comps');
      const data = await res.json();
      setComps(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const triggerCrawl = async () => {
    setCrawling(true);
    await fetch('http://localhost:8000/api/crawl', { method: 'POST' });
    alert('クロールを開始しました。1〜2分後に再読み込みしてください。');
    setCrawling(false);
  };

  useEffect(() => {
    fetchComps();
  }, []);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'S': return 'bg-amber-500 text-black font-bold';
      case 'A': return 'bg-purple-600 text-white font-bold';
      case 'B': return 'bg-blue-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  return (
    <main className="min-h-screen bg-[#0f172a] text-slate-100 p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-8 border-b border-slate-800 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-indigo-400">
              DoubleUp.GG ⚔️
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              TFT ダブルアップ上位100人 対戦データ・メタ統計 (Queue: 1160)
            </p>
          </div>
          <button
            onClick={triggerCrawl}
            disabled={crawling}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 rounded-lg text-sm font-semibold transition"
          >
            {crawling ? 'データ取得中...' : '最新戦績を取得・更新'}
          </button>
        </div>

        {/* コンプ一覧テーブル */}
        <div className="mt-8 overflow-x-auto">
          {loading ? (
            <div className="text-center py-20 text-slate-400">データを読み込み中...</div>
          ) : comps.length === 0 ? (
            <div className="text-center py-20 text-slate-400 bg-slate-900/50 rounded-xl border border-slate-800">
              データがありません。「最新戦績を取得・更新」を押してクロールを実行してください。
            </div>
          ) : (
            <div className="grid gap-4">
              {comps.map((comp) => (
                <div
                  key={comp.comp_key}
                  className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-slate-900/80 hover:bg-slate-800/80 transition rounded-xl border border-slate-800 gap-4"
                >
                  {/* Tier & 構成名 */}
                  <div className="flex items-center gap-4 min-w-[240px]">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${getTierColor(comp.tier)}`}>
                      {comp.tier}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-100">{comp.display_name}</h3>
                      <span className="text-xs text-slate-400">{comp.sample_size} 試合</span>
                    </div>
                  </div>

                  {/* メインキャリー & 推奨アイテム */}
                  <div className="flex items-center gap-3">
                    {comp.main_carry.icon && (
                      <div className="relative">
                        <img
                          src={comp.main_carry.icon}
                          alt={comp.main_carry.name}
                          className="w-12 h-12 rounded-lg border-2 border-amber-400 object-cover"
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                      {comp.best_items.map((item) => (
                        <img
                          key={item.id}
                          src={item.icon}
                          alt={item.name}
                          title={item.name}
                          className="w-8 h-8 rounded border border-slate-700 object-cover"
                        />
                      ))}
                    </div>
                  </div>

                  {/* 統計数値 (平均順位, Top2率, 勝率) */}
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="text-xs text-slate-400">平均順位</div>
                      <div className="font-extrabold text-teal-400 text-base">#{comp.avg_placement}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-slate-400">Top 2率</div>
                      <div className="font-bold text-slate-200">{comp.top2_rate}%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-slate-400">勝率 (1位)</div>
                      <div className="font-bold text-slate-200">{comp.win_rate}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
```

---

## 7. 実行・起動手順

```bash
# 1. バックエンド起動
cd backend
pip install -r requirements.txt
# .env を作成して RIOT_API_KEY=RGAPI-xxxx を記述
uvicorn app.main:app --reload --port 8000

# 2. フロントエンド起動 (別ターミナル)
cd frontend
npm install
npm run dev
```
ブラウザで `http://localhost:3000` を開き、「最新戦績を取得・更新」をクリックすると自動でデータ収集・集計が行われ、統計画面が表示されます。
