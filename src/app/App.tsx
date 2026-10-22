import { Canvas } from "@react-three/fiber";
import { useMemo } from "react";
import { NeutralToneMapping, PCFShadowMap } from "three";
import { CameraDirector } from "../engine/CameraDirector";
import { OVERVIEW } from "../engine/framings";
import { LabelProjector } from "../engine/LabelProjector";
import type { Anchor } from "../engine/labelAnchors";
import { useLabLabels } from "../lab/labels";
import { LabScene } from "../lab/LabScene";
import { LabLabelLayer } from "../lab/ui/LabLabelLayer";
import { LabDock, LabTopBar, RaviTip, ZoomControls } from "../lab/ui/LabChrome";
import { useExplain } from "../lab/explain";
import { LabPanel } from "../lab/ui/LabPanel";
import { useUi } from "../store/ui";
import { BuildingLabels } from "../ui/BuildingLabels";
import { DeparturesBoard } from "../ui/DeparturesBoard";
import { ExamPanel } from "../ui/ExamPanel";
import { Hud } from "../ui/Hud";
import { InteriorLabels } from "../ui/InteriorLabels";
import { LessonList } from "../ui/LessonList";
import { MentorChat } from "../ui/MentorChat";
import { Scoreboard } from "../ui/Scoreboard";
import { StationPanel } from "../ui/StationPanel";
import { Toast } from "../ui/Toast";
import { Airport } from "../world/Airport";
import { buildingAnchors } from "../world/buildingAnchors";
import { interiorAnchors } from "../world/interiorAnchors";
import { Terminal1Interior } from "../world/interiors/Terminal1Interior";
import { Lights } from "../world/Lights";
import { palette } from "./theme";

/** One interior component per building that has lessons. */
const interiors: Record<string, () => React.JSX.Element> = { m01: Terminal1Interior };

export function App() {
  const view = useUi((s) => s.view);
  const panel = useUi((s) => s.panel);
  const transition = useUi((s) => s.transition);
  const moduleId = view.kind === "building" ? view.moduleId : null;
  const Interior = moduleId ? interiors[moduleId] : null;
  const isLab = view.kind === "lab";
  const labLabels = useLabLabels((s) => s.labels);
  const explain = useExplain((s) => s.current);
  const anchors = useMemo<Anchor[]>(() => {
    if (isLab) {
      const list: Anchor[] = labLabels.map((l) => ({ id: l.id, world: l.world }));
      if (explain) list.push({ id: "lab:explain", world: explain.world });
      return list;
    }
    return moduleId ? interiorAnchors(moduleId) : buildingAnchors;
  }, [moduleId, isLab, labLabels, explain]);

  return (
    <div className={`app ${isLab ? "app--lab" : ""}`}>
      <Canvas
        className="scene"
        shadows={{ type: PCFShadowMap }}
        dpr={[1, 1.5]}
        gl={{ toneMapping: NeutralToneMapping, antialias: true }}
        camera={{ position: OVERVIEW.position, fov: 32, near: 1, far: 2000 }}
        onPointerMissed={() => {
          document.body.style.cursor = "";
          useExplain.getState().clear();
        }}
      >
        {!isLab && <color attach="background" args={[palette.background]} />}
        {!isLab && <fog attach="fog" args={[palette.background, 380, 760]} />}
        <Lights dim={isLab} />
        {isLab ? <LabScene /> : Interior ? <Interior /> : <Airport />}
        <CameraDirector />
        <LabelProjector anchors={anchors} />
      </Canvas>

      {isLab ? <LabLabelLayer /> : moduleId ? <InteriorLabels key={moduleId} moduleId={moduleId} /> : <BuildingLabels />}
      <Hud />
      {view.kind === "overview" && !panel && <DeparturesBoard />}
      {moduleId && <LessonList moduleId={moduleId} />}
      {isLab && <LabTopBar />}
      {isLab && <LabDock />}
      {isLab && <RaviTip />}
      {isLab && <ZoomControls />}
      {isLab && panel?.kind !== "scoreboard" && <LabPanel />}

      {panel?.kind === "lesson" && <StationPanel key={panel.lessonId} lessonId={panel.lessonId} />}
      {panel?.kind === "exam" && <ExamPanel key={panel.moduleId} moduleId={panel.moduleId} />}
      {panel?.kind === "scoreboard" && <Scoreboard />}

      <MentorChat />
      <Toast />
      <div className={`fade ${transition === "out" ? "is-on" : ""}`} aria-hidden="true" />
    </div>
  );
}
