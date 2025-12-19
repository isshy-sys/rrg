'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from './lib/auth';
import LoadingSpinner from './components/LoadingSpinner';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      const authenticated = await isAuthenticated();
      if (authenticated) {
        // Already logged in, redirect to home page
        router.push('/home');
      } else {
        // Not logged in, redirect to login page
        router.push('/login');
      }
    };

    checkAuthAndRedirect();
  }, [router]);

  // Show loading spinner while checking authentication and redirecting
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
      <LoadingSpinner />
    </div>
  );
}
