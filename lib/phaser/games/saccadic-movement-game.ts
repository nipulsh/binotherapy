import * as Phaser from "phaser";
import { BaseScene } from "../scenes/base-scene";

class SaccadicMovementScene extends BaseScene {
  private tiles: Phaser.GameObjects.Rectangle[] = [];
  private columns: number = 4;
  private tileHeight: number = 200;
  private spawnInterval: number = 1000;
  private lastSpawnTime: number = 0;
  private speed: number = 200;
  private tilesHit: number = 0;
  private totalTiles: number = 0;
  private maxCombo: number = 0;
  private combo: number = 0;
  private scoreText?: Phaser.GameObjects.Text;
  private accuracyText?: Phaser.GameObjects.Text;
  private gameTimer?: Phaser.Time.TimerEvent;
  private timeRemaining: number = 60;

  create() {
    const { width, height } = this.scale;

    // Create column dividers
    for (let i = 1; i < this.columns; i++) {
      const x = (width / this.columns) * i;
      const graphics = this.add.graphics();
      graphics.lineStyle(2, 0xcccccc, 1);
      graphics.lineBetween(x, 0, x, height);
    }

    // Add bottom detection line
    const bottomLine = this.add.graphics();
    bottomLine.lineStyle(5, 0xff0000, 0.5);
    bottomLine.lineBetween(0, height - 10, width, height - 10);

    // UI Text
    this.scoreText = this.add.text(10, 10, "Score: 0", {
      fontSize: "24px",
      color: "#000",
    });
    this.accuracyText = this.add.text(10, 40, "Accuracy: 100%", {
      fontSize: "20px",
      color: "#000",
    });

    this.startGame();
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

  update(time: number) {
    if (!this.gameActive) return;

    // Spawn new tiles
    if (time - this.lastSpawnTime > this.spawnInterval) {
      this.spawnTile();
      this.lastSpawnTime = time;
    }

    // Update existing tiles
    this.tiles.forEach((tile, index) => {
      tile.y += this.speed * (this.game.loop.delta / 1000);

      // Check if tile reached bottom
      if (tile.y > this.scale.height) {
        if (!(tile as Phaser.GameObjects.Rectangle & { hit?: boolean }).hit) {
          this.handleMiss();
        }
        tile.destroy();
        this.tiles.splice(index, 1);
      }
    });
  }

  private spawnTile() {
    const columnWidth = this.scale.width / this.columns;
    const column = Phaser.Math.Between(0, this.columns - 1);
    const x = column * columnWidth;

    const tile = this.add.rectangle(
      x + columnWidth / 2,
      -this.tileHeight / 2,
      columnWidth - 4,
      this.tileHeight,
      0x000000
    );

    tile.setInteractive();
    const tileWithData = tile as Phaser.GameObjects.Rectangle & { hit?: boolean; column?: number };
    tileWithData.hit = false;
    tileWithData.column = column;

    tile.on("pointerdown", () => {
      if (!(tile as Phaser.GameObjects.Rectangle & { hit?: boolean }).hit && this.gameActive) {
        this.handleTileHit(tile);
      }
    });

    this.tiles.push(tile);
    this.totalTiles++;
  }

  private handleTileHit(tile: Phaser.GameObjects.Rectangle) {
    (tile as Phaser.GameObjects.Rectangle & { hit?: boolean }).hit = true;
    tile.setFillStyle(0x4caf50);

    const reactionTime = Date.now() - this.startTime;
    this.recordReactionTime(reactionTime);

    this.tilesHit++;
    this.combo++;
    this.maxCombo = Math.max(this.maxCombo, this.combo);

    const points = 10 * this.combo;
    this.updateScore(points);
    this.updateAccuracy(this.tilesHit, this.totalTiles);

    this.updateUI();
  }

  private handleMiss() {
    this.combo = 0;
    this.updateUI();
  }

  private updateUI() {
    if (this.scoreText) this.scoreText.setText(`Score: ${this.score}`);
    if (this.accuracyText)
      this.accuracyText.setText(`Accuracy: ${this.accuracy}%`);
  }
}

export const saccadicMovementGameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 600,
  height: 800,
  backgroundColor: "#ffffff",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: SaccadicMovementScene,
};

