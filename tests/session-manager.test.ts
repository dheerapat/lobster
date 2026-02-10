import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { SessionManager } from "../src/adapters/agents/opencode/session-manager.js";
import fs from "fs/promises";
import path from "path";

describe("SessionManager", () => {
  let sessionManager: SessionManager;
  let testPath: string;

  beforeEach(async () => {
    testPath = path.join(process.cwd(), ".test-session-manager");
    sessionManager = new SessionManager(testPath);
    await fs.rm(testPath, { recursive: true, force: true });
  });

  afterEach(async () => {
    await fs.rm(testPath, { recursive: true, force: true });
  });

  describe("initialization", () => {
    it("should initialize with default path", async () => {
      const defaultManager = new SessionManager();
      await defaultManager.load();
      expect(defaultManager).toBeDefined();
      await defaultManager.save();
    });
  });

  describe("load", () => {
    it("should load sessions from file", async () => {
      const sessionsPath = path.join(testPath, "sessions.json");
      await fs.mkdir(testPath, { recursive: true });
      await fs.writeFile(
        sessionsPath,
        JSON.stringify({
          "channel-1": "session-abc",
          "channel-2": "session-def",
        }),
      );

      await sessionManager.load();

      expect(sessionManager.getSessionId("channel-1")).toBe("session-abc");
      expect(sessionManager.getSessionId("channel-2")).toBe("session-def");
    });

    it("should start fresh if file does not exist", async () => {
      await sessionManager.load();
      expect(sessionManager.getSessionId("any-channel")).toBeUndefined();
    });
  });

  describe("save", () => {
    it("should save sessions to file", async () => {
      sessionManager.setSessionId("channel-1", "session-123");
      await sessionManager.save();

      const content = await fs.readFile(
        path.join(testPath, "sessions.json"),
        "utf-8",
      );
      const data = JSON.parse(content);

      expect(data["channel-1"]).toBe("session-123");
    });

    it("should create directory if it does not exist", async () => {
      sessionManager.setSessionId("channel-1", "session-456");
      await sessionManager.save();

      const exists = await fs
        .access(testPath)
        .then(() => true)
        .catch(() => false);
      expect(exists).toBeTrue();
    });
  });

  describe("getSessionId", () => {
    it("should return session ID for existing channel", async () => {
      sessionManager.setSessionId("channel-1", "session-789");
      const sessionId = sessionManager.getSessionId("channel-1");
      expect(sessionId).toBe("session-789");
    });

    it("should return undefined for non-existent channel", () => {
      const sessionId = sessionManager.getSessionId("non-existent");
      expect(sessionId).toBeUndefined();
    });
  });

  describe("setSessionId", () => {
    it("should set session ID for a channel", async () => {
      sessionManager.setSessionId("channel-2", "session-new");
      expect(sessionManager.getSessionId("channel-2")).toBe("session-new");
    });

    it("should overwrite existing session ID", () => {
      sessionManager.setSessionId("channel-3", "session-old");
      sessionManager.setSessionId("channel-3", "session-new");
      expect(sessionManager.getSessionId("channel-3")).toBe("session-new");
    });
  });

  describe("deleteSession", () => {
    it("should delete session for a channel", () => {
      sessionManager.setSessionId("channel-4", "session-del");
      const deleted = sessionManager.deleteSession("channel-4");

      expect(deleted).toBeTrue();
      expect(sessionManager.getSessionId("channel-4")).toBeUndefined();
    });

    it("should return false when deleting non-existent session", () => {
      const deleted = sessionManager.deleteSession("non-existent");
      expect(deleted).toBeFalse();
    });
  });

  describe("clearAll", () => {
    it("should clear all sessions", () => {
      sessionManager.setSessionId("channel-5", "session-5");
      sessionManager.setSessionId("channel-6", "session-6");
      sessionManager.setSessionId("channel-7", "session-7");

      sessionManager.clearAll();

      expect(sessionManager.getSessionId("channel-5")).toBeUndefined();
      expect(sessionManager.getSessionId("channel-6")).toBeUndefined();
      expect(sessionManager.getSessionId("channel-7")).toBeUndefined();
    });
  });

  describe("end-to-end workflow", () => {
    it("should handle complete load-set-save cycle", async () => {
      await sessionManager.load();

      sessionManager.setSessionId("channel-8", "session-8");
      sessionManager.setSessionId("channel-9", "session-9");

      await sessionManager.save();

      const newManager = new SessionManager(testPath);
      await newManager.load();

      expect(newManager.getSessionId("channel-8")).toBe("session-8");
      expect(newManager.getSessionId("channel-9")).toBe("session-9");
    });

    it("should persist session deletions", async () => {
      sessionManager.setSessionId("channel-10", "session-10");
      await sessionManager.save();

      const newManager = new SessionManager(testPath);
      await newManager.load();

      newManager.deleteSession("channel-10");
      await newManager.save();

      const finalManager = new SessionManager(testPath);
      await finalManager.load();

      expect(finalManager.getSessionId("channel-10")).toBeUndefined();
    });
  });
});
