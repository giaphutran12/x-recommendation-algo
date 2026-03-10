// In-memory pub/sub for feed weight change events
// Single-user demo — no need for Redis or external message broker

type Listener = (data: unknown) => void;

class FeedEventBus {
  private listeners = new Map<string, Set<Listener>>();

  subscribe(userId: string, listener: Listener): () => void {
    if (!this.listeners.has(userId)) {
      this.listeners.set(userId, new Set());
    }
    this.listeners.get(userId)!.add(listener);
    return () => {
      this.listeners.get(userId)?.delete(listener);
    };
  }

  emit(userId: string, data: unknown): void {
    this.listeners.get(userId)?.forEach((fn) => fn(data));
  }
}

export const feedEvents = new FeedEventBus();
