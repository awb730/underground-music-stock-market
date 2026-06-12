import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from storage.db import get_connection, upsert_artist, insert_metrics
from storage.seed_history import seed_artist
from features.momentum import compute_features, get_artist_history
from signals.engine import classify_signal
import pandas as pd
from ingestion.lastfm_client import get_artist as fetch_lastfm_artist


app = FastAPI(title="Music Quant API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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