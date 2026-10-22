import { describe, expect, it } from "vitest";
import type { LessonDef } from "../content/types";
import { offlineAnswer } from "./offlineAnswer";

const lesson: LessonDef = {
  id: "x",
  slot: 4,
  title: "Rebooking Desk",
  topic: "Retries, timeouts and idempotency",
  summary: "Make model calls survive a slow provider.",
  review: [],
  steps: [
    { kind: "brief", mentor: ["Model City is slow tonight."] },
    {
      kind: "learn",
      video: { title: "v", durationSec: 1, src: null },
      sections: [
        { heading: "Timeouts", body: "A timeout frees your worker. It does not stop the provider working on the request." },
        { heading: "Jitter", body: "Random jitter spreads retries out so clients do not all retry at the same moment." },
      ],
      keyPoints: ["Never retry a 400."],
    },
  ],
};

describe("offline mentor answers", () => {
  it("picks the passage that matches the question", () => {
    expect(offlineAnswer(lesson, "why add jitter to retries?")).toContain("Jitter");
    expect(offlineAnswer(lesson, "what does a timeout free?")).toContain("Timeouts");
  });

  it("says so when the notes don't cover the question", () => {
    expect(offlineAnswer(lesson, "best pizza in Bengaluru")).toContain("isn't in this station's notes");
  });

  it("asks for a station when none is open", () => {
    expect(offlineAnswer(null, "hello")).toContain("Open a station");
  });
});
