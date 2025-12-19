'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, clearSessionToken, getUserIdentifier } from '../lib/auth';

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800">TOEFL Speaking Master</h1>
          <button
            onClick={handleLogout}
            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            ログアウト
          </button>
        </div>
        
        <div className="text-center">
          <h2 className="text-2xl mb-6">ようこそ、{getUserIdentifier()}さん</h2>
          <p className="text-lg mb-8 text-gray-700">TOEFL Speaking対策を始めましょう</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-md border">
              <h3 className="text-xl font-semibold mb-3 text-blue-600">フラッシュカード</h3>
              <p className="text-gray-600 mb-4">重要な語彙や表現を効率的に学習</p>
              <button
                onClick={() => router.push('/flashcards')}
                className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                学習を開始
              </button>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md border">
              <h3 className="text-xl font-semibold mb-3 text-green-600">スピーキング練習</h3>
              <p className="text-gray-600 mb-4">実際の試験形式で練習</p>
              <button
                onClick={() => router.push('/practice/select')}
                className="w-full px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                練習を開始
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}