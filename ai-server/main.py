from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import shutil
import uuid
import os

app = FastAPI(title="Smart Food Freshness AI Server")

# ============================
# CORS (allow backend access)
# ============================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("🧠 Freshness AI Server Started")

# ============================
# ROOT HEALTH CHECK
# ============================
@app.get("/")
def root():
    return {
        "status": "AI Server Running",
        "mode": "Freshness & Expiry Prediction"
    }

# ============================
# HELPER: TIME DIFFERENCE
# ============================
def hours_since_prepared(prepared_time: str):
    try:
        cooked = datetime.fromisoformat(prepared_time)
        now = datetime.now()
        diff = now - cooked
        return round(diff.total_seconds() / 3600, 2)
    except Exception:
        return None

# ============================
# HELPER: FRESHNESS RULE ENGINE
# ============================
def freshness_rules(food_name: str, hours_passed: float):
    food = food_name.lower()

    # 🍚 RICE ITEMS
    if "rice" in food or "biriyani" in food:
        if hours_passed <= 8:
            return "Fresh", "Safe to donate"
        elif hours_passed <= 12:
            return "Semi-Fresh", "Donate within 2 hours"
        else:
            return "Spoiled", "Not safe to donate"

    # 🍛 CURRIES
    if "curry" in food:
        if hours_passed <= 6:
            return "Fresh", "Safe to donate"
        elif hours_passed <= 12:
            return "Semi-Fresh", "Donate immediately"
        else:
            return "Spoiled", "Not safe to donate"

    # 🫓 ROTI / CHAPATI
    if "chapati" in food or "roti" in food:
        if hours_passed <= 10:
            return "Fresh", "Safe to donate"
        else:
            return "Spoiled", "Not safe to donate"

    # 🔁 DEFAULT FALLBACK
    if hours_passed <= 6:
        return "Fresh", "Safe to donate"
    elif hours_passed <= 10:
        return "Semi-Fresh", "Donate quickly"
    else:
        return "Spoiled", "Not safe to donate"

# ============================
# MAIN AI ENDPOINT
# ============================
@app.post("/analyze-food")
async def analyze_food(
    image: UploadFile = File(...),   # kept for future ML
    food_name: str = Form(...),
    prepared_time: str = Form(...)
):
    """
    prepared_time example:
    2026-01-27T09:30
    """

    # Save image temporarily (future use)
    temp_name = f"{uuid.uuid4().hex}.jpg"
    temp_path = os.path.join("temp", temp_name)
    os.makedirs("temp", exist_ok=True)

    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)

    try:
        hours_passed = hours_since_prepared(prepared_time)

        if hours_passed is None:
            return {
                "status": "error",
                "message": "Invalid prepared_time format"
            }

        freshness, recommendation = freshness_rules(food_name, hours_passed)

        return {
            "status": "success",
            "food_item": food_name,
            "hours_since_prepared": hours_passed,
            "freshness": freshness,
            "expiry_status": recommendation,
            "ai_note": "Decision based on food type + time rules"
        }

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
