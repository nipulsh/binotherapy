import * as Phaser from "phaser";
import type { GameResult } from "@/lib/types/game.types";

export abstract class BaseScene extends Phaser.Scene {
  protected score: number = 0;
  protected accuracy: number = 100;
  protected reactionTimes: number[] = [];
  protected startTime: number = 0;
  protected gameActive: boolean = false;

  protected startGame() {
    this.score = 0;
    this.accuracy = 100;
    this.reactionTimes = [];
    this.startTime = Date.now();
    this.gameActive = true;
  }

  protected recordReactionTime(reactionTime: number) {
    this.reactionTimes.push(reactionTime);
  }

  protected updateScore(points: number) {
    this.score += points;
  }

  protected updateAccuracy(correct: number, total: number) {
    if (total > 0) {
      this.accuracy = Math.round((correct / total) * 100);
    }
  }

  protected endGame(level: number = 1, metadata?: Record<string, unknown>) {
    if (!this.gameActive) return;

    this.gameActive = false;
    const duration = Math.floor((Date.now() - this.startTime) / 1000);

    const result: GameResult = {
      score: this.score,
      accuracy: this.accuracy,
      reactionTimes: this.reactionTimes,
      duration,
      level,
      metadata: metadata || {},
    };

    // Emit game-end event on both scene and game events
    this.events.emit("game-end", result);
    this.game.events.emit("game-end", result);
  }
}
