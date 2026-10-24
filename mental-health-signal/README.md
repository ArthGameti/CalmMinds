# Mental Health Signal

Web app that predicts a student's mental-health score (0–10) from daily habits using a trained
Random Forest model (tuned R² ≈ 0.865, MAE ≈ 0.37).

## Run locally
```bash
pip install -r requirements.txt
uvicorn main:app --reload
```
Open **http://127.0.0.1:8000** (API docs: /docs). Verify with `python smoke_test.py`.

## Deploy
- **Render:** push to GitHub → New Web Service (uses `render.yaml`), or set build `pip install -r requirements.txt`, start `uvicorn main:app --host 0.0.0.0 --port $PORT`.
- **Railway / Heroku:** uses the `Procfile`.
- **Docker:** `docker build -t mhs . && docker run -p 8000:8000 mhs`

The frontend calls `/api/...` on the same origin, so no configuration is needed.

## Structure
`main.py` (FastAPI) · `static/` (index.html, style.css, script.js) · `Mental_Health_Model.pkl` · `stats.json` · `smoke_test.py`

Notes: the model was pickled with scikit-learn 1.9.0 (pinned). Informational only – not a clinical tool.
