from sqlalchemy import Column, String, Date, Float, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class JournalEntry(Base):
    __tablename__ = "journals"

    id = Column(String, primary_key=True, index=True)
    text = Column(String)
    date = Column(Date)
    dominant_emotion = Column(String)

    word_emotions = relationship("WordEmotion", back_populates="journal", cascade="all, delete-orphan")


class WordEmotion(Base):
    __tablename__ = "word_emotions"

    id = Column(String, primary_key=True, index=True)
    text = Column(String)
    emotion = Column(String)
    score = Column(Float)
    journal_id = Column(String, ForeignKey("journals.id"))

    journal = relationship("JournalEntry", back_populates="word_emotions")
