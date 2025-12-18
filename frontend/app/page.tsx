export default function Home() {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column'
    }}>
      <h1>TOEFL Speaking Master</h1>
      <p>Frontend deployment successful!</p>
      <p>Backend API: {process.env.NEXT_PUBLIC_API_BASE_URL || 'Not configured'}</p>
    </div>
  );
}
