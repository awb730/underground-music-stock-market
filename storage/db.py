import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def get_connection():
    supabase_url = os.getenv("SUPABASE_DATABASE_URL")
    if supabase_url:
        return psycopg2.connect(supabase_url)
    return psycopg2.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD")
    )

def upsert_artist(name: str, genres: list) -> int | None:
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO artists (name, genres)
        VALUES (%s, %s)
        ON CONFLICT (name) DO UPDATE SET genres = EXCLUDED.genres
        RETURNING id;
    """, (name, genres))

    row = cursor.fetchone()
    artist_id = row[0] if row else None
    conn.commit()
    cursor.close()
    conn.close()
    return artist_id

def insert_metrics(artist_id: int | None, listeners: int, playcount: int):
    """Insert a new metrics snapshot for an artist."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO artist_metrics (artist_id, listeners, playcount)
        VALUES (%s, %s, %s);
    """, (artist_id, listeners, playcount))

    conn.commit()
    cursor.close()
    conn.close()