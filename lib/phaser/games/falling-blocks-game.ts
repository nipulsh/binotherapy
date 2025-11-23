import * as Phaser from "phaser";
import type { GameResult } from "@/lib/types/game.types";

export interface FallingBlockData {
  startY: number;
  fallDistance: number;
  color: number;
}

export class FallingBlocksScene extends Phaser.Scene {
  private ground!: Phaser.GameObjects.Rectangle;
  private currentBlock: Phaser.GameObjects.Rectangle | null = null;
  private landedBlocks: Phaser.GameObjects.Rectangle[] = [];
  private distanceText: Phaser.GameObjects.Text | null = null;
  private scoreText!: Phaser.GameObjects.Text;
  private blocksStackedText!: Phaser.GameObjects.Text;
  private highestFallText!: Phaser.GameObjects.Text;

  private totalScore: number = 0;
  private blocksStacked: number = 0;
  private highestFall: number = 0;
  private currentFallDistance: number = 0;
  private gameState:
    | "INITIALIZING"
    | "READY"
    | "PLAYING"
    | "PAUSED"
    | "GAME_OVER" = "INITIALIZING";
  private spawnTimer: Phaser.Time.TimerEvent | null = null;
  private gameStartTime: number = 0;

  private readonly GAME_WIDTH = 800;
  private readonly GAME_HEIGHT = 600;
  private readonly GROUND_Y = 550;
  private readonly SPAWN_Y = 50;
  private readonly SPAWN_DELAY = 2000;
  private readonly GAME_OVER_THRESHOLD = 100;

  constructor() {
    super({ key: "FallingBlocksScene" });
  }

  create() {
    // Set world bounds
    this.physics.world.setBounds(0, 0, this.GAME_WIDTH, this.GAME_HEIGHT);

    // Create ground
    this.ground = this.add.rectangle(
      this.GAME_WIDTH / 2,
      this.GROUND_Y,
      this.GAME_WIDTH,
      20,
      0x4a5568
    );
    this.physics.add.existing(this.ground, true);

    // Set gravity
    this.physics.world.gravity.y = 300;

    // Create UI text
    this.scoreText = this.add.text(20, 20, "Total Score: 0", {
      fontSize: "24px",
      color: "#ffffff",
      fontFamily: "Arial",
    });

    this.blocksStackedText = this.add.text(20, 60, "Blocks Stacked: 0", {
      fontSize: "20px",
      color: "#ffffff",
      fontFamily: "Arial",
    });

    this.highestFallText = this.add.text(20, 100, "Highest Fall: 0m", {
      fontSize: "20px",
      color: "#ffffff",
      fontFamily: "Arial",
    });

    // Initialize game
    this.gameState = "READY";
    this.gameStartTime = Date.now();
    this.events.emit("game-ready");

    // Start spawning blocks
    this.spawnNextBlock();
  }

  private spawnNextBlock() {
    if (this.gameState !== "PLAYING" && this.gameState !== "READY") return;

    this.gameState = "PLAYING";

    // Random block width (60-120px)
    const blockWidth = Phaser.Math.Between(60, 120);
    const blockHeight = Phaser.Math.Between(40, 80);

    // Random x position within bounds
    const x = Phaser.Math.Between(
      blockWidth / 2,
      this.GAME_WIDTH - blockWidth / 2
    );

    // Random color
    const colors = [0xff6b6b, 0x4ecdc4, 0x45b7d1, 0xf9ca24, 0x6c5ce7, 0xa29bfe];
    const color = Phaser.Utils.Array.GetRandom(colors);

    // Create block
    const block = this.add.rectangle(
      x,
      this.SPAWN_Y,
      blockWidth,
      blockHeight,
      color
    );
    this.physics.add.existing(block);
    const body = block.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    body.setBounce(0.2, 0.2);

    // Store block data
    const blockData: FallingBlockData = {
      startY: this.SPAWN_Y,
      fallDistance: 0,
      color,
    };
    block.setData("startY", blockData.startY);
    block.setData("fallDistance", blockData.fallDistance);
    block.setData("color", blockData.color);

    this.currentBlock = block;

    // Create distance text above block
    this.distanceText = this.add.text(x, this.SPAWN_Y - 30, "0m", {
      fontSize: "18px",
      color: "#ffffff",
      fontFamily: "Arial",
      backgroundColor: "#000000",
      padding: { x: 8, y: 4 },
    });

    // Set up collisions
    this.physics.add.collider(block, this.ground, () =>
      this.onBlockLanded(block)
    );

    // Collide with landed blocks
    this.landedBlocks.forEach((landedBlock) => {
      this.physics.add.collider(block, landedBlock, () =>
        this.onBlockLanded(block)
      );
    });

    // Emit block spawned event
    this.events.emit("block-spawned");
  }

  private onBlockLanded(block: Phaser.GameObjects.Rectangle) {
    if (!this.currentBlock || block !== this.currentBlock) return;

    const body = block.body as Phaser.Physics.Arcade.Body;
    body.setImmovable(true);
    body.setVelocity(0, 0);

    const fallDistance = block.getData("fallDistance") as number;
    const finalDistance = Math.round(fallDistance / 10); // Convert to meters

    // Update stats
    this.totalScore += finalDistance;
    this.blocksStacked++;
    if (finalDistance > this.highestFall) {
      this.highestFall = finalDistance;
    }

    // Add to landed blocks
    this.landedBlocks.push(block);

    // Remove distance text with animation
    if (this.distanceText) {
      this.tweens.add({
        targets: this.distanceText,
        y: this.scoreText.y,
        alpha: 0,
        duration: 500,
        onComplete: () => {
          this.distanceText?.destroy();
          this.distanceText = null;
        },
      });
    }

    // Update UI
    this.updateUI();

    // Check game over
    const highestBlockY = Math.min(...this.landedBlocks.map((b) => b.y));
    if (highestBlockY < this.GAME_OVER_THRESHOLD) {
      this.endGame();
      return;
    }

    // Emit block landed event
    this.events.emit("block-landed", {
      distance: finalDistance,
      totalScore: this.totalScore,
      blocksStacked: this.blocksStacked,
    });

    // Clear current block
    this.currentBlock = null;

    // Spawn next block after delay
    this.gameState = "READY";
    if (this.spawnTimer) {
      this.spawnTimer.destroy();
    }
    this.spawnTimer = this.time.delayedCall(this.SPAWN_DELAY, () => {
      this.spawnNextBlock();
    });
  }

  private updateUI() {
    this.scoreText.setText(`Total Score: ${this.totalScore}m`);
    this.blocksStackedText.setText(`Blocks Stacked: ${this.blocksStacked}`);
    this.highestFallText.setText(`Highest Fall: ${this.highestFall}m`);

    // Emit UI update event
    this.events.emit("ui-update", {
      totalScore: this.totalScore,
      blocksStacked: this.blocksStacked,
      highestFall: this.highestFall,
      currentFallDistance: this.currentFallDistance,
    });
  }

  private endGame() {
    if (this.gameState === "GAME_OVER") return;

    this.gameState = "GAME_OVER";

    // Stop all timers
    if (this.spawnTimer) {
      this.spawnTimer.destroy();
    }

    // Calculate duration
    const duration = Math.floor((Date.now() - this.gameStartTime) / 1000);

    // Create game result
    const result: GameResult = {
      score: this.totalScore,
      accuracy: 100,
      reactionTimes: [],
      duration,
      level: Math.floor(this.blocksStacked / 10) + 1,
      metadata: {
        blocksStacked: this.blocksStacked,
        highestFall: this.highestFall,
        gameName: "falling-blocks",
      },
    };

    // Emit game end event
    this.events.emit("game-end", result);
    this.game.events.emit("game-end", result);
  }

  update() {
    if (this.gameState !== "PLAYING" || !this.currentBlock) return;

    // Update fall distance
    const startY = this.currentBlock.getData("startY") as number;
    const currentY = this.currentBlock.y;
    const fallDistance = currentY - startY;
    this.currentBlock.setData("fallDistance", fallDistance);
    this.currentFallDistance = Math.round(fallDistance / 10);

    // Update distance text
    if (this.distanceText) {
      this.distanceText.setText(`${this.currentFallDistance}m`);
      this.distanceText.x = this.currentBlock.x;
      this.distanceText.y = this.currentBlock.y - 40;

      // Pulse effect
      const scale = 1 + Math.sin(Date.now() / 200) * 0.1;
      this.distanceText.setScale(scale);
    }
  }

  restart() {
    // Clear all blocks
    this.landedBlocks.forEach((block) => block.destroy());
    this.landedBlocks = [];

    if (this.currentBlock) {
      this.currentBlock.destroy();
      this.currentBlock = null;
    }

    if (this.distanceText) {
      this.distanceText.destroy();
      this.distanceText = null;
    }

    if (this.spawnTimer) {
      this.spawnTimer.destroy();
      this.spawnTimer = null;
    }

    // Reset stats
    this.totalScore = 0;
    this.blocksStacked = 0;
    this.highestFall = 0;
    this.currentFallDistance = 0;
    this.gameState = "READY";
    this.gameStartTime = Date.now();

    // Update UI
    this.updateUI();

    // Start new game
    this.spawnNextBlock();
  }
}
