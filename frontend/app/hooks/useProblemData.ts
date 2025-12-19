import { useState, useEffect } from 'react';

interface Problem {
  question: string;
  problem_id: string;
  reading_text?: string;
  lecture_script?: string;
  lecture_audio_url?: string;
  task_type?: string;
  preparation_time?: number;
  speaking_time?: number;
  created_at?: string;
}

export function useProblemData() {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Get problem data from session storage
      const storedProblem = sessionStorage.getItem('currentProblem');
      
      if (storedProblem) {
        const problemData = JSON.parse(storedProblem);
        setProblem(problemData);
        console.log('✅ Problem data loaded from session storage:', problemData.problem_id);
      } else {
        // No problem data found
        setError('問題データが見つかりません。問題選択画面に戻ってください。');
        console.error('❌ No problem data found in session storage');
      }
    } catch (err) {
      console.error('❌ Failed to load problem data:', err);
      setError('問題データの読み込みに失敗しました。');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { problem, isLoading, error };
}