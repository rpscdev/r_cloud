from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel

class BlogPost(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    
    title: str
    slug: str
    content: str
    image_url: Optional[str] = None
    
    is_published: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
