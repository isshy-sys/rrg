// 簡単なuseProblemDataフック（一時的な実装）
import { useState, useEffect } from 'react';

interface Problem {
  question: string;
  problem_id: string;
  // 他の必要なプロパティを追加
}

export function useProblemData() {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 一時的な実装 - サンプルデータを設定
    setTimeout(() => {
      setProblem({
        question: "サンプル問題: この機能は現在開発中です。",
        problem_id: "sample-001"
      });
      setIsLoading(false);
    }, 1000);
  }, []);

  return { problem, isLoading, error };
}