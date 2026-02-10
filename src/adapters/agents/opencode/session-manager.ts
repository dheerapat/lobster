import fs from "fs/promises";
import path from "path";

interface SessionData {
  [channelId: string]: string;
}

export class SessionManager {
  private sessions: Map<string, string> = new Map();
  private sessionsPath: string;
  private saveScheduled: boolean = false;

  constructor(basePath: string = ".lobster") {
    this.sessionsPath = path.join(basePath, "sessions.json");
  }

  async load(): Promise<void> {
    try {
      const content = await fs.readFile(this.sessionsPath, "utf-8");
      const data: SessionData = JSON.parse(content);
      this.sessions = new Map(Object.entries(data));
    } catch (error) {
      console.warn("Could not load sessions, starting fresh:", error);
      this.sessions = new Map();
    }
  }

  async save(): Promise<void> {
    const data: SessionData = Object.fromEntries(this.sessions);
    const dir = path.dirname(this.sessionsPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(this.sessionsPath, JSON.stringify(data, null, 2));
  }

  private scheduleSave(): void {
    if (this.saveScheduled) return;
    this.saveScheduled = true;
    setTimeout(async () => {
      await this.save();
      this.saveScheduled = false;
    }, 1000);
  }

  getSessionId(channelId: string): string | undefined {
    return this.sessions.get(channelId);
  }

  setSessionId(channelId: string, sessionId: string): void {
    this.sessions.set(channelId, sessionId);
    this.scheduleSave();
  }

  deleteSession(channelId: string): boolean {
    const deleted = this.sessions.delete(channelId);
    if (deleted) {
      this.scheduleSave();
    }
    return deleted;
  }

  clearAll(): void {
    this.sessions.clear();
    this.scheduleSave();
  }
}
