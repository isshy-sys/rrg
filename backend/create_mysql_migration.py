#!/usr/bin/env python3
"""
Create a new Alembic migration for MySQL database.
This script helps generate the initial migration from PostgreSQL to MySQL.
"""
import os
import subprocess
import sys
from dotenv import load_dotenv

def create_migration():
    """Create a new Alembic migration for MySQL."""
    # Load environment variables
    load_dotenv()
    
    print("🔄 Creating new Alembic migration for MySQL...")
    
    try:
        # Generate migration
        result = subprocess.run([
            "alembic", "revision", "--autogenerate", 
            "-m", "Convert from PostgreSQL to MySQL"
        ], capture_output=True, text=True, cwd=".")
        
        if result.returncode == 0:
            print("✅ Migration created successfully!")
            print(f"📄 Output: {result.stdout}")
            
            print("\n📋 Next steps:")
            print("1. Review the generated migration file in alembic/versions/")
            print("2. Test the migration: alembic upgrade head")
            print("3. Verify tables were created correctly")
            
        else:
            print(f"❌ Migration creation failed: {result.stderr}")
            return False
            
    except FileNotFoundError:
        print("❌ Alembic not found. Make sure it's installed:")
        print("   pip install alembic")
        return False
    except Exception as e:
        print(f"❌ Error creating migration: {str(e)}")
        return False
    
    return True

if __name__ == "__main__":
    success = create_migration()
    sys.exit(0 if success else 1)