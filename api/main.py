import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from api.auth import hash_password, verify_password, create_access_token, decode_token
from storage.db import get_connection, upsert_artist, insert_metrics
from storage.seed_history import seed_artist
from features.momentum import compute_features, get_artist_history
from signals.engine import classify_signal
import pandas as pd
from ingestion.lastfm_client import get_artist as fetch_lastfm_artist


class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str

class LoginRequest(BaseModel):
    username: str
    password: str

class OpenPositionRequest(BaseModel):
    artist_id: str
    direction: str
    credits_wagered: str


app = FastAPI(title="Music Quant API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "https://music-stock-exchange.netlify.app"
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_all_artists():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name FROM artists;")
    artists = cursor.fetchall()
    cursor.close()
    conn.close()
    return artists

@app.get("/")
def root():
    return {"message": "Music Quant API is running"}

@app.get("/artists")
def list_artists():
    artists = get_all_artists()
    return [{"id": a[0], "name": a[1]} for a in artists]


@app.get("/artist/{artist_id}/history")
def artist_history(artist_id: int):
    df = get_artist_history(artist_id)
    if df.empty:
        raise HTTPException(status_code=404, detail="Artist not found")
    df["recorded_at"] = pd.to_datetime(df["recorded_at"])
    df["date"] = df["recorded_at"].dt.strftime("%b %d")
    return df[["date", "listeners"]].to_dict(orient="records")


@app.get("/artist/{artist_id}/metrics}")
def artist_metrics(artist_id: int):
    df = get_artist_history(artist_id)
    if df.empty:
        raise HTTPException(status_code=404, detail="Artist not found")
    features = compute_features(df)
    return features

@app.get("/artist/{artist_id}/signal")
def artist_signal(artist_id: int):
    df = get_artist_history(artist_id)
    if df.empty:
        raise HTTPException(status_code=404, detail="Artist not found")
    features = compute_features(df)
    signal = classify_signal(features)
    return {
        "artist_id": artist_id,
        "signal": signal,
        **features
    }

@app.get("/leaderboard")
def leaderboard():
    artists = get_all_artists()
    results = []
    for artist_id, name in artists:
        df = get_artist_history(artist_id)
        if df.empty or len(df) < 7:
            continue
        features = compute_features(df)
        signal = classify_signal(features)
        results.append({
            "artist_id": artist_id,
            "name": name,
            "signal": signal,
            **features
        })
    priority = {"BREAKOUT": 0, "RISING": 1, "STABLE": 2, "COOLING": 3, "DORMANT": 4}
    results.sort(key=lambda x: (priority.get(x["signal"], 99), -x["listener_growth_7d"]))
    return results

@app.get("/search")
def search_artist(name: str):
    try:
        data = fetch_lastfm_artist(name)
    except Exception:
        raise HTTPException(status_code=404, detail="Artist not found on Last.fm")
    
    artist_id = upsert_artist(data["name"], data["genres"])
    if not artist_id: return
    insert_metrics(artist_id, data["listeners"], data["playcount"])

    # Seed history if this is a new artist
    df = get_artist_history(artist_id)
    if len(df) < 7:
        seed_artist(artist_id)
        df = get_artist_history(artist_id)

    features = compute_features(df)
    signal = classify_signal(features)

    return {
        "artist_id": artist_id,
        "name": data["name"],
        "signal": signal,
        **features
    }

# Auth and JWT
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload

# --- Auth Endpoints ---

@app.post("/register")
def register(req: RegisterRequest):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO users (username, email, password_hash)
            VALUES (%s, %s, %s)
            RETURNING id, username, credits;
        """, (req.username, req.email, hash_password(req.password)))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=500, detail="Registration failed")
        conn.commit()
        token = create_access_token({"sub": str(user[0]), "username": user[1]})
        return {"token": token, "username": user[1], "credits": user[2]}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Registration error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.post("/login")
def login(req: LoginRequest):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, password_hash, credits FROM users WHERE username = %s;", (req.username,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()

    if not user or not verify_password(req.password, user[2]):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_access_token({"sub": str(user[0]), "username": user[1]})
    return {"token": token, "username": user[1], "credits": user[3]}

@app.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, email, credits FROM users WHERE id = %s;", (current_user["sub"],))
    user = cursor.fetchone()
    cursor.close()
    conn.close()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"id": user[0], "username": user[1], "email": user[2], "credits": user[3]}

# --- Position Endpoints ---

@app.post("/positions/open")
def open_position(req: OpenPositionRequest, current_user: dict = Depends(get_current_user)):
    user_id = int(current_user["sub"])
    conn = get_connection()
    cursor = conn.cursor()

    # Check user has enough credits
    cursor.execute("SELECT credits FROM users WHERE id = %s;", (user_id,))
    row = cursor.fetchone()
    if not row or row[0] < req.credits_wagered:
        raise HTTPException(status_code=400, detail="Insufficient credits")

    if int(req.credits_wagered) <= 0:
        raise HTTPException(status_code=400, detail="Credits wagered must be greater than 0")

    if req.direction not in ("LONG", "SHORT"):
        raise HTTPException(status_code=400, detail="Direction must be LONG or SHORT")

    # Get current listener count — fix: cast artist_id to int
    df = get_artist_history(int(req.artist_id))
    if df.empty:
        raise HTTPException(status_code=404, detail="Artist not found")
    listener_count = int(df.iloc[-1]["listeners"])

    # Deduct credits and open position
    cursor.execute("UPDATE users SET credits = credits - %s WHERE id = %s;", (req.credits_wagered, user_id))
    cursor.execute("""
        INSERT INTO positions (user_id, artist_id, direction, credits_wagered, listener_count_at_open)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id;
    """, (user_id, req.artist_id, req.direction, req.credits_wagered, listener_count))

    # Fix: null check on fetchone
    result = cursor.fetchone()
    position_id = result[0] if result else None

    conn.commit()
    cursor.close()
    conn.close()

    return {"message": "Position opened", "position_id": position_id}

@app.get("/portfolio")
def get_portfolio(current_user: dict = Depends(get_current_user)):
    user_id = int(current_user["sub"])
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT credits FROM users WHERE id = %s;", (user_id,))
    credits = cursor.fetchone()

    cursor.execute("""
        SELECT p.id, a.name, p.direction, p.credits_wagered,
               p.listener_count_at_open, p.status, p.opened_at
        FROM positions p
        JOIN artists a ON p.artist_id = a.id
        WHERE p.user_id = %s
        ORDER BY p.opened_at DESC;
    """, (user_id,))
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    positions = []
    for row in rows:
        pos_id, name, direction, wagered, listeners_at_open, status, opened_at = row

        # Get current listeners for P&L
        artist_conn = get_connection()
        artist_cursor = artist_conn.cursor()
        artist_cursor.execute("""
            SELECT listeners FROM artist_metrics
            WHERE artist_id = (SELECT id FROM artists WHERE name = %s)
            ORDER BY recorded_at DESC LIMIT 1;
        """, (name,))
        current = artist_cursor.fetchone()
        artist_cursor.close()
        artist_conn.close()

        current_listeners = current[0] if current else listeners_at_open
        growth = (current_listeners - listeners_at_open) / listeners_at_open if listeners_at_open > 0 else 0

        if direction == "LONG":
            pnl = int(wagered * growth)
        else:
            pnl = int(wagered * -growth)

        positions.append({
            "id": pos_id,
            "artist": name.capitalize(),
            "direction": direction,
            "credits_wagered": wagered,
            "pnl": pnl,
            "pnl_pct": round(growth * 100, 2),
            "status": status,
            "opened_at": opened_at.strftime("%b %d, %Y")
        })

    return {"credits": credits, "positions": positions}

@app.post("/positions/close/{position_id}")
def close_position(position_id: int, current_user: dict = Depends(get_current_user)):
    user_id = int(current_user["sub"])
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT p.id, p.direction, p.credits_wagered, p.listener_count_at_open,
               p.status, a.name
        FROM positions p
        JOIN artists a ON p.artist_id = a.id
        WHERE p.id = %s AND p.user_id = %s;
    """, (position_id, user_id))
    row = cursor.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Position not found")
    if row[4] == "closed":
        raise HTTPException(status_code=400, detail="Position already closed")

    pos_id, direction, wagered, listeners_at_open, status, artist_name = row

    # Get current listeners
    artist_cursor = conn.cursor()
    artist_cursor.execute("""
        SELECT listeners FROM artist_metrics
        WHERE artist_id = (SELECT id FROM artists WHERE name = %s)
        ORDER BY recorded_at DESC LIMIT 1;
    """, (artist_name,))
    current = artist_cursor.fetchone()
    current_listeners = current[0] if current else listeners_at_open

    growth = (current_listeners - listeners_at_open) / listeners_at_open if listeners_at_open > 0 else 0

    if direction == "LONG":
        pnl = int(wagered * growth)
    else:
        pnl = int(wagered * -growth)

    credits_returned = wagered + pnl

    # Close position and return credits
    cursor.execute("""
        UPDATE positions SET status = 'closed', pnl = %s, closed_at = NOW()
        WHERE id = %s;
    """, (pnl, position_id))
    cursor.execute("UPDATE users SET credits = credits + %s WHERE id = %s;", (credits_returned, user_id))

    conn.commit()
    cursor.close()
    conn.close()

    return {
        "message": "Position closed",
        "pnl": pnl,
        "credits_returned": credits_returned
    }