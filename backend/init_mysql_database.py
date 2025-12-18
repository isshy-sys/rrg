#!/usr/bin/env python3
"""
Initialize MySQL database tables for TOEFL Speaking Master application.
"""
import os
import sys
from sqlalchemy import create_engine
from dotenv import load_dotenv
from models import Base

def init_database():
    """Initialize the MySQL database with all tables."""
    # Load environment variables
    load_dotenv()
    
    # Get database configuration
    mysql_host = os.getenv("MYSQL_HOST")
    mysql_port = os.getenv("MYSQL_PORT", "3306")
    mysql_database = os.getenv("MYSQL_DATABASE")
    mysql_username = os.getenv("MYSQL_USERNAME")
    mysql_password = os.getenv("MYSQL_PASSWORD")
    mysql_ssl_mode = os.getenv("MYSQL_SSL_MODE", "REQUIRED")
    mysql_ssl_ca = os.getenv("MYSQL_SSL_CA", "ssl/DigiCertGlobalRootCA.crt.pem")
    
    if not all([mysql_host, mysql_database, mysql_username, mysql_password]):
        print("❌ Missing required MySQL configuration in .env file")
        print("Required variables: MYSQL_HOST, MYSQL_DATABASE, MYSQL_USERNAME, MYSQL_PASSWORD")
        return False
    
    # Construct DATABASE_URL
    if mysql_ssl_mode == "REQUIRED":
        # Get absolute path for SSL certificate
        ssl_ca_path = os.path.abspath(mysql_ssl_ca)
        if not os.path.exists(ssl_ca_path):
            print(f"❌ SSL certificate not found: {ssl_ca_path}")
            print("Please ensure the SSL certificate is downloaded to the ssl/ directory")
            return False
        database_url = f"mysql+pymysql://{mysql_username}:{mysql_password}@{mysql_host}:{mysql_port}/{mysql_database}?ssl_ca={ssl_ca_path}&ssl_verify_cert=true&ssl_verify_identity=false"
    else:
        database_url = f"mysql+pymysql://{mysql_username}:{mysql_password}@{mysql_host}:{mysql_port}/{mysql_database}"
    
    # Override with environment variable if set
    database_url = os.getenv("DATABASE_URL", database_url)
    
    print(f"🔗 Connecting to: {mysql_host}:{mysql_port}/{mysql_database}")
    print(f"👤 Username: {mysql_username}")
    
    try:
        # Create engine with SSL configuration
        if mysql_ssl_mode == "REQUIRED":
            engine = create_engine(
                f"mysql+pymysql://{mysql_username}:{mysql_password}@{mysql_host}:{mysql_port}/{mysql_database}",
                pool_pre_ping=True,
                pool_size=1,
                max_overflow=0,
                echo=True,  # Show SQL statements
                connect_args={
                    "ssl": {"ssl": True}  # Enable SSL
                }
            )
        else:
            engine = create_engine(
                database_url,
                pool_pre_ping=True,
                pool_size=1,
                max_overflow=0,
                echo=True
            )
        
        print("📋 Creating all database tables...")
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        
        print("✅ Database initialization completed successfully!")
        print("\n📊 Created tables:")
        print("   - users")
        print("   - practice_sessions")
        print("   - saved_phrases")
        
        return True
        
    except Exception as e:
        print(f"❌ Database initialization failed: {str(e)}")
        return False

if __name__ == "__main__":
    success = init_database()
    sys.exit(0 if success else 1)