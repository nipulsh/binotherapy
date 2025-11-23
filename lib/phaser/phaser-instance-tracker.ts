/**
 * Phaser Instance Tracker
 *
 * Prevents duplicate Phaser game instances from being created.
 * Tracks active instances and ensures proper cleanup.
 */

interface PhaserInstance {
  game: Phaser.Game;
  containerId: string;
  timestamp: number;
}

class PhaserInstanceTracker {
  private instances: Map<string, PhaserInstance> = new Map();
  private initialized = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.initialized = true;
    }
  }

  /**
   * Register a Phaser game instance
   */
  register(containerId: string, game: Phaser.Game): boolean {
    if (!this.initialized) return false;

    // Check if instance already exists for this container
    const existing = this.instances.get(containerId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (existing && existing.game && !(existing.game as any).destroyed) {
      console.warn(
        `Phaser instance already exists for container: ${containerId}. Destroying old instance.`
      );
      try {
        existing.game.destroy(true);
      } catch (error) {
        console.error("Error destroying existing Phaser instance:", error);
      }
    }

    this.instances.set(containerId, {
      game,
      containerId,
      timestamp: Date.now(),
    });

    console.log(`Phaser instance registered for container: ${containerId}`);
    return true;
  }

  /**
   * Unregister a Phaser game instance
   */
  unregister(containerId: string): void {
    const instance = this.instances.get(containerId);
    if (instance) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!(instance.game as any).destroyed) {
          instance.game.destroy(true);
        }
      } catch (error) {
        console.error("Error destroying Phaser instance:", error);
      }
      this.instances.delete(containerId);
      console.log(`Phaser instance unregistered for container: ${containerId}`);
    }
  }

  /**
   * Check if an instance exists for a container
   */
  hasInstance(containerId: string): boolean {
    const instance = this.instances.get(containerId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return instance !== undefined && !(instance.game as any).destroyed;
  }

  /**
   * Get all active instances
   */
  getActiveInstances(): PhaserInstance[] {
    return Array.from(this.instances.values()).filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (instance) => !(instance.game as any).destroyed
    );
  }

  /**
   * Cleanup all instances
   */
  cleanup(): void {
    this.instances.forEach((instance, containerId) => {
      this.unregister(containerId);
    });
  }
}

// Export singleton instance
export const phaserTracker = new PhaserInstanceTracker();

// Cleanup on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    phaserTracker.cleanup();
  });
}
