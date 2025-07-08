from sqlalchemy import Column, String, Date, Float, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.sqlite import JSON
from .database import Base

class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id = Column(String, primary_key=True, index=True)
    text = Column(Text)
    date = Column(Date, unique=True, index=True)
    dominant_emotion = Column(String)
    dominant_score = Column(Float)
    all_emotions = Column(JSON)

    # ✅ Define relationship to WordEmotion
    word_emotions = relationship("WordEmotion", back_populates="journal", cascade="all, delete-orphan")


class WordEmotion(Base):
    __tablename__ = "word_emotions"

    id = Column(String, primary_key=True, index=True)
    text = Column(String)
    emotion = Column(String)
    score = Column(Float)

    # ✅ Add ForeignKey linking to JournalEntry
    journal_id = Column(String, ForeignKey("journal_entries.id"))

    # ✅ Back-reference to parent journal
    journal = relationship("JournalEntry", back_populates="word_emotions")
