"""
TFT 最新セット(マスタデータ)抽出スクリプト
CommunityDragon公式CDNから現在の全チャンピオン、アイテム、オーグメント、特性を抽出し、
Antigravity IDE / Webアプリでそのまま扱える単一の clean な JSON ファイルに出力します。
"""
import requests
import json
import os

CDRAGON_JA_URL = "https://raw.communitydragon.org/latest/cdragon/tft/ja_jp.json"
ASSET_BASE_URL = "https://raw.communitydragon.org/latest/game/"

def clean_icon_url(raw_path: str) -> str:
    if not raw_path:
        return ""
    p = raw_path.lower()
    for ext in [".dds", ".tex"]:
        if p.endswith(ext):
            p = p[:-len(ext)] + ".png"
            break
    return f"{ASSET_BASE_URL}{p.lstrip('/')}"

def export_set_master(target_set_mutator: str = None, output_path: str = "tft_set_master.json"):
    print("CommunityDragon から最新マスタデータを取得中...")
    resp = requests.get(CDRAGON_JA_URL, timeout=30)
    resp.raise_for_status()
    raw = resp.json()
    
    set_data_list = raw.get("setData", [])
    
    # 対象セットの特定（指定がなければ最新セットを採用）
    target_set = None
    if target_set_mutator:
        for s in set_data_list:
            if target_set_mutator in s.get("mutator", ""):
                target_set = s
                break
    if not target_set and set_data_list:
        target_set = set_data_list[-1]
    
    mutator = target_set.get("mutator", "CurrentSet")
    set_name = target_set.get("name", "Unknown Set")
    print(f"対象セット: {set_name} ({mutator})")

    # 1. チャンピオン抽出
    champions = []
    for c in target_set.get("champions", []):
        api_name = c.get("apiName", "")
        # トークンやダミーの除外フィルタ
        if not api_name or c.get("cost", 0) <= 0 or not c.get("name"):
            continue
        champions.append({
            "id": api_name,
            "name": c.get("name"),
            "cost": c.get("cost"),
            "traits": c.get("traits", []),
            "icon": clean_icon_url(c.get("icon", ""))
        })
    champions.sort(key=lambda x: (x["cost"], x["name"]))

    # 2. 特性 (Traits) 抽出
    traits = []
    for t in target_set.get("traits", []):
        api_name = t.get("apiName", "")
        if not api_name or not t.get("name"):
            continue
        traits.append({
            "id": api_name,
            "name": t.get("name"),
            "description": t.get("desc", ""),
            "icon": clean_icon_url(t.get("icon", ""))
        })

    # 3. アイテム & オーグメント抽出
    items = []
    augments = []
    for item in raw.get("items", []):
        api_name = item.get("apiName", "")
        name = item.get("name", "")
        if not api_name or not name:
            continue

        desc = item.get("desc", "")
        icon = clean_icon_url(item.get("icon", ""))

        # オーグメント判定 (apiNameにAugmentが含まれるもの)
        if "Augment" in api_name:
            # 現在のセットまたは汎用オーグメント
            augments.append({
                "id": api_name,
                "name": name,
                "tier": item.get("augmentTier", "Unknown"),
                "description": desc,
                "icon": icon
            })
        elif "Item" in api_name:
            # 素材・完成アイテム・レディアント等
            items.append({
                "id": api_name,
                "name": name,
                "description": desc,
                "icon": icon
            })

    output_data = {
        "setName": set_name,
        "mutator": mutator,
        "totalChampions": len(champions),
        "totalTraits": len(traits),
        "totalItems": len(items),
        "totalAugments": len(augments),
        "champions": champions,
        "traits": traits,
        "items": items,
        "augments": augments
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    print(f"マスタデータの出力完了: {output_path}")
    print(f" - チャンピオン: {len(champions)}体")
    print(f" - 特性: {len(traits)}種")
    print(f" - アイテム: {len(items)}個")
    print(f" - オーグメント: {len(augments)}個")

if __name__ == "__main__":
    export_set_master()
