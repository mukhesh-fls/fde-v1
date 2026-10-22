import type { LessonDef } from "../content/types";
import { offlineAnswer } from "./offlineAnswer";

export type ChatMessage = { role: "user" | "assistant"; content: string; offline?: boolean };

/** Ask Ravi: the Claude-backed server route first, the lesson notes if that isn't available. */
export async function askRavi(
  lesson: LessonDef | null,
  stepKind: string | null,
  message: string,
  history: ChatMessage[],
): Promise<ChatMessage> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    const res = await fetch("/api/mentor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lesson, stepKind, message, history: history.map(({ role, content }) => ({ role, content })) }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (res.ok) {
      const { reply } = (await res.json()) as { reply: string };
      if (reply) return { role: "assistant", content: reply };
    }
  } catch {
    // Network error or timeout: fall through to the offline answer.
  }
  return { role: "assistant", content: offlineAnswer(lesson, message), offline: true };
}
