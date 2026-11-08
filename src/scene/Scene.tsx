export default function Scene() {
  return (
    <>
      <ambientLight intensity={0.05} />
      <directionalLight position={[4, 1.5, 3]} intensity={2.8} color="#fff6e8" />
      <mesh>
        <sphereGeometry args={[1, 48, 48]} />
        <meshStandardMaterial color="#b4a48a" roughness={1} metalness={0} />
      </mesh>
    </>
  );
}
