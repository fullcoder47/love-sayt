"""Madina uchun shaxsiy romantik sayt — Flask + HTML/CSS/JS."""
from pathlib import Path

from flask import Flask, jsonify, render_template

from site_content import SITE

BASE_DIR = Path(__file__).resolve().parent
app = Flask(__name__)
app.json.ensure_ascii = False


@app.get("/")
def home():
    media_root = BASE_DIR / "static" / "media"
    voice_file = media_root / "voice.mp3"
    gallery_dir = media_root / "gallery"
    allowed_images = {".jpg", ".jpeg", ".png", ".webp", ".avif"}
    gallery = ([f"media/gallery/{path.name}" for path in sorted(gallery_dir.iterdir())
                if path.is_file() and path.suffix.lower() in allowed_images][:12]
               if gallery_dir.is_dir() else [])
    video_available = (media_root / "love-video.mp4").is_file()
    return render_template(
        "index.html",
        site=SITE,
        voice_available=voice_file.is_file(),
        gallery=gallery,
        video_available=video_available,
    )


@app.get("/healthz")
def health():
    return jsonify(status="ok", project="madina-love-universe")


@app.after_request
def security_headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["X-Frame-Options"] = "DENY"
    return response


if __name__ == "__main__":
    # Lokal test uchun. Production'da gunicorn app:app ishlatiladi.
    app.run(host="127.0.0.1", port=5000, debug=False)
