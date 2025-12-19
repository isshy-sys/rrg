const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// Error classes
export class APIError extends Error {
  userMessage: string;
  details?: unknown;
  constructor(userMessage: string, details?: unknown) {
    super(userMessage);
    this.name = 'APIError';
    this.userMessage = userMessage;
    this.details = details;
  }
}

export class NetworkError extends Error {
  constructor(message = 'Network error') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class RateLimitError extends APIError {
  constructor(userMessage = 'リクエスト回数の上限に達しました。しばらく待ってから再試行してください。') {
    super(userMessage);
    this.name = 'RateLimitError';
  }
}

export class ServerError extends APIError {
  constructor(userMessage = 'サーバーエラーが発生しました。') {
    super(userMessage);
    this.name = 'ServerError';
  }
}

export class AuthenticationError extends APIError {
  constructor(userMessage = '認証エラーが発生しました。ログインし直してください。') {
    super(userMessage);
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends APIError {
  details?: Record<string, unknown>;
  constructor(userMessage = '入力エラーがあります。', details?: Record<string, unknown>) {
    super(userMessage, details);
    this.name = 'ValidationError';
    this.details = details;
  }
}

export class RecordingError extends Error {
  constructor(message = '録音エラー') {
    super(message);
    this.name = 'RecordingError';
  }
}

// Helper for JSON requests
async function requestJSON<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  try {
    const res = await fetch(input, init);
    const text = await res.text();

    // Parse response safely — server may return non-JSON or empty bodies
    let data: any = {};
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        data = { detail: text };
      }
    } else {
      data = { detail: res.statusText || 'No response body' };
    }

    // Log request details for debugging (only in development)
    if (process.env.NODE_ENV === 'development' && !res.ok) {
      try {
        console.error('API Request failed:');
        console.error('URL:', String(input));
        console.error('Method:', init?.method || 'GET');
        console.error('Status:', res?.status || 'no status');
        console.error('Status Text:', res?.statusText || 'no status text');
        console.error('Response Data:', data);
        console.error('Raw Text:', text);
        console.error('Content Type:', res?.headers?.get('content-type') || 'unknown');
        console.error('Has Response:', !!res);
        console.error('Has Text:', !!text);
        console.error('Has Data:', !!data);
        if (data && typeof data === 'object') {
          console.error('Data Keys:', Object.keys(data));
        }
      } catch (logError) {
        console.error('Error logging API failure:', logError);
        console.error('Basic error - URL:', String(input));
        console.error('Basic error - Status:', res?.status);
      }
    }

    if (!res.ok) {
      const status = res.status;
      
      // Extract error information from the response
      let userMessage = 'APIエラーが発生しました。';
      let errorDetails = data;
      
      // Handle structured error response from backend
      if (data?.error) {
        userMessage = data.error.user_message || data.error.message || userMessage;
        errorDetails = {
          code: data.error.code,
          message: data.error.message,
          user_message: data.error.user_message,
          details: data.error.details || {}
        };
      } else if (data?.detail) {
        userMessage = data.detail;
        errorDetails = data.detail;
      } else if (data?.message) {
        userMessage = data.message;
        errorDetails = data.message;
      } else if (text) {
        userMessage = text;
        errorDetails = text;
      }
      
      // Provide more specific error messages for common issues
      if (userMessage.includes('サポートされていないファイル形式')) {
        userMessage = '音声ファイルの形式に問題があります。マイクの設定を確認して、もう一度録音してください。';
      } else if (userMessage.includes('application/octet-stream')) {
        userMessage = 'ブラウザの録音機能に問題があります。ページを再読み込みして、もう一度お試しください。';
      }
      
      // Throw specific error types based on status code
      if (status === 401) throw new AuthenticationError(data?.error?.user_message);
      if (status === 429) throw new RateLimitError(data?.error?.user_message);
      if (status >= 500) throw new ServerError(data?.error?.user_message);
      
      throw new APIError(userMessage, errorDetails);
    }

    return data as T;
  } catch (err) {
    if (err instanceof APIError || err instanceof AuthenticationError || err instanceof ServerError || err instanceof RateLimitError) throw err;
    throw new NetworkError((err as Error)?.message || 'Network error');
  }
}

// History
export async function fetchHistory(userIdentifier: string, limit = 3) {
  const url = `${API_BASE}/api/history?user_id=${encodeURIComponent(userIdentifier)}&limit=${encodeURIComponent(String(limit))}`;
  return requestJSON<{ sessions: any[]; total: number }>(url, { method: 'GET' });
}

export async function fetchSessionDetail(sessionId: string, userIdentifier: string) {
  const url = `${API_BASE}/api/history/${encodeURIComponent(sessionId)}?user_id=${encodeURIComponent(userIdentifier)}`;
  return requestJSON<any>(url, { method: 'GET' });
}

// Problems
export async function generateProblem(userIdentifier: string, task_type = 'task3', topic_category?: string) {
  const url = `${API_BASE}/api/problems/generate`;
  const body = { task_type, topic_category, user_id: userIdentifier };
  return requestJSON<any>(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}

// Speech (upload audio blob)
export async function transcribeAudio(audioBlob: Blob, problemId: string, retryCount = 0) {
  const url = `${API_BASE}/api/speech/transcribe`;
  const fd = new FormData();
  // Ensure the blob has the correct type and filename extension (prioritize most compatible formats)
  const filename = audioBlob.type.includes('wav') ? 'recording.wav' :
                   audioBlob.type.includes('ogg') ? 'recording.ogg' :
                   audioBlob.type.includes('mp4') ? 'recording.mp4' :
                   audioBlob.type.includes('webm') ? 'recording.webm' : 'recording.wav';
  fd.append('audio_file', audioBlob, filename);
  fd.append('problem_id', problemId);
  
  // Log audio blob details for debugging
  console.log('🎤 Transcribing audio:', {
    size: audioBlob.size,
    type: audioBlob.type,
    filename: filename,
    problemId: problemId,
    url: url,
    blobConstructor: audioBlob.constructor.name,
    isBlob: audioBlob instanceof Blob,
    hasStream: typeof audioBlob.stream === 'function',
    hasArrayBuffer: typeof audioBlob.arrayBuffer === 'function'
  });

  // Critical check: if blob type is empty or generic, try to fix it
  if (!audioBlob.type || audioBlob.type === 'application/octet-stream') {
    console.warn('⚠️ Audio blob has invalid MIME type:', audioBlob.type);
    console.log('🔧 Attempting to fix MIME type...');
    
    // Create a new blob with a more compatible MIME type
    audioBlob = new Blob([audioBlob], { type: 'audio/mp4' });
    console.log('✅ Fixed audio blob MIME type to:', audioBlob.type);
  }
  
  // Special handling for WebM and MP4 files that might have compatibility issues
  if (audioBlob.type.includes('webm')) {
    console.warn('⚠️ WebM format detected. This may cause compatibility issues with Whisper API.');
    console.log('🔍 WebM file details:', {
      size: audioBlob.size,
      type: audioBlob.type
    });
    
    // If it's a problematic WebM file, try to convert it to a more compatible format
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Check WebM signature more thoroughly
      const webmSignature = [0x1a, 0x45, 0xdf, 0xa3];
      const hasValidSignature = webmSignature.every((byte, i) => uint8Array[i] === byte);
      
      if (!hasValidSignature) {
        console.warn('⚠️ WebM file has invalid signature, converting to WAV format');
        audioBlob = new Blob([audioBlob], { type: 'audio/wav' });
        console.log('🔧 Converted WebM to WAV format for better compatibility');
      }
    } catch (conversionError) {
      console.warn('⚠️ Could not validate WebM signature:', conversionError);
    }
  }
  
  // Special handling for MP4 files that might have codec compatibility issues
  if (audioBlob.type.includes('mp4')) {
    console.warn('⚠️ MP4 format detected. This may cause codec compatibility issues with Whisper API.');
    console.log('🔍 MP4 file details:', {
      size: audioBlob.size,
      type: audioBlob.type
    });
    
    // If it's MP4 with codec info, try to simplify to basic MP4 or convert to WAV
    if (audioBlob.type.includes('codecs')) {
      console.warn('⚠️ MP4 file with codec info detected, converting to WAV for better compatibility');
      audioBlob = new Blob([audioBlob], { type: 'audio/wav' });
      console.log('🔧 Converted MP4 with codecs to WAV format for better compatibility');
    }
  }
  
  // Log first few bytes of audio data for debugging
  if (audioBlob.size > 0) {
    const reader = new FileReader();
    reader.onload = () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      const bytes = new Uint8Array(arrayBuffer).slice(0, 20);
      console.log('🔍 First 20 bytes (hex):', Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(' '));
    };
    reader.readAsArrayBuffer(audioBlob.slice(0, 20));
  }

  // Check if audio blob is valid
  if (audioBlob.size === 0) {
    throw new APIError('音声ファイルが空です。録音が正常に行われませんでした。');
  }

  // Check if audio blob is too small (likely invalid)
  if (audioBlob.size < 1000) { // Less than 1KB is probably invalid
    console.warn('⚠️ Audio blob is very small:', audioBlob.size, 'bytes');
    throw new APIError(`音声ファイルが小さすぎます（${audioBlob.size}バイト）。録音が正常に行われなかった可能性があります。`);
  }

  // Additional validation: check if blob can be read as array buffer
  try {
    const arrayBuffer = await audioBlob.arrayBuffer();
    if (arrayBuffer.byteLength === 0) {
      throw new APIError('音声データが読み取れません。録音に失敗した可能性があります。');
    }
    
    // Check if the audio data looks like valid audio
    const uint8Array = new Uint8Array(arrayBuffer);
    const firstBytes = Array.from(uint8Array.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join(' ');
    
    console.log('✅ Audio blob validation passed:', {
      size: audioBlob.size,
      type: audioBlob.type,
      arrayBufferSize: arrayBuffer.byteLength,
      firstBytesHex: firstBytes
    });
    
    // Basic validation for common audio formats
    if (audioBlob.type.includes('webm')) {
      // WebM should start with EBML signature
      if (!uint8Array.slice(0, 4).every((byte, i) => byte === [0x1a, 0x45, 0xdf, 0xa3][i])) {
        console.warn('⚠️ WebM file does not have expected signature');
      }
    }
    
  } catch (bufferError) {
    console.error('❌ Audio blob validation failed:', bufferError);
    throw new APIError('音声データの検証に失敗しました。録音をやり直してください。');
  }

  // Validate MIME type
  if (!audioBlob.type) {
    console.warn('⚠️ Audio blob has no MIME type');
    throw new APIError('音声ファイルの形式を判定できません。');
  }
  
  // Validate audio blob type
  const validTypes = ['audio/webm', 'audio/wav', 'audio/mp3', 'audio/mp4', 'audio/ogg'];
  const isValidType = validTypes.some(type => audioBlob.type.includes(type));
  if (!isValidType) {
    console.warn('⚠️ Potentially unsupported audio type:', audioBlob.type);
  }

  try {
    console.log('🚀 Sending transcription request to:', url);
    console.log('📤 Request details:', {
      audioSize: audioBlob.size,
      audioType: audioBlob.type,
      filename: filename,
      problemId: problemId,
      url: url,
      method: 'POST'
    });
    
    // Log FormData details
    console.log('📋 FormData contents:');
    for (const [key, value] of fd.entries()) {
      if (value && typeof value === 'object' && 'name' in value) {
        console.log(`  ${key}: File - name: ${(value as File).name}, size: ${(value as File).size}, type: ${(value as File).type}`);
      } else if (value && typeof value === 'object' && 'size' in value) {
        console.log(`  ${key}: Blob - size: ${(value as Blob).size}, type: ${(value as Blob).type}`);
      } else {
        console.log(`  ${key}: ${typeof value} - ${value}`);
      }
    }
    
    // Additional validation
    const audioFileEntry = fd.get('audio_file');
    console.log('🔍 Audio file entry validation:', {
      exists: !!audioFileEntry,
      type: typeof audioFileEntry,
      isBlob: audioFileEntry instanceof Blob,
      isFile: audioFileEntry instanceof File,
      size: audioFileEntry instanceof Blob ? audioFileEntry.size : 'N/A',
      mimeType: audioFileEntry instanceof Blob ? audioFileEntry.type : 'N/A'
    });
    
    // Log request configuration
    console.log('⚙️ Request config:', {
      method: 'POST',
      hasBody: !!fd,
      timeout: '30000ms'
    });
    
    // Test backend connectivity first
    try {
      console.log('🏥 Testing backend connectivity...');
      const healthCheck = await fetch(`${API_BASE}/health`, { 
        method: 'GET'
      });
      console.log('🏥 Backend health check result:', {
        status: healthCheck.status,
        ok: healthCheck.ok,
        statusText: healthCheck.statusText
      });
      
      if (!healthCheck.ok) {
        console.warn('⚠️ Backend health check failed:', healthCheck.status);
        throw new NetworkError(`バックエンドサーバーが応答していません (${healthCheck.status})`);
      }
    } catch (healthError) {
      console.error('❌ Backend health check failed:', healthError);
      if (healthError instanceof NetworkError) {
        throw healthError;
      }
      throw new NetworkError('バックエンドサーバーに接続できません。サーバーが起動しているか確認してください。');
    }
    
    const res = await fetch(url, { 
      method: 'POST', 
      body: fd,
      // Extended timeout for audio transcription (can take longer for large files)
      signal: AbortSignal.timeout(90000) // 90 second timeout for transcription
    });
    console.log('📡 Transcription response received:', {
      status: res?.status,
      statusText: res?.statusText,
      ok: res?.ok,
      headers: res?.headers ? Object.fromEntries(res.headers.entries()) : 'no headers',
      url: res?.url
    });
    
    if (!res || !res.ok) {
      console.log('🚨 Error response detected:', {
        hasResponse: !!res,
        status: res?.status,
        statusText: res?.statusText,
        ok: res?.ok,
        url: res?.url,
        type: res?.type,
        headers: res?.headers ? Object.fromEntries(res.headers.entries()) : 'no headers'
      });
      
      let rawText = '';
      let errorData: any = {};
      let parseError: string | null = null;
      
      console.log('🔍 Processing error response...');
      console.log('🔍 Response details:', {
        status: res?.status,
        statusText: res?.statusText,
        ok: res?.ok,
        headers: res?.headers ? Object.fromEntries(res.headers.entries()) : 'no headers'
      });
      
      try {
        rawText = await res.text();
        console.log('📄 Raw error response text:', rawText);
        console.log('📏 Raw text length:', rawText?.length);
        console.log('📝 Raw text type:', typeof rawText);
        
        // Log response headers for debugging
        console.log('📋 Response headers:');
        if (res.headers) {
          res.headers.forEach((value, key) => {
            console.log(`  ${key}: ${value}`);
          });
        }
      } catch (textError) {
        console.warn('❌ Failed to read response text:', textError);
        rawText = '';
      }
      
      try {
        if (rawText) {
          console.log('🔍 Attempting to parse JSON from rawText...');
          errorData = JSON.parse(rawText);
          console.log('📋 Parsed error data:', errorData);
          console.log('📋 Error data keys:', Object.keys(errorData));
          console.log('📋 Error data type:', typeof errorData);
        } else {
          console.log('⚠️ No rawText to parse, using empty response');
          errorData = { detail: 'Empty response' };
        }
      } catch (parseErr) {
        parseError = String(parseErr);
        console.warn('❌ Failed to parse error response as JSON:', parseErr);
        console.log('🔍 Parse error details:', {
          error: parseErr,
          rawTextSample: rawText?.substring(0, 100),
          rawTextLength: rawText?.length
        });
        errorData = { 
          detail: rawText || 'Unknown error',
          parseError: parseError,
          rawResponse: rawText
        };
      }

      // Extract user-friendly error message
      let userMessage = '音声の文字起こしに失敗しました。';
      
      // Handle specific HTTP status codes
      if (res?.status === 413) {
        userMessage = '音声ファイルが大きすぎます。録音時間を短くしてお試しください。';
      } else if (res?.status === 415) {
        userMessage = '音声ファイルの形式がサポートされていません。';
      } else if (res?.status === 500) {
        userMessage = 'サーバー内部エラーが発生しました。しばらく待ってから再度お試しください。';
      } else if (res?.status === 503) {
        userMessage = 'サービスが一時的に利用できません。しばらく待ってから再度お試しください。';
      } else if (errorData?.error?.user_message) {
        userMessage = errorData.error.user_message;
      } else if (errorData?.error?.message) {
        userMessage = errorData.error.message;
      } else if (errorData?.detail) {
        userMessage = errorData.detail;
      } else if (rawText && rawText.length < 200) {
        userMessage = rawText;
      } else {
        userMessage = `サーバーエラーが発生しました (${res?.status || 'unknown status'})。もう一度お試しください。`;
      }

      // Log detailed error for debugging (include rawText and headers)
      try {
        const headersObj: Record<string, string> = {};
        if (res && res.headers && typeof res.headers.forEach === 'function') {
          res.headers.forEach((value, key) => {
            headersObj[key] = value;
          });
        }
        
        const detailedErrorInfo = {
          hasResponse: !!res,
          status: res?.status || 'no response',
          statusText: res?.statusText || 'no response',
          responseParsed: errorData || {},
          rawText: rawText || 'no raw text',
          rawTextLength: rawText?.length || 0,
          url: url,
          contentType: res?.headers?.get('content-type') || 'unknown',
          headers: headersObj,
          audioSize: audioBlob.size,
          audioType: audioBlob.type,
          filename: filename,
          parseError: parseError || null,
          userMessage: userMessage || 'Unknown error',
          errorDataKeys: errorData ? Object.keys(errorData) : [],
          errorDataType: typeof errorData,
          // Add more debugging info
          audioBlobValid: audioBlob instanceof Blob,
          audioBlobConstructor: audioBlob.constructor.name,
          hasFormData: !!fd,
          formDataEntries: fd ? Array.from(fd.entries()).map(([key, value]) => ({
            key,
            valueType: typeof value,
            isFile: value instanceof File,
            size: value instanceof File ? value.size : 'N/A'
          })) : []
        };
        
        // Log error info safely to avoid circular reference issues
        console.error('❌ Transcription error:', {
          status: res?.status || 'unknown',
          userMessage: userMessage || 'Unknown error',
          audioSize: audioBlob.size,
          audioType: audioBlob.type,
          url: url
        });
        
        // Log error data separately if it exists and is not empty
        if (errorData && typeof errorData === 'object' && Object.keys(errorData).length > 0) {
          console.error('📋 Response error data:', errorData);
        }
        
        // Log raw text if it's short enough and exists
        if (rawText && rawText.length > 0 && rawText.length < 500) {
          console.error('📄 Raw response text:', rawText);
        }
      } catch (logError) {
        console.error('❌ Error logging transcription error:', logError);
        console.error('🔍 Basic error info:', {
          status: res?.status || 'unknown',
          userMessage: userMessage || 'Unknown error',
          audioSize: audioBlob.size,
          audioType: audioBlob.type
        });
      }

      throw new APIError(userMessage, errorData);
    }
    
    return res.json();
  } catch (err) {
    if (err instanceof APIError) {
      // For persistent API errors, provide a fallback option
      if (retryCount >= 2) {
        console.error('❌ Transcription failed after retries. Offering fallback option.');
        throw new APIError(
          '音声の文字起こしに失敗しました。手動で回答を入力するか、ページを再読み込みして再度お試しください。',
          { 
            originalError: err.details,
            fallbackAvailable: true,
            retryCount: retryCount
          }
        );
      }
      throw err;
    }
    
    // Log the actual error for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('Transcription network error:', {
        error: err,
        message: (err as Error)?.message,
        stack: (err as Error)?.stack,
        url: url,
        audioSize: audioBlob.size,
        audioType: audioBlob.type,
        errorType: typeof err,
        errorName: (err as Error)?.name,
        retryCount: retryCount
      });
    }
    
    // Check if it's a network connectivity issue
    const errorMessage = (err as Error)?.message || '';
    const errorName = (err as Error)?.name || '';
    
    if (errorName === 'AbortError' || errorMessage.includes('aborted')) {
      throw new NetworkError('リクエストがタイムアウトしました。ネットワーク接続を確認してもう一度お試しください。');
    } else if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('Failed to fetch')) {
      throw new NetworkError('ネットワーク接続エラーです。インターネット接続とサーバーの状態を確認してください。');
    } else if (errorName === 'TypeError' && errorMessage.includes('NetworkError')) {
      throw new NetworkError('ネットワークエラーが発生しました。しばらく待ってから再度お試しください。');
    }
    
    // Retry logic for network errors (but not for timeout errors)
    if (retryCount < 1 && (errorName === 'TypeError' || errorMessage.includes('fetch')) && !errorMessage.includes('timed out')) {
      console.log(`🔄 Retrying transcription (attempt ${retryCount + 1}/2)...`);
      await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1))); // Longer delay for transcription
      return transcribeAudio(audioBlob, problemId, retryCount + 1);
    }
    
    throw new NetworkError(`音声処理中にエラーが発生しました: ${errorMessage}`);
  }
}

// Scoring
export async function evaluateResponse(payload: { problem_id: string; transcript: string; reading_text: string; lecture_script: string }) {
  const url = `${API_BASE}/api/scoring/evaluate`;
  return requestJSON<any>(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
}

export async function evaluateTask1Response(payload: { problem_id: string; transcript: string; question: string }) {
  const url = `${API_BASE}/api/scoring/evaluate-task1`;
  return requestJSON<any>(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
}

export async function generateModelAnswer(payload: { problem_id: string; reading_text: string | null; lecture_script: string; question: string }) {
  const url = `${API_BASE}/api/scoring/model-answer/generate`;
  return requestJSON<any>(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
}

export async function generateTask1ModelAnswer(payload: { problem_id: string; question: string }) {
  const url = `${API_BASE}/api/scoring/model-answer/generate-task1`;
  return requestJSON<any>(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
}

export async function generateTask2ModelAnswer(payload: { problem_id: string; announcement_text: string; conversation_script: string; question: string }) {
  const url = `${API_BASE}/api/scoring/model-answer/generate-task2`;
  return requestJSON<any>(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
}

// Phrases
export async function savePhrase(userIdentifier: string, phrase: string, context = '', category = '') {
  const url = `${API_BASE}/api/phrases`;
  const body = { user_id: userIdentifier, phrase, context, category };
  return requestJSON<any>(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}

export async function getPhrases(userIdentifier: string) {
  const url = `${API_BASE}/api/phrases?user_id=${encodeURIComponent(userIdentifier)}`;
  return requestJSON<any>(url, { method: 'GET' });
}

export async function deletePhrase(phraseId: string, userIdentifier: string) {
  const url = `${API_BASE}/api/phrases/${encodeURIComponent(phraseId)}?user_id=${encodeURIComponent(userIdentifier)}`;
  return requestJSON<any>(url, { method: 'DELETE' });
}

export async function updatePhraseMastered(phraseId: string, userIdentifier: string, is_mastered: boolean) {
  const url = `${API_BASE}/api/phrases/${encodeURIComponent(phraseId)}?user_id=${encodeURIComponent(userIdentifier)}`;
  return requestJSON<any>(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_mastered }) });
}

// Task1 Archive
export async function getTask1Questions(userIdentifier: string, limit = 50, offset = 0) {
  const url = `${API_BASE}/api/task1-archive/questions?user_id=${encodeURIComponent(userIdentifier)}&limit=${limit}&offset=${offset}`;
  return requestJSON<any>(url, { method: 'GET' });
}

export async function getTask1Question(questionId: string, userIdentifier: string) {
  const url = `${API_BASE}/api/task1-archive/questions/${encodeURIComponent(questionId)}?user_id=${encodeURIComponent(userIdentifier)}`;
  return requestJSON<any>(url, { method: 'GET' });
}

export async function deleteTask1Question(questionId: string, userIdentifier: string) {
  const url = `${API_BASE}/api/task1-archive/questions/${encodeURIComponent(questionId)}?user_id=${encodeURIComponent(userIdentifier)}`;
  return requestJSON<any>(url, { method: 'DELETE' });
}

// Misc
export async function fetchHistoryForUser(userIdentifier: string, limit = 3) {
  return fetchHistory(userIdentifier, limit);
}

// AI Review functions
export async function generateAIReview(payload: { 
  task_type: string; 
  problem_id: string; 
  user_transcript: string; 
  question: string;
  reading_text?: string;
  lecture_script?: string;
  announcement_text?: string;
  conversation_script?: string;
}) {
  const url = `${API_BASE}/api/scoring/ai-review`;
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 AI Review Request:', {
      url: url,
      payload: payload,
      payloadSize: JSON.stringify(payload).length
    });
  }
  
  return requestJSON<any>(url, { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify(payload) 
  });
}

export async function saveAIReview(problemId: string, aiReviewData: any) {
  const url = `${API_BASE}/api/scoring/save-ai-review`;
  const payload = {
    problem_id: problemId,
    ai_review_data: aiReviewData
  };
  
  return requestJSON<any>(url, { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify(payload) 
  });
}

// Speech audio generation
export async function generateSpeechAudio(text: string): Promise<Blob> {
  const url = `${API_BASE}/api/scoring/generate-speech`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text })
    });
    
    if (!response.ok) {
      throw new APIError(`音声生成に失敗しました: ${response.status}`);
    }
    
    return await response.blob();
  } catch (error) {
    console.error('Speech generation error:', error);
    throw new APIError('音声生成中にエラーが発生しました。');
  }
}

export type RecordingErrorType = RecordingError;

export { fetchHistory as fetchHistoryAPI, transcribeAudio as transcribeAudioAPI };
