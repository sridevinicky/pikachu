from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import platform

app = Flask(__name__)
CORS(app)  # 👈 Enable CORS for all routes and origins

@app.route('/shutdown', methods=['POST'])
def shutdown():
    auth = request.headers.get("Authorization")
    if auth != "Bearer secret-key":
        return jsonify({"error": "Unauthorized"}), 403

    system = platform.system()

    try:
        if system == "Windows":
            os.system("shutdown /s /t 1")
        elif system == "Linux" or system == "Darwin":
            os.system("sudo shutdown -h now")
        else:
            return jsonify({"error": "Unsupported OS"}), 400

        return jsonify({"status": "Shutting down..."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000)
