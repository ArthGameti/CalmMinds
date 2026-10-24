"""
Mental Health Signal – FastAPI backend.

Serves the website (./static) and exposes the trained Random Forest model:
    POST /api/predict   -> predicted mental-health score (0-10 scale)
    GET  /api/stats     -> aggregate dataset statistics used by the charts
    GET  /api/health    -> liveness check

Run:  uvicorn main:app --reload      then open http://127.0.0.1:8000
"""
import json
from pathlib import Path
from typing import Literal

import joblib
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

BASE = Path(__file__).parent
model = joblib.load(BASE / "Mental_Health_Model.pkl")
stats = json.loads((BASE / "stats.json").read_text(encoding="utf-8"))

TOP_COUNTRIES = ["Other", "India", "USA", "Canada", "Australia", "UK",
                 "Germany", "Mexico", "Turkey", "France"]

app = FastAPI(title="Mental Health Signal API", version="2.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


class StudentData(BaseModel):
    age: int = Field(..., ge=10, le=100)
    gender: Literal["Male", "Female"]
    country: str = Field(..., min_length=1, max_length=60)
    academic_level: Literal["Undergraduate", "Graduate", "High School"]
    most_used_platform: Literal["Facebook", "LinkedIn", "Instagram", "Snapchat", "Twitter",
                                "YouTube", "TikTok", "LINE", "KakaoTalk", "VKontakte",
                                "WhatsApp", "WeChat"]
    purpose_of_use: Literal["Networking", "Education", "Entertainment", "News"]
    avg_daily_usage_hours: float = Field(..., ge=0, le=24)
    daily_unlocks: int = Field(..., ge=0, le=1000)
    study_hours: float = Field(..., ge=0, le=24)
    physical_activity_hours: float = Field(..., ge=0, le=24)
    sleep_hours_per_night: float = Field(..., ge=0, le=24)
    stress_level: Literal["Low", "Medium", "High", "Very High"]


class PredictionResponse(BaseModel):
    predicted_mental_health_score: float


def to_frame(d: StudentData) -> pd.DataFrame:
    country = d.country.strip()
    return pd.DataFrame([{
        "Age": d.age, "Gender": d.gender, "Country": country,
        "Academic_Level": d.academic_level, "Most_Used_Platform": d.most_used_platform,
        "Purpose_Of_Use": d.purpose_of_use, "Avg_Daily_Usage_Hours": d.avg_daily_usage_hours,
        "Daily_Unlocks": d.daily_unlocks, "Study_Hours": d.study_hours,
        "Physical_Activity_Hours": d.physical_activity_hours,
        "Sleep_Hours_Per_Night": d.sleep_hours_per_night, "Stress_Level": d.stress_level,
        "Grouped_country": country if country in TOP_COUNTRIES else "Other",
    }])


@app.post("/api/predict", response_model=PredictionResponse)
@app.post("/predict", response_model=PredictionResponse, include_in_schema=False)  # backward compatible
def predict(data: StudentData):
    pred = float(model.predict(to_frame(data))[0])
    return PredictionResponse(predicted_mental_health_score=round(max(0.0, min(10.0, pred)), 2))


@app.get("/api/stats")
def get_stats():
    return stats


@app.get("/api/health")
def health():
    return {"status": "ok"}


# Static site: "/" -> index.html, and style.css / script.js resolve both as
# "/style.css" and "/static/style.css". Mounted last so API routes take priority.
app.mount("/static", StaticFiles(directory=BASE / "static"), name="static")
app.mount("/", StaticFiles(directory=BASE / "static", html=True), name="site")


if __name__ == "__main__":  # python main.py
    import os
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
