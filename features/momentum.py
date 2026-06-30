"""Computes the growth and acceleration of artists and creats basis for indicators/signals """

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
from storage.db import get_connection

def get_artist_history(artist_id: int) -> pd.DataFrame:
    """Pull all metric snapshots for an artist into a DataFrame."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT recorded_at, listeners, playcount
        FROM artist_metrics
        WHERE artist_id = %s
        ORDER BY recorded_at ASC;
    """, (artist_id,))
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    """ Create the data frame based on the artist history """
    df = pd.DataFrame(rows, columns=["recorded_at", "listeners", "playcount"])
    return df


def compute_features(df: pd.DataFrame) -> dict:
    """Compute momentum indicators from a time-series DataFrame."""

    df = df.copy()
    df["recorded_at"] = pd.to_datetime(df["recorded_at"])
    df = df.sort_values("recorded_at").reset_index(drop=True)

    latest = df.iloc[-1]
    day_7 = df.iloc[-7] if len(df) >= 7 else df.iloc[0]
    day_30 = df.iloc[0]

    # Growth rates
    listener_growth_7d = (latest["listeners"] - day_7["listeners"]) / day_7["listeners"] * 100
    listener_growth_30d = (latest["listeners"] - day_30["listeners"]) / day_30["listeners"] * 100
    playcount_growth_7d = (latest["playcount"] - day_7["playcount"]) / day_7["playcount"] * 100

    # Momentum: is growth accelerating? Computed by subtracting 30 day growth info from the latest info
    mid = df.iloc[len(df) // 2]
    early_growth = (mid["listeners"] - day_30["listeners"]) / day_30["listeners"] * 100
    late_growth = (latest["listeners"] - mid["listeners"]) / mid["listeners"] * 100
    acceleration = late_growth - early_growth

    # Z-score: how abnormal is current listener count vs 30d mean
    mean = df["listeners"].mean()
    std = df["listeners"].std()
    z_score = (latest["listeners"] - mean) / std if std > 0 else 0

    return {
        "listeners_now": int(latest["listeners"]),
        "listener_growth_7d": round(listener_growth_7d, 2),
        "listener_growth_30d": round(listener_growth_30d, 2),
        "playcount_growth_7d": round(playcount_growth_7d, 2),
        "acceleration": round(acceleration, 2),
        "z_score": round(z_score, 2)
    }


def analyze_all_artists():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name FROM artists;")
    artists = cursor.fetchall()
    cursor.close()
    conn.close()

    results = []
    for artist_id, name in artists:
        df = get_artist_history(artist_id)
        if len(df) < 7:
            continue
        features = compute_features(df)
        features["name"] = name
        results.append(features)

    return results

if __name__ == "__main__":
    results = analyze_all_artists()
    for r in results:
        print(f"\n{r['name']}")
        print(f"  Listeners:        {r['listeners_now']:,}")
        print(f"  7d Growth:        {r['listener_growth_7d']}%")
        print(f"  30d Growth:       {r['listener_growth_30d']}%")
        print(f"  Playcount 7d:     {r['playcount_growth_7d']}%")
        print(f"  Acceleration:     {r['acceleration']}")
        print(f"  Z-Score:          {r['z_score']}")
