
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "indicsafe.db"


def get_connection():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database():
    connection = get_connection()

    connection.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            original_message TEXT NOT NULL,
            normalized_message TEXT NOT NULL,
            prediction TEXT NOT NULL,
            abusive_score REAL,
            review_status TEXT DEFAULT 'Not Required',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    connection.commit()
    connection.close()


def save_message(original, normalized, prediction, score):
    connection = get_connection()

    cursor = connection.execute("""
        INSERT INTO messages (
            original_message,
            normalized_message,
            prediction,
            abusive_score,
            review_status
        )
        VALUES (?, ?, ?, ?, ?)
    """, (
        original,
        normalized,
        prediction,
        score,
        "Pending" if prediction == "abusive" else "Not Required"
    ))

    message_id = cursor.lastrowid
    connection.commit()
    connection.close()

    return message_id


def get_all_messages():
    connection = get_connection()

    rows = connection.execute("""
        SELECT * FROM messages ORDER BY id DESC
    """).fetchall()

    connection.close()

    return [dict(row) for row in rows]


def update_review(message_id, status):
    if status not in ("Approved", "Rejected"):
        raise ValueError("Invalid review status")

    connection = get_connection()

    cursor = connection.execute("""
        UPDATE messages
        SET review_status = ?
        WHERE id = ? AND review_status = 'Pending'
    """, (status, message_id))

    connection.commit()
    updated = cursor.rowcount
    connection.close()

    return updated
