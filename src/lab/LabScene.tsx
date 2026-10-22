import { Environment, Lightformer, Sparkles } from "@react-three/drei";
import { Bloom, EffectComposer, N8AO, SMAA, Vignette } from "@react-three/postprocessing";
import { useEffect } from "react";
import { cameraDistance, frame, setViewOffset } from "../engine/cameraRig";
import { ModelContext, useExplain } from "./explain";
import { LAB_MODELS } from "./registry";
import { useActiveModelId, useLab } from "./store";

/** Soft studio lighting for glossy materials, made from light panels so nothing is downloaded. */
function Studio() {
  return (
    <>
      <Environment resolution={256} frames={1} background={false}>
        <color attach="background" args={["#05080F"]} />
        <Lightformer form="rect" intensity={1.6} position={[0, 14, 2]} scale={[26, 8, 1]} rotation={[Math.PI / 2, 0, 0]} />
        <Lightformer form="rect" intensity={2.2} color="#5EC8FF" position={[-16, 5, 6]} scale={[3, 12, 1]} rotation={[0, Math.PI / 2.3, 0]} />
        <Lightformer form="rect" intensity={2.2} color="#A78BFA" position={[16, 5, -2]} scale={[3, 12, 1]} rotation={[0, -Math.PI / 2.3, 0]} />
        <Lightformer form="ring" intensity={1.2} color="#3EE6A4" position={[0, 4, -16]} scale={10} />
      </Environment>
      <ambientLight intensity={0.15} />
      <pointLight position={[0, 18, 10]} intensity={260} distance={70} color="#CFE6FF" />
      <pointLight position={[-18, 6, -8]} intensity={120} distance={50} color="#5EC8FF" />
      <pointLight position={[18, 6, 8]} intensity={120} distance={50} color="#A78BFA" />
    </>
  );
}

/** The lab's 3D content: the active model under soft studio light, with a gentle glow on bright parts. */
export function LabScene() {
  const modelId = useActiveModelId();
  const stage = useLab((s) => s.stageId);
  const points = useLab((s) => s.stagePoints);
  const def = LAB_MODELS[modelId];
  const sheet = useLab((s) => s.sheet);

  // When the side sheet opens, slide the view so the model stays in the uncovered part of the screen.
  useEffect(() => {
    setViewOffset(sheet ? cameraDistance() * 0.11 : 0, true);
  }, [sheet, modelId]);

  useEffect(() => {
    useExplain.getState().clear();
    if (def) void frame(def.camera, true);
  }, [modelId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lean the camera towards the stage being explained, without losing the whole model.
  useEffect(() => {
    if (!def) return;
    const p = stage ? points[stage] : null;
    if (!p) return void frame(def.camera, true);
    const [px, py, pz] = def.camera.position;
    const [tx, ty, tz] = def.camera.target;
    const k = 0.4;
    void frame(
      {
        position: [px + (p[0] - tx) * k, py * 0.82, pz * 0.82 + (p[2] - tz) * k],
        target: [tx + (p[0] - tx) * k, ty, tz + (p[2] - tz) * k],
      },
      true,
    );
  }, [stage]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!def) return null;
  const { View } = def;
  return (
    <ModelContext.Provider value={modelId}>
      <Studio />
      <color attach="background" args={["#060A14"]} />
      <fog attach="fog" args={["#060A14", 70, 200]} />
      <View key={modelId} />
      {/* Fine motes of light drifting through the studio, for depth */}
      <Sparkles count={140} scale={[70, 26, 50]} position={[0, 10, 0]} size={2.2} speed={0.18} opacity={0.4} color="#8FDBFF" noise={0.6} />
      <EffectComposer multisampling={0} enableNormalPass={false}>
        <N8AO halfRes aoRadius={2.2} intensity={2.2} distanceFalloff={1} color="#000000" />
        <SMAA />
        <Bloom mipmapBlur intensity={1.1} luminanceThreshold={0.55} luminanceSmoothing={0.25} radius={0.75} />
        <Vignette offset={0.3} darkness={0.6} />
      </EffectComposer>
    </ModelContext.Provider>
  );
}
