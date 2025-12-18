#!/usr/bin/env python3
"""
Monitor transcription performance and provide optimization suggestions.
"""
import time
import requests
import io

def monitor_transcription_performance():
    """Monitor transcription performance with different file sizes."""
    
    print("🎵 Monitoring transcription performance...")
    
    # Test different file sizes
    test_cases = [
        (1000, "Small file (1KB)"),
        (10000, "Medium file (10KB)"),
        (100000, "Large file (100KB)"),
        (500000, "Very large file (500KB)")
    ]
    
    for file_size, description in test_cases:
        print(f"\n📊 Testing {description}...")
        
        # Create test audio data
        test_audio_data = b'\x1a\x45\xdf\xa3' + b'\x00' * (file_size - 4)  # WebM-like header
        
        try:
            files = {
                'audio_file': ('test.webm', io.BytesIO(test_audio_data), 'audio/webm;codecs=opus')
            }
            data = {
                'problem_id': f'perf-test-{int(time.time())}'
            }
            
            start_time = time.time()
            
            response = requests.post(
                "http://localhost:8000/api/speech/transcribe",
                files=files,
                data=data,
                timeout=120  # 2 minute timeout for monitoring
            )
            
            end_time = time.time()
            processing_time = end_time - start_time
            
            print(f"   File size: {file_size:,} bytes")
            print(f"   Processing time: {processing_time:.2f} seconds")
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                print(f"   ✅ Success")
            else:
                error_text = response.text[:100] + "..." if len(response.text) > 100 else response.text
                print(f"   ❌ Failed: {error_text}")
            
            # Performance analysis
            if processing_time > 30:
                print(f"   ⚠️  Slow processing detected ({processing_time:.2f}s)")
            elif processing_time > 60:
                print(f"   🚨 Very slow processing detected ({processing_time:.2f}s)")
            else:
                print(f"   ✅ Good performance ({processing_time:.2f}s)")
                
        except requests.exceptions.Timeout:
            print(f"   ❌ Timeout after 2 minutes")
        except Exception as e:
            print(f"   ❌ Error: {e}")
        
        # Wait between tests
        time.sleep(2)
    
    print("\n📈 Performance monitoring completed")
    print("\n💡 Optimization suggestions:")
    print("   - Keep audio files under 100KB for best performance")
    print("   - Use Opus codec for better compression")
    print("   - Consider client-side audio compression for large files")

if __name__ == "__main__":
    # Wait for server to start
    time.sleep(3)
    monitor_transcription_performance()