'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '../../lib/auth';
import LoadingSpinner from '../../components/LoadingSpinner';

/**
 * Task1 Special Training - Main Page
 * Provides structured training for TOEFL Task1 with personalized templates
 */
export default function Task1TrainingPage() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await isAuthenticated();
      if (!authenticated) {
        router.push('/login');
      } else {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleBackToSelect = () => {
    router.push('/practice/select');
  };

  const trainingSteps = [
    {
      id: 'profile',
      title: 'ステップ1: プロフィール作成',
      description: '20の質問に答えて、あなた専用の回答テンプレートを作成します',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      route: '/practice/task1-training/profile',
      status: 'available'
    },
    {
      id: 'questions',
      title: 'ステップ2: 50問練習',
      description: '論点タグ付きの厳選された50問で実践練習',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      route: '/practice/task1-training/questions',
      status: 'locked'
    },
    {
      id: 'templates',
      title: 'ステップ3: テンプレート確認',
      description: 'あなた専用の暗記用テンプレートを確認・編集',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      route: '/practice/task1-training/templates',
      status: 'locked'
    },
    {
      id: 'review',
      title: 'ステップ4: 繰り返し練習',
      description: '生成されたテンプレートを使って繰り返し練習',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      route: '/practice/task1-training/review',
      status: 'locked'
    }
  ];

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header className="surface-elevated backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center gap-4">
          <button
            onClick={handleBackToSelect}
            className="flex items-center gap-2 text-sm hover:text-luxury transition-all duration-300"
            style={{ color: 'var(--foreground-muted)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            戻る
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-luxury">
            Task1特訓
          </h1>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            ✨ NEW
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Title Section */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 sm:mb-6" style={{ color: 'var(--foreground)' }}>
            Task1特訓プログラム
          </h2>
          <p className="text-lg sm:text-xl gold-accent font-light tracking-wide max-w-3xl mx-auto">
            あなた専用のテンプレートを作成し、Task1で高得点を目指しましょう
          </p>
        </div>

        {/* Training Steps */}
        <div className="grid sm:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
          {trainingSteps.map((step, index) => (
            <div
              key={step.id}
              className={`bg-white rounded-2xl shadow-md p-6 sm:p-8 relative overflow-hidden transition-all duration-300 ${
                step.status === 'available' 
                  ? 'hover:shadow-lg cursor-pointer' 
                  : 'opacity-60 cursor-not-allowed'
              }`}
              onClick={() => {
                if (step.status === 'available') {
                  router.push(step.route);
                }
              }}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-500/10 to-transparent rounded-full blur-xl"></div>
              <div className="relative">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    step.status === 'available' 
                      ? 'bg-orange-100 text-orange-600' 
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {step.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl font-bold" style={{ color: 'var(--foreground)' }}>
                      {step.title}
                    </h3>
                    {step.status === 'locked' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 mt-1">
                        🔒 ロック中
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {step.description}
                </p>
                {step.status === 'available' && (
                  <div className="mt-4 flex justify-end">
                    <span className="text-sm text-orange-600 font-medium">
                      開始する →
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-12 sm:mt-16 max-w-4xl mx-auto">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Task1特訓について
                </h3>
                <div className="text-sm text-blue-800 space-y-2">
                  <p>• <strong>ステップ1</strong>: 20の質問であなたの経験・価値観を登録</p>
                  <p>• <strong>ステップ2</strong>: 論点タグ付きの50問で実践練習</p>
                  <p>• <strong>ステップ3</strong>: あなた専用の暗記用テンプレートを生成</p>
                  <p>• <strong>ステップ4</strong>: テンプレートを使った繰り返し練習</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}