import requests
import json

CDRAGON_JA_URL = "https://raw.communitydragon.org/latest/cdragon/tft/ja_jp.json"
ASSET_BASE_URL = "https://raw.communitydragon.org/latest/game/"

def clean_icon_url(raw_path: str) -> str:
    if not raw_path or "none" in raw_path.lower():
        return ""
    p = raw_path.lower()
    for ext in [".dds", ".tex"]:
        if p.endswith(ext):
            p = p[:-len(ext)] + ".png"
            break
    return f"{ASSET_BASE_URL}{p.lstrip('/')}"

def extract_pure_set_data(target_set_prefix: str = "TFT13", output_path: str = "tft_set_clean.json"):
    """
    指定したセット（例: 'TFT13' や 'TFT18'）の正規データのみを厳選抽出する
    """
    print("CommunityDragon からマスタデータを取得中...")
    resp = requests.get(CDRAGON_JA_URL, timeout=30)
    resp.raise_for_status()
    raw = resp.json()

    # 1. セット対象の特定
    target_set = None
    for s in raw.get("setData", []):
        mutator = s.get("mutator", "")
        # 例: TFTSet13 や TFTSet18 にマッチするものを探す
        if target_set_prefix.replace("TFT", "TFTSet") in mutator:
            target_set = s
            break
    
    if not target_set:
        # 見つからない場合は最後のセットを採用
        target_set = raw.get("setData", [])[-1]
        print(f"指定プレフィックスが見つからなかったため、最新セットを採用します: {target_set.get('mutator')}")

    set_name = target_set.get("name", "Current Set")
    print(f"抽出対象セット: {set_name}")

    # ================= 1. チャンピオンの厳選 =================
    # 除外対象のキーワード（モンスター、金床、ダミー、召喚物）
    exclude_tokens = ["dragon", "krug", "golem", "dummy", "wolf", "crab", "herald", "voidspawn", "turret", "chest", "spiderling"]

    champions = []
    for c in target_set.get("champions", []):
        api_name = c.get("apiName", "")
        cost = c.get("cost", 0)
        traits = c.get("traits", [])

        # コストが1〜6以外、または特性（シナジー）を持っていないものはトークン/モンスターなので除外
        if cost < 1 or cost > 7 or len(traits) == 0:
            continue

        # 除外キーワードが含まれる場合はスキップ
        if any(token in api_name.lower() for token in exclude_tokens):
            continue

        champions.append({
            "id": api_name,
            "name": c.get("name"),
            "cost": cost,
            "traits": traits,
            "icon": clean_icon_url(c.get("icon", ""))
        })
    champions.sort(key=lambda x: (x["cost"], x["name"]))

    # ================= 2. 特性（Traits）の厳選 =================
    traits = []
    for t in target_set.get("traits", []):
        api_name = t.get("apiName", "")
        # 特殊なシステム特性（Teamup等）を除外し、正規の特性のみ採用
        if not api_name or not t.get("name"):
            continue
        traits.append({
            "id": api_name,
            "name": t.get("name"),
            "description": t.get("desc", ""),
            "icon": clean_icon_url(t.get("icon", ""))
        })

    # ================= 3. アイテムの厳選 =================
    # 汎用通常完成アイテム（TFT_Item_...）および対象セット固有アイテムのみ残す
    # 過去セット（TFT7_, TFT11_, TFT14_, TFT16_等）やイベント（TFTEvent_）は完全除外
    valid_items = []
    for item in raw.get("items", []):
        api_name = item.get("apiName", "")
        name = item.get("name", "")

        if not api_name or not name:
            continue

        # オーグメントはアイテム側からはスキップ
        if "Augment" in api_name:
            continue

        # 過去セット・イベント・デバッグアイテムの除外判定
        is_past_set = any(api_name.startswith(f"TFT{i}_") for i in range(1, 25) if f"TFT{i}" != target_set_prefix)
        is_event = "Event" in api_name or "Debug" in api_name or "ArmoryKey" in api_name or "Grant" in api_name

        if is_past_set or is_event:
            continue

        # 標準完成アイテム (TFT_Item_) または対象セット限定アイテムのみ採用
        if api_name.startswith("TFT_Item_") or api_name.startswith(f"{target_set_prefix}_Item_"):
            # 金床などのシステムトークンを除外
            if "Anvil" in api_name or "Consumable" in api_name or "none" in item.get("icon", ""):
                continue

            valid_items.append({
                "id": api_name,
                "name": name,
                "description": item.get("desc", ""),
                "icon": clean_icon_url(item.get("icon", ""))
            })

    # ================= 4. オーグメントの厳選 =================
    valid_augments = []
    for item in raw.get("items", []):
        api_name = item.get("apiName", "")
        name = item.get("name", "")

        if not api_name or not name:
            continue

        if "Augment" in api_name:
            # 過去セットのオーグメントを除外
            is_past_set = any(api_name.startswith(f"TFT{i}_") for i in range(1, 25) if f"TFT{i}" != target_set_prefix)
            if is_past_set:
                continue

            valid_augments.append({
                "id": api_name,
                "name": name,
                "tier": item.get("augmentTier", "Unknown"),
                "description": item.get("desc", ""),
                "icon": clean_icon_url(item.get("icon", ""))
            })

    # 出力
    result = {
        "setName": set_name,
        "targetPrefix": target_set_prefix,
        "totalChampions": len(champions),
        "totalTraits": len(traits),
        "totalItems": len(valid_items),
        "totalAugments": len(valid_augments),
        "champions": champions,
        "traits": traits,
        "items": valid_items,
        "augments": valid_augments
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"\n絞り込み完了！: {output_path}")
    print(f" - チャンピオン: {len(champions)}体 (ダミー・モンスターを除去)")
    print(f" - 特性: {len(traits)}種")
    print(f" - アイテム: {len(valid_items)}個 (過去セット・不要トークンを除去)")
    print(f" - オーグメント: {len(valid_augments)}個")

if __name__ == "__main__":
    # 例: ログに含まれていた "TFT13" （または抽出したいセットプレフィックス）を指定
    extract_pure_set_data(target_set_prefix="TFT13")