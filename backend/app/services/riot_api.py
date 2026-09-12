import time
import collections
import requests
import app.config as config

class RiotRateLimiter:
    """
    Riot Games API Rate Limiter
    Development Key Limits:
    - 20 requests per 1 second
    - 100 requests per 2 minutes (120 seconds)
    """
    def __init__(self):
        self.req_1s = collections.deque()   # timestamps in 1-second window
        self.req_120s = collections.deque() # timestamps in 120-second window

    def wait_if_needed(self):
        now = time.time()

        # Clean old timestamps
        while self.req_1s and now - self.req_1s[0] >= 1.0:
            self.req_1s.popleft()
        while self.req_120s and now - self.req_120s[0] >= 120.0:
            self.req_120s.popleft()

        # 1-second limit check (cap at 18 for safety margin)
        if len(self.req_1s) >= 18:
            sleep_time = 1.0 - (now - self.req_1s[0]) + 0.05
            if sleep_time > 0:
                print(f"[RateLimiter] 1-sec limit reached. Sleeping {sleep_time:.2f}s...")
                time.sleep(sleep_time)
                now = time.time()

        # 120-second (2 min) limit check (cap at 92 for safety margin)
        if len(self.req_120s) >= 92:
            sleep_time = 120.0 - (now - self.req_120s[0]) + 1.0
            if sleep_time > 0:
                print(f"[RateLimiter] 2-min limit reached ({len(self.req_120s)}/100). Sleeping {sleep_time:.1f}s...")
                time.sleep(sleep_time)
                now = time.time()

        # Record new request timestamp
        self.req_1s.append(now)
        self.req_120s.append(now)

        # Baseline pacing delay: ~1.2s per request guarantees continuous execution under 100 req / 2 min
        time.sleep(1.2)

rate_limiter = RiotRateLimiter()

def get_headers():
    return {"X-Riot-Token": config.RIOT_API_KEY}

def safe_request(url: str, params: dict = None):
    try:
        while True:
            rate_limiter.wait_if_needed()
            res = requests.get(url, headers=get_headers(), params=params)
            
            if res.status_code == 429:
                retry_after = int(res.headers.get("Retry-After", 10))
                print(f"[HTTP 429 Rate Limited] Riot API asked to wait {retry_after}s...")
                time.sleep(retry_after + 1)
                continue
            if res.status_code in (401, 403):
                print(f"Riot API Auth Error ({res.status_code}): Check RIOT_API_KEY")
                return None
            if res.status_code == 404:
                return None
            res.raise_for_status()
            return res.json()
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

def get_double_up_top_players(count: int = 100) -> list[str]:
    # ダブルアップ ランキング一覧取得 (RANKED_TFT_DOUBLE_UP or 1160)
    for q_name in ["RANKED_TFT_DOUBLE_UP", f"{config.DOUBLE_UP_QUEUE_ID}"]:
        url = f"https://{config.PLATFORM_ROUTING}.api.riotgames.com/tft/league/v1/rated-ladders/{q_name}/top"
        data = safe_request(url)
        if data and isinstance(data, list):
            puuids = [entry.get("puuid") or entry.get("summonerId") for entry in data[:count] if isinstance(entry, dict)]
            valid = [p for p in puuids if p]
            if valid:
                return valid

    # Fallback to Challenger ladder
    challenger_url = f"https://{config.PLATFORM_ROUTING}.api.riotgames.com/tft/league/v1/challenger"
    ch_data = safe_request(challenger_url)
    if ch_data and isinstance(ch_data, dict) and "entries" in ch_data:
        entries = ch_data["entries"]
        puuids = [e.get("puuid") for e in entries[:count] if isinstance(e, dict) and e.get("puuid")]
        if puuids:
            return puuids
        return [e.get("summonerId") for e in entries[:count] if isinstance(e, dict) and e.get("summonerId")]
    return []

def get_single_rank_top_players(count: int = 100) -> list[str]:
    # シングルランク (Ranked Solo) Top プレイヤー取得
    challenger_url = f"https://{config.PLATFORM_ROUTING}.api.riotgames.com/tft/league/v1/challenger"
    ch_data = safe_request(challenger_url, params={"queue": "RANKED_TFT"})
    if ch_data and isinstance(ch_data, dict) and "entries" in ch_data:
        entries = ch_data["entries"]
        puuids = [e.get("puuid") for e in entries[:count] if isinstance(e, dict) and e.get("puuid")]
        if puuids:
            return puuids
        return [e.get("summonerId") for e in entries[:count] if isinstance(e, dict) and e.get("summonerId")]
    
    # Fallback to Grandmaster
    gm_url = f"https://{config.PLATFORM_ROUTING}.api.riotgames.com/tft/league/v1/grandmaster"
    gm_data = safe_request(gm_url, params={"queue": "RANKED_TFT"})
    if gm_data and isinstance(gm_data, dict) and "entries" in gm_data:
        entries = gm_data["entries"]
        puuids = [e.get("puuid") for e in entries[:count] if isinstance(e, dict) and e.get("puuid")]
        if puuids:
            return puuids
    return []

def get_recent_matches(puuid: str, count: int = 10) -> list[str]:
    url = f"https://{config.REGION_ROUTING}.api.riotgames.com/tft/match/v1/matches/by-puuid/{puuid}/ids"
    return safe_request(url, params={"count": count}) or []

def get_match_detail(match_id: str):
    url = f"https://{config.REGION_ROUTING}.api.riotgames.com/tft/match/v1/matches/{match_id}"
    return safe_request(url)