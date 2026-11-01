
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import re
import unicodedata

app = FastAPI(
    title="IndicSafe API",
    description="Indic Language Cyberbullying Detection System",
    version="1.0"
)

# Allow React frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class MessageRequest(BaseModel):
    message: str = Field(min_length=1, max_length=3000)


def normalize_text(text: str):

    text = unicodedata.normalize("NFKC", text)

    text = re.sub(
        r"https?://\S+|www\.\S+",
        " ",
        text
    )

    text = re.sub(r"\s+", " ", text).strip()

    text = re.sub(r"(.)\1{3,}", r"\1\1", text)

    return text


@app.get("/")
def home():

    return {
        "status": "online",
        "project": "IndicSafe",
        "message": "Backend is running successfully"
    }


@app.post("/analyze")
def analyze_message(data: MessageRequest):

    cleaned_text = normalize_text(data.message)

    return {
        "status": "success",
        "original_message": data.message,
        "normalized_message": cleaned_text,
        "analysis": {
            "label": "pending_ai_model",
            "confidence": None,
            "message": "Backend connected. AI model integration is next."
        }
    }
