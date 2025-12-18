"""
Database configuration and session management.
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Construct MySQL DATABASE_URL from environment variables
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "toefl_speaking_db")
MYSQL_USERNAME = os.getenv("MYSQL_USERNAME", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
MYSQL_SSL_MODE = os.getenv("MYSQL_SSL_MODE", "REQUIRED")
MYSQL_SSL_CA = os.getenv("MYSQL_SSL_CA", "ssl/DigiCertGlobalRootCA.crt.pem")

# Construct DATABASE_URL for MySQL with proper SSL settings
if MYSQL_SSL_MODE == "REQUIRED":
    # Get absolute path for SSL certificate
    import os.path
    ssl_ca_path = os.path.abspath(MYSQL_SSL_CA)
    DATABASE_URL = f"mysql+pymysql://{MYSQL_USERNAME}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE}?ssl_ca={ssl_ca_path}&ssl_verify_cert=true&ssl_verify_identity=false"
else:
    DATABASE_URL = f"mysql+pymysql://{MYSQL_USERNAME}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE}"

# Allow override from environment variable (but construct it properly first)
env_database_url = os.getenv("DATABASE_URL")
if env_database_url and not env_database_url.startswith("mysql+pymysql://"):
    # If DATABASE_URL is set but doesn't look like a proper MySQL URL, use our constructed one
    pass
else:
    DATABASE_URL = env_database_url or DATABASE_URL

# Create engine with MySQL-specific settings
if MYSQL_SSL_MODE == "REQUIRED":
    import os.path
    ssl_ca_path = os.path.abspath(MYSQL_SSL_CA)
    
    engine = create_engine(
        f"mysql+pymysql://{MYSQL_USERNAME}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE}",
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
        pool_recycle=3600,  # Recycle connections every hour for Azure MySQL
        echo=False,
        connect_args={
            "ssl": {"ssl": True}  # Enable SSL
        }
    )
else:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
        pool_recycle=3600,
        echo=False
    )

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """Dependency for getting database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
