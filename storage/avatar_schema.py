import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from storage.db import get_connection

def add_avatar_column():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
    """)
    conn.commit()
    cursor.close()
    conn.close()
    print("avatar_url column added successfully.")



if __name__ == "__main__":
    add_avatar_column()