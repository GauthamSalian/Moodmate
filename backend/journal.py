from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from transformers import pipeline
from uuid import uuid4
from datetime import date
from sqlalchemy.orm import Session, relationship
from .database import Base, SessionLocal, engine
from . import models



models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

emotion_pipeline = pipeline("text-classification", model="j-hartmann/emotion-english-distilroberta-base", top_k=None)

class AllEmotionScore(BaseModel):
    emotion: str
    score: float

class WordEmotionOut(BaseModel):
    text: str
    emotion: str
    score: float

    class Config:
        orm_mode = True

class JournalEntryResponse(BaseModel):
    id: str
    text: str
    date: date
    dominant_emotion: str
    dominant_score: float
    all_emotions: List[AllEmotionScore]
    word_emotions: List[WordEmotionOut]

    class Config:
        orm_mode = True


class JournalRequest(BaseModel):
    text: str
    date: date

class JournalEditRequest(BaseModel):
    text: str


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def analyze_emotions(text: str):
    full_text_results = emotion_pipeline(text)[0]
    dominant_emotion = full_text_results[0]['label'].lower()
    dominant_score = round(full_text_results[0]['score'], 3)
    all_emotions = [
        {"emotion": res['label'].lower(), "score": round(res['score'], 3)}
        for res in full_text_results
    ]

    words = text.split()
    word_emotions = []
    for word in words:
        result = emotion_pipeline(word)[0][0]
        word_emotions.append({
            "text": word,
            "emotion": result['label'].lower(),
            "score": round(result['score'], 3)
        })

    return dominant_emotion, dominant_score, all_emotions, word_emotions

@app.post("/journal-entry", response_model=JournalEntryResponse)
def create_journal_entry(entry: JournalRequest, db: Session = Depends(get_db)):
    existing = db.query(models.JournalEntry).filter(models.JournalEntry.date == entry.date).first()
    if existing:
        raise HTTPException(status_code=400, detail="Journal entry for this date already exists")

    dominant_emotion, dominant_score, all_emotions, word_emotions_data = analyze_emotions(entry.text)
    journal_id = str(uuid4())
    journal = models.JournalEntry(
        id=journal_id,
        text=entry.text,
        date=entry.date,
        dominant_emotion=dominant_emotion,
        dominant_score=dominant_score,
        all_emotions=all_emotions
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

    return {
        "id": journal.id,
        "text": journal.text,
        "date": journal.date,
        "dominant_emotion": dominant_emotion,
        "dominant_score": dominant_score,
        "all_emotions": all_emotions,
        "word_emotions": word_emotions_data
    }

@app.put("/journal-entry/{entry_id}", response_model=JournalEntryResponse)
def update_journal_entry(entry_id: str, request: JournalEditRequest, db: Session = Depends(get_db)):
    journal = db.query(models.JournalEntry).filter(models.JournalEntry.id == entry_id).first()
    if not journal:
        raise HTTPException(status_code=404, detail="Journal entry not found")

    db.query(models.WordEmotion).filter(models.WordEmotion.journal_id == journal.id).delete()

    dominant_emotion, dominant_score, all_emotions, word_emotions_data = analyze_emotions(request.text)
    journal.text = request.text
    journal.dominant_emotion = dominant_emotion

    for word in word_emotions_data:
        journal.word_emotions.append(models.WordEmotion(
            id=str(uuid4()),
            text=word['text'],
            emotion=word['emotion'],
            score=word['score']
        ))

    db.commit()
    db.refresh(journal)

    return {
        "id": journal.id,
        "text": journal.text,
        "date": journal.date,
        "dominant_emotion": dominant_emotion,
        "dominant_score": dominant_score,
        "all_emotions": all_emotions,
        "word_emotions": word_emotions_data
    }

@app.get("/journal-entry/by-date", response_model=JournalEntryResponse)
def get_journal_by_date(date: date = Query(...), db: Session = Depends(get_db)):
    journal = db.query(models.JournalEntry).filter(models.JournalEntry.date == date).first()
    if not journal:
        raise HTTPException(status_code=404, detail="No journal entry found for this date")

    return {
        "id": journal.id,
        "text": journal.text,
        "date": journal.date,
        "dominant_emotion": journal.dominant_emotion,
        "dominant_score": journal.dominant_score or 0.0,
        "all_emotions": journal.all_emotions or [],
        "word_emotions": [
            {"text": w.text, "emotion": w.emotion, "score": w.score}
            for w in journal.word_emotions
        ]
    }

@app.get("/journal-entries", response_model=List[JournalEntryResponse])
def get_all_journals(db: Session = Depends(get_db)):
    journals = db.query(models.JournalEntry).all()
    response = []
    for j in journals:
        entry = JournalEntryResponse(
            id=j.id,
            text=j.text,
            date=j.date,
            dominant_emotion=j.dominant_emotion,
            dominant_score=j.dominant_score or 0.0,
            all_emotions=j.all_emotions or [],  # or fill this in if you want
            word_emotions=[
                WordEmotionOut(
                    text=w.text,
                    emotion=w.emotion,
                    score=w.score
                )
                for w in j.word_emotions
            ]
        )
        response.append(entry)
    return response

