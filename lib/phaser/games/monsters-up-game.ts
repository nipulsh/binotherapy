import * as Phaser from "phaser";
import { BaseScene } from "../scenes/base-scene";

enum GameState {
  START = "START",
  PLAYING = "PLAYING",
  GAMEOVER = "GAMEOVER",
}

class MonstersUpScene extends BaseScene {
  private state: GameState = GameState.START;
  private player?: Phaser.Physics.Arcade.Sprite;
  private platforms?: Phaser.Physics.Arcade.StaticGroup;
  private stars?: Phaser.Physics.Arcade.Group;
  private scoreText?: Phaser.GameObjects.Text;
  private bestScoreText?: Phaser.GameObjects.Text;
  private gameOverText?: Phaser.GameObjects.Text;
  private restartText?: Phaser.GameObjects.Text;
  private perfectText?: Phaser.GameObjects.Text;
  private lastY: number = 0;
  private perfectCount: number = 0;
  private platformsClimbed: number = 0;
  private bestScore: number = 0;
  private themeIndex: number = 0;
  private backgroundColors: number[] = [
    0x87ceeb, 0xffb6c1, 0x98fb98, 0xffd700, 0xdda0dd,
  ];

  create() {
    const { width, height } = this.scale;

    // Load best score from localStorage
    const savedBest = localStorage.getItem("monsters-up-best");
    this.bestScore = savedBest ? parseInt(savedBest, 10) : 0;

    // Set initial background
    this.cameras.main.setBackgroundColor(
      this.backgroundColors[this.themeIndex]
    );

    // Create player (monster)
    this.player = this.physics.add.sprite(width / 2, height - 100, "monster");
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);
    this.player.setScale(0.6);

    // Create player graphic if texture doesn't exist
    if (!this.textures.exists("monster")) {
      const graphics = this.add.graphics();
      graphics.fillStyle(0x8b4513, 1);
      graphics.fillCircle(0, 0, 25);
      graphics.fillStyle(0xff0000, 1);
      graphics.fillCircle(-8, -8, 4);
      graphics.fillCircle(8, -8, 4);
      graphics.fillStyle(0xffffff, 1);
      graphics.fillEllipse(0, 5, 12, 8);
      graphics.generateTexture("monster", 50, 50);
      graphics.destroy();
    }

    // Create platforms group
    this.platforms = this.physics.add.staticGroup();

    // Create stars group
    this.stars = this.physics.add.group();

    // Create initial platform
    this.spawnPlatform(height - 50);

    // Collisions
    this.physics.add.collider(
      this.player,
      this.platforms,
      (obj1, obj2) => {
        const player = obj1 as Phaser.Physics.Arcade.Sprite;
        const platform = obj2 as Phaser.Physics.Arcade.Sprite;
        this.handleLanding(player, platform);
      },
      undefined,
      this
    );
    this.physics.add.overlap(
      this.player,
      this.stars,
      (obj1, obj2) => {
        const player = obj1 as Phaser.Physics.Arcade.Sprite;
        const star = obj2 as Phaser.Physics.Arcade.Sprite;
        this.collectStar(player, star);
      },
      undefined,
      this
    );

    // UI
    this.scoreText = this.add.text(10, 10, "Score: 0", {
      fontSize: "24px",
      color: "#000",
      fontStyle: "bold",
    });
    this.scoreText.setScrollFactor(0);

    this.bestScoreText = this.add.text(10, 40, `Best: ${this.bestScore}`, {
      fontSize: "18px",
      color: "#666",
    });
    this.bestScoreText.setScrollFactor(0);

    // Start screen
    this.gameOverText = this.add.text(
      width / 2,
      height / 2 - 50,
      "MONSTERS UP!",
      {
        fontSize: "48px",
        color: "#fff",
        fontStyle: "bold",
      }
    );
    this.gameOverText.setOrigin(0.5);
    this.gameOverText.setScrollFactor(0);

    this.restartText = this.add.text(
      width / 2,
      height / 2 + 20,
      "Tap/Click or Press SPACE to Start",
      {
        fontSize: "20px",
        color: "#fff",
      }
    );
    this.restartText.setOrigin(0.5);
    this.restartText.setScrollFactor(0);

    // Input
    this.input.on("pointerdown", () => this.handleInput());
    this.input.keyboard?.on("keydown-SPACE", () => this.handleInput());

    // Camera setup
    this.lastY = this.player.y;
    this.cameras.main.setBounds(0, 0, width, Number.MAX_SAFE_INTEGER);
    this.cameras.main.startFollow(this.player, false, 0.1, 0.1);
    this.cameras.main.setDeadzone(0, 200);
  }

  private handleInput() {
    if (this.state === GameState.START) {
      this.startGame();
      this.state = GameState.PLAYING;
      if (this.gameOverText) this.gameOverText.setVisible(false);
      if (this.restartText) this.restartText.setVisible(false);
    } else if (
      this.state === GameState.PLAYING &&
      this.player?.body?.touching.down
    ) {
      this.jump();
    } else if (this.state === GameState.GAMEOVER) {
      this.scene.restart();
    }
  }

  private jump() {
    if (!this.player) return;
    this.player.setVelocityY(-550);
    // Jump sound would go here
  }

  private handleLanding(
    player: Phaser.Physics.Arcade.Sprite,
    platform: Phaser.Physics.Arcade.Sprite
  ) {
    if (!this.player || !this.gameActive) return;

    const playerSprite = player;
    const platformSprite = platform;

    const offset = Math.abs(playerSprite.x - platformSprite.x);
    const perfectThreshold = 20;
    const safeZone =
      platformSprite.displayWidth / 2 - playerSprite.displayWidth / 2;

    if (offset < perfectThreshold) {
      // Perfect landing!
      this.addPerfectEffect(playerSprite);
      this.updateScore(2);
      this.perfectCount++;
      this.platformsClimbed++;
    } else if (offset <= safeZone) {
      // Safe landing
      this.updateScore(1);
      this.wobblePlatform(platformSprite);
      this.platformsClimbed++;
    } else {
      // Off platform - game over
      this.handleGameOver();
      return;
    }

    this.updateScoreText();
  }

  private addPerfectEffect(player: Phaser.Physics.Arcade.Sprite) {
    // Perfect text
    const text = this.add.text(player.x, player.y - 40, "Perfect!", {
      fontSize: "18px",
      color: "#fff",
      fontStyle: "bold",
      stroke: "#000",
      strokeThickness: 3,
    });
    text.setOrigin(0.5);

    this.tweens.add({
      targets: text,
      y: text.y - 30,
      alpha: 0,
      duration: 600,
      onComplete: () => text.destroy(),
    });

    // Player bounce animation
    this.tweens.add({
      targets: player,
      scaleX: 0.8,
      scaleY: 1.2,
      yoyo: true,
      duration: 100,
    });

    // Camera flash
    this.cameras.main.flash(150, 255, 255, 255, false);

    // Particles effect
    const particles = this.add.particles(player.x, player.y, "star", {
      speed: { min: 50, max: 100 },
      scale: { start: 0.5, end: 0 },
      lifespan: 500,
      quantity: 10,
    });
    this.time.delayedCall(500, () => particles.destroy());
  }

  private wobblePlatform(platform: Phaser.Physics.Arcade.Sprite) {
    this.tweens.add({
      targets: platform,
      angle: 5,
      yoyo: true,
      repeat: 2,
      duration: 100,
    });
  }

  private spawnPlatform(yOffset: number) {
    if (!this.platforms) return;

    const x = Phaser.Math.Between(80, this.scale.width - 80);
    const platform = this.platforms.create(x, yOffset, "platform");

    // Create platform graphic if texture doesn't exist
    if (!this.textures.exists("platform")) {
      const graphics = this.add.graphics();
      graphics.fillStyle(0x8b4513, 1);
      graphics.fillRoundedRect(-50, -10, 100, 20, 5);
      graphics.generateTexture("platform", 100, 20);
      graphics.destroy();
    }

    platform.refreshBody();

    // Random star spawn (every 5th platform)
    if (this.platformsClimbed % 5 === 0 && this.stars) {
      const star = this.stars.create(x, yOffset - 40, "star");
      star.setScale(0.6);

      // Create star graphic if texture doesn't exist
      if (!this.textures.exists("star")) {
        const graphics = this.add.graphics();
        graphics.fillStyle(0xffd700, 1);
        // Draw a star shape manually
        const points = 5;
        const outerRadius = 10;
        const innerRadius = 5;
        graphics.beginPath();
        for (let i = 0; i < points * 2; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          const angle = (i * Math.PI) / points;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          if (i === 0) {
            graphics.moveTo(x, y);
          } else {
            graphics.lineTo(x, y);
          }
        }
        graphics.closePath();
        graphics.fillPath();
        graphics.generateTexture("star", 20, 20);
        graphics.destroy();
      }
    }
  }

  private collectStar(
    player: Phaser.Physics.Arcade.Sprite,
    star: Phaser.Physics.Arcade.Sprite
  ) {
    star.destroy();
    this.updateScore(3);
    this.updateScoreText();
    // Collect sound would go here
  }

  private spawnNextPlatform() {
    const newY = this.lastY - 120;
    this.spawnPlatform(newY);

    // Destroy lowest platform
    if (this.platforms) {
      const lowest = this.platforms
        .getChildren()
        .find(
          (p) =>
            (p as Phaser.Physics.Arcade.Sprite).y >
            this.cameras.main.scrollY + 800
        );
      if (lowest) {
        (lowest as Phaser.Physics.Arcade.Sprite).destroy();
      }
    }

    // Change theme every 10 platforms
    if (this.platformsClimbed % 10 === 0 && this.platformsClimbed > 0) {
      this.themeIndex = (this.themeIndex + 1) % this.backgroundColors.length;
      this.cameras.main.setBackgroundColor(
        this.backgroundColors[this.themeIndex]
      );
    }
  }

  update() {
    if (!this.player || this.state !== GameState.PLAYING || !this.gameActive)
      return;

    // Camera follows player upward
    if (this.player.y < this.lastY - 120) {
      this.lastY = this.player.y;
      this.cameras.main.scrollY = this.player.y - 300;
      this.spawnNextPlatform();
    }

    // Game over if player falls off screen
    if (this.player.y > this.cameras.main.scrollY + 720) {
      this.handleGameOver();
    }
  }

  private updateScoreText() {
    if (this.scoreText) {
      this.scoreText.setText(`Score: ${this.score}`);
    }
  }

  private handleGameOver() {
    if (this.state === GameState.GAMEOVER) return;

    this.state = GameState.GAMEOVER;
    this.gameActive = false;
    this.physics.pause();

    // Update best score
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      localStorage.setItem("monsters-up-best", this.bestScore.toString());
    }

    const level = Math.floor(this.score / 100) + 1;

    // Game over UI
    const { width } = this.scale;
    this.gameOverText = this.add.text(
      width / 2,
      this.cameras.main.scrollY + 300,
      "Game Over",
      {
        fontSize: "48px",
        color: "#ff0000",
        fontStyle: "bold",
        stroke: "#000",
        strokeThickness: 4,
      }
    );
    this.gameOverText.setOrigin(0.5);
    this.gameOverText.setScrollFactor(0);

    this.restartText = this.add.text(
      width / 2,
      this.cameras.main.scrollY + 380,
      "Tap to Restart",
      {
        fontSize: "24px",
        color: "#fff",
        fontStyle: "bold",
      }
    );
    this.restartText.setOrigin(0.5);
    this.restartText.setScrollFactor(0);

    // Update best score display
    if (this.bestScoreText) {
      this.bestScoreText.setText(`Best: ${this.bestScore}`);
    }

    // End game and save using parent's protected method
    super.endGame(level, {
      platformsClimbed: this.platformsClimbed,
      perfectCount: this.perfectCount,
      bestScore: this.bestScore,
    });
  }
}

export const monstersUpGameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 480,
  height: 640,
  backgroundColor: "#87ceeb",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 800 },
      debug: false,
    },
  },
  scene: MonstersUpScene,
};
