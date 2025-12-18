// 簡単なuseProblemDataフック（一時的な実装）
import { useState, useEffect } from 'react';

export function useProblemData() {
  const [problem, setProblem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 一時的な実装 - 実際のデータ取得は後で実装
    setIsLoading(false);
  }, []);

  return { problem, isLoading, error };
}