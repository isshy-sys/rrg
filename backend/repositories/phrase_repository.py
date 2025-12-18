"""
Repository for SavedPhrase CRUD operations.
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from models import SavedPhrase, User


class PhraseRepository:
    """Repository for managing saved phrases."""
    
    def __init__(self, db: Session):
        """
        Initialize repository with database session.
        
        Args:
            db: SQLAlchemy database session
        """
        self.db = db
    
    def save_phrase(
        self,
        user_id: str,  # Changed to string for MySQL CHAR(36)
        phrase: str,
        context: str,
        category: str
    ) -> SavedPhrase:
        """
        Save a new phrase to the database.
        
        Args:
            user_id: ID of the user (string for MySQL)
            phrase: The phrase text to save
            context: Context or usage example
            category: Category of the phrase (e.g., 'transition', 'example', 'conclusion')
        
        Returns:
            The saved SavedPhrase object
        """
        saved_phrase = SavedPhrase(
            user_id=user_id,
            phrase=phrase,
            context=context,
            category=category,
            is_mastered=False
        )
        self.db.add(saved_phrase)
        self.db.commit()
        self.db.refresh(saved_phrase)
        return saved_phrase
    
    def get_phrase(self, phrase_id: str) -> Optional[SavedPhrase]:
        """
        Get a phrase by ID.
        
        Args:
            phrase_id: ID of the phrase (string for MySQL)
        
        Returns:
            SavedPhrase object or None if not found
        """
        return self.db.query(SavedPhrase).filter(SavedPhrase.id == phrase_id).first()
    
    def get_user_phrases(self, user_id: str) -> List[SavedPhrase]:
        """
        Get all phrases for a user.
        
        Args:
            user_id: ID of the user (string for MySQL)
        
        Returns:
            List of SavedPhrase objects
        """
        return (
            self.db.query(SavedPhrase)
            .filter(SavedPhrase.user_id == user_id)
            .order_by(SavedPhrase.created_at.desc())
            .all()
        )
    
    def delete_phrase(self, phrase_id: str) -> bool:
        """
        Delete a phrase by ID.
        
        Args:
            phrase_id: ID of the phrase to delete (string for MySQL)
        
        Returns:
            True if deleted, False if not found
        """
        phrase = self.get_phrase(phrase_id)
        if phrase:
            self.db.delete(phrase)
            self.db.commit()
            return True
        return False
    
    def update_mastered_status(self, phrase_id: str, is_mastered: bool) -> Optional[SavedPhrase]:
        """
        Update the mastered status of a phrase.
        
        Args:
            phrase_id: ID of the phrase (string for MySQL)
            is_mastered: New mastered status
        
        Returns:
            Updated SavedPhrase object or None if not found
        """
        phrase = self.get_phrase(phrase_id)
        if phrase:
            phrase.is_mastered = is_mastered
            self.db.commit()
            self.db.refresh(phrase)
            return phrase
        return None
