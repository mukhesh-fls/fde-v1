/** Soft daylight: a hemisphere fill plus one sun with soft shadows over the whole airport. */
export function Lights({ dim = false }: { dim?: boolean }) {
  const s = 170;
  return (
    <>
      <hemisphereLight args={["#FFFFFF", "#D3DAE3", dim ? 0.12 : 1.25]} />
      <ambientLight intensity={dim ? 0 : 0.25} />
      <directionalLight
        position={[90, 160, 70]}
        intensity={dim ? 0.5 : 2.3}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
        shadow-radius={4}
        shadow-camera-left={-s}
        shadow-camera-right={s}
        shadow-camera-top={s}
        shadow-camera-bottom={-s}
        shadow-camera-near={10}
        shadow-camera-far={420}
      />
    </>
  );
}
