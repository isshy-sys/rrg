/**
 * AudioRecorder component - Audio recording with real-time waveform visualization
 * 
 * Features:
 * - MediaRecorder API for audio recording
 * - Real-time waveform visualization
 * - Microphone access error handling
 * - Automatic recording start and stop
 * 
 * Requirements: 4.1, 4.2
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import WaveformVisualizer from './WaveformVisualizer';
import { RecordingError } from '@/lib/api-client';

interface AudioRecorderProps {
  duration: number; // Recording duration in seconds
  onRecordingComplete: (audioBlob: Blob) => void;
  onError: (error: Error) => void;
  autoStart?: boolean; // Automatically start recording on mount
}

export default function AudioRecorder({
  duration,
  onRecordingComplete,
  onError,
  autoStart = false,
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mimeTypeRef = useRef<string>('audio/webm');

  // Start recording function
  const startRecording = async () => {
    try {
      // Check if MediaRecorder is supported
      if (!window.MediaRecorder) {
        throw new RecordingError('このブラウザは音声録音をサポートしていません。Chrome、Firefox、Safari等の最新ブラウザをお使いください。');
      }
      
      // Request microphone access with optimized settings for transcription
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,  // Lower sample rate for faster processing
          channelCount: 1,    // Mono audio for smaller file size
        },
      });

      setAudioStream(stream);
      audioChunksRef.current = [];

      // Create MediaRecorder instance with fallback MIME types and optimal settings
      let mimeType = '';
      let options: MediaRecorderOptions = {};
      
      // Use formats with best Whisper API compatibility
      const supportedTypes = [
        'audio/ogg;codecs=opus',  // OGG Opus has excellent Whisper compatibility
        'audio/webm;codecs=opus', // WebM Opus is also well supported
        'audio/wav'               // WAV if available (rare in browsers)
      ];
      
      // Fallback types for older browsers
      const fallbackTypes = [
        'audio/webm',
        'audio/mp4'
      ];
      
      // Try supported formats in order of Whisper compatibility
      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          console.log('✅ Using supported format:', type);
          break;
        }
      }
      
      // If none of the preferred formats work, try fallback types
      if (!mimeType) {
        console.warn('⚠️ Preferred formats not supported, trying fallback formats...');
        for (const type of fallbackTypes) {
          if (MediaRecorder.isTypeSupported(type)) {
            mimeType = type;
            console.log('📝 Using fallback format:', type);
            break;
          }
        }
      }
      
      if (mimeType) {
        options.mimeType = mimeType;
        // Add bitrate optimized for transcription (smaller files, faster processing)
        if (mimeType.includes('opus') || mimeType.includes('mp4')) {
          options.audioBitsPerSecond = 64000; // 64 kbps for faster processing
        }
      }

      console.log('🎙️ Using MIME type:', mimeType || 'default');
      console.log('🎙️ MediaRecorder options:', options);
      console.log('🎙️ WAV support check:', supportedTypes.map(type => ({
        type,
        supported: MediaRecorder.isTypeSupported(type)
      })));
      
      if (mimeType.includes('opus')) {
        console.log('✅ Using Opus codec for excellent Whisper compatibility');
      } else if (mimeType === 'audio/wav') {
        console.log('✅ Using WAV format for maximum compatibility');
      } else {
        console.warn('⚠️ Using fallback format:', mimeType);
      }
      
      if (!mimeType) {
        console.warn('⚠️ No supported MIME type found! This may cause issues.');
      }
      
      mimeTypeRef.current = mimeType || 'audio/webm';
      
      const mediaRecorder = new MediaRecorder(stream, options);

      mediaRecorder.ondataavailable = (event) => {
        console.log('📊 Data available event. Size:', event.data.size, 'bytes');
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log('📦 Added chunk. Total chunks:', audioChunksRef.current.length);
        }
      };

      mediaRecorder.onstop = () => {
        console.log('🎙️ MediaRecorder stopped. Chunks collected:', audioChunksRef.current.length);
        
        // Add a small delay to ensure all data is collected
        setTimeout(() => {
          console.log('🔄 Processing audio chunks after delay. Total chunks:', audioChunksRef.current.length);
          
          if (audioChunksRef.current.length === 0) {
            console.error('❌ No audio chunks collected after delay!');
            const error = new RecordingError('録音データが収集されませんでした。マイクの設定を確認してください。');
            setError(error.message);
            onError(error);
            return;
          }
          
          // Create blob with fallback MIME type handling
          let blobMimeType = mimeTypeRef.current;
          
          // If chunks have their own MIME type, use that instead
          if (audioChunksRef.current.length > 0 && audioChunksRef.current[0].type) {
            blobMimeType = audioChunksRef.current[0].type;
            console.log('🔄 Using chunk MIME type:', blobMimeType);
          }
          
          // Ensure we have a valid MIME type
          if (!blobMimeType || blobMimeType === '') {
            blobMimeType = 'audio/webm'; // Safe fallback
            console.log('🔧 Using fallback MIME type:', blobMimeType);
          }
          
          const audioBlob = new Blob(audioChunksRef.current, {
            type: blobMimeType,
          });
          console.log('📦 Audio blob created:', {
            size: audioBlob.size,
            type: audioBlob.type,
            mimeType: mimeTypeRef.current,
            chunksCount: audioChunksRef.current.length,
            chunkSizes: audioChunksRef.current.map(chunk => chunk.size),
            chunkTypes: audioChunksRef.current.map(chunk => chunk.type)
          });
          
          // Check if the blob type matches what we expected
          if (audioBlob.type !== mimeTypeRef.current) {
            console.warn('⚠️ Blob type mismatch!', {
              expected: mimeTypeRef.current,
              actual: audioBlob.type
            });
          }
          
          // Validate blob size
          if (audioBlob.size === 0) {
            console.error('❌ Audio blob is empty!');
            const error = new RecordingError('録音データが空です。マイクの設定を確認してもう一度お試しください。');
            setError(error.message);
            onError(error);
            return;
          }
          
          // Additional validation for very small blobs
          if (audioBlob.size < 1000) {
            console.warn('⚠️ Audio blob is very small:', audioBlob.size, 'bytes');
            console.log('🔍 Proceeding with small blob, but this might indicate an issue');
          }
          
          // Clean up stream first
          stream.getTracks().forEach((track) => track.stop());
          setAudioStream(null);
          setIsRecording(false);
          
          // Then trigger completion callback
          onRecordingComplete(audioBlob);
        }, 100); // 100ms delay to ensure data collection is complete
      };

      mediaRecorder.onerror = (event) => {
        console.error('❌ MediaRecorder error:', event);
        const error = new RecordingError('録音中にエラーが発生しました。ブラウザを再読み込みして再度お試しください。');
        setError(error.message);
        onError(error);
        
        // Clean up on error
        setIsRecording(false);
        if (audioStream) {
          audioStream.getTracks().forEach((track) => track.stop());
          setAudioStream(null);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      
      // Start recording with appropriate timeslice based on duration
      // For shorter recordings, use smaller timeslice to ensure data collection
      const timeslice = duration <= 5 ? 250 : 500; // 250ms for short recordings, 500ms for longer
      console.log('🎙️ Starting recording with timeslice:', timeslice, 'ms');
      mediaRecorder.start(timeslice);
      setIsRecording(true);
      setError(null);
      console.log('🎙️ Recording started with state:', mediaRecorder.state);

      // Auto-stop after duration
      console.log(`⏱️ Recording will auto-stop in ${duration} seconds`);
      recordingTimeoutRef.current = setTimeout(() => {
        console.log('⏰ Auto-stop timeout triggered');
        stopRecording();
      }, duration * 1000);
    } catch (err) {
      handleRecordingError(err);
    }
  };

  // Stop recording function
  const stopRecording = () => {
    console.log('🛑 stopRecording called. mediaRecorder state:', mediaRecorderRef.current?.state);
    
    if (!mediaRecorderRef.current) {
      console.warn('⚠️ No mediaRecorder instance');
      return;
    }
    
    // Clear timeout first to prevent double execution
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
    
    // Check if mediaRecorder is in a valid state to stop
    if (mediaRecorderRef.current.state === 'recording') {
      console.log('⏹️ Stopping MediaRecorder...');
      // Request final data before stopping
      mediaRecorderRef.current.requestData();
      // Small delay to ensure requestData is processed
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }, 50);
      setIsRecording(false);
    } else if (mediaRecorderRef.current.state === 'paused') {
      console.log('⏸️ MediaRecorder is paused, resuming and stopping...');
      mediaRecorderRef.current.resume();
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.requestData();
          setTimeout(() => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
              mediaRecorderRef.current.stop();
            }
          }, 50);
        }
      }, 50);
      setIsRecording(false);
    } else {
      console.warn('⚠️ MediaRecorder is not in recording state:', mediaRecorderRef.current.state);
      // If not recording but we have chunks, still trigger completion
      if (audioChunksRef.current.length > 0) {
        console.log('📦 Manually triggering completion with existing chunks');
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mimeTypeRef.current,
        });
        
        if (audioBlob.size > 0) {
          onRecordingComplete(audioBlob);
        } else {
          const error = new RecordingError('録音データが空です。もう一度お試しください。');
          setError(error.message);
          onError(error);
        }
        
        setIsRecording(false);
        
        // Clean up stream
        if (audioStream) {
          audioStream.getTracks().forEach((track) => track.stop());
          setAudioStream(null);
        }
      } else {
        // No chunks and not recording - this is an error state
        const error = new RecordingError('録音が正常に開始されませんでした。もう一度お試しください。');
        setError(error.message);
        onError(error);
        setIsRecording(false);
      }
    }
  };

  // Handle recording errors
  const handleRecordingError = (err: unknown) => {
    let errorMessage = '音声録音の開始に失敗しました。';
    
    if (err instanceof DOMException) {
      if (err.name === 'NotAllowedError') {
        errorMessage = 'マイクへのアクセスが拒否されました。ブラウザの設定を確認してください。';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'マイクが見つかりません。デバイスを確認してください。';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'マイクが他のアプリケーションで使用中です。';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage = 'マイクの設定が対応していません。';
      }
    }
    
    setError(errorMessage);
    onError(new RecordingError(errorMessage));
  };

  // Auto-start recording if enabled
  useEffect(() => {
    if (autoStart) {
      startRecording();
    }

    // Cleanup on unmount
    return () => {
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
      }
      if (audioStream) {
        audioStream.getTracks().forEach((track) => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      {/* Recording indicator */}
      {isRecording && (
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-gray-700">録音中...</span>
        </div>
      )}

      {/* Waveform visualizer */}
      <WaveformVisualizer audioStream={audioStream} isRecording={isRecording} />

      {/* Error message */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Manual controls (if not auto-start) */}
      {!autoStart && (
        <div className="flex space-x-4">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              録音開始
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              録音停止
            </button>
          )}
        </div>
      )}
    </div>
  );
}
