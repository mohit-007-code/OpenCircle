export default function Home() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0b0f14',
      color: 'white',
      fontFamily: 'system-ui'
    }}>
      <h1 style={{ fontSize: '4rem', margin: 0 }}></h1>
      <h2 style={{ fontSize: '2rem', marginTop: '1rem' }}>OpenCircle is Live!</h2>
      <p style={{ color: '#888', marginTop: '1rem' }}>Deployment successful</p>
    </div>
  );
}
