from typing import Optional
from sqlmodel import Field, SQLModel
from datetime import datetime

class BlogPost(SQLModel, table=True):
    # The ID is optional because the Database creates it automatically
    id: Optional[int] = Field(default=None, primary_key=True)
    
    title: str
    slug: str  # used in blogs for loading page with that name or for seo 
    content: str # This will store your Markdown text
    image_url: Optional[str] = None
    
    is_published: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)