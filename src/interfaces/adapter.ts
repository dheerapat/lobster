// Standardized Message Packet
export interface MessagePacket {
  id: string;
  source: string; // e.g., 'discord', 'whatsapp'
  channelId: string; // e.g., specific channel ID or phone number
  userId: string; // e.g., user ID
  payload: string; // The actual text/content
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface ResponsePacket extends MessagePacket {
  originalMessageId: string;
}

// The Contract for Input Adapters (Discord, WhatsApp, etc.)
export interface IInputAdapter {
  name: string;
  start(): Promise<void>;
  stop(): Promise<void>;
  // The adapter calls this whenever a message arrives
  onMessage(callback: (msg: MessagePacket) => void): void;
}

// The Contract for Output Adapters (Sending replies back)
export interface IOutputAdapter {
  name: string;
  start(): Promise<void>;
  stop(): Promise<void>;
  send(response: ResponsePacket): Promise<void>;
}

// The Contract for Agents (Claude, Ollama, etc.)
export interface IAgentAdapter {
  name: string;
  start(): Promise<void>;
  stop(): Promise<void>;
  process(message: MessagePacket, context?: any): Promise<string>;
}
