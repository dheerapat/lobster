import fs from "fs/promises";
import path from "path";

interface QueuedItem<T> {
  id: string;
  data: T;
  timestamp: number;
}

export class QueueManager {
  private basePath: string;
  private queues: Set<string> = new Set();

  constructor(basePath: string = ".lobster/queues") {
    this.basePath = basePath;
  }

  /**
   * Initialize directories for all registered queue names
   */
  async registerQueue(name: string) {
    if (this.queues.has(name)) return;

    const dirs = [
      path.join(this.basePath, name), // Incoming/Pending
      path.join(this.basePath, `${name}_processing`), // Currently being handled
      path.join(this.basePath, `${name}_done`), // Completed (optional, for logs)
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }

    this.queues.add(name);
  }

  /**
   * Add an item to the queue.
   * Writes a JSON file to the 'pending' directory.
   */
  async enqueue<T>(queueName: string, data: T): Promise<string> {
    await this.registerQueue(queueName);

    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fileName = `${id}.json`;
    const filePath = path.join(this.basePath, queueName, fileName);

    const item: QueuedItem<T> = {
      id,
      data,
      timestamp: Date.now(),
    };

    await fs.writeFile(filePath, JSON.stringify(item, null, 2));

    return id;
  }

  /**
   * Get the next item from the queue.
   * Moves the file from 'pending' to 'processing' to prevent double-processing.
   */
  async dequeue<T>(queueName: string): Promise<QueuedItem<T> | null> {
    await this.registerQueue(queueName);

    const pendingDir = path.join(this.basePath, queueName);
    const processingDir = path.join(this.basePath, `${queueName}_processing`);

    // 1. List all files in pending
    let files: string[];
    try {
      files = await fs.readdir(pendingDir);
    } catch (e) {
      return null; // Directory doesn't exist yet
    }

    // Filter for JSON files
    const jsonFiles = files.filter((f) => f.endsWith(".json"));

    if (jsonFiles.length === 0) return null;

    // 2. Sort by filename (which contains timestamp) to get oldest first
    jsonFiles.sort();

    const oldestFile = jsonFiles[0]!;
    const sourcePath = path.join(pendingDir, oldestFile);
    const targetPath = path.join(processingDir, oldestFile);

    try {
      // 3. Move file atomically (rename)
      await fs.rename(sourcePath, targetPath);

      // 4. Read content
      const content = await fs.readFile(targetPath, "utf-8");
      const item: QueuedItem<T> = JSON.parse(content);

      return item;
    } catch (error) {
      console.error(`Error moving/reading queue file ${oldestFile}:`, error);
      return null;
    }
  }

  /**
   * Mark a job as completed.
   * Moves the file from 'processing' to 'done' (or deletes it).
   */
  async complete(queueName: string, itemId: string): Promise<void> {
    const processingDir = path.join(this.basePath, `${queueName}_processing`);
    const doneDir = path.join(this.basePath, `${queueName}_done`);

    const fileName = `${itemId}.json`;
    const sourcePath = path.join(processingDir, fileName);
    const targetPath = path.join(doneDir, fileName);

    try {
      // Move to done folder (for audit trail) or unlink() to delete
      // Here we move to done to keep a history
      await fs.rename(sourcePath, targetPath);
    } catch (error) {
      // File might already be gone or moved, ignore
      console.warn(`Could not complete item ${itemId}:`, error);
    }
  }

  /**
   * Optional: Clear old history to prevent disk fill
   */
  async cleanup(
    queueName: string,
    olderThanMs: number = 7 * 24 * 60 * 60 * 1000,
  ) {
    // 7 days
    const doneDir = path.join(this.basePath, `${queueName}_done`);
    // Implementation: Read files, check mtime, delete if old...
    // (Left as exercise for brevity)
  }
}
