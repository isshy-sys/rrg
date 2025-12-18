#!/usr/bin/env python3
"""
Fix UUID handling in all routers for MySQL compatibility.
"""
import os
import re

def fix_file_uuid(filepath):
    """Fix UUID handling in a specific file."""
    
    if not os.path.exists(filepath):
        print(f"❌ File not found: {filepath}")
        return False
    
    # Read the file
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Pattern 1: question_uuid = UUID(question_id) pattern
    pattern1 = r'(\s+)question_uuid = UUID\(question_id\)'
    replacement1 = r'\1UUID(question_id)  # Just validate format, don\'t convert'
    content = re.sub(pattern1, replacement1, content)
    
    # Pattern 2: Replace question_uuid usage with question_id
    content = re.sub(r'PracticeSession\.id == question_uuid', 'PracticeSession.id == question_id', content)
    
    # Pattern 3: phrase_uuid = UUID(phrase_id) pattern
    pattern3 = r'(\s+)phrase_uuid = UUID\(phrase_id\)'
    replacement3 = r'\1UUID(phrase_id)  # Just validate format, don\'t convert'
    content = re.sub(pattern3, replacement3, content)
    
    # Pattern 4: Replace phrase_uuid usage with phrase_id
    content = re.sub(r'SavedPhrase\.id == phrase_uuid', 'SavedPhrase.id == phrase_id', content)
    
    # Write back if changed
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Fixed UUID handling in {filepath}")
        return True
    else:
        print(f"ℹ️  No changes needed in {filepath}")
        return False

def main():
    """Fix UUID handling in all router files."""
    
    files_to_fix = [
        'routers/task1_archive.py',
        'routers/phrases.py'
    ]
    
    fixed_count = 0
    for filepath in files_to_fix:
        if fix_file_uuid(filepath):
            fixed_count += 1
    
    print(f"\n✅ Fixed {fixed_count} files")

if __name__ == "__main__":
    main()