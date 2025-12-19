'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, clearSessionToken } from '../lib/auth';
import LoadingSpinner from '../components/LoadingSpinner';

export default function HomePage() {
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

  const handleLogout = () => {
    clearSessionToken();
    router.push('/login');
  };

  const handleStartPractice = () => {
    // Navigate to Task Selection Page
    router.push('/practice/select');
  };

  const handleFlashcards = () => {
    router.push('/flashcards');
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header className="surface-elevated backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-bold text-luxury">
            TOEFL Speaking Master
          </h1>
          <button
            onClick={handleLogout}
            className="text-sm hover:text-luxury transition-all duration-300"
            style={{ color: 'var(--foreground-muted)' }}
          >
            ログアウト
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Welcome Section */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 sm:mb-6" style={{ color: 'var(--foreground)' }}>
            ようこそ！
          </h2>
          <p className="text-lg sm:text-xl gold-accent font-light tracking-wide">
            TOEFL Speaking の練習を始めましょう
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-7xl mx-auto mb-12 sm:mb-16">
          <button 
            onClick={handleStartPractice}
            className="luxury-card rounded-2xl p-8 sm:p-10 text-left group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-500/10 to-transparent rounded-full blur-2xl"></div>
            <div className="relative">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 gold-gradient">
                <svg className="w-7 h-7" style={{ color: 'var(--color-black-50)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 gold-accent">
                練習を始める
              </h3>
              <p className="text-sm sm:text-base font-light tracking-wide" style={{ color: 'var(--foreground-muted)' }}>
                TOEFL Speaking練習を始めましょう
              </p>
            </div>
          </button>

          <button 
            onClick={handleFlashcards}
            className="luxury-card rounded-2xl p-8 sm:p-10 text-left group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-500/10 to-transparent rounded-full blur-2xl"></div>
            <div className="relative">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6" style={{
                background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.1) 100%)',
                border: '1px solid var(--border-color-gold)'
              }}>
                <svg className="w-7 h-7 gold-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3" style={{ color: 'var(--foreground)' }}>
                復習
              </h3>
              <p className="text-sm sm:text-base font-light tracking-wide" style={{ color: 'var(--foreground-muted)' }}>
                過去の問題を振りかえります
              </p>
            </div>
          </button>

          <button 
            onClick={() => {
              // TODO: Task1特訓機能の実装
              console.log('Task1特訓 - 工事中');
            }}
            className="luxury-card rounded-2xl p-8 sm:p-10 text-left group relative overflow-hidden opacity-75 hover:opacity-90 transition-opacity"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-transparent rounded-full blur-2xl"></div>
            <div className="relative">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6" style={{
                background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(249, 115, 22, 0.1) 100%)',
                border: '1px solid rgba(249, 115, 22, 0.3)'
              }}>
                <svg className="w-7 h-7 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3" style={{ color: 'var(--foreground)' }}>
                （工事中）Task1特訓
              </h3>
              <p className="text-sm sm:text-base font-light tracking-wide" style={{ color: 'var(--foreground-muted)' }}>
                Task1に特化した集中練習
              </p>
              <div className="mt-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  🚧 準備中
                </span>
              </div>
            </div>
          </button>
        </div>


      </main>
    </div>
  );
}