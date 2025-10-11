export default function Home() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <h1 style={{ 
        fontSize: '5rem', 
        margin: 0, 
        textShadow: '0 4px 8px rgba(0,0,0,0.3)' 
      }}>
        
      </h1>
      <h2 style={{ 
        fontSize: '3rem', 
        marginTop: '1rem', 
        fontWeight: 'bold',
        textShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}>
        OpenCircle
      </h2>
      <p style={{ 
        fontSize: '1.5rem', 
        marginTop: '1rem', 
        opacity: 0.9 
      }}>
        Successfully Deployed on Vercel! 
      </p>
      <p style={{ 
        fontSize: '1rem', 
        marginTop: '2rem', 
        opacity: 0.7 
      }}>
        Your Next.js application is live and running
      </p>
    </div>
  );
}
