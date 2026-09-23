import os
import tempfile
from pathlib import Path
import numpy as np
import tensorflow as tf
import tensorflow_hub as hub
import librosa
import pandas as pd
import urllib.request

from fastapi import FastAPI, UploadFile, File

app = FastAPI()

# =========================
# CONFIG
# =========================
MODEL_URL = "https://tfhub.dev/google/yamnet/1"

BASE_DIR = Path(__file__).resolve().parent
LABELS_PATH = BASE_DIR / "yamnet_class_map.csv"
LABELS_URL = "https://raw.githubusercontent.com/tensorflow/models/master/research/audioset/yamnet/yamnet_class_map.csv"

# =========================
# GLOBALS (lazy init)
# =========================
model = None
labels = []

# =========================
# FORCE CLEAN TF CACHE (IMPORTANT FIX)
# =========================
def clean_tfhub_cache():
    temp_dir = Path(os.getenv("TEMP"))
    cache_dir = temp_dir / "tfhub_modules"

    if cache_dir.exists():
        print("🧹 Clearing TFHub cache...")
        for item in cache_dir.glob("*"):
            try:
                if item.is_dir():
                    for sub in item.rglob("*"):
                        sub.unlink()
                    item.rmdir()
                else:
                    item.unlink()
            except:
                pass

# =========================
# LOAD MODEL SAFELY
# =========================
def get_model():
    global model

    if model is not None:
        return model

    print("🔄 Loading YAMNet model (clean start)...")

    try:
        # force clean first
        clean_tfhub_cache()

        model = hub.load(MODEL_URL)

        print("✅ YAMNet model loaded successfully")
        return model

    except Exception as e:
        print("❌ Model loading failed:", e)

        # retry ONCE after cleanup
        try:
            clean_tfhub_cache()
            model = hub.load(MODEL_URL)
            print("✅ YAMNet model loaded on retry")
            return model
        except Exception as e2:
            print("💥 Final failure loading model:", e2)
            raise RuntimeError("YAMNet model could not be loaded")

# =========================
# LOAD LABELS
# =========================
def load_labels():
    global labels

    try:
        if not LABELS_PATH.exists():
            print("⬇ Downloading labels...")
            urllib.request.urlretrieve(LABELS_URL, LABELS_PATH)

        df = pd.read_csv(LABELS_PATH)
        labels = df["display_name"].tolist()

        print(f"✅ Loaded {len(labels)} labels")

    except Exception as e:
        print("⚠ Label loading failed:", e)
        labels = []

load_labels()

# =========================
# PREDICTION
# =========================
def predict(audio_path: str):
    model = get_model()

    waveform, sr = librosa.load(audio_path, sr=16000, mono=True)
    waveform = waveform.astype(np.float32)

    scores, embeddings, spectrogram = model(waveform)

    mean_scores = tf.reduce_mean(scores, axis=0)
    top_k = tf.math.top_k(mean_scores, k=5)

    results = []

    for i in range(5):
        idx = int(top_k.indices[i].numpy())
        score = float(top_k.values[i].numpy())

        label = labels[idx] if idx < len(labels) else f"class_{idx}"

        results.append({
            "label": label,
            "class_id": idx,
            "confidence": score
        })

    return {
        "label": results[0]["label"],
        "class_id": results[0]["class_id"],
        "confidence": results[0]["confidence"],
        "top_5": results
    }

# =========================
# API
# =========================
@app.post("/analyze-audio")
async def analyze_audio(file: UploadFile = File(...)):

    suffix = Path(file.filename).suffix

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        temp_path = tmp.name

    try:
        result = predict(temp_path)

        label = result["label"].lower()

        if "siren" in label or "alarm" in label:
            result["severity"] = "HIGH"
        else:
            result["severity"] = "LOW"

        return result

    finally:
        os.remove(temp_path)
