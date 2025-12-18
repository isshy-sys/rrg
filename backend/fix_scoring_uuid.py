#!/usr/bin/env python3
"""
Fix UUID handling in scoring.py for MySQL compatibility.
"""
import re

def fix_scoring_uuid():
    """Fix UUID handling in scoring router."""
    
    # Read the file
    with open('routers/scoring.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Pattern to match UUID validation and usage
    pattern = r'''        # Validate problem_id is a valid UUID
        try:
            problem_uuid = UUID\(request\.problem_id\)
        except ValueError:
            raise HTTPException\(status_code=400, detail="Invalid problem_id format"\)
        
        # Verify the practice session exists
        session = db\.query\(PracticeSession\)\.filter\(PracticeSession\.id == problem_uuid\)\.first\(\)'''
    
    replacement = '''        # Validate problem_id is a valid UUID format
        try:
            UUID(request.problem_id)  # Just validate format, don't convert
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid problem_id format")
        
        # Verify the practice session exists (use string ID for MySQL CHAR(36))
        session = db.query(PracticeSession).filter(PracticeSession.id == request.problem_id).first()'''
    
    # Replace all occurrences
    new_content = re.sub(pattern, replacement, content, flags=re.MULTILINE)
    
    # Also fix the "Invalid problem ID format" variant
    pattern2 = r'''        # Validate problem_id is a valid UUID
        try:
            problem_uuid = UUID\(request\.problem_id\)
        except ValueError:
            raise HTTPException\(status_code=400, detail="Invalid problem ID format"\)
        
        # Find the practice session
        session = db\.query\(PracticeSession\)\.filter\(PracticeSession\.id == problem_uuid\)\.first\(\)'''
    
    replacement2 = '''        # Validate problem_id is a valid UUID format
        try:
            UUID(request.problem_id)  # Just validate format, don't convert
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid problem ID format")
        
        # Find the practice session (use string ID for MySQL CHAR(36))
        session = db.query(PracticeSession).filter(PracticeSession.id == request.problem_id).first()'''
    
    new_content = re.sub(pattern2, replacement2, new_content, flags=re.MULTILINE)
    
    # Write the fixed content back
    with open('routers/scoring.py', 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print("✅ Fixed UUID handling in scoring.py")

if __name__ == "__main__":
    fix_scoring_uuid()