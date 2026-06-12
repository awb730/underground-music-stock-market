import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def get_local_connection():
    return psycopg2.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD")
    )

def get_supabase_connection():
    return psycopg2.connect(os.getenv("SUPABASE_DATABASE_URL"))

def migrate():
    print("Connecting to local DB...")
    local = get_local_connection()
    local_cursor = local.cursor()

    print("Connecting to Supabase...")
    supa = get_supabase_connection()
    supa_cursor = supa.cursor()

    print("Creating tables...")
    supa_cursor.execute("""
        CREATE TABLE IF NOT EXISTS artists (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) UNIQUE NOT NULL,
            genres TEXT[],
            created_at TIMESTAMP DEFAULT NOW()
        );
    """)

    supa_cursor.execute("""
        CREATE TABLE IF NOT EXISTS artist_metrics (
            id SERIAL PRIMARY KEY,
            artist_id INTEGER REFERENCES artists(id),
            listeners INTEGER,
            playcount INTEGER,
            recorded_at TIMESTAMP DEFAULT NOW()
        );
    """)

    # Migrate artists
    print("Migrating artists...")
    local_cursor.execute("SELECT id, name, genres, created_at FROM artists;")
    artists = local_cursor.fetchall()

    for artist in artists:
        supa_cursor.execute("""
            INSERT INTO artists (id, name, genres, created_at)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (name) DO NOTHING;
        """, artist)

    # Migrate metrics
    print("Migrating artist_metrics...")
    local_cursor.execute("SELECT artist_id, listeners, playcount, recorded_at FROM artist_metrics;")
    metrics = local_cursor.fetchall()

    for metric in metrics:
        supa_cursor.execute("""
            INSERT INTO artist_metrics (artist_id, listeners, playcount, recorded_at)
            VALUES (%s, %s, %s, %s);
        """, metric)

    # Sync sequences so future inserts don't conflict
    supa_cursor.execute("SELECT setval('artists_id_seq', (SELECT MAX(id) FROM artists));")
    supa_cursor.execute("SELECT setval('artist_metrics_id_seq', (SELECT MAX(id) FROM artist_metrics));")

    supa.commit()
    local_cursor.close()
    local.close()
    supa_cursor.close()
    supa.close()
    print(f"Migration complete. {len(artists)} artists, {len(metrics)} metrics rows migrated.")

if __name__ == "__main__":
    migrate()