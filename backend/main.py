from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel, Session, select
from database import engine
from models import BlogPost

app = FastAPI(title="My AI Portfolio")

# --- CORS CONFIGURATION ---
# Updated to Server and Production domains
origins = [
    "http://localhost:5173",      # Local Development
    "http://127.0.0.1:5173",      # Local Development
    "*"                           # Allow ALL origins (Crucial for first VPS deployment)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    SQLModel.metadata.create_all(engine)

# --- ROUTES ---

# 1. CREATE
@app.post("/posts/", response_model=BlogPost)
def create_post(post: BlogPost):
    with Session(engine) as session:
        session.add(post)
        session.commit()
        session.refresh(post)
        return post

# 2. READ ALL
@app.get("/posts/", response_model=list[BlogPost])
def read_posts():
    with Session(engine) as session:
        # Sort by ID descending (newest first)
        statement = select(BlogPost).order_by(BlogPost.id.desc()) 
        posts = session.exec(statement).all()
        return posts

# 3. UPDATE 
@app.put("/posts/{post_id}", response_model=BlogPost)
def update_post(post_id: int, post_update: BlogPost):
    with Session(engine) as session:
        db_post = session.get(BlogPost, post_id)
        if not db_post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        # Update fields
        db_post.title = post_update.title
        db_post.content = post_update.content
        db_post.slug = post_update.slug
        
        session.add(db_post)
        session.commit()
        session.refresh(db_post)
        return db_post

# 4. DELETE 
@app.delete("/posts/{post_id}")
def delete_post(post_id: int):
    with Session(engine) as session:
        post = session.get(BlogPost, post_id)
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        session.delete(post)
        session.commit()
        return {"message": "Post deleted successfully"}