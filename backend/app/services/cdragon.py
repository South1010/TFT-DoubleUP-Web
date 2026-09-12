import os
import json
import requests
from app.config import CDRAGON_JA_JSON_URL, CDRAGON_ASSET_BASE, CURRENT_TFT_SET, CURRENT_SET_MUTATOR

class CDragonMaster:
    def __init__(self):
        self.champions = {}
        self.items = {}
        self.augments = {}
        self.traits = {}
        self.load_master()

    def _format_url(self, path: str) -> str:
        if not path:
            return ""
        if path.startswith("http://") or path.startswith("https://"):
            return path
        p = path.lower()
        for ext in [".dds", ".tex"]:
            if p.endswith(ext):
                p = p[:-len(ext)] + ".png"
                break
        return f"{CDRAGON_ASSET_BASE}{p.lstrip('/')}"

    def load_master(self):
        try:
            possible_paths = [
                os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../frontend/tft_set_18.json")),
                os.path.abspath(os.path.join(os.path.dirname(__file__), "../../tft_set_18.json")),
                "c:/TFT-DoubleUP-Web/frontend/tft_set_18.json"
            ]

            master_path = None
            for p in possible_paths:
                if os.path.exists(p):
                    master_path = p
                    break

            if master_path:
                with open(master_path, "r", encoding="utf-8") as f:
                    master_data = json.load(f)

                pve_keywords = [
                    "Dummy", "Stage", "Shop", "NPC", "Minion", "Treasure",
                    "Turret", "Target", "ダミー", "宝箱", "金床"
                ]

                CHAMP_ENGLISH_NAMES = {
                    "ラックス": "Lux", "タリック": "Taric", "ザイラ": "Zyra", "ドレイヴン": "Draven",
                    "マルファイト": "Malphite", "マオカイ": "Maokai", "アルーン": "Alune", "アイバーン": "Ivern",
                    "コグ＝マウ": "KogMaw", "コグマウ": "KogMaw", "アカリ": "Akali", "ヴァルス": "Varus", "シェン": "Shen",
                    "アムム": "Amumu", "ケネン": "Kennen", "オーン": "Ornn", "ザヤ": "Xayah",
                    "アリスター": "Alistar", "ルブラン": "Leblanc", "ヘカリム": "Hecarim", "エズリアル": "Ezreal",
                    "ナー": "Gnar", "コブコ": "Kobuko", "ベイガー": "Veigar", "ティーモ": "Teemo",
                    "ラムス": "Rammus", "トリスターナ": "Tristana", "レオナ": "Leona", "ケイル": "Kayle",
                    "セジュアニ": "Sejuani", "ケイトリン": "Caitlyn", "ワーウィック": "Warwick", "アジール": "Azir",
                    "カシオペア": "Cassiopeia", "カ＝ジックス": "Khazix", "カジックス": "Khazix", "アンベッサ": "Ambessa", "イラオイ": "Illaoi",
                    "エコー": "Ekko", "エリス": "Elise", "ガレン": "Garen", "コーキ": "Corki",
                    "セヴィカ": "Sevika", "マルザハール": "Malzahar", "モルデカイザー": "Mordekaiser", "ランブル": "Rumble",
                    "ビクター": "Viktor", "メル": "Mel", "マスター・イー": "MasterYi", "マスターイー": "MasterYi", "ラカン": "Rakan",
                    "リリア": "Lillia", "ジンクス": "Jinx", "ヴァイ": "Vi", "シルコ": "Silco",
                    "ハイマーディンガー": "Heimerdinger", "ジェイス": "Jayce", "スウェイン": "Swain",
                    "カルマ": "Karma", "ヨリック": "Yorick", "カミール": "Camille", "シンダーリング": "Cinderling",
                    "レク＝サイ": "RekSai", "レクサイ": "RekSai", "小石": "Sentry", "グロンプ": "Gromp",
                    "スカトルクラブ": "ScuttleCrab", "スカトル": "ScuttleCrab", "マークウルフ": "Murkwolf",
                    "ユナラ": "Yunara", "ダイアナ": "Diana", "フィドルスティックス": "Fiddlesticks",
                    "フィドルステックス": "Fiddlesticks", "ママ鳥": "MamaBird", "レンガー": "Rengar",
                    "アーリ": "Ahri", "アフェリオス": "Aphelios", "シヴィア": "Sivir", "セト": "Sett",
                    "ソラカ": "Soraka", "ニダリー": "Nidalee", "ブランブルバック": "Brambleback",
                    "モルガナ": "Morgana", "守護神": "Sentinel", "アッシュ": "Ashe",
                    "エルダードラゴン": "ElderDragon", "クルーグ": "Krug"
                }

                # 1. Champions (Set 18 マスタ)
                for c in master_data.get("champions", []):
                    cname = c.get("name", "")
                    cost = c.get("cost", 1)
                    if cname and cost <= 7:
                        if any(k.lower() in cname.lower() for k in pve_keywords):
                            continue
                        cid = f"TFT18_{cname}"
                        eng_name = CHAMP_ENGLISH_NAMES.get(cname, cname.capitalize())
                        lower_eng = eng_name.lower()
                        icon_url = f"https://raw.communitydragon.org/latest/game/assets/characters/tft18_{lower_eng}/tft18_{lower_eng}_square.png"
                        if cname == "ママ鳥" or eng_name == "MamaBird":
                            icon_url = "https://raw.communitydragon.org/latest/game/assets/characters/tft_razorbeak/hud/razorbeak_square.png"

                        champ_obj = {
                            "name": cname,
                            "cost": cost,
                            "icon": icon_url,
                            "traits": c.get("traits", [])
                        }

                        # Store under all common key variations
                        self.champions[cid] = champ_obj
                        self.champions[cname] = champ_obj
                        self.champions[eng_name] = champ_obj
                        self.champions[f"DA_18_{eng_name}"] = champ_obj
                        self.champions[f"TFT18_{eng_name}"] = champ_obj
                        self.champions[f"DA_18_{eng_name}_AD"] = champ_obj
                        self.champions[f"DA_18_{eng_name}_AP"] = champ_obj
                        self.champions[f"TFT18_{eng_name}_AD"] = champ_obj
                        self.champions[f"TFT18_{eng_name}_AP"] = champ_obj
                        if eng_name == "Gnar":
                            self.champions["DA_18_GnarSmall"] = champ_obj
                            self.champions["TFT18_GnarSmall"] = champ_obj

                # 2. Traits (Set 18 マスタ: origins & classes)
                traits_raw = []
                t_dict = master_data.get("traits", {})
                if isinstance(t_dict, dict):
                    traits_raw.extend(t_dict.get("origins", []))
                    traits_raw.extend(t_dict.get("classes", []))

                for t in traits_raw:
                    tname = t.get("name")
                    if tname:
                        tid = f"TFT18_Trait_{tname}"
                        self.traits[tid] = {
                            "name": tname,
                            "icon": f"https://raw.communitydragon.org/latest/game/assets/ux/traiticons/trait_icon_18_{tname.lower()}.png",
                            "description": t.get("description", "")
                        }

                master_augment_icons = {}
                set_master_paths = [
                    os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../frontend/tft_set_master.json")),
                    os.path.abspath(os.path.join(os.path.dirname(__file__), "../../tft_set_master.json")),
                    "c:/TFT-DoubleUP-Web/frontend/tft_set_master.json"
                ]
                for sm_p in set_master_paths:
                    if os.path.exists(sm_p):
                        try:
                            with open(sm_p, "r", encoding="utf-8") as sm_f:
                                sm_data = json.load(sm_f)
                                for item in sm_data.get("items", []):
                                    iname = item.get("name")
                                    iicon = item.get("icon")
                                    if iname and iicon:
                                        master_augment_icons[iname.strip().lower()] = iicon
                        except Exception:
                            pass
                        break

                # 3. Augments (Set 18 マスタ)
                for a in master_data.get("augments", []):
                    aname = a.get("name", "")
                    if aname:
                        aid = f"TFT18_Augment_{aname}"
                        tier_str = str(a.get("tier", "Gold")).lower()
                        if "silver" in tier_str:
                            fallback_icon = "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/augments/hexcore/tft_augment_generic_silver.png"
                        elif "prismatic" in tier_str:
                            fallback_icon = "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/augments/hexcore/tft_augment_generic_prismatic.png"
                        else:
                            fallback_icon = "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/augments/hexcore/tft_augment_generic_gold.png"

                        icon_url = master_augment_icons.get(aname.lower(), fallback_icon)
                        self.augments[aid] = {
                            "id": aid,
                            "name": aname,
                            "tier": a.get("tier", "Gold"),
                            "icon": icon_url,
                            "desc": a.get("description", "")
                        }

                # 4. Items (Set 18 完成装備)
                ITEM_MAP_OVERRIDE = {
                    "TFT_Item_SteadfastHeart": "tft_item_nightharvester.png",
                    "TFT_Item_EdgeOfNight": "tft_item_guardianangel.png",
                    "TFT_Item_HandOfJustice": "tft_item_unstableconcoction.png",
                    "TFT_Item_RunaansHurricane": "tft_item_krakenslayer.png",
                    "TFT_Item_SunfireCape": "tft_item_redbuff.png",
                    "TFT_Item_RedBuff": "tft_item_rapidfirecannon.png",
                    "TFT_Item_GiantSlayer": "tft_item_madredsbloodrazor.png",
                    "TFT_Item_SpiritVisage": "tft_item_spiritvisagerr.png",
                    "TFT_Item_ProtectorsVow": "tft_item_frozenheart.png",
                    "TFT_Item_FrozenHeart": "tft_item_frozenheart.png",
                    "TFT_Item_StrikerFlail": "tft_item_powergauntlet.png",
                    "TFT_Item_PowerGauntlet": "tft_item_powergauntlet.png",
                    "TFT_Item_Evenshroud": "tft_item_spectralgauntlet.png",
                    "TFT18_Item_FloraFatalisEmblem": "https://raw.communitydragon.org/latest/game/assets/ux/traiticons/trait_icon_18_florafatalis.png",
                    "TFT18_Item_FaeEmblem": "https://raw.communitydragon.org/latest/game/assets/ux/traiticons/trait_icon_18_fae.png",
                    "DA_18_EmblemFae": "https://raw.communitydragon.org/latest/game/assets/ux/traiticons/trait_icon_18_fae.png"
                }

                standard_items = [
                    ("TFT_Item_InfinityEdge", "インフィニティ・エッジ", "物理ダメージ+35%、クリティカル率+35%"),
                    ("TFT_Item_GuinsoosRageblade", "グインサー・レイジブレード", "通常攻撃ごとに攻撃速度が5%増加する。"),
                    ("TFT_Item_LastWhisper", "ラスト リスパー", "物理ダメージを与えると、3秒間30%の物理防御低下を付与する。"),
                    ("TFT_Item_BlueBuff", "ブルーバフ", "最大マナが10減少する。キルまたはアシスト時にマナを10回復する。"),
                    ("TFT_Item_JeweledGauntlet", "ジュエル ガントレット", "スキルがクリティカル判定を持つようになり、魔力+35%、クリティカル率+35%獲得。"),
                    ("TFT_Item_RabadonsDeathcap", "ラバドン デスキャップ", "魔力+50、さらに20%の追加ダメージ増加。"),
                    ("TFT_Item_WarmogsArmor", "ワーモグ・アーマー", "体力+800、最大体力が12%増加。"),
                    ("TFT_Item_BrambleVest", "ブランブル ベスト", "物理防御+55、受けるクリティカルダメージを軽減。"),
                    ("TFT_Item_DragonsClaw", "ドラゴン クロウ", "魔法防御+65、2秒ごとに最大体力の5%を回復。"),
                    ("TFT_Item_GargoyleStoneplate", "ガーゴイル ストーンプレート", "自身を攻撃対象とする敵1体につき、防御力・魔法防御が+15増加。"),
                    ("TFT_Item_SunfireCape", "サンファイア・ケープ", "2秒ごとに周囲の敵を燃焼させ、負傷と火傷ダメージを与える。"),
                    ("TFT_Item_GiantSlayer", "ジャイアント スレイヤー", "体力が1750以上の高体力の敵に対して与えるダメージが25%増加。"),
                    ("TFT_Item_RedBuff", "レッドバフ", "攻撃速度+40%、通常攻撃に燃焼効果を付与。"),
                    ("TFT_Item_SpearOfShojin", "ショウジンの矛", "通常攻撃ごとに追加でマナを5回復する。"),
                    ("TFT_Item_VoidStaff", "ヴォイドスタッフ", "魔力+30、攻撃またはスキルで敵の魔法防御を30%減少させる。"),
                    ("TFT_Item_Morellonomicon", "モレロノミコン", "魔法スキルダメージを与えた際、燃焼と負傷を付与する。"),
                    ("TFT_Item_Crownguard", "クラウンガード", "戦闘開始時、耐久値シールドを獲得し、シールド消滅時に魔力を獲得。"),
                    ("TFT_Item_SteadfastHeart", "揺るがぬ心", "受けるダメージを8%軽減し、体力が50%以上で軽減率が15%に増加。"),
                    ("TFT_Item_TitansResolve", "巨人の誓い", "ダメージを与えるか受けるとスタックを獲得し、攻撃力・魔力・防御力が増加。"),
                    ("TFT_Item_HextechGunblade", "ヘックステック ガンブレード", "与えたダメージの20%分、最も体力が低い味方を回復。"),
                    ("TFT_Item_ArchangelsStaff", "アークエンジェル スタッフ", "5秒ごとに魔力が+20増加する。"),
                    ("TFT_Item_EdgeOfNight", "ナイト エッジ", "体力が60%以下になると一時的にステルス状態になり、デバフを解除。"),
                    ("TFT_Item_HandOfJustice", "ハンド オブ ジャスティス", "攻撃力・魔力+15%、オムニヴァンプ+15%。毎ラウンド効果が強化。"),
                    ("TFT_Item_SpiritVisage", "スピリットビサージュ", "魔法防御+25、1秒ごとに最大体力の2.5%を回復する。"),
                    ("TFT_Item_Quicksilver", "クイックシルバー", "戦闘開始から14秒間、行動阻害効果を無効化し攻撃速度が増加。"),
                    ("TFT_Item_RunaansHurricane", "クラーケンの怒り", "通常攻撃が近くの敵にも矢を放ち、物理ダメージを与える。"),
                    ("TFT_Item_ThiefsGloves", "盗賊のグローブ", "毎ラウンド、ランダムな完成アイテムを2つ一時的に獲得する。"),
                    ("TFT_Item_SteraksGage", "ステラックの篭手", "体力が60%以下になると最大体力が増加し、物理攻撃力が増加。"),
                    ("TFT_Item_IonicSpark", "イオニック スパーク", "周囲の敵の魔法防御を低下させ、スキル使用時に魔法ダメージを与える。"),
                    ("TFT_Item_AdaptiveHelm", "アダプティブ ヘルム", "前衛配置時は防御力増加、後衛配置時は魔力とマナ獲得速度が増加。"),
                    ("TFT_Item_Bloodthirster", "ブラッドサースター", "オムニヴァンプ+20%。体力が40%以下になるとシールドを獲得。"),
                    ("TFT_Item_ProtectorsVow", "プロテクターの誓い", "初期マナ+45、物理防御+20。体力が40%以下になると最大体力の25%のシールドを獲得。"),
                    ("TFT_Item_StrikerFlail", "ストライカーフレイル", "攻撃速度+15%、クリティカル率+20%。通常攻撃またはスキル発動で追加物理ダメージを与える。"),
                    ("TFT_Item_Deathblade", "デスブレード", "物理攻撃力+55%、5%の追加ダメージを与える。"),
                    ("TFT_Item_Evenshroud", "イーブンシュラウド", "体力+150、魔法防御+20。周囲2マスの敵の物理防御を30%低下させる。"),
                    ("TFT18_Item_FloraFatalisEmblem", "フローラ・ファターリスの紋章", "フローラ・ファターリス特性を獲得する。"),
                    ("TFT18_Item_FaeEmblem", "フェイの紋章", "フェイ特性を獲得する。"),
                    ("DA_18_EmblemFae", "フェイの紋章", "フェイ特性を獲得する。")
                ]

                for iid, iname, idesc in standard_items:
                    item_file = ITEM_MAP_OVERRIDE.get(iid, f"{iid.lower()}.png")
                    if item_file.startswith("http://") or item_file.startswith("https://"):
                        icon_url = item_file
                    else:
                        icon_url = f"https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hexcore/{item_file}"
                    self.items[iid] = {
                        "name": iname,
                        "icon": icon_url,
                        "desc": idesc
                    }

                print(f"CDragonMaster strictly loaded from tft_set_18.json ({len(self.champions)} champions, {len(self.items)} items, {len(self.augments)} augments, {len(self.traits)} traits).")
                return

        except Exception as e:
            print(f"Failed to load tft_set_18.json: {e}")

cdragon = CDragonMaster()