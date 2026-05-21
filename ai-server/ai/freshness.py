from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import shutil
import uuid
import os
from datetime import datetime

# 🔥 AI MODELS
from ultralytics import YOLO
from transformers import pipeline
import cv2

app = FastAPI(title="Smart Food Freshness AI Server")

# ============================
# LOAD MODELS
# ============================
print("🧠 Loading AI Models...")

yolo_model = YOLO("yolov8m.pt")   # FREE pretrained
hf_model = pipeline("image-classification")

print("✅ Models Loaded")

# ============================
# CORS
# ============================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================
# ROOT
# ============================
@app.get("/")
def root():
    return {"status": "AI Server Running 🚀"}

# ============================
# TIME CALCULATION
# ============================
def calculate_hours_passed(cooked_time: str):
    cooked = datetime.fromisoformat(cooked_time)
    now = datetime.now()
    diff = now - cooked
    return round(diff.total_seconds() / 3600, 2)

# ============================
# RULE ENGINE (TIME BASED)
# ============================
def freshness_rules(food_type, hours_passed):
    food_type = food_type.lower()

    if food_type in ["rice", "fried rice", "biriyani"]:
        if hours_passed <= 8:
            return "Fresh", "Safe to donate"
        elif hours_passed <= 12:
            return "Semi-Fresh", "Donate within 2 hours"
        else:
            return "Spoiled", "Not safe to donate"

    elif food_type in ["curry", "chicken curry", "veg curry"]:
        if hours_passed <= 6:
            return "Fresh", "Safe to donate"
        elif hours_passed <= 12:
            return "Semi-Fresh", "Donate immediately"
        else:
            return "Spoiled", "Not safe to donate"

    elif food_type in ["chapati", "roti"]:
        if hours_passed <= 10:
            return "Fresh", "Safe to donate"
        else:
            return "Spoiled", "Not safe to donate"

    else:
        if hours_passed <= 6:
            return "Fresh", "Safe to donate"
        elif hours_passed <= 10:
            return "Semi-Fresh", "Donate quickly"
        else:
            return "Spoiled", "Not safe"

# ============================
# 🧠 IMAGE ANALYSIS
# ============================
def analyze_image(image_path):

    results = yolo_model(image_path)

    detections = []
    max_conf = 0

    for r in results:
        for box in r.boxes:
            conf = float(box.conf[0])
            max_conf = max(max_conf, conf)

    # HuggingFace classification
    hf_result = hf_model(image_path)[0]

    return {
        "yolo_confidence": round(max_conf * 100, 2),
        "hf_label": hf_result["label"],
        "hf_confidence": round(hf_result["score"] * 100, 2)
    }

# ============================
# 🎯 FINAL DECISION ENGINE
# ============================
def final_decision(food_name, hours_passed, ai_data):

    # Time based result
    rule_status, recommendation = freshness_rules(food_name, hours_passed)

    label = ai_data["hf_label"].lower()

    # 🔥 AI override (fungus/spoilage detection)
    if "mold" in label or "rotten" in label or "spoiled" in label:
        return "Spoiled", "AI detected spoilage (fungus)"

    # 🔥 Combine logic
    return rule_status, recommendation

# ============================
# 🎨 DRAW BOUNDING BOX (OPTIONAL)
# ============================
def draw_boxes(image_path):

    img = cv2.imread(image_path)
    results = yolo_model(image_path)

    for r in results:
        for box in r.boxes:
            x1,y1,x2,y2 = map(int, box.xyxy[0])
            conf = float(box.conf[0])

            label = f"Food {conf:.2f}"
            color = (0,255,0)

            cv2.rectangle(img,(x1,y1),(x2,y2),color,2)
            cv2.putText(img,label,(x1,y1-10),
                        cv2.FONT_HERSHEY_SIMPLEX,0.6,color,2)

    output_path = image_path.replace(".jpg","_out.jpg")
    cv2.imwrite(output_path,img)

    return output_path

# ============================
# 🚀 MAIN API
# ============================
@app.post("/analyze-food")
async def analyze_food(
    image: UploadFile = File(...),
    food_name: str = Form(...),
    cooked_time: str = Form(...)
):

    temp_name = f"{uuid.uuid4().hex}.jpg"
    temp_path = os.path.join("temp", temp_name)
    os.makedirs("temp", exist_ok=True)

    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)

    try:
        # ⏱ TIME
        hours_passed = calculate_hours_passed(cooked_time)

        # 🤖 AI ANALYSIS
        ai_data = analyze_image(temp_path)

        # 🎯 FINAL DECISION
        final_status, recommendation = final_decision(
            food_name,
            hours_passed,
            ai_data
        )

        # 🎨 OPTIONAL IMAGE OUTPUT
        boxed_image = draw_boxes(temp_path)

        return {
            "status": "success",

            "food_item": food_name,
            "time_passed_hours": hours_passed,

            # 🔥 FINAL RESULT
            "final_freshness": final_status,
            "expiry_status": recommendation,

            # 📊 DETAILS
            "time_based": freshness_rules(food_name, hours_passed),
            "ai_prediction": ai_data,

            # 🖼 IMAGE OUTPUT
            "processed_image": boxed_image,

            "ai_note": "Hybrid AI (Time + Image + Detection)"
        }

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)