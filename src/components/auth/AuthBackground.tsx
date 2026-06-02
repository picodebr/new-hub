const AuthBackground = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
    <div
      className="blob animate-float1"
      style={{
        width: 400,
        height: 400,
        top: '-10%',
        right: '-5%',
        background: 'hsl(var(--blob-1))',
      }}
    />
    <div
      className="blob animate-float2"
      style={{
        width: 350,
        height: 350,
        bottom: '-8%',
        left: '-8%',
        background: 'hsl(var(--blob-2))',
      }}
    />
    <div
      className="blob animate-float3"
      style={{
        width: 280,
        height: 280,
        top: '40%',
        left: '60%',
        background: 'hsl(var(--blob-3))',
      }}
    />
    <div
      className="blob animate-float1"
      style={{
        width: 200,
        height: 200,
        bottom: '20%',
        right: '20%',
        background: 'hsl(var(--blob-4))',
        animationDelay: '3s',
      }}
    />
  </div>
);

export default AuthBackground;
