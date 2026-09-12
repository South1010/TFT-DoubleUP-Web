import sqlite3
from app.config import DB_PATH

def get_connection():
    conn = sqlite3.connect(DB_PATH, timeout=20.0)
    conn.row_factory = sqlite3.Row
    try:
        conn.execute("PRAGMA journal_mode=WAL;")
    except Exception:
        pass
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS matches (
        match_id TEXT PRIMARY KEY,
        game_datetime INTEGER,
        game_version TEXT,
        tft_set_number INTEGER,
        queue_id INTEGER DEFAULT 1160
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
        queue_id INTEGER DEFAULT 1160,
        display_name TEXT,
        main_carry_id TEXT,
        traits_summary TEXT,
        sample_size INTEGER,
        avg_placement REAL,
        top2_rate REAL,
        top4_rate REAL DEFAULT 0.0,
        win_rate REAL,
        tier TEXT,
        best_items_json TEXT,
        units_detail_json TEXT
    )
    ''')

    try:
        cursor.execute("ALTER TABLE matches ADD COLUMN queue_id INTEGER DEFAULT 1160")
    except Exception:
        pass

    try:
        cursor.execute("ALTER TABLE aggregated_comps ADD COLUMN units_detail_json TEXT")
    except Exception:
        pass

    try:
        cursor.execute("ALTER TABLE aggregated_comps ADD COLUMN queue_id INTEGER DEFAULT 1160")
    except Exception:
        pass

    try:
        cursor.execute("ALTER TABLE aggregated_comps ADD COLUMN top4_rate REAL DEFAULT 0.0")
    except Exception:
        pass

    # Extended custom comp columns for TFT Double Up features
    extended_columns = [
        ("reroll_level", "TEXT DEFAULT 'Standard'"),
        ("overview", "TEXT DEFAULT ''"),
        ("play_conditions", "TEXT DEFAULT ''"),
        ("progression_guide", "TEXT DEFAULT ''"),
        ("dedicated_augment", "TEXT DEFAULT ''"),
        ("recommended_augments_json", "TEXT DEFAULT '[]'"),
        ("level_boards_json", "TEXT DEFAULT '{}'"),
        ("partner_comp_keys_json", "TEXT DEFAULT '[]'"),
        ("is_custom", "INTEGER DEFAULT 0"),
        ("display_order", "INTEGER DEFAULT 0")
    ]

    for col_name, col_type in extended_columns:
        try:
            cursor.execute(f"ALTER TABLE aggregated_comps ADD COLUMN {col_name} {col_type}")
        except Exception:
            pass

    cursor.execute("UPDATE aggregated_comps SET display_order = 0 WHERE display_order IS NULL")
    cursor.execute("UPDATE aggregated_comps SET is_custom = 1 WHERE is_custom IS NULL OR is_custom = 0")

    conn.commit()
    conn.close()