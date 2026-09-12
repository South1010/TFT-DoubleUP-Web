import json
from collections import defaultdict
from app.database import get_connection
from app.config import DOUBLE_UP_QUEUE_ID, SOLO_QUEUE_ID
from app.services.riot_api import get_double_up_top_players, get_single_rank_top_players, get_recent_matches, get_match_detail
from app.services.cdragon import cdragon

def determine_comp_key(units: list, traits: list) -> tuple[str, str, str]:
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

def seed_sample_data():
    """Double Up (1160) および Single Rank (1100) 用 独立メタデータを生成"""
    conn = get_connection()
    cursor = conn.cursor()

    # 1. Double Up (1160) 専用メタ構成
    doubleup_comps = [
        {
            "comp_key": "1160_6_Elderwood_DA_18_Ezreal",
            "queue_id": 1160,
            "display_name": "6 エルダーウッド エズリアル & ザヤ",
            "main_carry_id": "DA_18_Ezreal",
            "traits_summary": "6 エルダーウッド, 2 ヴァンガード, 2 ラピッドファイア, 2 エクセキューショナー",
            "sample_size": 1850,
            "avg_placement": 1.45,
            "top2_rate": 88.0,
            "top4_rate": 96.5,
            "win_rate": 52.0,
            "tier": "OP",
            "best_items_json": json.dumps(["TFT_Item_InfinityEdge", "TFT_Item_GuinsoosRageblade", "TFT_Item_LastWhisper"]),
            "reroll_level": "Fast 8",
            "overview": "高コスト物理キャリー「エズリアル」と「ザヤ」を軸にした超高火力物理後衛構成。エルダーウッドの耐久・バフと前衛の堅牢なタンクで時間を稼ぎます。",
            "play_conditions": "初期にADアイテム（大剣・弓）が集まった時、またはエルダーウッドの紋章/オーグメントを獲得した時。",
            "progression_guide": "序盤(Lv3-5): グナー・リリアなどの軽量エルダーウッドで前衛を構築し、ポッピーやハンターにADアイテムを持たせて進行。\n中盤(Lv6-7): Lv7でヘカリムを引いて前衛を強化。\n終盤(Lv8-9): Lv8でエズリアル・ザヤ・オーンを揃えて完成。ダブルアップではAP特化の相方と組むことで圧勝可能。",
            "dedicated_augment": "エルダーウッドの紋章 / 精鋭射撃手",
            "recommended_augments_json": json.dumps(["エルダーウッドの心", "サイバネティック アップリンク", "巨大な仲間", "ゴールド・チケット"]),
            "partner_comp_keys_json": json.dumps(["1160_5_Sprykin_DA_18_Veigar", "1160_5_Coven_DA_18_LeBlanc"]),
            "level_boards_json": json.dumps({
                "3": [
                    {"id": "DA_18_GnarSmall", "role": "フロントライン", "row": 0, "col": 3, "star": 2, "items": []},
                    {"id": "DA_18_Lillia", "role": "ミッドライン", "row": 1, "col": 3, "star": 1, "items": []},
                    {"id": "DA_18_Caitlyn", "role": "キャリー代行", "row": 3, "col": 6, "star": 1, "items": ["TFT_Item_InfinityEdge"]}
                ],
                "5": [
                    {"id": "DA_18_GnarSmall", "role": "フロントライン", "row": 0, "col": 3, "star": 2, "items": ["TFT_Item_Crownguard"]},
                    {"id": "DA_18_Lillia", "role": "ミッドライン", "row": 1, "col": 3, "star": 2, "items": []},
                    {"id": "DA_18_Rakan", "role": "前衛CC", "row": 1, "col": 2, "star": 1, "items": []},
                    {"id": "DA_18_Tristana", "role": "サブAD", "row": 3, "col": 5, "star": 2, "items": ["TFT_Item_GuinsoosRageblade"]},
                    {"id": "DA_18_Caitlyn", "role": "キャリー代行", "row": 3, "col": 6, "star": 2, "items": ["TFT_Item_InfinityEdge", "TFT_Item_LastWhisper"]}
                ],
                "7": [
                    {"id": "DA_18_Hecarim", "role": "メインタンク", "row": 0, "col": 3, "star": 2, "items": ["TFT_Item_WarmogsArmor", "TFT_Item_BrambleVest"]},
                    {"id": "DA_18_GnarSmall", "role": "フロントライン", "row": 0, "col": 4, "star": 2, "items": ["TFT_Item_TitansResolve"]},
                    {"id": "DA_18_Lillia", "role": "ミッドライン", "row": 1, "col": 3, "star": 2, "items": []},
                    {"id": "DA_18_Rakan", "role": "前衛CC", "row": 1, "col": 2, "star": 2, "items": []},
                    {"id": "DA_18_Xayah", "role": "サブキャリー", "row": 3, "col": 5, "star": 1, "items": ["TFT_Item_RedBuff"]},
                    {"id": "DA_18_Ezreal", "role": "メインキャリー", "row": 3, "col": 6, "star": 1, "items": ["TFT_Item_InfinityEdge", "TFT_Item_GuinsoosRageblade", "TFT_Item_LastWhisper"]},
                    {"id": "DA_18_MasterYi_AD", "role": "サブキャリー", "row": 0, "col": 5, "star": 1, "items": []}
                ],
                "8": [
                    {"id": "DA_18_Ezreal", "role": "メインキャリー", "row": 3, "col": 6, "items": ["TFT_Item_InfinityEdge", "TFT_Item_GuinsoosRageblade", "TFT_Item_LastWhisper"], "star": 2},
                    {"id": "DA_18_Xayah", "role": "サブキャリー", "row": 3, "col": 5, "items": ["TFT_Item_GiantSlayer", "TFT_Item_RedBuff"], "star": 2},
                    {"id": "DA_18_Hecarim", "role": "メインタンク", "row": 0, "col": 3, "items": ["TFT_Item_WarmogsArmor", "TFT_Item_BrambleVest", "TFT_Item_DragonsClaw"], "star": 2},
                    {"id": "DA_18_Ornn", "role": "サブタンク", "row": 0, "col": 2, "items": ["TFT_Item_SunfireCape", "TFT_Item_SteadfastHeart"], "star": 2},
                    {"id": "DA_18_GnarSmall", "role": "フロントライン", "row": 0, "col": 4, "items": ["TFT_Item_Bloodthirster", "TFT_Item_TitansResolve"], "star": 2},
                    {"id": "DA_18_Lillia", "role": "ミッドライン", "row": 1, "col": 3, "items": ["TFT_Item_Crownguard"], "star": 2},
                    {"id": "DA_18_MasterYi_AD", "role": "サブキャリー", "row": 0, "col": 5, "items": ["TFT_Item_EdgeOfNight"], "star": 2},
                    {"id": "DA_18_Rakan", "role": "前衛CC", "row": 1, "col": 2, "items": ["TFT_Item_VoidStaff"], "star": 2}
                ]
            }),
            "units_detail": [
                {"id": "DA_18_Ezreal", "role": "メインキャリー", "row": 3, "col": 6, "items": ["TFT_Item_InfinityEdge", "TFT_Item_GuinsoosRageblade", "TFT_Item_LastWhisper"], "star": 2},
                {"id": "DA_18_Xayah", "role": "サブキャリー", "row": 3, "col": 5, "items": ["TFT_Item_GiantSlayer", "TFT_Item_RedBuff"], "star": 2},
                {"id": "DA_18_Hecarim", "role": "メインタンク", "row": 0, "col": 3, "items": ["TFT_Item_WarmogsArmor", "TFT_Item_BrambleVest", "TFT_Item_DragonsClaw"], "star": 2},
                {"id": "DA_18_Ornn", "role": "サブタンク", "row": 0, "col": 2, "items": ["TFT_Item_SunfireCape", "TFT_Item_SteadfastHeart"], "star": 2},
                {"id": "DA_18_GnarSmall", "role": "フロントライン", "row": 0, "col": 4, "items": ["TFT_Item_Bloodthirster", "TFT_Item_TitansResolve"], "star": 2},
                {"id": "DA_18_Lillia", "role": "ミッドライン", "row": 1, "col": 3, "items": ["TFT_Item_Crownguard"], "star": 2},
                {"id": "DA_18_MasterYi_AD", "role": "サブキャリー", "row": 0, "col": 5, "items": ["TFT_Item_EdgeOfNight"], "star": 2},
                {"id": "DA_18_Rakan", "role": "前衛CC", "row": 1, "col": 2, "items": ["TFT_Item_VoidStaff"], "star": 2}
            ]
        },
        {
            "comp_key": "1160_5_Sprykin_DA_18_Veigar",
            "queue_id": 1160,
            "display_name": "5 スプライキン ベイガー & ティーモ★3",
            "main_carry_id": "DA_18_Veigar",
            "traits_summary": "5 スプライキン, 2 ディフェンダー, 2 インヴォーカー, 2 スペルウィーバー",
            "sample_size": 1620,
            "avg_placement": 1.65,
            "top2_rate": 84.0,
            "top4_rate": 93.0,
            "win_rate": 46.0,
            "tier": "OP",
            "best_items_json": json.dumps(["TFT_Item_BlueBuff", "TFT_Item_JeweledGauntlet", "TFT_Item_RabadonsDeathcap"]),
            "reroll_level": "6リロール",
            "overview": "レベル6でスローリロールを行い、ベイガーとティーモの★3を完成させる超高火力AP構成。ダブルアップでの即時支援性能がピカイチ。",
            "play_conditions": "序盤に涙・無駄でかい棒が多く落ちた時、またはスプライキンのオーグメントが出た時。",
            "progression_guide": "序盤(Lv3-5): コブコ・トリスターナで連勝または利子50Gを最速確保。\n中盤(Lv6 / 3-2~4-1): 利子50Gを維持しながら毎ターンリロールし、ベイガー・ティーモを3つ星化。\n終盤(Lv7-8): ★3化達成後にレベルを上げ、ラムスやモーガナを追加。",
            "dedicated_augment": "【HERO】スプライキンの悪戯 (ベイガー専用)",
            "recommended_augments_json": json.dumps(["ジュエルロータス", "スプライキンの王冠", "貿易協定", "パンドラのベンチ"]),
            "partner_comp_keys_json": json.dumps(["1160_6_Elderwood_DA_18_Ezreal", "1160_5_Blossom_DA_18_Ahri"]),
            "level_boards_json": json.dumps({
                "4": [
                    {"id": "DA_18_Kobuko", "role": "メインタンク", "row": 0, "col": 3, "star": 2, "items": ["TFT_Item_SunfireCape"]},
                    {"id": "DA_18_Tristana", "role": "AD進行", "row": 3, "col": 4, "star": 2, "items": []},
                    {"id": "DA_18_Teemo", "role": "サブAP", "row": 3, "col": 5, "star": 1, "items": ["TFT_Item_SpearOfShojin"]},
                    {"id": "DA_18_Veigar", "role": "メインキャリー", "row": 3, "col": 6, "star": 1, "items": ["TFT_Item_BlueBuff"]}
                ],
                "6": [
                    {"id": "DA_18_Rammus", "role": "メインタンク", "row": 0, "col": 3, "star": 2, "items": ["TFT_Item_WarmogsArmor", "TFT_Item_GargoyleStoneplate"]},
                    {"id": "DA_18_Kobuko", "role": "サブタンク", "row": 0, "col": 2, "star": 2, "items": ["TFT_Item_BrambleVest"]},
                    {"id": "DA_18_GnarSmall", "role": "フロントライン", "row": 0, "col": 4, "star": 2, "items": []},
                    {"id": "DA_18_Tristana", "role": "AD", "row": 3, "col": 4, "star": 2, "items": []},
                    {"id": "DA_18_Teemo", "role": "サブキャリー", "row": 3, "col": 5, "star": 3, "items": ["TFT_Item_SpearOfShojin", "TFT_Item_Morellonomicon"]},
                    {"id": "DA_18_Veigar", "role": "メインキャリー", "row": 3, "col": 6, "star": 3, "items": ["TFT_Item_BlueBuff", "TFT_Item_JeweledGauntlet", "TFT_Item_RabadonsDeathcap"]}
                ]
            }),
            "units_detail": [
                {"id": "DA_18_Veigar", "role": "メインキャリー", "row": 3, "col": 6, "items": ["TFT_Item_BlueBuff", "TFT_Item_JeweledGauntlet", "TFT_Item_RabadonsDeathcap"], "star": 3},
                {"id": "DA_18_Teemo", "role": "サブキャリー", "row": 3, "col": 5, "items": ["TFT_Item_SpearOfShojin", "TFT_Item_Morellonomicon"], "star": 3},
                {"id": "DA_18_Rammus", "role": "メインタンク", "row": 0, "col": 3, "items": ["TFT_Item_WarmogsArmor", "TFT_Item_GargoyleStoneplate", "TFT_Item_SunfireCape"], "star": 2},
                {"id": "DA_18_Kobuko", "role": "サブタンク", "row": 0, "col": 2, "items": ["TFT_Item_BrambleVest", "TFT_Item_DragonsClaw"], "star": 2},
                {"id": "DA_18_Tristana", "role": "バックラインAD", "row": 3, "col": 4, "items": ["TFT_Item_LastWhisper"], "star": 2},
                {"id": "DA_18_GnarSmall", "role": "フロントライン", "row": 0, "col": 4, "items": ["TFT_Item_Crownguard"], "star": 2},
                {"id": "DA_18_Ahri", "role": "バックラインAP", "row": 3, "col": 1, "items": ["TFT_Item_HextechGunblade"], "star": 2},
                {"id": "DA_18_Morgana", "role": "ミッドライン", "row": 1, "col": 3, "items": ["TFT_Item_SpiritVisage"], "star": 2}
            ]
        },
        {
            "comp_key": "1160_5_Blossom_DA_18_Ahri",
            "queue_id": 1160,
            "display_name": "5 ブロッサム アーリ & アッシュ",
            "main_carry_id": "DA_18_Ahri",
            "traits_summary": "5 ブロッサム, 2 ハンター, 2 ブローラー, 2 スペルウィーバー",
            "sample_size": 1410,
            "avg_placement": 1.95,
            "top2_rate": 76.5,
            "top4_rate": 88.0,
            "win_rate": 38.0,
            "tier": "S",
            "best_items_json": json.dumps(["TFT_Item_BlueBuff", "TFT_Item_JeweledGauntlet", "TFT_Item_HextechGunblade"]),
            "reroll_level": "Standard",
            "overview": "アーリの広範囲魔法バーストとアッシュの持続物理DPSを兼ね備えたバランス型ハイブリッド編成。",
            "play_conditions": "涙・弓・大剣がバランスよく揃っている時。",
            "progression_guide": "序盤: ブロッサム2を早期発動させて連勝進行。\n中盤: 4-1でLv7に上げ、アーリ・アッシュを引きに行く。\n終盤: 5-1でLv8にし、セットを追加して前衛を固定。",
            "dedicated_augment": "花開く絆",
            "recommended_augments_json": json.dumps(["ジュエルロータス", "サイバネティック ヴァンプ", "理想的なデュオ"]),
            "partner_comp_keys_json": json.dumps(["1160_5_Coven_DA_18_LeBlanc", "1160_5_Blackthorn_DA_18_Azir"]),
            "level_boards_json": json.dumps({}),
            "units_detail": [
                {"id": "DA_18_Ahri", "role": "メインキャリー", "row": 3, "col": 6, "items": ["TFT_Item_BlueBuff", "TFT_Item_JeweledGauntlet", "TFT_Item_HextechGunblade"], "star": 2},
                {"id": "DA_18_Ashe", "role": "サブキャリー", "row": 3, "col": 5, "items": ["TFT_Item_GuinsoosRageblade", "TFT_Item_InfinityEdge", "TFT_Item_LastWhisper"], "star": 2},
                {"id": "DA_18_Sett", "role": "メインタンク", "row": 0, "col": 3, "items": ["TFT_Item_WarmogsArmor", "TFT_Item_BrambleVest", "TFT_Item_DragonsClaw"], "star": 2},
                {"id": "DA_18_Yunara", "role": "サブキャリー", "row": 3, "col": 4, "items": ["TFT_Item_SpearOfShojin"], "star": 2},
                {"id": "DA_18_Yorick", "role": "フロントライン", "row": 0, "col": 2, "items": ["TFT_Item_SteadfastHeart"], "star": 2},
                {"id": "DA_18_Caitlyn", "role": "バックライン", "row": 3, "col": 1, "items": ["TFT_Item_Morellonomicon"], "star": 2},
                {"id": "DA_18_Kobuko", "role": "サブタンク", "row": 0, "col": 1, "items": ["TFT_Item_SunfireCape"], "star": 2},
                {"id": "DA_18_Cassiopeia", "role": "ミッドライン", "row": 2, "col": 2, "items": ["TFT_Item_VoidStaff"], "star": 2}
            ]
        },
        {
            "comp_key": "1160_5_Coven_DA_18_LeBlanc",
            "queue_id": 1160,
            "display_name": "5 魔女 ルブラン & モルガナ",
            "main_carry_id": "DA_18_LeBlanc",
            "traits_summary": "5 魔女, 3 インヴォーカー, 2 スペルウィーバー, 2 ヴァンガード",
            "sample_size": 1280,
            "avg_placement": 2.15,
            "top2_rate": 72.0,
            "top4_rate": 84.0,
            "win_rate": 32.0,
            "tier": "S",
            "best_items_json": json.dumps(["TFT_Item_SpearOfShojin", "TFT_Item_JeweledGauntlet", "TFT_Item_ArchangelsStaff"]),
            "reroll_level": "7リロール",
            "overview": "魔女シナジーによるマナ回復とルブランの単体即死級APダメージで相手キャリーを瞬殺する構成。",
            "play_conditions": "ショウジンの矛が早期に完成する時。",
            "progression_guide": "序盤: エリス・カシオペアで前衛・後衛の魔女基礎を構築。\n中盤: Lv7でスローリロールを行いルブラン・モルガナの★2/★3を目指す。",
            "dedicated_augment": "魔女の儀式",
            "recommended_augments_json": json.dumps(["マナのフロー", "スペルウィーバーの紋章", "死の贈り物"]),
            "partner_comp_keys_json": json.dumps(["1160_6_Elderwood_DA_18_Ezreal", "1160_5_Sprykin_DA_18_Veigar"]),
            "level_boards_json": json.dumps({}),
            "units_detail": [
                {"id": "DA_18_LeBlanc", "role": "メインキャリー", "row": 3, "col": 3, "items": ["TFT_Item_SpearOfShojin", "TFT_Item_JeweledGauntlet", "TFT_Item_ArchangelsStaff"], "star": 2},
                {"id": "DA_18_Morgana", "role": "サブキャリー", "row": 3, "col": 4, "items": ["TFT_Item_Morellonomicon", "TFT_Item_HextechGunblade"], "star": 2},
                {"id": "DA_18_Elise", "role": "メインタンク", "row": 0, "col": 3, "items": ["TFT_Item_WarmogsArmor", "TFT_Item_BrambleVest", "TFT_Item_DragonsClaw"], "star": 2},
                {"id": "DA_18_Cassiopeia", "role": "バックライン", "row": 3, "col": 5, "items": ["TFT_Item_BlueBuff"], "star": 2},
                {"id": "DA_18_Caitlyn", "role": "バックラインAD", "row": 3, "col": 6, "items": ["TFT_Item_LastWhisper"], "star": 2},
                {"id": "DA_18_Teemo", "role": "ミッドライン", "row": 2, "col": 2, "items": ["TFT_Item_VoidStaff"], "star": 2},
                {"id": "DA_18_Hecarim", "role": "サブタンク", "row": 0, "col": 2, "items": ["TFT_Item_SunfireCape"], "star": 2},
                {"id": "DA_18_Veigar", "role": "バックライン", "row": 3, "col": 1, "items": ["TFT_Item_RabadonsDeathcap"], "star": 2}
            ]
        },
        {
            "comp_key": "1160_5_Blackthorn_DA_18_Azir",
            "queue_id": 1160,
            "display_name": "5 ブラックソーン アジール & マルファイト",
            "main_carry_id": "DA_18_Azir",
            "traits_summary": "5 ブラックソーン, 2 エクセキューショナー, 2 ブローラー, 2 モノリス",
            "sample_size": 1150,
            "avg_placement": 2.25,
            "top2_rate": 68.0,
            "top4_rate": 81.0,
            "win_rate": 28.0,
            "tier": "S",
            "best_items_json": json.dumps(["TFT_Item_GuinsoosRageblade", "TFT_Item_SpearOfShojin", "TFT_Item_JeweledGauntlet"]),
            "reroll_level": "Fast 8",
            "overview": "アジールの兵士召喚による圧倒的盤面維持力とマルファイトのモノリスシールドで耐え勝つコントロール構成。",
            "play_conditions": "グインサー・ショウジン作成可能かつAPオーグメント時。",
            "progression_guide": "序盤: レクサイ・マルファイトで固い前衛を作り安定進行。\n終盤: Lv8でアジールを引き出し召喚兵士で前衛を圧迫。",
            "dedicated_augment": "砂塵の皇帝",
            "recommended_augments_json": json.dumps(["サイバネティック・アップリンク", "巨大な仲間", "ゴールド・チケット"]),
            "partner_comp_keys_json": json.dumps(["1160_5_Blossom_DA_18_Ahri"]),
            "level_boards_json": json.dumps({}),
            "units_detail": [
                {"id": "DA_18_Azir", "role": "メインキャリー", "row": 3, "col": 4, "items": ["TFT_Item_GuinsoosRageblade", "TFT_Item_SpearOfShojin", "TFT_Item_JeweledGauntlet"], "star": 2},
                {"id": "DA_18_Malphite", "role": "メインタンク", "row": 0, "col": 3, "items": ["TFT_Item_WarmogsArmor", "TFT_Item_GargoyleStoneplate", "TFT_Item_DragonsClaw"], "star": 2},
                {"id": "DA_18_Veigar", "role": "サブキャリー", "row": 3, "col": 5, "items": ["TFT_Item_BlueBuff", "TFT_Item_RabadonsDeathcap"], "star": 2},
                {"id": "DA_18_RekSai", "role": "サブタンク", "row": 0, "col": 2, "items": ["TFT_Item_SteadfastHeart"], "star": 2},
                {"id": "DA_18_Sett", "role": "フロントライン", "row": 0, "col": 4, "items": ["TFT_Item_SunfireCape"], "star": 2},
                {"id": "DA_18_Yunara", "role": "バックライン", "row": 3, "col": 2, "items": ["TFT_Item_GiantSlayer"], "star": 2},
                {"id": "DA_18_Ezreal", "role": "キャリー", "row": 3, "col": 6, "items": ["TFT_Item_InfinityEdge"], "star": 2},
                {"id": "DA_18_Kobuko", "role": "サブタンク", "row": 0, "col": 1, "items": ["TFT_Item_Crownguard"], "star": 2}
            ]
        }
    ]

    for idx, comp in enumerate(doubleup_comps):
        cursor.execute("""
            INSERT OR REPLACE INTO aggregated_comps 
            (comp_key, queue_id, display_name, main_carry_id, traits_summary, sample_size, avg_placement, top2_rate, top4_rate, win_rate, tier, best_items_json, units_detail_json, reroll_level, overview, play_conditions, progression_guide, dedicated_augment, recommended_augments_json, level_boards_json, partner_comp_keys_json, is_custom, display_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
        """, (
            comp["comp_key"],
            comp["queue_id"],
            comp["display_name"],
            comp["main_carry_id"],
            comp["traits_summary"],
            comp["sample_size"],
            comp["avg_placement"],
            comp["top2_rate"],
            comp["top4_rate"],
            comp["win_rate"],
            comp["tier"],
            comp["best_items_json"],
            json.dumps(comp["units_detail"]),
            comp.get("reroll_level", "Standard"),
            comp.get("overview", ""),
            comp.get("play_conditions", ""),
            comp.get("progression_guide", ""),
            comp.get("dedicated_augment", ""),
            comp.get("recommended_augments_json", "[]"),
            comp.get("level_boards_json", "{}"),
            comp.get("partner_comp_keys_json", "[]"),
            idx
        ))

    conn.commit()
    conn.close()
    print("Seeded registered Double Up (1160) comps with custom status enabled.")


def aggregate_statistics(queue_id: int = 1160):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT p.comp_key, p.placement, p.units_json
        FROM participants p
        JOIN matches m ON p.match_id = m.match_id
        WHERE m.queue_id = ? AND p.comp_key IS NOT NULL AND p.comp_key != ''
    """, (queue_id,))
    rows = cursor.fetchall()

    if not rows:
        conn.close()
        return

    comp_stats = defaultdict(lambda: {"placements": [], "carry_items": defaultdict(int), "carry_id": None})

    for row in rows:
        ckey = row["comp_key"]
        placement = row["placement"]
        units = json.loads(row["units_json"]) if row["units_json"] else []

        comp_stats[ckey]["placements"].append(placement)

        carry_id = ckey.split("_")[-1] if "_" in ckey else None
        if carry_id:
            comp_stats[ckey]["carry_id"] = carry_id
            for u in units:
                if u.get("character_id") == carry_id:
                    for iname in u.get("itemNames", []):
                        comp_stats[ckey]["carry_items"][iname] += 1

    for ckey, stats in comp_stats.items():
        placements = stats["placements"]
        n = len(placements)
        avg_p = round(sum(placements) / n, 2)
        top2 = round(sum(1 for p in placements if p <= 2) / n * 100, 1)
        top4 = round(sum(1 for p in placements if p <= 4) / n * 100, 1)
        win = round(sum(1 for p in placements if p == 1) / n * 100, 1)

        # 5 段階ティア分類 (OP, S, A, B, C) - キュー独立判定
        if queue_id == SOLO_QUEUE_ID:
            if avg_p <= 2.80:
                tier = "OP"
            elif avg_p <= 3.60:
                tier = "S"
            elif avg_p <= 4.40:
                tier = "A"
            elif avg_p <= 5.20:
                tier = "B"
            else:
                tier = "C"
        else:
            if avg_p <= 1.70:
                tier = "OP"
            elif avg_p <= 2.30:
                tier = "S"
            elif avg_p <= 2.80:
                tier = "A"
            elif avg_p <= 3.30:
                tier = "B"
            else:
                tier = "C"

        sorted_items = sorted(stats["carry_items"].items(), key=lambda x: x[1], reverse=True)
        best_items = [item[0] for item in sorted_items[:3]]

        cursor.execute("""
            INSERT OR REPLACE INTO aggregated_comps 
            (comp_key, queue_id, display_name, main_carry_id, traits_summary, sample_size, avg_placement, top2_rate, top4_rate, win_rate, tier, best_items_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            ckey, queue_id, ckey, stats["carry_id"] or "", "", n, avg_p, top2, top4, win, tier, json.dumps(best_items)
        ))

    conn.commit()
    conn.close()


def crawl_and_save(queue_id: int = 1160):
    print(f"Starting crawl for queue_id {queue_id}...")
    if queue_id == SOLO_QUEUE_ID:
        puuids = get_single_rank_top_players(count=50)
    else:
        puuids = get_double_up_top_players(count=50)

    queue_name = "Single Rank (1100)" if queue_id == SOLO_QUEUE_ID else "Double Up (1160)"
    print(f"Fetched {len(puuids)} top players for {queue_name} crawl batch.")

    if not puuids:
        print(f"Could not fetch top players for {queue_name}. Ensuring seed data exists.")
        seed_sample_data()
        return

    conn = get_connection()
    cursor = conn.cursor()
    match_ids_set = set()

    for p in puuids:
        mids = get_recent_matches(p, count=10)
        match_ids_set.update(mids)

    print(f"Found {len(match_ids_set)} unique matches to inspect for {queue_name}.")

    saved_count = 0
    for mid in list(match_ids_set):
        cursor.execute("SELECT match_id FROM matches WHERE match_id = ?", (mid,))
        if cursor.fetchone():
            continue

        detail = get_match_detail(mid)
        if not detail or "info" not in detail:
            continue

        info = detail["info"]
        if info.get("queue_id") != queue_id:
            continue

        cursor.execute("""
            INSERT OR IGNORE INTO matches (match_id, queue_id, game_datetime, game_version, tft_set_number)
            VALUES (?, ?, ?, ?, ?)
        """, (
            mid,
            queue_id,
            info.get("game_datetime"),
            info.get("game_version"),
            info.get("tft_set_number")
        ))

        participants = info.get("participants", [])
        for p in participants:
            puuid = p.get("puuid")
            placement = p.get("placement")
            level = p.get("level")
            units = p.get("units", [])
            traits = p.get("traits", [])

            ckey, dname, carry_id = determine_comp_key(units, traits)

            cursor.execute("""
                INSERT OR IGNORE INTO participants (match_id, puuid, placement, level, comp_key, traits_json, units_json)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                mid,
                puuid,
                placement,
                level,
                ckey,
                json.dumps(traits),
                json.dumps(units)
            ))

        saved_count += 1
        if saved_count % 10 == 0:
            conn.commit()

    conn.commit()
    conn.close()

    print(f"Successfully saved {saved_count} new {queue_name} matches to SQLite database.")
    aggregate_statistics(queue_id)