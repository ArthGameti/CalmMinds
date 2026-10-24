# 🧠 Mental Health Signal

> A machine-learning web app that predicts a student's mental-health score (0–10) from daily habits such as sleep, social-media use, physical activity and stress.

![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)
![scikit-learn](https://img.shields.io/badge/scikit--learn-1.9.0-F7931E?logo=scikitlearn&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)

> ⚠️ **Disclaimer:** This project is for educational and informational purposes only. It is not a clinical tool and does not provide a medical diagnosis.

<!-- Add a screenshot: ![Screenshot](docs/screenshot.png) -->

## ✨ Features

- **Real ML predictions** from a tuned Random Forest regressor served through a FastAPI endpoint
- **Responsive website** with an animated score gauge, comparison with the average student, and personalised suggestions
- **Dataset insights** — live charts (stress, sleep, social-media use, platform, correlations) built from the training data
- **Validated inputs** on both the frontend and the backend (Pydantic)
- **Deployment-ready** — Dockerfile, Procfile and `render.yaml` included

## 📊 Model

| Model | R² (test) | MAE |
|---|---|---|
| Linear Regression | 0.740 | 0.536 |
| Random Forest (default) | 0.878 | 0.347 |
| **Random Forest (tuned) — deployed** | **0.865** | **0.369** |

- **Dataset:** 5,000 student records (*Student Social Media and Mental Health Impact*), ages 18–24
- **Target:** `Mental_Health_Score` (3.6–9.4 in the data)
- **Features (12):** age, gender, country, academic level, most-used platform, purpose of use, daily usage hours, daily unlocks, study hours, physical activity hours, sleep hours, stress level
- **Pipeline:** preprocessing (encoding + scaling + country grouping) → Random Forest
- Full training workflow: [`ML_Project.ipynb`](ML_Project.ipynb) (if included in your repo)

## 🗂 Project structure

```
mental-health-signal/
├── main.py                    # FastAPI app: API + serves the website
├── Mental_Health_Model.pkl    # Trained scikit-learn pipeline
├── stats.json                 # Aggregated dataset stats for the charts
├── static/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── smoke_test.py              # End-to-end check against a running server
├── requirements.txt
├── Dockerfile · Procfile · render.yaml
└── README.md
```

## 🚀 Getting started

### Run locally
```bash
git clone https://github.com/<your-username>/mental-health-signal.git
cd mental-health-signal
pip install -r requirements.txt
uvicorn main:app --reload
```
Open **http://127.0.0.1:8000** · Interactive API docs at **/docs**.

### Run with Docker
```bash
docker build -t mental-health-signal .
docker run -d --name mhs -p 8000:8000 mental-health-signal
```

### Verify the install
```bash
python smoke_test.py
```

## 🔌 API

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/predict` | Returns the predicted mental-health score |
| `GET` | `/api/stats` | Aggregate dataset statistics |
| `GET` | `/api/health` | Health check |

**Example request**
```bash
curl -X POST http://127.0.0.1:8000/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "age": 21, "gender": "Female", "country": "India",
    "academic_level": "Undergraduate", "most_used_platform": "Instagram",
    "purpose_of_use": "Entertainment", "avg_daily_usage_hours": 4.5,
    "daily_unlocks": 110, "study_hours": 4, "physical_activity_hours": 1,
    "sleep_hours_per_night": 6.8, "stress_level": "Medium"
  }'
```
**Response**
```json
{ "predicted_mental_health_score": 6.32 }
```

## ☁️ Deployment

- **Render:** create a Web Service from the repo (uses `render.yaml`)
- **Railway / Heroku:** uses the `Procfile`
- **Any Docker host:** build and run the image as shown above

The frontend calls the API on the same origin, so no extra configuration is needed.

## ⚠️ Limitations

- Trained on survey data from students aged 18–24; predictions outside this range are less reliable.
- The model finds correlations, not causes.
- The pickled model requires `scikit-learn==1.9.0` to load correctly.

## 🛠 Tech stack

Python · FastAPI · scikit-learn · pandas · Docker · HTML / CSS / JavaScript
