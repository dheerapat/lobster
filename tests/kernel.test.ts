import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { Kernel } from "../src/kernel/kernel.js";
import type {
  IInputAdapter,
  IOutputAdapter,
  IAgentAdapter,
  MessagePacket,
  ResponsePacket,
} from "../src/interfaces/adapter.js";
import fs from "fs/promises";
import path from "path";

describe("Kernel", () => {
  let kernel: Kernel;
  let testQueuePath: string;

  beforeEach(async () => {
    kernel = new Kernel();
    testQueuePath = path.join(process.cwd(), ".test-kernel-queues");
    await fs.rm(testQueuePath, { recursive: true, force: true });
  });

  afterEach(async () => {
    await kernel.shutdown();
    await fs.rm(testQueuePath, { recursive: true, force: true });
  });

  describe("bootstrap", () => {
    it("should initialize kernel with empty state", () => {
      expect(kernel).toBeDefined();
    });
  });

  describe("handleIncomingMessage", () => {
    it("should enqueue incoming messages", async () => {
      const message: MessagePacket = {
        id: "msg-123",
        source: "discord",
        channelId: "channel-1",
        userId: "user-1",
        payload: "Hello",
        timestamp: Date.now(),
      };

      await kernel["handleIncomingMessage"](message);

      await new Promise((resolve) => setTimeout(resolve, 100));
    });
  });

  describe("shutdown", () => {
    it("should stop gracefully", async () => {
      await kernel.shutdown();
    });
  });
});
