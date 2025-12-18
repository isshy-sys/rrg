'use client';

import { useState, useEffect, useRef } from 'react';
import type { Task1Question } from '@/lib/types';

interface Task1QuestionCardProps {
  question: Task1Question;
  onNext: () => void;
  onPrevious: () => void;
  onDelete: (questionId: string) => void;
  onQuestionUpdate?: (questionId: string, updatedQuestion: Partial<Task1Question>) => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
}

/**
 * Task1QuestionCard component for displaying Task1 questions in a flashcard-like interface.
 * Shows question on front, user response and score on back.
 */
export default function Task1QuestionCard({ 
  question, 
  onNext, 
  onPrevious, 
  onDelete,
  onQuestionUpdate,
  canGoNext, 
  canGoPrevious 
}: Task1QuestionCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiReview, setAiReview] = useState(question.ai_review);
  
  // 音声再生機能の状態
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sync aiReview state with question prop changes
  useEffect(() => {
    setAiReview(question.ai_review);
  }, [question.ai_review]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(question.id);
    setShowDeleteConfirm(false);
  };

  const handleDeleteCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score?: number | null) => {
    if (!score && score !== 0) return 'text-gray-500';
    if (score >= 4) return 'text-green-600';
    if (score >= 3) return 'text-blue-600';
    if (score >= 2) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score?: number | null) => {
    if (!score && score !== 0) return '未採点';
    switch (score) {
      case 4: return '優秀';
      case 3: return '良好';
      case 2: return '改善必要';
      case 1: return '要練習';
      default: return '未回答';
    }
  };

  const handleGenerateAIAnswer = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isGeneratingAI) return;
    
    setIsGeneratingAI(true);
    
    try {
      // Import API functions dynamically with type assertion
      const apiClient = await import('@/lib/api-client') as any;
      const generateAIReview = apiClient.generateAIReview;
      const saveAIReview = apiClient.saveAIReview;
      
      console.log('🤖 Generating AI model answer for Task1 question...');
      
      // Generate AI review with placeholder transcript to get model answer
      // Note: Backend requires at least 1 character for user_transcript
      const payload = {
        task_type: 'task1',
        problem_id: question.id,
        user_transcript: question.user_transcript || 'No user response available. Please generate a model answer for this question.', // Use existing transcript or placeholder
        question: question.question
      };
      
      console.log('📤 AI model answer generation payload:', payload);
      const result = await generateAIReview(payload);
      
      console.log('✅ AI model answer generated:', result);
      
      // Save the AI review to the database
      await saveAIReview(question.id, result);
      
      // Update local state
      setAiReview(result);
      
      console.log('💾 AI model answer saved successfully');
      
      // Update the parent component's question data without causing reshuffle
      if (onQuestionUpdate) {
        onQuestionUpdate(question.id, { ai_review: result });
      }
      
      // Note: We don't call onUpdate() here because it would cause the question
      // list to reshuffle and reset the current index, making the screen jump.
      
    } catch (error) {
      console.error('❌ Failed to generate AI model answer:', error);
      alert('AI模擬回答の生成に失敗しました。しばらく待ってから再度お試しください。');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // 音声生成と再生機能
  const handleGenerateAndPlayAudio = async (text: string) => {
    if (!text || !text.trim()) {
      alert('音声生成するテキストがありません。');
      return;
    }

    // Stop any currently playing audio and wait a bit
    handleStopAudio();
    await new Promise(resolve => setTimeout(resolve, 100));

    setIsGeneratingAudio(true);

    try {
      // Import API function dynamically with type assertion
      const apiClient = await import('@/lib/api-client') as any;
      const generateSpeechAudio = apiClient.generateSpeechAudio;

      console.log('🔊 Generating speech audio...');
      const audioBlob = await generateSpeechAudio(text);

      // Clean up previous audio URL if exists
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }

      // Create new audio URL
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);

      // Create and configure audio element
      const audio = new Audio(url);
      
      // Preload the audio
      audio.preload = 'auto';
      audio.load();

      // Set up event listeners before assigning to ref
      audio.onplay = () => {
        console.log('🎵 Audio started playing');
        setIsPlaying(true);
      };
      
      audio.onpause = () => {
        console.log('⏸️ Audio paused');
        setIsPlaying(false);
      };
      
      audio.onended = () => {
        console.log('🏁 Audio playback ended');
        setIsPlaying(false);
      };
      
      audio.onerror = (e) => {
        console.error('❌ Audio playback error:', e);
        setIsPlaying(false);
        alert('音声の再生に失敗しました。');
      };

      // Wait for audio to be ready
      await new Promise((resolve, reject) => {
        audio.oncanplaythrough = resolve;
        audio.onerror = reject;
        // Timeout after 5 seconds
        setTimeout(() => reject(new Error('Audio loading timeout')), 5000);
      });

      // Assign to ref after setup
      audioRef.current = audio;

      // Start playback with better error handling
      try {
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
          await playPromise;
          console.log('✅ Audio playback started successfully');
        }
      } catch (playError: any) {
        console.error('❌ Audio play() failed:', playError);
        setIsPlaying(false);
        
        // Handle specific error types
        if (playError.name === 'AbortError') {
          console.log('ℹ️ Audio play was interrupted, this is normal');
          return; // Don't show error for AbortError
        } else if (playError.name === 'NotAllowedError') {
          alert('ブラウザの自動再生がブロックされています。ページをクリックしてから再度お試しください。');
        } else if (playError.name === 'NotSupportedError') {
          alert('この音声形式はサポートされていません。');
        } else {
          alert('音声の再生に失敗しました。もう一度お試しください。');
        }
        return;
      }

    } catch (error) {
      console.error('❌ Audio generation/playback error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          alert('音声の読み込みがタイムアウトしました。もう一度お試しください。');
        } else {
          alert(error.message);
        }
      } else {
        alert('音声生成に失敗しました。');
      }
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleStopAudio = () => {
    console.log('🛑 Attempting to stop audio...');
    
    if (audioRef.current) {
      try {
        // First, pause the audio
        if (!audioRef.current.paused && !audioRef.current.ended) {
          audioRef.current.pause();
          console.log('⏸️ Audio paused');
        }
        
        // Reset current time
        audioRef.current.currentTime = 0;
        
        // Remove event listeners to prevent conflicts
        audioRef.current.onplay = null;
        audioRef.current.onpause = null;
        audioRef.current.onended = null;
        audioRef.current.onerror = null;
        audioRef.current.oncanplaythrough = null;
        
        console.log('🛑 Audio stopped successfully');
      } catch (error) {
        console.warn('Warning stopping audio:', error);
      }
      
      // Clear the reference
      audioRef.current = null;
    }
    
    // Always update the playing state
    setIsPlaying(false);
    console.log('🔄 Playing state set to false');
  };

  // Cleanup audio resources on unmount or when audioUrl changes
  useEffect(() => {
    return () => {
      // Stop audio if playing
      handleStopAudio();
      
      // Clean up audio URL
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Additional cleanup on component unmount
  useEffect(() => {
    return () => {
      // Ensure audio is stopped and cleaned up
      if (audioRef.current) {
        try {
          if (!audioRef.current.paused) {
            audioRef.current.pause();
          }
          audioRef.current.src = '';
          audioRef.current.load();
        } catch (error) {
          console.warn('Warning during audio cleanup:', error);
        }
      }
      
      // Clean up any remaining audio URL
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6">
      {/* Card Container with 3D flip effect */}
      <div 
        className={`flip-card ${isFlipped ? 'flipped' : ''}`}
        onClick={handleFlip}
        style={{ 
          height: '500px',
          cursor: 'pointer',
          perspective: '1000px',
          position: 'relative'
        }}
      >
        {/* Delete Button - Outside flip transformation */}
        <div className="absolute top-4 right-4 z-20">
          {!showDeleteConfirm ? (
            <button
              onClick={handleDeleteClick}
              className="w-10 h-10 rounded-full bg-red-500/90 hover:bg-red-600 text-white shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-110 flex items-center justify-center group"
              title="この問題を削除"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          ) : (
            <div className="bg-white/95 dark:bg-gray-800/95 rounded-xl p-3 shadow-xl backdrop-blur-sm border border-red-200 dark:border-red-800">
              <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-3 whitespace-nowrap">
                削除しますか？
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteConfirm}
                  className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  削除
                </button>
                <button
                  onClick={handleDeleteCancel}
                  className="px-3 py-1.5 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 text-xs font-medium rounded-lg transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flip-card-inner">

          {/* Front of Card - Question */}
          <div className="flip-card-front p-6 sm:p-8 flex flex-col">
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="text-center max-w-3xl">
                <div className="mb-6">
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm">
                    Task 1 - Independent Speaking
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-8 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent dark:from-white dark:to-gray-300">
                  Question
                </h2>
                <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-6 shadow-inner border border-gray-200/50 dark:border-gray-700/50">
                  <p className="text-base sm:text-lg md:text-xl leading-relaxed font-medium" style={{ color: 'var(--foreground)' }}>
                    {question.question}
                  </p>
                </div>
              </div>
            </div>
            <div className="text-center mt-6">
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100/80 dark:bg-gray-800/80 border border-gray-200/50 dark:border-gray-700/50">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                <p className="text-xs sm:text-sm font-medium" style={{ color: 'var(--foreground-muted)' }}>
                  タップして回答を確認
                </p>
              </div>
            </div>
          </div>

          {/* Back of Card - Response and Score */}
          <div className="flip-card-back p-6 sm:p-8">
            <div className="h-full flex flex-col">
              {/* Score Section */}
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="bg-white/80 dark:bg-gray-800/80 rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
                    <div className={`text-4xl font-bold mb-2 ${getScoreColor(question.overall_score)}`}>
                      {question.overall_score !== undefined ? `${question.overall_score}/4` : '未採点'}
                    </div>
                    <div className={`text-sm font-semibold px-3 py-1 rounded-full ${getScoreColor(question.overall_score)} bg-current/10`}>
                      {getScoreLabel(question.overall_score)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Response Section */}
              <div className="flex-1 overflow-y-auto">
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    あなたの回答
                  </h3>
                  {question.user_transcript ? (
                    <div className="bg-white/70 dark:bg-gray-800/70 rounded-xl p-5 shadow-sm border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>
                        {question.user_transcript}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white/70 dark:bg-gray-800/70 rounded-xl p-5 text-center shadow-sm border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
                      <div className="text-gray-400 mb-2">
                        <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.562M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium" style={{ color: 'var(--foreground-muted)' }}>
                        回答が記録されていません
                      </p>
                    </div>
                  )}
                </div>

                {/* AI模擬回答セクション */}
                {(() => {
                  console.log('🔍 AI Review Debug:', {
                    hasAiReview: !!aiReview,
                    aiReviewData: aiReview,
                    questionId: question.id,
                    hasImprovedResponse: !!(aiReview?.improved_response),
                    questionAiReview: question.ai_review,
                    stateAiReview: aiReview
                  });
                  return null;
                })()}
                {aiReview?.improved_response ? (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                      <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      AI模擬回答
                    </h3>
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-5 border border-emerald-200/50 dark:border-emerald-700/50">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1">
                          <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-4 shadow-sm border border-emerald-200/30 dark:border-emerald-700/30">
                            <p className="text-sm leading-relaxed text-emerald-900 dark:text-emerald-100 font-medium">
                              {aiReview.improved_response}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isPlaying) {
                              handleStopAudio();
                            } else {
                              handleGenerateAndPlayAudio(aiReview.improved_response || '');
                            }
                          }}
                          disabled={isGeneratingAudio}
                          className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-sm flex-shrink-0"
                          title={isPlaying ? "音声を停止" : "AI模擬回答を音声で聞く"}
                        >
                          {isGeneratingAudio ? (
                            <>
                              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              生成中...
                            </>
                          ) : isPlaying ? (
                            <>
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              停止
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                              </svg>
                              音声で聞く
                            </>
                          )}
                        </button>
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <span>この回答例は、AIが生成した模擬回答です</span>
                      </div>
                      <div className="mt-1">
                        <p className="text-xs text-emerald-600 dark:text-emerald-400">
                          🔊 音声再生がブロックされる場合は、ページ内をクリックしてから再度お試しください。
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      AI模擬回答
                    </h3>
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-200/50 dark:border-gray-700/50">
                      <div className="text-center py-4">
                        <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-3">
                          AI模擬回答は利用できません
                        </p>
                        <button
                          onClick={handleGenerateAIAnswer}
                          disabled={isGeneratingAI}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            isGeneratingAI
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm hover:shadow-md'
                          }`}
                        >
                          {isGeneratingAI ? (
                            <>
                              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              生成中...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                              </svg>
                              AI模擬回答を生成
                            </>
                          )}
                        </button>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                          AIが質問に対する模擬回答を生成します
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Date */}
                <div className="mb-4">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                    <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    実施日時
                  </h3>
                  <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200/30 dark:border-gray-700/30">
                    <p className="text-sm font-medium" style={{ color: 'var(--foreground-muted)' }}>
                      {formatDate(question.created_at)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-center mt-4">
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <p className="text-xs font-medium" style={{ color: 'var(--foreground-muted)' }}>
                    タップして問題に戻る
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center mt-8 max-w-md mx-auto">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrevious();
          }}
          disabled={!canGoPrevious}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all shadow-sm ${
            canGoPrevious 
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 hover:shadow-md transform hover:-translate-y-0.5' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          前へ
        </button>

        <div className="bg-white/80 dark:bg-gray-800/80 px-4 py-2 rounded-full border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
          <div className="text-sm font-semibold" style={{ color: 'var(--foreground-muted)' }}>
            {isFlipped ? '回答' : '問題'}
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          disabled={!canGoNext}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all shadow-sm ${
            canGoNext 
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 hover:shadow-md transform hover:-translate-y-0.5' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
          }`}
        >
          次へ
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}