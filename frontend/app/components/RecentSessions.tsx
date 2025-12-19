'use client';

import { useRouter } from 'next/navigation';

interface PracticeSessionSummary {
  id: string;
  session_id: string;
  task_type: string;
  overall_score?: number | null;
  created_at: string;
  question?: string;
}

interface RecentSessionsProps {
  sessions: PracticeSessionSummary[];
  isLoading?: boolean;
}

export default function RecentSessions({ sessions, isLoading = false }: RecentSessionsProps) {
  const router = useRouter();
  
  if (isLoading) {
    return (
      <div className="luxury-card rounded-xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="luxury-card rounded-xl p-6">
        <p className="text-center py-8" style={{ color: 'var(--foreground-muted)' }}>
          まだ学習履歴がありません。練習を始めましょう！
        </p>
      </div>
    );
  }

  const handleSessionClick = (sessionId: string) => {
    router.push(`/history/${sessionId}`);
  };

  return (
    <div className="luxury-card rounded-xl overflow-hidden">
      <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
        {sessions.map((session) => (
          <div
            key={session.session_id}
            onClick={() => handleSessionClick(session.session_id)}
            className="p-6 hover:bg-opacity-50 transition-colors cursor-pointer"
            style={{ 
              background: 'var(--background-card)'
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium gold-accent" 
                        style={{ 
                          background: 'rgba(212, 175, 55, 0.1)',
                          border: '1px solid var(--border-color-gold)'
                        }}>
                    {session.task_type.toUpperCase()}
                  </span>
                  <span className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                    {formatDate(session.created_at)}
                  </span>
                </div>
                {session.overall_score !== null && session.overall_score !== undefined && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm" style={{ color: 'var(--foreground-muted)' }}>総合スコア:</span>
                    <span className={`text-lg font-semibold ${getScoreColor(session.overall_score)}`}>
                      {session.overall_score}/4
                    </span>
                  </div>
                )}
              </div>
              <svg
                className="w-5 h-5"
                style={{ color: 'var(--foreground-muted)' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return '今日';
  } else if (diffDays === 1) {
    return '昨日';
  } else if (diffDays < 7) {
    return `${diffDays}日前`;
  } else {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}

function getScoreColor(score: number | null | undefined): string {
  if (!score || score < 0) return 'text-gray-600';
  if (score >= 3.5) return 'text-green-600';
  if (score >= 2.5) return 'text-blue-600';
  if (score >= 1.5) return 'text-yellow-600';
  return 'text-red-600';
}