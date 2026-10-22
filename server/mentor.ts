import Anthropic from "@anthropic-ai/sdk";
import type { LessonDef } from "../src/content/types";

export type MentorRequest = {
  lesson: LessonDef | null;
  stepKind: string | null;
  message: string;
  history: { role: "user" | "assistant"; content: string }[];
};

const MODEL = "claude-haiku-5-5";

function lessonText(lesson: LessonDef) {
  const parts: string[] = [`Station ${lesson.slot}: ${lesson.title} (${lesson.topic})`, lesson.summary];
  for (const step of lesson.steps) {
    if (step.kind === "brief") parts.push(`Brief: ${step.mentor.join(" ")}`);
    if (step.kind === "learn") {
      for (const s of step.sections) parts.push(`## ${s.heading}\n${s.body}${s.code ? `\n${s.code}` : ""}`);
      parts.push(`Key points: ${step.keyPoints.join("; ")}`);
    }
  }
  return parts.join("\n\n");
}

/**
 * The system prompt is per station and stays the same for every question at that station, so it caches.
 * Quiz answers are deliberately not included, so Ravi can't hand them out.
 */
function systemPrompt(lesson: LessonDef | null) {
  const base = [
    "You are Ravi, a calm senior engineer on the operations team at the Futurelab AI Airport, a course where an airport stands for a production AI system (passengers are requests, gates are workers, flights to Model City are LLM calls).",
    "You help a learner who is working through a station. Answer from the lesson notes below. If the question goes beyond them, answer briefly from general engineering knowledge and say so.",
    "Give hints rather than full solutions, ask at most one question back, and keep every reply under 60 words. Plain language, no marketing tone. Never reveal which option is correct in a quiz; explain the concept instead.",
  ].join("\n");
  return lesson ? `${base}\n\n<lesson_notes>\n${lessonText(lesson)}\n</lesson_notes>` : base;
}

export async function askMentor(req: MentorRequest): Promise<string> {
  const client = new Anthropic();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    output_config: { effort: "low" },
    system: [{ type: "text", text: systemPrompt(req.lesson), cache_control: { type: "ephemeral" } }],
    messages: [
      ...req.history.slice(-8).map((m) => ({ role: m.role, content: m.content })),
      {
        role: "user" as const,
        content: req.stepKind ? `(I'm on the "${req.stepKind}" step.) ${req.message}` : req.message,
      },
    ],
  });
  if (response.stop_reason === "refusal") return "I can't help with that one. Ask me about this station's topic.";
  return response.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("")
    .trim();
}

export const mentorConfigured = () => Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);

/** Maps SDK errors to an HTTP status for the client, which then falls back to the scripted answers. */
export function mentorErrorStatus(error: unknown) {
  if (error instanceof Anthropic.AuthenticationError) return 503;
  if (error instanceof Anthropic.RateLimitError) return 429;
  if (error instanceof Anthropic.APIError) return 502;
  return 500;
}
