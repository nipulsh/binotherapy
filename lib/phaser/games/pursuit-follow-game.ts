import * as Phaser from "phaser";
import { BaseScene } from "../scenes/base-scene";

class PursuitFollowScene extends BaseScene {
  private target?: Phaser.GameObjects.Arc;
  private cursor?: Phaser.GameObjects.Arc;
  private path?: Phaser.Curves.Path;
  private pathProgress: number = 0;
  private trackingDistances: number[] = [];
  private scoreText?: Phaser.GameObjects.Text;
  private accuracyText?: Phaser.GameObjects.Text;
  private gameTimer?: Phaser.Time.TimerEvent;
  private timeRemaining: number = 30;
  private updateInterval?: Phaser.Time.TimerEvent;

  create() {
    const { width, height } = this.scale;

    // Create smooth curved path
    this.path = this.add.path(width / 2, height / 2);
    // splineTo accepts an array of numbers (x1, y1, x2, y2, ...)
    const points = [
      width * 0.2,
      height * 0.3,
      width * 0.8,
      height * 0.2,
      width * 0.7,
      height * 0.6,
      width * 0.3,
      height * 0.8,
      width * 0.5,
      height * 0.5,
    ];
    // @ts-expect-error - Phaser's splineTo accepts array of numbers but types are strict
    this.path.splineTo(points);

    // Create moving target
    this.target = this.add.circle(0, 0, 20, 0xff0000, 1);

    // Create cursor that follows mouse
    this.cursor = this.add.circle(0, 0, 15, 0x00ff00, 0.7);

    // UI
    this.scoreText = this.add
      .text(width / 2, 30, "Tracking Accuracy: 100%", {
        fontSize: "32px",
        color: "#fff",
      })
      .setOrigin(0.5);

    this.startGame();
    this.startTimer();
    this.startTracking();
  }

  private startTimer() {
    this.gameTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.timeRemaining--;
        if (this.timeRemaining <= 0) {
          this.endGame(1, {
            averageTrackingDistance:
              this.trackingDistances.reduce((a, b) => a + b, 0) /
              this.trackingDistances.length,
          });
        }
      },
      loop: true,
    });
  }

  private startTracking() {
    // Update every 100ms
    this.updateInterval = this.time.addEvent({
      delay: 100,
      callback: () => {
        if (!this.gameActive || !this.target || !this.cursor) return;

        // Move target along path
        this.pathProgress += 0.01;
        if (this.pathProgress > 1) this.pathProgress = 0;

        const point = this.path!.getPoint(this.pathProgress);
        this.target.setPosition(point.x, point.y);

        // Update cursor to mouse position
        const pointer = this.input.activePointer;
        this.cursor.setPosition(pointer.x, pointer.y);

        // Calculate distance between cursor and target
        const distance = Phaser.Math.Distance.Between(
          this.target.x,
          this.target.y,
          this.cursor.x,
          this.cursor.y
        );

        this.trackingDistances.push(distance);

        // Calculate accuracy (closer = better, max distance is screen diagonal)
        const maxDistance = Math.sqrt(
          this.scale.width ** 2 + this.scale.height ** 2
        );

        // Update accuracy based on all tracking distances
        if (this.trackingDistances.length > 0) {
          this.accuracy = Math.round(
            this.trackingDistances.reduce((a, b) => {
              const accuracyForDistance = Math.max(
                0,
                100 - (b / maxDistance) * 100
              );
              return a + accuracyForDistance;
            }, 0) / this.trackingDistances.length
          );

          // Score based on tracking accuracy
          this.score = Math.round(
            this.trackingDistances.reduce((a, b) => {
              return a + Math.max(0, 100 - (b / maxDistance) * 100);
            }, 0)
          );
        }

        if (this.scoreText)
          this.scoreText.setText(`Tracking Accuracy: ${this.accuracy}%`);
      },
      loop: true,
    });
  }
}

export const pursuitFollowGameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: "#34495e",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: PursuitFollowScene,
};
