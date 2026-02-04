from datetime import timedelta
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import SQLModel, Session, select
from database import engine
from models import BlogPost
from auth import (
    create_access_token,
    verify_password,
    get_current_admin,
    ADMIN_USERNAME,
    ADMIN_HASHED_PASSWORD,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

app = FastAPI(
    title="raghvendra.cloud",
    root_path="/api"
)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "*"
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

@app.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    if form_data.username != ADMIN_USERNAME:
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    
    if not verify_password(form_data.password, ADMIN_HASHED_PASSWORD):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": form_data.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/posts/", response_model=BlogPost)
def create_post(
    post: BlogPost, 
    current_user: str = Depends(get_current_admin)
):
    with Session(engine) as session:
        session.add(post)
        session.commit()
        session.refresh(post)
        return post

@app.get("/posts/", response_model=list[BlogPost])
def read_posts():
    with Session(engine) as session:
        statement = select(BlogPost).order_by(BlogPost.id.desc()) 
        posts = session.exec(statement).all()
        return posts

@app.put("/posts/{post_id}", response_model=BlogPost)
def update_post(
    post_id: int, 
    post_update: BlogPost, 
    current_user: str = Depends(get_current_admin) 
):
    with Session(engine) as session:
        db_post = session.get(BlogPost, post_id)
        if not db_post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        db_post.title = post_update.title
        db_post.content = post_update.content
        db_post.slug = post_update.slug
        db_post.image_url = post_update.image_url
        
        session.add(db_post)
        session.commit()
        session.refresh(db_post)
        return db_post

@app.delete("/posts/{post_id}")
def delete_post(
    post_id: int, 
    current_user: str = Depends(get_current_admin)
):
    with Session(engine) as session:
        post = session.get(BlogPost, post_id)
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        session.delete(post)
        session.commit()
        return {"message": "Post deleted successfully"}
