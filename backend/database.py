from sqlmodel import create_engine

# Use SQLite for local development (Fast & Easy),
DATABASE_URL = "sqlite:///./portfolio.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})