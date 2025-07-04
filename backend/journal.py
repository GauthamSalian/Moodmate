from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from transformers import pipeline
from uuid import uuid4
from datetime import date

from sqlalchemy.orm import Session
from .database import SessionLocal, engine
from . import models

# Create DB tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Emotion pipeline
emotion_pipeline = pipeline("text-classification", model="j-hartmann/emotion-english-distilroberta-base", top_k=1)

# Pydantic models
class WordEmotionOut(BaseModel):
    text: str
    emotion: str
    score: float

    class Config:
        orm_mode = True

class JournalEntryOut(BaseModel):
    id: str
    text: str
    date: date
    dominant_emotion: str
    word_emotions: List[WordEmotionOut]

    class Config:
        orm_mode = True

class JournalRequest(BaseModel):
    text: str
    date: date

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Emotion analysis
def analyze_emotions(text: str):
    result_full = emotion_pipeline(text)[0][0]
    dominant_emotion = result_full['label'].lower()
    words = text.split()
    word_emotions = []

    for word in words:
        result = emotion_pipeline(word)[0][0]
        label = result['label'].lower()
        score = round(result['score'], 3)
        word_emotions.append({
            "text": word,
            "emotion": label,
            "score": score
        })

    return dominant_emotion, word_emotions

# Routes
@app.post("/journal-entry", response_model=JournalEntryOut)
def create_journal_entry(entry: JournalRequest, db: Session = Depends(get_db)):
    dominant_emotion, word_emotions_data = analyze_emotions(entry.text)
    journal_id = str(uuid4())

    journal = models.JournalEntry(
        id=journal_id,
        text=entry.text,
        date=entry.date,
        dominant_emotion=dominant_emotion
    )

    for word in word_emotions_data:
        journal.word_emotions.append(models.WordEmotion(
            id=str(uuid4()),
            text=word['text'],
            emotion=word['emotion'],
            score=word['score']
        ))

    db.add(journal)
    db.commit()
    db.refresh(journal)
    return journal

@app.get("/journal-entries", response_model=List[JournalEntryOut])
def get_all_journals(db: Session = Depends(get_db)):
    return db.query(models.JournalEntry).all()

@app.get("/journal-entry/{entry_id}", response_model=JournalEntryOut)
def get_journal_by_id(entry_id: str, db: Session = Depends(get_db)):
    journal = db.query(models.JournalEntry).filter(models.JournalEntry.id == entry_id).first()
    if not journal:
        raise HTTPException(status_code=404, detail="Journal not found")
    return journal
