import * as Phaser from "phaser";
import { BaseScene } from "../scenes/base-scene";

class DepthPerceptionScene extends BaseScene {
  private circles: Phaser.GameObjects.Arc[] = [];
  private targetIndex: number = 0;
  private level: number = 1;
  private correctClicks: number = 0;
  private totalClicks: number = 0;
  private scoreText?: Phaser.GameObjects.Text;
  private levelText?: Phaser.GameObjects.Text;
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
    this.levelText = this.add
      .text(width / 2, 70, "Level: 1", {
        fontSize: "24px",
        color: "#fff",
      })
      .setOrigin(0.5);

    this.startGame();
    this.spawnCircles();
    this.startTimer();
  }

  private startTimer() {
    this.gameTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.timeRemaining--;
        if (this.timeRemaining <= 0) {
          this.endGame(this.level);
        }
      },
      loop: true,
    });
  }

  private spawnCircles() {
    const { width, height } = this.scale;
    this.circles = [];

    // Generate 3-5 circles with different sizes (simulating depth)
    const numCircles = Phaser.Math.Between(3, 5);
    const sizes: number[] = [];
    const positions: { x: number; y: number }[] = [];

    for (let i = 0; i < numCircles; i++) {
      // Larger circles appear closer (depth perception)
      const size = Phaser.Math.Between(40, 100);
      sizes.push(size);
      positions.push({
        x: Phaser.Math.Between(size, width - size),
        y: Phaser.Math.Between(150, height - 100),
      });
    }

    // The largest circle is the target (closest)
    this.targetIndex = sizes.indexOf(Math.max(...sizes));

    // Create circles
    sizes.forEach((size, index) => {
      const circle = this.add.circle(
        positions[index].x,
        positions[index].y,
        size,
        0x3498db,
        0.8
      );

      circle.setInteractive();
      circle.setData("isTarget", index === this.targetIndex);

      circle.on("pointerdown", () => {
        this.handleCircleClick(circle);
      });

      this.circles.push(circle);
    });
  }

  private handleCircleClick(circle: Phaser.GameObjects.Arc) {
    if (!this.gameActive) return;

    const isTarget = circle.getData("isTarget");
    this.totalClicks++;

    const reactionTime = Date.now() - this.startTime;
    this.recordReactionTime(reactionTime);

    if (isTarget) {
      this.correctClicks++;
      this.updateScore(100 * this.level);
      this.cameras.main.shake(100, 0.01);
      this.level++;
      this.updateAccuracy(this.correctClicks, this.totalClicks);
      this.updateUI();

      // Clear and spawn new circles
      this.circles.forEach((c) => c.destroy());
      this.spawnCircles();
    } else {
      // Wrong click
      this.cameras.main.shake(200, 0.02);
      this.updateAccuracy(this.correctClicks, this.totalClicks);
      this.updateUI();
    }
  }

  private updateUI() {
    if (this.scoreText) this.scoreText.setText(`Score: ${this.score}`);
    if (this.levelText) this.levelText.setText(`Level: ${this.level}`);
  }
}

export const depthPerceptionGameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: "#1a1a2e",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: DepthPerceptionScene,
};
