import type { Plugin } from "vite";
import { askMentor, mentorConfigured, mentorErrorStatus, type MentorRequest } from "./mentor";

/** Serves POST /api/mentor from the Vite dev and preview servers. The API key never reaches the browser. */
export function mentorApi(): Plugin {
  const handler = async (req: import("http").IncomingMessage, res: import("http").ServerResponse) => {
    const send = (status: number, body: object) => {
      res.statusCode = status;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(body));
    };
    if (req.method !== "POST") return send(405, { error: "POST only" });
    if (!mentorConfigured()) return send(503, { error: "mentor_not_configured" });
    let raw = "";
    for await (const chunk of req) raw += chunk;
    try {
      const body = JSON.parse(raw) as MentorRequest;
      if (typeof body.message !== "string" || !body.message.trim() || body.message.length > 1000)
        return send(400, { error: "message must be 1-1000 characters" });
      const reply = await askMentor(body);
      send(200, { reply });
    } catch (error) {
      console.error("[mentor]", error instanceof Error ? error.message : error);
      send(mentorErrorStatus(error), { error: "mentor_unavailable" });
    }
  };
  return {
    name: "mentor-api",
    configureServer(server) {
      server.middlewares.use("/api/mentor", handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use("/api/mentor", handler);
    },
  };
}
