function Lights() {
  return (
    <>
      {/* AMBIENT LIGHT */}
      <ambientLight intensity={0.6} />

      {/* KEY LIGHT */}
      <directionalLight
        position={[3, 5, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      {/* FILL LIGHT */}
      <pointLight position={[-3, 2, 2]} intensity={0.6} />

      {/* RIM LIGHT */}
      <pointLight position={[0, 3, -3]} intensity={0.4} color="#88aaff" />
    </>
  );
}

export default Lights;