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
  // モック実装 - 開発中のため一時的にモックデータを返す
  console.log('🎲 Generating mock problem for:', task_type);
  
  // 2秒待機してAPIコールをシミュレート
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const mockProblems = {
    task1: {
      problem_id: `task1-${Date.now()}`,
      task_type: 'task1',
      question: "Some people prefer to work independently, while others prefer to work as part of a team. Which do you prefer and why? Use specific reasons and examples to support your answer.",
      reading_text: undefined,
      lecture_script: undefined,
      topic_category: topic_category || "Work and Career"
    },
    task2: {
      problem_id: `task2-${Date.now()}`,
      task_type: 'task2',
      question: "The woman expresses her opinion about the university's new policy. State her opinion and explain the reasons she gives for holding that opinion.",
      reading_text: "University Announcement\n\nEffective next semester, the university will implement a new policy requiring all students to complete at least 20 hours of community service before graduation. This initiative aims to strengthen the connection between our academic community and the broader society while providing students with valuable real-world experience. Students can choose from a variety of approved community service opportunities, including tutoring local high school students, volunteering at community centers, or participating in environmental cleanup projects. The community service requirement will be tracked through the student portal, and students must submit documentation of their service hours along with a brief reflection essay.",
      lecture_script: "Now listen to two students discussing the announcement.\n\nMan: Did you see this new community service requirement? Twenty hours seems like a lot on top of our regular coursework.\n\nWoman: Actually, I think it's a great idea. I mean, sure, it's additional work, but think about the benefits. First, it gives us a chance to apply what we're learning in our classes to real situations. Like, if you're studying education, you could tutor kids and see how teaching actually works in practice.\n\nMan: I guess that makes sense, but I'm worried about finding the time.\n\nWoman: Well, that's my second point - it's actually great for time management skills. You have to learn to balance your academic work with other responsibilities, which is exactly what we'll need to do in our careers. Plus, the university is offering flexible options. You can spread those 20 hours across multiple semesters, so it's not like you have to do it all at once.\n\nMan: Hmm, I hadn't thought about the career preparation aspect.\n\nWoman: Exactly! And one more thing - this kind of experience looks really good on resumes. Employers love to see that you've been involved in your community and can handle multiple commitments.",
      topic_category: topic_category || "Campus Life"
    },
    task3: {
      problem_id: `task3-${Date.now()}`,
      task_type: 'task3',
      question: "Using the example from the lecture, explain how the concept of 'social proof' influences consumer behavior.",
      reading_text: "Social Proof in Marketing\n\nSocial proof is a psychological phenomenon where people look to the behavior and actions of others to guide their own decisions, especially in situations of uncertainty. In marketing, this concept is leveraged to influence consumer purchasing decisions by demonstrating that others have already chosen and approved of a product or service. There are several types of social proof commonly used in marketing: expert endorsements, celebrity testimonials, user reviews and ratings, and popularity indicators such as 'bestseller' labels or showing how many people have purchased an item. The effectiveness of social proof stems from our natural tendency to follow the crowd and assume that if many others are doing something, it must be the right choice.",
      lecture_script: "Now, let me give you a concrete example of how social proof works in practice. Let's say you're shopping online for a new laptop. You've narrowed it down to two similar models with comparable features and prices. However, when you look at the product pages, you notice some key differences.\n\nThe first laptop has just a few reviews - maybe five or six - and while they're generally positive, there aren't many details. The average rating is about 4 stars.\n\nThe second laptop, on the other hand, has over 500 customer reviews with an average rating of 4.2 stars. You can see detailed comments from verified purchasers talking about their experiences - some mentioning how great the battery life is, others praising the fast processing speed, and several noting excellent customer service from the company.\n\nNow, which laptop are you more likely to choose? Most people would go with the second one, even though it's only slightly higher rated. Why? Because of social proof. Those 500 reviews represent 500 people who made the same decision you're trying to make, and they're sharing their experiences. This gives you confidence that you're making a good choice.\n\nThe interesting thing is, this happens even when we're not consciously thinking about it. Our brains automatically process this information and use it as a shortcut for decision-making. It's much easier to trust the judgment of hundreds of other customers than to research every technical specification ourselves.",
      topic_category: topic_category || "Psychology and Marketing"
    },
    task4: {
      problem_id: `task4-${Date.now()}`,
      task_type: 'task4',
      question: "Using points and examples from the lecture, explain how animals use different strategies to survive in extreme cold environments.",
      reading_text: undefined,
      lecture_script: "Today I want to talk about how animals have adapted to survive in extremely cold environments. There are basically two main strategies that animals use: behavioral adaptations and physiological adaptations.\n\nLet's start with behavioral adaptations. These are changes in how animals act to deal with the cold. One of the most common examples is migration. Many birds, like Arctic terns, fly thousands of miles to warmer climates when winter approaches. They're essentially avoiding the problem altogether by moving somewhere else.\n\nAnother behavioral strategy is hibernation. Bears are a great example of this. When food becomes scarce and temperatures drop, bears enter a state of deep sleep where their heart rate and breathing slow down dramatically. This allows them to conserve energy and survive the winter without needing to find food.\n\nNow, physiological adaptations are actual physical changes in the animal's body. One fascinating example is antifreeze proteins. Some fish in the Arctic, like the Antarctic cod, produce special proteins in their blood that prevent ice crystals from forming. It's like having natural antifreeze running through their veins.\n\nAnother physiological adaptation is counter-current heat exchange. Penguins use this system in their flippers and legs. Warm blood flowing from the heart heats up the cold blood returning from the extremities. This prevents heat loss and keeps their core body temperature stable even when they're standing on ice.\n\nFinally, there's insulation. Arctic foxes, for instance, grow incredibly thick winter coats with multiple layers of fur that trap warm air close to their bodies. Some animals even change color - the Arctic fox's fur turns white in winter, which not only provides camouflage but also better insulation properties.",
      topic_category: topic_category || "Biology and Animal Behavior"
    }
  };
  
  const mockProblem = mockProblems[task_type as keyof typeof mockProblems] || mockProblems.task3;
  
  console.log('✅ Mock problem generated:', mockProblem.problem_id);
  return mockProblem;
}

// Speech (upload audio blob) - モック実装
export async function transcribeAudio(audioBlob: Blob, problemId: string, retryCount = 0) {
  // モック実装 - 開発中のため一時的にモックデータを返す
  console.log('🎤 Mock transcription for audio blob:', {
    size: audioBlob.size,
    type: audioBlob.type,
    problemId: problemId
  });
  
  // 2-5秒待機してAPIコールをシミュレート
  const delay = 2000 + Math.random() * 3000;
  await new Promise(resolve => setTimeout(resolve, delay));
  
  // サンプル文字起こし結果を返す
  const mockTranscripts = [
    "This is a sample transcription for testing purposes. The actual transcription feature is currently under development.",
    "I believe that working independently has several advantages over working in a team. First, you have complete control over your schedule and can work at your own pace.",
    "The university's new policy regarding community service requirements will have both positive and negative impacts on students. Let me explain the main points.",
    "Social proof is a powerful psychological phenomenon that significantly influences consumer behavior in various ways."
  ];
  
  const randomTranscript = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];
  
  return {
    transcript: randomTranscript,
    confidence: 0.85 + Math.random() * 0.1, // 0.85-0.95の信頼度
    processing_time: delay / 1000
  };
}

// Scoring - モック実装
export async function evaluateResponse(payload: { problem_id: string; transcript: string; reading_text: string; lecture_script: string }) {
  // モック実装 - 開発中のため一時的にモックデータを返す (ScoringResponse型)
  console.log('🤖 Mock scoring for Task 2/3/4:', payload.problem_id);
  
  // 3-5秒待機してAPIコールをシミュレート
  const delay = 3000 + Math.random() * 2000;
  await new Promise(resolve => setTimeout(resolve, delay));
  
  return {
    overall_score: Math.floor(Math.random() * 3) + 2, // 2-4のスコア
    delivery: {
      score: Math.floor(Math.random() * 3) + 2,
      feedback: "発音とイントネーションが良好です。"
    },
    language_use: {
      score: Math.floor(Math.random() * 3) + 2,
      feedback: "文法と語彙の使用が適切です。"
    },
    topic_development: {
      score: Math.floor(Math.random() * 3) + 2,
      feedback: "トピックの展開が論理的です。"
    },
    improvement_tips: [
      "より具体的な詳細を含めることを推奨",
      "接続詞の使用を増やして流暢性を向上",
      "時間管理を改善する"
    ],
    user_transcript: payload.transcript
  };
}

export async function evaluateTask1Response(payload: { problem_id: string; transcript: string; question: string }) {
  // モック実装 - 開発中のため一時的にモックデータを返す (Task1ScoringResponse型)
  console.log('🤖 Mock scoring for Task 1:', payload.problem_id);
  
  // 3-5秒待機してAPIコールをシミュレート
  const delay = 3000 + Math.random() * 2000;
  await new Promise(resolve => setTimeout(resolve, delay));
  
  return {
    overall_score: Math.floor(Math.random() * 3) + 2, // 2-4のスコア
    delivery_feedback: "発音とイントネーションが良好です。",
    language_use_feedback: "文法と語彙の使用が適切です。",
    topic_dev_feedback: "トピックの展開が論理的です。",
    improvement_tips: [
      "より詳細な説明があるとさらに良い",
      "語彙の多様性を増やすことを推奨",
      "発音の明瞭さを向上させる"
    ],
    strengths: [
      "質問に対して適切に回答している",
      "具体的な例を挙げて説明している",
      "論理的な構成で話している"
    ],
    user_transcript: payload.transcript
  };
}

export async function generateModelAnswer(payload: { problem_id: string; reading_text: string | null; lecture_script: string; question: string }) {
  // モック実装 - 開発中のため一時的にモックデータを返す
  console.log('📝 Mock model answer generation:', payload.problem_id);
  
  // 2-3秒待機してAPIコールをシミュレート
  const delay = 2000 + Math.random() * 1000;
  await new Promise(resolve => setTimeout(resolve, delay));
  
  return {
    model_answer: "This is a sample model answer for demonstration purposes. The actual model answer generation feature is currently under development.",
    highlighted_phrases: [
      {
        text: "sample phrase",
        category: "transition",
        useful_for_writing: true
      },
      {
        text: "demonstration purposes",
        category: "academic",
        useful_for_writing: true
      }
    ]
  };
}

export async function generateTask1ModelAnswer(payload: { problem_id: string; question: string }) {
  // モック実装 - 開発中のため一時的にモックデータを返す
  console.log('📝 Mock Task1 model answer generation:', payload.problem_id);
  
  // 2-3秒待機してAPIコールをシミュレート
  const delay = 2000 + Math.random() * 1000;
  await new Promise(resolve => setTimeout(resolve, delay));
  
  return {
    model_answer: "This is a sample Task1 model answer for demonstration purposes. The actual model answer generation feature is currently under development.",
    highlighted_phrases: [
      {
        text: "in my opinion",
        category: "opinion",
        explanation: "Used to express personal viewpoint"
      },
      {
        text: "for example",
        category: "example",
        explanation: "Used to provide specific examples"
      }
    ]
  };
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
