export default function Home() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      color: "white",
      fontFamily: "system-ui",
      fontSize: "3rem",
      textAlign: "center",
      padding: "2rem"
    }}>
      <div>
        <div style={{ fontSize: "5rem" }}></div>
        <div style={{ marginTop: "1rem" }}>OpenCircle</div>
        <div style={{ fontSize: "1.5rem", marginTop: "1rem", opacity: 0.9 }}>
          Successfully Deployed!
        </div>
      </div>
    </div>
  );
}
