from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import sqlite3
from dotenv import load_dotenv
import os

# Load environment variables from .env
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Set Google Gemini API Key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError("Google Gemini API key is missing. Set GEMINI_API_KEY in .env")

# Configure Google Gemini API
genai.configure(api_key=GEMINI_API_KEY)

# Ensure database exists
def init_db():
    conn = sqlite3.connect("chat.db")
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS chats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_message TEXT NOT NULL,
            ai_response TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()

init_db()  # Initialize database at startup


@app.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.json
        user_message = data.get("text", "")

        if not user_message:
            return jsonify({"error": "Message is required"}), 400

        # Use the updated model name
        model = genai.GenerativeModel("gemini-1.5-flash")  # Use a supported model
        response = model.generate_content(user_message)

        ai_response = response.text if response and response.text else "Sorry, I couldn't process that."

        # Store chat in database
        conn = sqlite3.connect("chat.db")
        cursor = conn.cursor()
        cursor.execute("INSERT INTO chats (user_message, ai_response) VALUES (?, ?)", (user_message, ai_response))
        conn.commit()
        conn.close()

        return jsonify({"user_message": user_message, "ai_response": ai_response})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# API Route: Fetch Chat History
@app.route("/chats", methods=["GET"])
def get_chats():
    try:
        conn = sqlite3.connect("chat.db")
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM chats ORDER BY id DESC")
        chats = [{"id": row[0], "user_message": row[1], "ai_response": row[2]} for row in cursor.fetchall()]
        conn.close()

        return jsonify(chats)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
