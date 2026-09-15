from fastapi import FastAPI, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
import os
import json
from app.database import init_db, get_connection
from app.services.crawler import crawl_and_save, seed_sample_data
from app.services.cdragon import cdragon
import app.config as config

app = FastAPI(title="TFT Stats & Meta API (Double Up & Single Rank)", version="1.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_no_cache_header(request, call_next):
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

def _sync_all_bidirectional_partners(cursor):
    """
    データベース内の全構成の partner_comp_keys_json を監査し、
    片方向リンクが存在する場合は相手側にも相互追加し、完全な双方向関係を保つ。
    """
    cursor.execute("SELECT comp_key, partner_comp_keys_json FROM aggregated_comps WHERE is_custom = 1")
    rows = cursor.fetchall()
    if not rows:
        return

    comp_keys_set = {r["comp_key"] for r in rows}
    partners_map = {}

    for r in rows:
        ckey = r["comp_key"]
        pjson = r["partner_comp_keys_json"]
        try:
            pkeys = json.loads(pjson) if pjson else []
        except Exception:
            pkeys = []
        partners_map[ckey] = set(k for k in pkeys if k in comp_keys_set and k != ckey)

    synced_map = {ckey: set(pkeys) for ckey, pkeys in partners_map.items()}

    for ckey, pkeys in partners_map.items():
        for target_key in pkeys:
            if target_key in synced_map:
                synced_map[target_key].add(ckey)

    for ckey, synced_pkeys in synced_map.items():
        old_set = partners_map[ckey]
        if synced_pkeys != old_set:
            sorted_list = sorted(list(synced_pkeys))
            cursor.execute(
                "UPDATE aggregated_comps SET partner_comp_keys_json = ? WHERE comp_key = ?",
                (json.dumps(sorted_list), ckey)
            )

def load_custom_comps_from_seed(cursor):
    seed_path = os.path.join(os.path.dirname(__file__), "custom_comps_seed.json")
    if os.path.exists(seed_path):
        try:
            with open(seed_path, "r", encoding="utf-8") as f:
                comps = json.load(f)
            for idx, c in enumerate(comps):
                best_items_val = c.get("best_items_json") if isinstance(c.get("best_items_json"), str) else json.dumps(c.get("best_items_json", []))
                units_detail_val = c.get("units_detail_json") if isinstance(c.get("units_detail_json"), str) else json.dumps(c.get("units_detail_json", []))
                rec_augments_val = c.get("recommended_augments_json") if isinstance(c.get("recommended_augments_json"), str) else json.dumps(c.get("recommended_augments_json", []))
                level_boards_val = c.get("level_boards_json") if isinstance(c.get("level_boards_json"), str) else json.dumps(c.get("level_boards_json", {}))
                partner_keys_val = c.get("partner_comp_keys_json") if isinstance(c.get("partner_comp_keys_json"), str) else json.dumps(c.get("partner_comp_keys_json", []))

                cursor.execute("""
                    INSERT OR REPLACE INTO aggregated_comps 
                    (comp_key, queue_id, display_name, main_carry_id, traits_summary, sample_size, avg_placement, top2_rate, top4_rate, win_rate, tier, best_items_json, units_detail_json, reroll_level, overview, play_conditions, progression_guide, dedicated_augment, recommended_augments_json, level_boards_json, partner_comp_keys_json, is_custom, display_order)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
                """, (
                    c["comp_key"],
                    c.get("queue_id", 1160),
                    c["display_name"],
                    c["main_carry_id"],
                    c.get("traits_summary", ""),
                    c.get("sample_size", 100),
                    c.get("avg_placement", 1.5),
                    c.get("top2_rate", 80.0),
                    c.get("top4_rate", 90.0),
                    c.get("win_rate", 40.0),
                    c.get("tier", "S"),
                    best_items_val,
                    units_detail_val,
                    c.get("reroll_level", "Standard"),
                    c.get("overview", ""),
                    c.get("play_conditions", ""),
                    c.get("progression_guide", ""),
                    c.get("dedicated_augment", ""),
                    rec_augments_val,
                    level_boards_val,
                    partner_keys_val,
                    c.get("display_order", idx)
                ))
            print(f"Loaded {len(comps)} custom comps from custom_comps_seed.json successfully.")
        except Exception as e:
            print(f"Error loading custom_comps_seed.json: {e}")

def dump_custom_comps_to_seed(cursor):
    seed_path = os.path.join(os.path.dirname(__file__), "custom_comps_seed.json")
    try:
        cursor.execute("SELECT * FROM aggregated_comps WHERE is_custom = 1 ORDER BY COALESCE(display_order, 0) ASC, rowid ASC")
        rows = cursor.fetchall()
        comps_data = [dict(r) for r in rows]
        with open(seed_path, "w", encoding="utf-8") as f:
            json.dump(comps_data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Error dumping custom_comps_seed.json: {e}")

@app.on_event("startup")
def on_startup():
    init_db()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE aggregated_comps SET is_custom = 1 WHERE is_custom IS NULL OR is_custom = 0")
    cursor.execute("SELECT COUNT(*) as cnt FROM aggregated_comps WHERE is_custom = 1")
    row = cursor.fetchone()
    if not row or row["cnt"] < 20:
        load_custom_comps_from_seed(cursor)
    _sync_all_bidirectional_partners(cursor)
    _normalize_display_orders(cursor)
    conn.commit()
    conn.close()

from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from fastapi import HTTPException

ADMIN_PASSCODE = config.ADMIN_PASSCODE

class AdminAuthRequest(BaseModel):
    passcode: str

class CustomCompSaveRequest(BaseModel):
    passcode: str
    comp_key: Optional[str] = None
    queue_id: Optional[int] = 1160
    display_name: str
    tier: str = "S"
    main_carry_id: str
    traits_summary: Optional[str] = ""
    reroll_level: Optional[str] = "Standard"
    overview: Optional[str] = ""
    play_conditions: Optional[str] = ""
    progression_guide: Optional[str] = ""
    dedicated_augment: Optional[str] = ""
    recommended_augments: Optional[List[str]] = []
    units_detail: Optional[List[Dict[str, Any]]] = []
    level_boards: Optional[Dict[str, List[Dict[str, Any]]]] = {}
    partner_comp_keys: Optional[List[str]] = []

class TogglePartnerRequest(BaseModel):
    passcode: str = ADMIN_PASSCODE
    source_comp_key: str
    target_comp_key: str
    is_selected: bool

def format_comp_row(r, comp_by_key_map=None):
    r_keys = r.keys()

    def get_str_id(val):
        if isinstance(val, dict):
            return str(val.get("id") or val.get("name") or "")
        return str(val or "")

    best_items_raw = json.loads(r["best_items_json"]) if ("best_items_json" in r_keys and r["best_items_json"]) else []
    best_items = []
    for raw_item in best_items_raw:
        iid = get_str_id(raw_item)
        if not iid: continue
        iinfo = cdragon.items.get(iid, {})
        best_items.append({
            "id": iid,
            "name": iinfo.get("name") or (raw_item.get("name") if isinstance(raw_item, dict) else iid),
            "icon": iinfo.get("icon") or (raw_item.get("icon") if isinstance(raw_item, dict) else "")
        })
    
    carry_id = get_str_id(r["main_carry_id"])
    carry_info = cdragon.champions.get(carry_id, {})
    if not carry_info.get("icon"):
        clean_cid = carry_id.replace("DA_18_", "").replace("TFT18_", "").replace("_AD", "").replace("_AP", "")
        carry_info = cdragon.champions.get(clean_cid, carry_info)

    units_detail_raw = json.loads(r["units_detail_json"]) if ("units_detail_json" in r_keys and r["units_detail_json"]) else []
    units_detail = []
    for u in units_detail_raw:
        cid = get_str_id(u.get("id", "")) or get_str_id(u)
        cinfo = cdragon.champions.get(cid) or cdragon.champions.get(cid.replace("DA_18_", "").replace("TFT18_", "").replace("_AD", "").replace("_AP", "")) or {}
        u_items = []
        for raw_item in u.get("items", []):
            item_id = get_str_id(raw_item)
            if not item_id: continue
            iinfo = cdragon.items.get(item_id, {})
            u_items.append({
                "id": item_id,
                "name": iinfo.get("name") or (raw_item.get("name") if isinstance(raw_item, dict) else item_id),
                "icon": iinfo.get("icon") or (raw_item.get("icon") if isinstance(raw_item, dict) else "")
            })

        units_detail.append({
            "id": cid,
            "name": u.get("name") or cinfo.get("name", cid.replace("DA_18_", "").replace("TFT18_", "")),
            "cost": cinfo.get("cost", u.get("cost", 1)),
            "icon": u.get("icon") or cinfo.get("icon", ""),
            "role": u.get("role", "ユニット"),
            "row": u.get("row", 0),
            "col": u.get("col", 0),
            "star": u.get("star", 2),
            "traits": cinfo.get("traits", []),
            "items": u_items
        })

    top4_val = r["top4_rate"] if ("top4_rate" in r_keys and r["top4_rate"] is not None) else r["top2_rate"]

    reroll_level = r["reroll_level"] if ("reroll_level" in r_keys and r["reroll_level"]) else "Standard"
    overview = r["overview"] if ("overview" in r_keys and r["overview"]) else ""
    play_conditions = r["play_conditions"] if ("play_conditions" in r_keys and r["play_conditions"]) else ""
    progression_guide = r["progression_guide"] if ("progression_guide" in r_keys and r["progression_guide"]) else ""
    dedicated_augment = r["dedicated_augment"] if ("dedicated_augment" in r_keys and r["dedicated_augment"]) else ""
    
    rec_augments_raw = json.loads(r["recommended_augments_json"]) if ("recommended_augments_json" in r_keys and r["recommended_augments_json"]) else []
    level_boards_raw = json.loads(r["level_boards_json"]) if ("level_boards_json" in r_keys and r["level_boards_json"]) else {}
    
    formatted_level_boards = {}
    for lvl, board in level_boards_raw.items():
        formatted_board = []
        for u in board:
            cid = get_str_id(u.get("id", "")) or get_str_id(u)
            cinfo = cdragon.champions.get(cid) or cdragon.champions.get(cid.replace("DA_18_", "").replace("TFT18_", "").replace("_AD", "").replace("_AP", "")) or {}
            u_items = []
            for raw_item in u.get("items", []):
                item_id = get_str_id(raw_item)
                if not item_id: continue
                iinfo = cdragon.items.get(item_id, {})
                u_items.append({
                    "id": item_id,
                    "name": iinfo.get("name") or (raw_item.get("name") if isinstance(raw_item, dict) else item_id),
                    "icon": iinfo.get("icon") or (raw_item.get("icon") if isinstance(raw_item, dict) else "")
                })
            formatted_board.append({
                "id": cid,
                "name": u.get("name") or cinfo.get("name", cid.replace("DA_18_", "").replace("TFT18_", "")),
                "cost": cinfo.get("cost", u.get("cost", 1)),
                "icon": u.get("icon") or cinfo.get("icon", ""),
                "role": u.get("role", "ユニット"),
                "row": u.get("row", 0),
                "col": u.get("col", 0),
                "star": u.get("star", 2),
                "traits": cinfo.get("traits", []),
                "items": u_items
            })
        formatted_level_boards[lvl] = formatted_board

    partner_keys_raw = json.loads(r["partner_comp_keys_json"]) if ("partner_comp_keys_json" in r_keys and r["partner_comp_keys_json"]) else []
    partner_comps = []
    if comp_by_key_map:
        for pkey in partner_keys_raw:
            if pkey in comp_by_key_map:
                pr = comp_by_key_map[pkey]
                pcarry_id = pr["main_carry_id"]
                pcarry = cdragon.champions.get(pcarry_id) or cdragon.champions.get(pcarry_id.replace("DA_18_", "").replace("TFT18_", "").replace("_AD", "").replace("_AP", "")) or {}
                partner_comps.append({
                    "comp_key": pr["comp_key"],
                    "display_name": pr["display_name"],
                    "tier": pr["tier"],
                    "traits_summary": pr["traits_summary"] or "",
                    "main_carry": {
                        "id": pcarry_id,
                        "name": pcarry.get("name", pcarry_id),
                        "cost": pcarry.get("cost", 1),
                        "icon": pcarry.get("icon", "")
                    }
                })

    return {
        "comp_key": r["comp_key"],
        "queue_id": r["queue_id"] if "queue_id" in r_keys else 1160,
        "display_name": r["display_name"],
        "tier": r["tier"],
        "avg_placement": r["avg_placement"],
        "top2_rate": r["top2_rate"],
        "top4_rate": top4_val,
        "win_rate": r["win_rate"],
        "sample_size": r["sample_size"],
        "traits_summary": r["traits_summary"] or "",
        "main_carry": {
            "id": r["main_carry_id"],
            "name": carry_info.get("name", r["main_carry_id"]),
            "cost": carry_info.get("cost", 1),
            "icon": carry_info.get("icon", "")
        },
        "best_items": best_items,
        "units_detail": units_detail,
        "reroll_level": reroll_level,
        "overview": overview,
        "play_conditions": play_conditions,
        "progression_guide": progression_guide,
        "dedicated_augment": dedicated_augment,
        "recommended_augments": rec_augments_raw,
        "level_boards": formatted_level_boards,
        "partner_comp_keys": partner_keys_raw,
        "partner_comps": partner_comps,
        "is_custom": r["is_custom"] if "is_custom" in r_keys else 0,
        "display_order": r["display_order"] if "display_order" in r_keys else 0
    }

TIER_ORDER = {"OP": 1, "S": 2, "A": 3, "B": 4, "C": 5}

def _normalize_display_orders(cursor):
    cursor.execute("SELECT comp_key, tier, display_name FROM aggregated_comps WHERE is_custom = 1")
    rows = cursor.fetchall()

    def comp_sort_key(r):
        t_str = (r["tier"] or "C").strip().upper()
        t_val = TIER_ORDER.get(t_str, 99)
        name_val = (r["display_name"] or "").strip()
        return (t_val, name_val)

    sorted_rows = sorted(rows, key=comp_sort_key)
    for idx, r in enumerate(sorted_rows):
        cursor.execute("UPDATE aggregated_comps SET display_order = ? WHERE comp_key = ?", (idx, r["comp_key"]))

@app.get("/api/comps")
def get_comps(queue_id: int = Query(1160, description="Queue ID: 1160 for Double Up")):
    conn = get_connection()
    cursor = conn.cursor()
    _sync_all_bidirectional_partners(cursor)
    _normalize_display_orders(cursor)
    conn.commit()
    cursor.execute("SELECT * FROM aggregated_comps WHERE is_custom = 1 ORDER BY COALESCE(display_order, 0) ASC, rowid ASC")
    rows = cursor.fetchall()
    conn.close()

    comp_by_key_map = {r["comp_key"]: r for r in rows}

    return [format_comp_row(r, comp_by_key_map) for r in rows]

@app.get("/api/debug/partner-sync")
def debug_partner_sync():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT comp_key, display_name, partner_comp_keys_json FROM aggregated_comps WHERE is_custom = 1")
    rows = cursor.fetchall()
    conn.close()
    result = []
    for r in rows:
        pjson = r["partner_comp_keys_json"]
        try:
            pkeys = json.loads(pjson) if pjson else []
        except Exception as e:
            pkeys = str(e)
        result.append({
            "comp_key": r["comp_key"],
            "display_name": r["display_name"],
            "raw_json": pjson,
            "parsed_keys": pkeys
        })
    return result

@app.get("/api/comps/{comp_key}")
def get_single_comp(comp_key: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM aggregated_comps WHERE comp_key = ?", (comp_key,))
    row = cursor.fetchone()
    
    cursor.execute("SELECT * FROM aggregated_comps")
    all_rows = cursor.fetchall()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Comp not found")

    comp_by_key_map = {r["comp_key"]: r for r in all_rows}
    return format_comp_row(row, comp_by_key_map)

@app.post("/api/admin/verify")
def verify_admin(req: AdminAuthRequest):
    if req.passcode == ADMIN_PASSCODE:
        return {"status": "ok", "authenticated": True}
    raise HTTPException(status_code=401, detail="無効な管理者パスコードです")

@app.post("/api/admin/comps")
def create_or_update_comp(req: CustomCompSaveRequest):
    if req.passcode != ADMIN_PASSCODE:
        raise HTTPException(status_code=401, detail="無効な管理者パスコードです")

    if req.comp_key:
        comp_key = req.comp_key
    else:
        import time
        comp_key = f"custom_{req.queue_id or 1160}_{req.main_carry_id}_{int(time.time() * 1000)}"

    best_items = []
    for u in req.units_detail or []:
        if u.get("id") == req.main_carry_id or u.get("name") == req.main_carry_id:
            for raw_item in u.get("items", []):
                if isinstance(raw_item, dict):
                    best_items.append(raw_item.get("id") or raw_item.get("name") or "")
                else:
                    best_items.append(str(raw_item))
            break

    conn = get_connection()
    cursor = conn.cursor()

    # 既存の partner_comp_keys_json および相手側から紐付いている構成を収集
    existing_partners_in_comp = []
    if comp_key:
        cursor.execute("SELECT partner_comp_keys_json FROM aggregated_comps WHERE comp_key = ?", (comp_key,))
        existing_row = cursor.fetchone()
        if existing_row and existing_row["partner_comp_keys_json"]:
            try:
                existing_partners_in_comp = json.loads(existing_row["partner_comp_keys_json"])
            except Exception:
                existing_partners_in_comp = []
    else:
        existing_row = None

    reverse_partners_in_db = []
    if comp_key:
        cursor.execute("SELECT comp_key, partner_comp_keys_json FROM aggregated_comps WHERE is_custom = 1 AND comp_key != ?", (comp_key,))
        all_other_rows = cursor.fetchall()
        for r in all_other_rows:
            if r["partner_comp_keys_json"]:
                try:
                    pk_list = json.loads(r["partner_comp_keys_json"])
                    if comp_key in pk_list:
                        reverse_partners_in_db.append(r["comp_key"])
                except Exception:
                    pass

    # リクエストの partner_comp_keys、既存の相手リスト、逆方向リンクを統合して紐付け解除を防ぐ
    req_partners = req.partner_comp_keys or []
    merged_partners_set = set(existing_partners_in_comp) | set(reverse_partners_in_db) | set(req_partners)
    new_partners = sorted([k for k in merged_partners_set if k != comp_key])

    if existing_row is not None:
        # 既存構成の更新
        cursor.execute("""
            UPDATE aggregated_comps
            SET queue_id = ?, display_name = ?, main_carry_id = ?, traits_summary = ?, sample_size = ?, avg_placement = ?, top2_rate = ?, top4_rate = ?, win_rate = ?, tier = ?, best_items_json = ?, units_detail_json = ?, reroll_level = ?, overview = ?, play_conditions = ?, progression_guide = ?, dedicated_augment = ?, recommended_augments_json = ?, level_boards_json = ?, partner_comp_keys_json = ?, is_custom = 1
            WHERE comp_key = ?
        """, (
            req.queue_id or 1160,
            req.display_name,
            req.main_carry_id,
            req.traits_summary or "",
            100,
            1.5 if req.tier in ["OP", "S"] else 3.0,
            80.0 if req.tier in ["OP", "S"] else 50.0,
            90.0 if req.tier in ["OP", "S"] else 70.0,
            40.0 if req.tier in ["OP", "S"] else 20.0,
            req.tier,
            json.dumps(best_items),
            json.dumps(req.units_detail or []),
            req.reroll_level or "Standard",
            req.overview or "",
            req.play_conditions or "",
            req.progression_guide or "",
            req.dedicated_augment or "",
            json.dumps(req.recommended_augments or []),
            json.dumps(req.level_boards or {}),
            json.dumps(new_partners),
            comp_key
        ))
    else:
        # 新規構成登録
        cursor.execute("""
            INSERT INTO aggregated_comps 
            (comp_key, queue_id, display_name, main_carry_id, traits_summary, sample_size, avg_placement, top2_rate, top4_rate, win_rate, tier, best_items_json, units_detail_json, reroll_level, overview, play_conditions, progression_guide, dedicated_augment, recommended_augments_json, level_boards_json, partner_comp_keys_json, is_custom, display_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)
        """, (
            comp_key,
            req.queue_id or 1160,
            req.display_name,
            req.main_carry_id,
            req.traits_summary or "",
            100,
            1.5 if req.tier in ["OP", "S"] else 3.0,
            80.0 if req.tier in ["OP", "S"] else 50.0,
            90.0 if req.tier in ["OP", "S"] else 70.0,
            40.0 if req.tier in ["OP", "S"] else 20.0,
            req.tier,
            json.dumps(best_items),
            json.dumps(req.units_detail or []),
            req.reroll_level or "Standard",
            req.overview or "",
            req.play_conditions or "",
            req.progression_guide or "",
            req.dedicated_augment or "",
            json.dumps(req.recommended_augments or []),
            json.dumps(req.level_boards or {}),
            json.dumps(new_partners)
        ))

    # --- 双方向 (Mutual) ベストマッチ連携処理 ---
    print(f"[MUTUAL LINK DEBUG] Saving comp_key={comp_key}, new_partners={new_partners}")
    
    # new_partners に含まれるすべての相手の構成に comp_key を相互で確実に追加
    for target_pkey in new_partners:
        cursor.execute("SELECT partner_comp_keys_json FROM aggregated_comps WHERE comp_key = ?", (target_pkey,))
        target_row = cursor.fetchone()
        if target_row:
            try:
                t_list = json.loads(target_row["partner_comp_keys_json"]) if target_row["partner_comp_keys_json"] else []
            except Exception:
                t_list = []
            if comp_key not in t_list:
                t_list.append(comp_key)
                cursor.execute("UPDATE aggregated_comps SET partner_comp_keys_json = ? WHERE comp_key = ?", (json.dumps(sorted(t_list)), target_pkey))
                print(f"[MUTUAL LINK DEBUG] Added {comp_key} to target {target_pkey}")

    # データベース全域の双方向リンク完全同期および表示順序正規化
    _sync_all_bidirectional_partners(cursor)
    _normalize_display_orders(cursor)
    dump_custom_comps_to_seed(cursor)

    conn.commit()
    conn.close()

    return {"status": "ok", "comp_key": comp_key, "message": "チーム構成が正常に保存され、ベストマッチが相互連携されました"}


@app.post("/api/admin/toggle-partner")
def toggle_partner_link(req: TogglePartnerRequest):
    if req.passcode != ADMIN_PASSCODE:
        raise HTTPException(status_code=401, detail="無効な管理者パスコードです")

    conn = get_connection()
    cursor = conn.cursor()

    src_key = req.source_comp_key
    tgt_key = req.target_comp_key

    # 1. Update source comp's partner list
    cursor.execute("SELECT partner_comp_keys_json FROM aggregated_comps WHERE comp_key = ?", (src_key,))
    src_row = cursor.fetchone()
    if src_row:
        try:
            src_list = json.loads(src_row["partner_comp_keys_json"]) if src_row["partner_comp_keys_json"] else []
        except Exception:
            src_list = []
        if req.is_selected:
            if tgt_key not in src_list:
                src_list.append(tgt_key)
        else:
            src_list = [k for k in src_list if k != tgt_key]
        cursor.execute("UPDATE aggregated_comps SET partner_comp_keys_json = ? WHERE comp_key = ?", (json.dumps(src_list), src_key))

    # 2. Update target comp's partner list (MUTUAL REAL-TIME UPDATE!)
    cursor.execute("SELECT partner_comp_keys_json FROM aggregated_comps WHERE comp_key = ?", (tgt_key,))
    tgt_row = cursor.fetchone()
    if tgt_row:
        try:
            tgt_list = json.loads(tgt_row["partner_comp_keys_json"]) if tgt_row["partner_comp_keys_json"] else []
        except Exception:
            tgt_list = []
        if req.is_selected:
            if src_key not in tgt_list:
                tgt_list.append(src_key)
        else:
            tgt_list = [k for k in tgt_list if k != src_key]
        cursor.execute("UPDATE aggregated_comps SET partner_comp_keys_json = ? WHERE comp_key = ?", (json.dumps(tgt_list), tgt_key))

    _normalize_display_orders(cursor)
    dump_custom_comps_to_seed(cursor)
    conn.commit()
    conn.close()

    return {"status": "ok", "message": "パートナー相性関係を即座に相互更新しました"}

class ReorderCompsRequest(BaseModel):
    passcode: str = ADMIN_PASSCODE
    comp_keys: List[str]

@app.post("/api/admin/reorder-comps")
def reorder_comps(req: ReorderCompsRequest):
    if req.passcode != ADMIN_PASSCODE:
        raise HTTPException(status_code=401, detail="無効な管理者パスコードです")

    conn = get_connection()
    cursor = conn.cursor()
    for idx, ckey in enumerate(req.comp_keys):
        cursor.execute("UPDATE aggregated_comps SET display_order = ? WHERE comp_key = ?", (idx, ckey))
    dump_custom_comps_to_seed(cursor)
    conn.commit()
    conn.close()
    return {"status": "ok", "message": "表示順序を正常に更新しました"}

@app.delete("/api/admin/comps/{comp_key}")
def delete_comp(comp_key: str, passcode: str = Query(...)):
    if passcode != ADMIN_PASSCODE:
        raise HTTPException(status_code=401, detail="無効な管理者パスコードです")

    conn = get_connection()
    cursor = conn.cursor()

    # 他の構成の partner_comp_keys_json からも削除対象 comp_key を削除
    cursor.execute("SELECT comp_key, partner_comp_keys_json FROM aggregated_comps WHERE is_custom = 1")
    rows = cursor.fetchall()
    for r in rows:
        if r["partner_comp_keys_json"]:
            pkeys = json.loads(r["partner_comp_keys_json"])
            if comp_key in pkeys:
                updated_pkeys = [k for k in pkeys if k != comp_key]
                cursor.execute("UPDATE aggregated_comps SET partner_comp_keys_json = ? WHERE comp_key = ?", (json.dumps(updated_pkeys), r["comp_key"]))

    cursor.execute("DELETE FROM aggregated_comps WHERE comp_key = ?", (comp_key,))
    _normalize_display_orders(cursor)
    dump_custom_comps_to_seed(cursor)
    conn.commit()
    conn.close()
    return {"status": "ok", "message": f"構成 {comp_key} を削除しました"}


@app.get("/api/champions")
def get_champions():
    seen_names = set()
    champs = []
    for cid, cdata in cdragon.champions.items():
        cname = cdata.get("name")
        if cname and cname not in seen_names:
            seen_names.add(cname)
            champs.append({"id": f"TFT18_{cname}", **cdata})
    # コスト順 (1 -> 5)、同コスト内はあいうえお順にソート
    champs.sort(key=lambda c: (c.get("cost", 1), c.get("name", "")))
    return champs

@app.get("/api/items")
def get_items():
    return [
        {"id": iid, **idata} for iid, idata in cdragon.items.items()
    ]

@app.get("/api/augments")
def get_augments():
    augments = [{"id": aid, **adata} for aid, adata in cdragon.augments.items()]

    def augment_sort_key(a):
        aname = a.get("name", "")
        tier_str = str(a.get("tier", "")).lower()
        if "silver" in tier_str or tier_str == "1" or tier_str == "i" or aname.endswith(" I") or " I " in aname:
            t_order = 1
        elif "prismatic" in tier_str or "rainbow" in tier_str or tier_str == "3" or tier_str == "iii" or "虹" in tier_str or aname.endswith(" III") or " III " in aname or "++" in aname:
            t_order = 3
        else:
            t_order = 2
        return (t_order, aname)

    augments.sort(key=augment_sort_key)
    return augments

@app.get("/api/system/status")
def get_status():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM matches WHERE queue_id = 1160")
    doubleup_matches = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM matches WHERE queue_id = 1100")
    single_matches = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM aggregated_comps WHERE queue_id = 1160")
    doubleup_comps = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM aggregated_comps WHERE queue_id = 1100")
    single_comps = cursor.fetchone()[0]
    conn.close()

    return {
        "status": "online",
        "doubleup_queue_id": config.DOUBLE_UP_QUEUE_ID,
        "single_queue_id": config.SOLO_QUEUE_ID,
        "region": config.REGION_ROUTING,
        "platform": config.PLATFORM_ROUTING,
        "total_doubleup_matches": doubleup_matches,
        "total_single_matches": single_matches,
        "total_doubleup_comps": doubleup_comps,
        "total_single_comps": single_comps,
        "api_key_configured": bool(config.RIOT_API_KEY and not config.RIOT_API_KEY.startswith("RGAPI-YOUR"))
    }

@app.get("/api/matches")
def get_matches(queue_id: int = Query(1160, description="Queue ID: 1160 for Double Up, 1100 for Single Rank"), limit: int = 50):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM matches WHERE queue_id = ? ORDER BY game_datetime DESC LIMIT ?", (queue_id, limit))
    match_rows = cursor.fetchall()

    if not match_rows:
        conn.close()
        return get_sample_matches(queue_id)

    matches_list = []
    for m in match_rows:
        mid = m["match_id"]
        cursor.execute("SELECT * FROM participants WHERE match_id = ? ORDER BY placement ASC", (mid,))
        p_rows = cursor.fetchall()
        
        participants = []
        for p in p_rows:
            comp_key = p["comp_key"] or ""
            carry_id = comp_key.split("_")[-1] if "_" in comp_key else ""
            cinfo = cdragon.champions.get(carry_id, {})
            traits = json.loads(p["traits_json"]) if p["traits_json"] else []
            units = json.loads(p["units_json"]) if p["units_json"] else []

            participants.append({
                "puuid": p["puuid"],
                "placement": p["placement"],
                "level": p["level"],
                "comp_key": comp_key,
                "display_name": f"{cinfo.get('name', carry_id)} キャリー" if cinfo.get('name') else comp_key,
                "main_carry": {
                    "id": carry_id,
                    "name": cinfo.get("name", carry_id),
                    "icon": cinfo.get("icon", ""),
                    "cost": cinfo.get("cost", 1)
                },
                "traits": traits,
                "units": units
            })

        matches_list.append({
            "match_id": mid,
            "queue_id": queue_id,
            "game_datetime": m["game_datetime"],
            "game_version": m["game_version"],
            "tft_set_number": m["tft_set_number"],
            "participants": participants
        })

    conn.close()
    return matches_list


def get_sample_matches(queue_id: int = 1160):
    """公式 Set 18 完全ユニークな対戦ログサンプルデータ 50件 (Double Up or Single Rank)"""
    sample_matches = []
    
    # DBから全メタ構成の units_detail を読み込んでマップを作成
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT main_carry_id, traits_summary, units_detail_json FROM aggregated_comps")
    comp_rows = cursor.fetchall()
    conn.close()

    comp_units_map = {}
    for r in comp_rows:
        cid = r["main_carry_id"]
        tsummary = r["traits_summary"]
        ud_raw = json.loads(r["units_detail_json"]) if r["units_detail_json"] else []
        
        formatted_units = []
        for u in ud_raw:
            unit_cid = u.get("id", "")
            cinfo = cdragon.champions.get(unit_cid, {})
            u_items = []
            for item_id in u.get("items", []):
                iinfo = cdragon.items.get(item_id, {})
                u_items.append({
                    "id": item_id,
                    "name": iinfo.get("name", item_id),
                    "icon": iinfo.get("icon", "")
                })

            formatted_units.append({
                "id": unit_cid,
                "name": cinfo.get("name", unit_cid.replace("DA_18_", "").replace("TFT18_", "")),
                "cost": cinfo.get("cost", 1),
                "icon": cinfo.get("icon", ""),
                "role": u.get("role", "ユニット"),
                "row": u.get("row", 0),
                "col": u.get("col", 0),
                "star": u.get("star", 2),
                "traits": cinfo.get("traits", []),
                "items": u_items
            })
        
        comp_units_map[cid] = {
            "traits_summary": tsummary,
            "units_detail": formatted_units
        }

    comp_pool = [
        ("DA_18_Ezreal", "4 エルダーウッド エズリアル & ザヤ", 4),
        ("DA_18_Veigar", "5 スプライキン ベイガー & ティーモ", 1),
        ("DA_18_Ahri", "5 ブロッサム アーリ & アッシュ", 4),
        ("DA_18_LeBlanc", "5 魔女 ルブラン & モルガナ", 4),
        ("DA_18_Akali_AD", "4 インフェルノ アカリ & ヴァルス", 1),
        ("DA_18_Ashe", "5 ブロッサム アッシュ", 5),
        ("DA_18_MasterYi_AD", "4 アダプター マスター・イー", 5),
        ("DA_18_Teemo", "5 スプライキン ティーモ", 2),
    ]

    # 40名以上のリアルな日本語・グローバル Summoner 名プール
    player_names_list = [
        "神楽#JP1", "TFT_God#JP1", "DoubleUp_King#JP1", "Setsuko#NA1", "Milk#NA1", 
        "Dishsoap#NA1", "Title#JP1", "Ryuki#JP1", "Sakura#JP1", "Kenshiro#JP1", 
        "Shadow_TFT#JP1", "Viper#JP1", "Phantom#JP1", "Alpha_TFT#JP1", "Beta_Pro#JP1", 
        "Gamma_Master#JP1", "Delta_Tactician#JP1", "Omega_Gamer#JP1", "Zenith#JP1", "Apex_Player#JP1", 
        "Vortex#JP1", "Blaze_Storm#JP1", "Frost_Bite#JP1", "Storm_Rider#JP1", "Cyber_Ninja#JP1", 
        "Nexus_Lord#JP1", "Mirage#JP1", "Eclipse_Sun#JP1", "Solaria#JP1", "Astra_Star#JP1", 
        "Luna_Moon#JP1", "Starlight#JP1", "Challenger_Ren#JP1", "GM_Kaelen#JP1", "Master_Sora#JP1", 
        "Master_Tariq#JP1", "D1_Vex#JP1", "D1_Milo#JP1", "D2_Zion#JP1", "D2_Kaito#JP1", 
        "Challenger_Ares#JP1", "GM_Lumi#JP1", "Master_Ken#JP1", "HighDiamond_Nox#JP1", "Challenger_Nyx#JP1"
    ]

    if queue_id == config.SOLO_QUEUE_ID:
        # Single Rank: 50試合 (各試合8名)
        for i in range(50):
            match_id = f"JP1_SOLO_5920{100 + i}"
            datetime_timestamp = 1756470000000 - (i * 2700000) # 約45分刻み
            
            shift = (i * 3) % len(comp_pool)
            
            participants = []
            for rank in range(1, 9):
                c_idx = (rank - 1 + shift) % len(comp_pool)
                # プレイヤー名を50試合全試合で完全に一意に割り当て
                pname = player_names_list[(i * 8 + rank - 1) % len(player_names_list)]
                
                cid, dname, cost = comp_pool[c_idx]
                level = 9 if rank <= 2 else 8 if rank <= 6 else 7
                
                detail_info = comp_units_map.get(cid, {})

                participants.append({
                    "puuid": pname,
                    "placement": rank,
                    "level": level,
                    "comp_key": f"1100_{cid}",
                    "display_name": dname,
                    "traits_summary": detail_info.get("traits_summary", ""),
                    "units_detail": detail_info.get("units_detail", []),
                    "main_carry": {
                        "id": cid,
                        "name": cdragon.champions.get(cid, {}).get("name", cid),
                        "icon": cdragon.champions.get(cid, {}).get("icon", ""),
                        "cost": cost
                    }
                })

            sample_matches.append({
                "match_id": match_id,
                "queue_id": 1100,
                "game_datetime": datetime_timestamp,
                "game_version": "Version 14.24.582.1928 (Set 18)",
                "tft_set_number": 18,
                "participants": participants
            })
    else:
        # Double Up: 50試合 (各試合4ペア8名)
        for i in range(50):
            match_id = f"JP1_DOUBLE_5839{100 + i}"
            datetime_timestamp = 1756470000000 - (i * 3600000) # 約1時間刻み
            
            shift = (i * 2) % len(comp_pool)
            
            participants = []
            for rank in range(1, 5):
                for pair_slot in range(2):
                    c_idx = (rank * 2 + pair_slot - 2 + shift) % len(comp_pool)
                    pname = player_names_list[(i * 8 + (rank-1)*2 + pair_slot) % len(player_names_list)]
                    
                    cid, dname, cost = comp_pool[c_idx]
                    level = 9 if rank == 1 else 8 if rank <= 3 else 7

                    detail_info = comp_units_map.get(cid, {})

                    participants.append({
                        "puuid": f"{pname} (ペア{chr(64+rank)})",
                        "placement": rank,
                        "level": level,
                        "comp_key": f"1160_{cid}",
                        "display_name": dname,
                        "traits_summary": detail_info.get("traits_summary", ""),
                        "units_detail": detail_info.get("units_detail", []),
                        "main_carry": {
                            "id": cid,
                            "name": cdragon.champions.get(cid, {}).get("name", cid),
                            "icon": cdragon.champions.get(cid, {}).get("icon", ""),
                            "cost": cost
                        }
                    })

            sample_matches.append({
                "match_id": match_id,
                "queue_id": 1160,
                "game_datetime": datetime_timestamp,
                "game_version": "Version 14.24.582.1928 (Set 18)",
                "tft_set_number": 18,
                "participants": participants
            })

    return sample_matches


@app.post("/api/crawl")
def trigger_crawl(background_tasks: BackgroundTasks, queue_id: int = Query(1160)):
    background_tasks.add_task(crawl_and_save, queue_id)
    queue_name = "Single Rank (1100)" if queue_id == 1100 else "Double Up (1160)"
    return {"status": f"Crawler started in background for {queue_name}"}