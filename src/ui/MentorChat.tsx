import { useEffect, useRef, useState } from "react";
import { findLesson } from "../content/lessons";
import { findLabLesson, labLessonForMentor } from "../lab/content";
import { useLab } from "../lab/store";
import { askRavi, type ChatMessage } from "../mentor/ask";
import { useProgress } from "../store/progress";
import { useUi } from "../store/ui";

/** "Ask Ravi" in the bottom-right corner. Knows which station is open and answers from its lesson. */
export function MentorChat() {
  const open = useUi((s) => s.chatOpen);
  const setOpen = useUi((s) => s.setChatOpen);
  const panel = useUi((s) => s.panel);
  const inLab = useUi((s) => s.view.kind === "lab");
  const labLessonId = useLab((s) => s.lessonId);
  const lessonId = inLab ? labLessonId : panel?.kind === "lesson" ? panel.lessonId : null;
  const labLesson = inLab ? findLabLesson(labLessonId) : null;
  const lesson = labLesson ? labLessonForMentor(labLesson) : lessonId ? (findLesson(lessonId)?.lesson ?? null) : null;
  const stepIndex = useProgress((s) => (lessonId ? (s.lessons[lessonId]?.step ?? 0) : 0));
  const stepKind = inLab ? "lab" : lesson ? (lesson.steps[stepIndex]?.kind ?? null) : null;

  // One conversation per station, kept while the page is open.
  const [threads, setThreads] = useState<Record<string, ChatMessage[]>>({});
  const key = lessonId ?? "general";
  const messages = threads[key] ?? [];
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, busy]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    const user: ChatMessage = { role: "user", content: q };
    setThreads((t) => ({ ...t, [key]: [...(t[key] ?? []), user] }));
    setDraft("");
    setBusy(true);
    const reply = await askRavi(lesson, stepKind, q, [...messages, user]);
    setThreads((t) => ({ ...t, [key]: [...(t[key] ?? []), reply] }));
    setBusy(false);
  };

  const suggestions = lesson
    ? [`Explain ${lesson.topic.split(/,| and /)[0].toLowerCase()} simply`, "Give me a real-world example", "What should I remember from this?"]
    : ["How does this airport work?", "Where do I start?"];

  if (!open)
    return (
      <button className={`chat-launcher ${panel || inLab ? "is-shifted" : ""}`} onClick={() => setOpen(true)}>
        <span className="chat-launcher__avatar">R</span>
        Ask Ravi
      </button>
    );

  return (
    <section className={`chat ${panel || inLab ? "is-shifted" : ""}`} aria-label="Ask Ravi">
      <header className="chat__head">
        <span className="chat-launcher__avatar">R</span>
        <div>
          <div className="chat__title">Ask Ravi</div>
          <div className="chat__context">{labLesson ? `About Episode ${labLesson.episode}: ${labLesson.title}` : lesson ? `About Station ${lesson.slot}: ${lesson.title}` : "General questions"}</div>
        </div>
        <button className="chat__close" onClick={() => setOpen(false)} aria-label="Close chat">
          ×
        </button>
      </header>
      <div className="chat__list" ref={listRef}>
        <div className="chat__msg chat__msg--assistant">
          {lesson
            ? `You can ask anything about this lesson: ${lesson.topic.toLowerCase()}. I'll give you hints, not quiz answers.`
            : "Open a station and I can answer questions about its lesson."}
        </div>
        {messages.map((m, i) => (
          <div key={i} className={`chat__msg chat__msg--${m.role}`}>
            {m.content}
            {m.offline && <span className="chat__tag">from the lesson notes (offline)</span>}
          </div>
        ))}
        {busy && <div className="chat__msg chat__msg--assistant chat__typing">Ravi is thinking…</div>}
      </div>
      {messages.length === 0 && (
        <div className="chat__suggest">
          {suggestions.map((s) => (
            <button key={s} onClick={() => void send(s)}>
              {s}
            </button>
          ))}
        </div>
      )}
      <form
        className="chat__form"
        onSubmit={(e) => {
          e.preventDefault();
          void send(draft);
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={lesson ? "You can ask anything about this lesson" : "Ask Ravi"}
          maxLength={1000}
          aria-label="Your question"
        />
        <button className="btn btn--primary" disabled={!draft.trim() || busy}>
          Send
        </button>
      </form>
    </section>
  );
}
