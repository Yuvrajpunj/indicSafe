from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from functools import lru_cache
from app.models.muril_model import MuRILClassifier
from app.database import (
    initialize_database,
    save_message,
    get_all_messages,
    update_review
)
from pydantic import BaseModel, Field
from typing import Literal
import re
import unicodedata


@lru_cache(maxsize=1)
def get_classifier():
    return MuRILClassifier()


app = FastAPI(
    title="IndicSafe API",
    version="1.0.0"
)


# Initialize SQLite database
initialize_database()


# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class MessageRequest(BaseModel):
    message: str = Field(min_length=1, max_length=3000)


class ReviewRequest(BaseModel):
    status: Literal["Approved", "Rejected"]


def normalize_text(text: str):
    text = unicodedata.normalize("NFKC", text)

    text = re.sub(
        r"https?://\S+|www\.\S+",
        " ",
        text
    )

    text = re.sub(r"(.)\1{3,}", r"\1\1", text)

    text = re.sub(r"\s+", " ", text).strip()

    return text


@app.get("/")
def home():
    return {
        "status": "online",
        "project": "IndicSafe",
        "message": "Backend is working!"
    }


@app.post("/analyze")
def analyze_message(request: MessageRequest):

    normalized = normalize_text(request.message)

    classifier = get_classifier()
    prediction = classifier.predict(normalized)

    # Save analysis in SQLite database
    message_id = save_message(
        request.message,
        normalized,
        prediction["label"],
        prediction.get("abusive_score")
    )

    return {
        "status": "success",
        "id": message_id,
        "original_message": request.message,
        "normalized_message": normalized,
        "analysis": prediction
    }


@app.get("/messages")
def list_messages():
    return {
        "status": "success",
        "messages": get_all_messages()
    }


@app.patch("/messages/{message_id}/review")
def review_message(message_id: int, request: ReviewRequest):

    updated = update_review(message_id, request.status)

    if not updated:
        raise HTTPException(
            status_code=404,
            detail="Pending message not found"
        )

    return {
        "status": "success",
        "message_id": message_id,
        "review_status": request.status
    }