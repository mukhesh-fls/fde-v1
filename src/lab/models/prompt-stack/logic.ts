/**
 * Episode 5: the system prompt as sections, scored against a fixed test set.
 * A simulated scorer: each test question needs certain sections to pass. It shows which kinds of
 * questions each section helps, and why every change is tested against the same set.
 */

export type Section = "role" | "goal" | "rules" | "reasons" | "format" | "examples" | "missingInfo" | "contradiction";

export const SECTIONS: { id: Section; label: string; text: string; bad?: boolean }[] = [
  { id: "role", label: "Role", text: "You are Kestrel Travel's support assistant for passengers." },
  { id: "goal", label: "Goal", text: "Resolve the passenger's booking, baggage or refund question in one reply." },
  { id: "rules", label: "Rules", text: "Never promise a refund amount. Quote policy only from the provided documents." },
  { id: "reasons", label: "Reasons for rules", text: "Refund amounts depend on fare rules we check later, so a promised figure is often wrong." },
  { id: "format", label: "Output format", text: 'Reply as JSON: {"answer": string, "policy_id": string | null, "needs_human": boolean}.' },
  { id: "examples", label: "Examples", text: "Two varied example questions with ideal JSON replies." },
  { id: "missingInfo", label: "Missing-info rule", text: "If the booking reference is missing, ask for it. Don't guess." },
  { id: "contradiction", label: "Contradictory rule", text: "Always give the passenger a definite refund amount.", bad: true },
];

export type TestCase = { id: number; question: string; kind: string; needs: Section[]; brokenBy?: Section[] };

export const TEST_SET: TestCase[] = [
  { id: 1, question: "Hi, who am I talking to?", kind: "Tone", needs: ["role"] },
  { id: 2, question: "Can you help me plan a trip to Goa?", kind: "Stays on task", needs: ["role", "goal"] },
  { id: 3, question: "My bag is late, what now?", kind: "Stays on task", needs: ["goal"] },
  { id: 4, question: "How much refund will I get?", kind: "Policy", needs: ["rules"], brokenBy: ["contradiction"] },
  { id: 5, question: "Can you just promise me ₹5,000 back?", kind: "Policy edge case", needs: ["rules", "reasons"], brokenBy: ["contradiction"] },
  { id: 6, question: "The website says 7 days, you say 5. Which is right?", kind: "Policy edge case", needs: ["rules", "reasons"] },
  { id: 7, question: "Is my flight KT 204 on time?", kind: "Format", needs: ["format"] },
  { id: 8, question: "Change my seat and tell me the policy.", kind: "Format", needs: ["format", "examples"] },
  { id: 9, question: "I'm furious, this is the third delay!", kind: "Tone under pressure", needs: ["role", "examples"] },
  { id: 10, question: "Cancel my booking.", kind: "Missing info", needs: ["missingInfo"] },
  { id: 11, question: "Refund my flight from last week.", kind: "Missing info", needs: ["missingInfo", "rules"], brokenBy: ["contradiction"] },
  { id: 12, question: "Do I need a visa for Singapore?", kind: "Policy", needs: ["rules"] },
];

export type TestResult = { id: number; pass: boolean; reason: string };

export function runTestSet(on: Set<Section>): { results: TestResult[]; score: number } {
  const label = (s: Section) => SECTIONS.find((x) => x.id === s)!.label;
  const results = TEST_SET.map((t) => {
    const missing = t.needs.filter((s) => !on.has(s));
    const broken = (t.brokenBy ?? []).filter((s) => on.has(s));
    if (broken.length) return { id: t.id, pass: false, reason: `Conflicts with "${label(broken[0])}"` };
    if (missing.length) return { id: t.id, pass: false, reason: `Needs "${label(missing[0])}"` };
    return { id: t.id, pass: true, reason: "Pass" };
  });
  return { results, score: results.filter((r) => r.pass).length };
}

export const DEFAULT_ON: Section[] = ["role", "rules"];
