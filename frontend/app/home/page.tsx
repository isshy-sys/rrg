'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, clearSessionToken, getUserIdentifier } from '../lib/auth';

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [recentHistory, setRecentHistory] = useState([
    { task: 'TASK4', date: '昨日', score: '0/4' },
    { task: 'TASK4', date: '昨日', score: null },
    { task: 'TASK3', date: '昨日', score: '0/4' },
  ]);
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-yellow-600">TOEFL Speaking Master</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            ログアウト
          </button>
        </div>
        
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">ようこそ！</h2>
          <p className="text-lg text-yellow-600 mb-8">TOEFL Speaking Task 3の練習を始めましょう</p>
          
          {/* Main Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer"
                 onClick={() => router.push('/practice/select')}>
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">練習を始める</h3>
              <p className="text-gray-600">TOEFL Speaking練習を始めましょう</p>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer"
                 onClick={() => router.push('/flashcards')}>
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">フラッシュカード</h3>
              <p className="text-gray-600">フラッシュカードで復習</p>
            </div>
          </div>
        </div>
        
        {/* Recent Learning History */}
        <div className="max-w-2xl mx-auto">
          <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">最近の学習履歴</h3>
          <div className="bg-white rounded-2xl shadow-lg p-6">
            {recentHistory.map((item, index) => (
              <div key={index} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center">
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-600 text-sm font-medium rounded-full mr-4">
                    {item.task}
                  </span>
                  <span className="text-gray-600">{item.date}</span>
                </div>
                <div className="flex items-center">
                  {item.score && (
                    <span className="text-gray-800 mr-2">
                      総合スコア: <span className="text-red-500 font-semibold">{item.score}</span>
                    </span>
                  )}
                  <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}