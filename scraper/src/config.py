import os

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
REQUEST_DELAY = float(os.getenv("REQUEST_DELAY", "1.5"))
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
