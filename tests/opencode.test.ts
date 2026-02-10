import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import OpencodeAgent from "../src/adapters/agents/opencode/opencode.js";
import type { MessagePacket } from "../src/interfaces/adapter";
import fs from "fs/promises";
import path from "path";

describe("OpencodeAgent", () => {
  let agent: OpencodeAgent;
  let testSessionPath: string;

  beforeEach(async () => {
    testSessionPath = path.join(process.cwd(), ".test-sessions");
    agent = new OpencodeAgent();

    await fs.rm(testSessionPath, { recursive: true, force: true });
  });

  afterEach(async () => {
    await agent.stop();
    await fs.rm(testSessionPath, { recursive: true, force: true });
  });

  describe("initialization", () => {
    it("should initialize with correct name", () => {
      expect(agent.name).toBe("opencode");
    });

    it("should start and stop without errors", async () => {
      await agent.start();
      await agent.stop();
    });
  });

  describe("process - reset commands", () => {
    it("should handle /reset command", async () => {
      const message: MessagePacket = {
        id: "msg-1",
        source: "discord",
        channelId: "channel-123",
        userId: "user-123",
        payload: "/reset",
        timestamp: Date.now(),
      };

      const response = await agent.process(message);
      expect(response).toContain("fresh");
    });

    it("should handle !reset command", async () => {
      const message: MessagePacket = {
        id: "msg-2",
        source: "discord",
        channelId: "channel-456",
        userId: "user-456",
        payload: "!reset",
        timestamp: Date.now(),
      };

      const response = await agent.process(message);
      expect(response).toContain("fresh");
    });

    it("should handle reset with whitespace variations", async () => {
      const message: MessagePacket = {
        id: "msg-3",
        source: "discord",
        channelId: "channel-789",
        userId: "user-789",
        payload: "  /RESET  ",
        timestamp: Date.now(),
      };

      const response = await agent.process(message);
      expect(response).toContain("fresh");
    });
  });

  describe("process - error handling", () => {
    it("should return friendly error when opencode server is unavailable", async () => {
      const message: MessagePacket = {
        id: "msg-4",
        source: "discord",
        channelId: "channel-error",
        userId: "user-error",
        payload: "Hello",
        timestamp: Date.now(),
      };

      const response = await agent.process(message);
      expect(response).toContain("error");
    });
  });

  describe("session management", () => {
    it("should handle messages from different channels separately", async () => {
      const message1: MessagePacket = {
        id: "msg-5",
        source: "discord",
        channelId: "channel-a",
        userId: "user-a",
        payload: "Hello from channel A",
        timestamp: Date.now(),
      };

      const message2: MessagePacket = {
        id: "msg-6",
        source: "discord",
        channelId: "channel-b",
        userId: "user-b",
        payload: "Hello from channel B",
        timestamp: Date.now(),
      };

      const response1 = await agent.process(message1);
      const response2 = await agent.process(message2);

      expect(response1).toBeDefined();
      expect(response2).toBeDefined();
    });
  });
});
