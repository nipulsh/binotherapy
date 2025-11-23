import * as Phaser from "phaser";
import { BaseScene } from "../scenes/base-scene";

class EyeHandCoordinationScene extends BaseScene {
  private target?: Phaser.GameObjects.Arc;
  private targetTimer?: Phaser.Time.TimerEvent;
  private hits: number = 0;
  private misses: number = 0;
  private scoreText?: Phaser.GameObjects.Text;
  private accuracyText?: Phaser.GameObjects.Text;
  private gameTimer?: Phaser.Time.TimerEvent;
  private timeRemaining: number = 60;

  create() {
    const { width } = this.scale;

    // UI
    this.scoreText = this.add
      .text(width / 2, 30, "Score: 0", {
        fontSize: "32px",
        color: "#fff",
      })
      .setOrigin(0.5);
    this.accuracyText = this.add
      .text(width / 2, 70, "Accuracy: 100%", {
        fontSize: "24px",
        color: "#fff",
      })
      .setOrigin(0.5);

    this.startGame();
    this.spawnTarget();
    this.startTimer();
  }

  private startTimer() {
    this.gameTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.timeRemaining--;
        if (this.timeRemaining <= 0) {
          this.endGame(1);
        }
      },
      loop: true,
    });
  }

  private spawnTarget() {
    if (!this.gameActive) return;

    const { width, height } = this.scale;
    const x = Phaser.Math.Between(50, width - 50);
    const y = Phaser.Math.Between(150, height - 50);

    // Create target circle
    this.target = this.add.circle(x, y, 40, 0x00ff00, 1);
    this.target.setInteractive();

    const spawnTime = Date.now();
    this.target.on("pointerdown", () => {
      const reactionTime = Date.now() - spawnTime;
      this.recordReactionTime(reactionTime);
      this.handleHit();
    });

    // Target disappears after 2 seconds
    this.targetTimer = this.time.delayedCall(2000, () => {
      this.handleMiss();
    });
  }

  private handleHit() {
    if (!this.target) return;

    this.hits++;
    this.updateScore(10);
    this.updateAccuracy(this.hits, this.hits + this.misses);
    this.updateUI();

    this.target.destroy();
    this.target = undefined;

    // Spawn new target after short delay
    this.time.delayedCall(500, () => {
      this.spawnTarget();
    });
  }

  private handleMiss() {
    if (!this.target) return;

    this.misses++;
    this.updateAccuracy(this.hits, this.hits + this.misses);
    this.updateUI();

    this.target.destroy();
    this.target = undefined;

    // Spawn new target
    this.time.delayedCall(500, () => {
      this.spawnTarget();
    });
  }

  private updateUI() {
    if (this.scoreText) this.scoreText.setText(`Score: ${this.score}`);
    if (this.accuracyText)
      this.accuracyText.setText(`Accuracy: ${this.accuracy}%`);
  }
}

export const eyeHandCoordinationGameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: "#2c3e50",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: EyeHandCoordinationScene,
};

