import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from storage.db import get_connection

def create_payments_table():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS credit_purchases (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            stripe_session_id VARCHAR(255) UNIQUE NOT NULL,
            bundle_key VARCHAR(50) NOT NULL,
            credits_purchased INTEGER NOT NULL,
            amount_cents INTEGER NOT NULL,
            status VARCHAR(20) DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT NOW(),
            completed_at TIMESTAMP
        );
    """)

    conn.commit()
    cursor.close()
    conn.close()
    print("Payment table created successfully.")

if __name__ == "__main__":
    create_payments_table()
