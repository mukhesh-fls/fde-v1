import raw from "../../content/p2-l1/lessons.json";
import type { LessonDef, Question } from "../content/types";

export type LabStage = { id: string; title: string; body: string };
export type LabModelContent = { id: string; title: string; intro: string; stages: LabStage[]; tryThis: string[] };
export type LabLesson = {
  id: string;
  episode: number;
  title: string;
  tagline: string;
  sections: { heading: string; body: string }[];
  systemsLens: string;
  remember: string[];
  models: LabModelContent[];
  quiz: Question[];
};
export type LabModule = { id: string; programme: string; level: string; outcome: string; lessons: LabLesson[] };

export const labModule = raw as LabModule;
export const labLessons = [...labModule.lessons].sort((a, b) => a.episode - b.episode);
export const findLabLesson = (id: string) => labLessons.find((l) => l.id === id) ?? null;

/** The lab lesson in the airport lesson shape, so Ravi's chat (online and offline) can answer from it. */
export function labLessonForMentor(l: LabLesson): LessonDef {
  return {
    id: l.id,
    slot: l.episode,
    title: `Episode ${l.episode}: ${l.title}`,
    topic: l.tagline,
    summary: l.systemsLens,
    review: [],
    steps: [
      { kind: "brief", mentor: [l.tagline] },
      {
        kind: "learn",
        video: { title: l.title, durationSec: 0, src: null },
        sections: [
          ...l.sections,
          ...l.models.flatMap((m) => m.stages.map((s) => ({ heading: `${m.title}: ${s.title}`, body: s.body }))),
        ],
        keyPoints: l.remember,
      },
    ],
  };
}
