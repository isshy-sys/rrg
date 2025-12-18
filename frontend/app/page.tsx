'use client';

import { useState } from 'react';

export default function Home() {
  const [apiStatus, setApiStatus] = useState('未テスト');
  const [apiResponse, setApiResponse] = useState('');

  const testBackendConnection = async () => {
    setApiStatus('テスト中...');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://tech0-gen-11-step3-2-py-26.azurewebsites.net';
      const response = await fetch(`${apiUrl}/health`);
      const data = await response.json();
      
      setApiStatus('✅ 接続成功');
      setApiResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      setApiStatus('❌ 接続失敗');
      setApiResponse(error.message);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column',
      padding: '20px'
    }}>
      <h1>TOEFL Speaking Master</h1>
      <p>Frontend deployment successful!</p>
      <p>Backend API: {process.env.NEXT_PUBLIC_API_BASE_URL || 'Not configured'}</p>
      
      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={testBackendConnection}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Backend接続テスト
        </button>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <p>接続状況: {apiStatus}</p>
        {apiResponse && (
          <pre style={{ 
            backgroundColor: '#f5f5f5', 
            padding: '10px', 
            borderRadius: '5px',
            fontSize: '12px'
          }}>
            {apiResponse}
          </pre>
        )}
      </div>
    </div>
  );
}
