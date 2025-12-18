'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, clearSessionToken, getUserIdentifier } from '../../lib/auth';

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
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">TOEFL Speaking Master</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            ログアウト
          </button>
        </div>
        
        <div className="text-center">
          <h2 className="text-xl mb-4">ようこそ！ユーザー: {getUserIdentifier()}</h2>
          <p className="mb-8">ログイン機能が正常に動作しています。</p>
          <p className="text-gray-600">他の機能は段階的に復旧予定です。</p>
        </div>
      </div>
    </div>
  );
}