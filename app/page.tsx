export default function Home() {
  return (
    <main style={{display:'grid',placeItems:'center',minHeight:'100vh',gap:16}}>
      <h1>PetroPulse</h1>
      <p>Welcome — choose where to go:</p>
      <p><a href="/login">Login</a> · <a href="/dashboard">Dashboard</a></p>
    </main>
  );
}
