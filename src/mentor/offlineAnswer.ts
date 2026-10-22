import type { LessonDef } from "../content/types";

const STOP = new Set(
  "a an the is are was were be to of in on for and or but with what why how when does do did can i you it this that my me we our your about from as at by if then so which who will would should could".split(" "),
);

const words = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w))
    .map((w) => w.replace(/(ies|es|s)$/, ""));

type Passage = { heading: string; text: string };

function passages(lesson: LessonDef): Passage[] {
  const out: Passage[] = [{ heading: lesson.title, text: lesson.summary }];
  for (const step of lesson.steps) {
    if (step.kind === "brief") out.push({ heading: "The situation", text: step.mentor.join(" ") });
    if (step.kind === "learn") {
      for (const s of step.sections) out.push({ heading: s.heading, text: s.body });
      out.push({ heading: "Key points", text: step.keyPoints.join(" ") });
    }
  }
  return out;
}

const firstSentences = (text: string, maxWords = 55) => {
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [text];
  let out = "";
  for (const s of sentences) {
    if ((out + s).split(/\s+/).length > maxWords && out) break;
    out += s;
  }
  return out.trim();
};

/**
 * Ravi's offline answer: the passage of the lesson notes that best matches the question.
 * Used when the Claude API isn't configured or can't be reached.
 */
export function offlineAnswer(lesson: LessonDef | null, question: string): string {
  if (!lesson) return "Open a station first, and I'll answer from its lesson notes.";
  const q = new Set(words(question));
  if (q.size === 0) return `Ask me about ${lesson.topic.toLowerCase()}, for example "why does this matter?"`;
  let best: { p: Passage; score: number } | null = null;
  for (const p of passages(lesson)) {
    const pw = words(`${p.heading} ${p.heading} ${p.text}`);
    const score = pw.reduce((n, w) => n + (q.has(w) ? 1 : 0), 0) / Math.sqrt(pw.length + 1);
    if (!best || score > best.score) best = { p, score };
  }
  if (!best || best.score === 0)
    return `That isn't in this station's notes. This station covers ${lesson.topic.toLowerCase()}. Try asking about one of those.`;
  return `From "${best.p.heading}": ${firstSentences(best.p.text)}`;
}
