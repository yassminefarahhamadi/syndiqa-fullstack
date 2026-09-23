from flask import Flask, request, jsonify
from transformers import pipeline

app = Flask(__name__)

# Use a small, fast model
classifier = pipeline("text-classification", model="distilbert-base-uncased-finetuned-sst-2-english")

@app.route("/predict", methods=["POST"])
def predict():
    data = request.json
    description = data.get("description", "")

    # Run the model
    result = classifier(description)[0]
    label = result["label"]  # POSITIVE or NEGATIVE

    # Map to severity (basic logic, you can refine)
    desc_lower = description.lower()

    if "fire" in desc_lower or "injury" in desc_lower or "critical" in desc_lower:
        severity = "CRITICAL"
    elif "minor" in desc_lower or "delay" in desc_lower or "warning" in desc_lower:
        severity = "MEDIUM"
    elif label == "POSITIVE":
        severity = "HIGH"
    else:
        severity = "LOW"

    return jsonify({"severity": severity})

if __name__ == "__main__":
    app.run(port=3001)
