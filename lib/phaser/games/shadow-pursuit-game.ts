import * as Phaser from "phaser";
import type { GameResult } from "@/lib/types/game.types";

export class ShadowPursuitScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Image;
  private chaser!: Phaser.GameObjects.Image;
  private cursor!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private playerSpeed: number = 200;
  private chaserSpeed: number = 120; // Base speed
  private baseChaserSpeed: number = 120;
  private speedIncrement: number = 20; // Speed increase per level
  private gameStartTime: number = 0;
  private survivalTime: number = 0;
  private timerText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private currentLevel: number = 1;
  private lastLevelUpTime: number = 0;
  private levelUpInterval: number = 10; // Level up every 10 seconds
  private gameState: "READY" | "PLAYING" | "GAME_OVER" = "READY";
  private gameStarted: boolean = false;
  private startPromptText!: Phaser.GameObjects.Text;
  private arenaBounds!: Phaser.GameObjects.Rectangle;
  private arenaWidth: number = 800;
  private arenaHeight: number = 600;
  private playerRadius: number = 20; // Reduced hitbox
  private chaserRadius: number = 20; // Reduced hitbox
  private cameraShake: boolean = false;
  private dangerZone: number = 100;
  private joystickDirection: { x: number; y: number } = { x: 0, y: 0 };
  private isMobile: boolean = false;
  private lastUIUpdateTime: number = 0;
  private isRestarting: boolean = false;
  private audioUnlocked: boolean = false;
  private readonly WORLD_MARGIN: number = 50; // Consistent margin for world bounds and clamping

  constructor() {
    super({ key: "ShadowPursuitScene" });
  }

  unlockAudio() {
    if (this.audioUnlocked) return;

    try {
      const AudioContextClass =
        window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      const audioContext = new AudioContextClass();
      if (audioContext.state === "suspended") {
        audioContext
          .resume()
          .then(() => {
            this.audioUnlocked = true;
          })
          .catch(() => {});
      } else {
        this.audioUnlocked = true;
      }
    } catch (error) {
      console.warn("Audio unlock failed:", error);
    }
  }

  preload() {
    this.load.image("thief", "/thief.png");
    this.load.image("police", "/police.png");
  }

  create() {
    this.isRestarting = false;
    const { width, height } = this.scale;

    this.isMobile = this.sys.game.device.input.touch || width < 768;

    // Create arena background
    this.arenaBounds = this.add.rectangle(
      width / 2,
      height / 2,
      this.arenaWidth,
      this.arenaHeight,
      0x1a1a2e,
      0.8
    );
    this.arenaBounds.setStrokeStyle(2, 0x4a90e2, 0.5);

    // Create player (Thief) - Reduced size
    // Ensure spawn position is within bounds on all screen sizes
    const playerStartX = Math.max(this.WORLD_MARGIN + 50, Math.min(100, width - this.WORLD_MARGIN - 50));
    const playerStartY = Math.max(this.WORLD_MARGIN + 50, Math.min(100, height - this.WORLD_MARGIN - 50));
    this.player = this.add.image(playerStartX, playerStartY, "thief");
    this.player.setScale(0.1); // Reduced from 0.2 to 0.1
    this.player.setOrigin(0.5, 0.5);
    this.player.setTint(0x00d4ff);

    // Create chaser (Police) - Reduced size
    // Ensure spawn position is within bounds on all screen sizes
    const chaserStartX = Math.max(this.WORLD_MARGIN + 50, Math.min(width - 150, width - this.WORLD_MARGIN - 50));
    const chaserStartY = Math.max(this.WORLD_MARGIN + 50, Math.min(height - 150, height - this.WORLD_MARGIN - 50));
    this.chaser = this.add.image(chaserStartX, chaserStartY, "police");
    this.chaser.setScale(0.1); // Reduced from 0.2 to 0.1
    this.chaser.setOrigin(0.5, 0.5);
    this.chaser.setTint(0xff4444);

    // Input controls
    if (!this.isMobile) {
      if (this.input.keyboard) {
        this.cursor = this.input.keyboard.createCursorKeys();
        this.wasdKeys = this.input.keyboard.addKeys("W,A,S,D") as {
          W: Phaser.Input.Keyboard.Key;
          A: Phaser.Input.Keyboard.Key;
          S: Phaser.Input.Keyboard.Key;
          D: Phaser.Input.Keyboard.Key;
        };
      }
    } else {
      this.cursor = {
        up: { isDown: false } as Phaser.Input.Keyboard.Key,
        down: { isDown: false } as Phaser.Input.Keyboard.Key,
        left: { isDown: false } as Phaser.Input.Keyboard.Key,
        right: { isDown: false } as Phaser.Input.Keyboard.Key,
        shift: { isDown: false } as Phaser.Input.Keyboard.Key,
        space: { isDown: false } as Phaser.Input.Keyboard.Key,
      };
      this.wasdKeys = {
        W: { isDown: false } as Phaser.Input.Keyboard.Key,
        A: { isDown: false } as Phaser.Input.Keyboard.Key,
        S: { isDown: false } as Phaser.Input.Keyboard.Key,
        D: { isDown: false } as Phaser.Input.Keyboard.Key,
      };
    }

    // UI Text
    this.timerText = this.add
      .text(width / 2, 30, "Survival Time: 0:00", {
        fontSize: "32px",
        color: "#ffffff",
        fontFamily: "Arial",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.scoreText = this.add
      .text(width / 2, 70, "Score: 0.0s", {
        fontSize: "24px",
        color: "#4a90e2",
        fontFamily: "Arial",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    // Level display
    this.levelText = this.add
      .text(20, 20, "Level: 1", {
        fontSize: "28px",
        color: "#ffd700",
        fontFamily: "Arial",
        stroke: "#000000",
        strokeThickness: 3,
        fontStyle: "bold",
      })
      .setOrigin(0, 0);

    // Show start prompt
    this.startPromptText = this.add
      .text(width / 2, height / 2, "Press any key to start", {
        fontSize: "36px",
        color: "#ffffff",
        fontFamily: "Arial",
        stroke: "#000000",
        strokeThickness: 4,
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(300);

    const startGame = () => {
      if (!this.gameStarted && this.gameState === "READY") {
        this.gameStarted = true;
        this.gameState = "PLAYING";
        this.gameStartTime = Date.now();
        this.survivalTime = 0;
        this.lastLevelUpTime = 0;
        this.currentLevel = 1;

        if (this.startPromptText) {
          this.startPromptText.setVisible(false);
        }

        this.unlockAudio();
      }
    };

    // Clean up previous listeners
    this.input.off("pointerdown");
    if (this.input.keyboard) {
      this.input.keyboard.off("keydown");
    }

    // Add new listeners
    if (this.input.keyboard) {
      this.input.keyboard.once("keydown", startGame, this);
    }
    this.input.once("pointerdown", startGame, this);

    // Physics
    this.physics.add.existing(this.player, false);
    this.physics.add.existing(this.chaser, false);

    // Set circular hitboxes to match smaller sprite size
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    const chaserBody = this.chaser.body as Phaser.Physics.Arcade.Body;
    
    playerBody.setCircle(this.playerRadius); // Smaller circular hitbox
    chaserBody.setCircle(this.chaserRadius); // Smaller circular hitbox

    // Set world bounds to match actual canvas size (important for mobile scaling)
    const boundsWidth = width - this.WORLD_MARGIN * 2;
    const boundsHeight = height - this.WORLD_MARGIN * 2;
    
    this.physics.world.setBounds(
      this.WORLD_MARGIN,
      this.WORLD_MARGIN,
      boundsWidth,
      boundsHeight
    );

    playerBody.setCollideWorldBounds(true);
    chaserBody.setCollideWorldBounds(true);

    // Collision detection - player vs chaser only (obstacles removed)
    this.physics.add.overlap(
      this.player,
      this.chaser,
      this.onCaught,
      undefined,
      this
    );

    // Initial state
    this.gameState = "READY";
    this.gameStarted = false;
    this.gameStartTime = Date.now();
    this.survivalTime = 0;
    this.currentLevel = 1;
    this.lastLevelUpTime = 0;

    // Ensure both are stationary before game starts
    playerBody.setVelocity(0, 0);
    chaserBody.setVelocity(0, 0);

    // Emit scene-ready event
    this.events.emit("scene-ready");
    this.events.emit("game-ready");

    // Unlock audio on first interaction
    this.input.once("pointerdown", () => {
      this.sound.unlock();
      this.unlockAudio();
    });
  }


  update() {
    if (!this.gameStarted || this.gameState !== "PLAYING") return;

    // Update survival time
    const currentTime = Date.now();
    this.survivalTime = (currentTime - this.gameStartTime) / 1000;

    // Update timer display
    const minutes = Math.floor(this.survivalTime / 60);
    const seconds = (this.survivalTime % 60).toFixed(1);
    this.timerText.setText(
      `Survival Time: ${minutes}:${seconds.padStart(4, "0")}`
    );
    this.scoreText.setText(`Score: ${this.survivalTime.toFixed(1)}s`);

    // Level progression - every 10 seconds
    const currentLevelInterval = Math.floor(
      this.survivalTime / this.levelUpInterval
    );
    if (currentLevelInterval > this.lastLevelUpTime) {
      this.lastLevelUpTime = currentLevelInterval;
      this.currentLevel++;
      this.chaserSpeed =
        this.baseChaserSpeed + (this.currentLevel - 1) * this.speedIncrement;

      // Update level UI
      this.levelText.setText(`Level: ${this.currentLevel}`);

      // Visual feedback for level up
      this.cameras.main.flash(200, 255, 215, 0, false);
    }

    // Player movement
    if (this.gameStarted) {
      const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
      let velocityX = 0;
      let velocityY = 0;

      if (
        this.isMobile &&
        (this.joystickDirection.x !== 0 || this.joystickDirection.y !== 0)
      ) {
        velocityX = this.joystickDirection.x * this.playerSpeed;
        velocityY = this.joystickDirection.y * this.playerSpeed;
      } else if (!this.isMobile) {
        if (this.cursor.left.isDown || this.wasdKeys.A.isDown) {
          velocityX = -this.playerSpeed;
        } else if (this.cursor.right.isDown || this.wasdKeys.D.isDown) {
          velocityX = this.playerSpeed;
        }

        if (this.cursor.up.isDown || this.wasdKeys.W.isDown) {
          velocityY = -this.playerSpeed;
        } else if (this.cursor.down.isDown || this.wasdKeys.S.isDown) {
          velocityY = this.playerSpeed;
        }

        if (velocityX !== 0 && velocityY !== 0) {
          velocityX *= 0.707;
          velocityY *= 0.707;
        }
      }

      playerBody.setVelocity(velocityX, velocityY);
      
      // Additional boundary clamping for mobile (ensures no overflow)
      if (this.isMobile) {
        const { width, height } = this.scale;
        const minX = this.WORLD_MARGIN + this.playerRadius;
        const maxX = width - this.WORLD_MARGIN - this.playerRadius;
        const minY = this.WORLD_MARGIN + this.playerRadius;
        const maxY = height - this.WORLD_MARGIN - this.playerRadius;
        
        this.player.x = Phaser.Math.Clamp(this.player.x, minX, maxX);
        this.player.y = Phaser.Math.Clamp(this.player.y, minY, maxY);
      }
    }

    // Chaser AI - moves directly toward player (no obstacles)
    if (this.gameStarted) {
      const chaserBody = this.chaser.body as Phaser.Physics.Arcade.Body;
      const dx = this.player.x - this.chaser.x;
      const dy = this.player.y - this.chaser.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 0) {
        const normalizedX = dx / distance;
        const normalizedY = dy / distance;

        // Direct movement toward player
        const desiredVelX = normalizedX * this.chaserSpeed;
        const desiredVelY = normalizedY * this.chaserSpeed;

        chaserBody.setVelocity(desiredVelX, desiredVelY);
      }
      
      // Additional boundary clamping for mobile (ensures no overflow)
      if (this.isMobile) {
        const { width, height } = this.scale;
        const minX = this.WORLD_MARGIN + this.chaserRadius;
        const maxX = width - this.WORLD_MARGIN - this.chaserRadius;
        const minY = this.WORLD_MARGIN + this.chaserRadius;
        const maxY = height - this.WORLD_MARGIN - this.chaserRadius;
        
        this.chaser.x = Phaser.Math.Clamp(this.chaser.x, minX, maxX);
        this.chaser.y = Phaser.Math.Clamp(this.chaser.y, minY, maxY);
      }
    }

    // Visual feedback when chaser is close
    const distanceToChaser = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      this.chaser.x,
      this.chaser.y
    );

    if (distanceToChaser < this.dangerZone) {
      const dangerIntensity = 1 - distanceToChaser / this.dangerZone;
      this.player.setTint(
        Phaser.Display.Color.GetColor(
          255,
          68 - Math.floor(dangerIntensity * 100),
          68 - Math.floor(dangerIntensity * 100)
        )
      );

      if (distanceToChaser < this.dangerZone / 2 && !this.cameraShake) {
        this.cameraShake = true;
        this.cameras.main.shake(100, 0.01);
        setTimeout(() => {
          this.cameraShake = false;
        }, 100);
      }
    } else {
      this.player.clearTint();
      this.player.setTint(0x00d4ff);
    }

    // Emit UI update
    const now = Date.now();
    if (!this.lastUIUpdateTime || now - this.lastUIUpdateTime > 100) {
      this.lastUIUpdateTime = now;
      this.events.emit("ui-update", {
        survivalTime: this.survivalTime,
        chaserSpeed: this.chaserSpeed,
        distance: distanceToChaser,
        level: this.currentLevel,
      });
    }
  }

  setJoystickDirection(direction: { x: number; y: number }) {
    this.joystickDirection = direction;
  }

  onCaught = () => {
    if (this.gameState === "GAME_OVER") return;

    this.gameState = "GAME_OVER";

    // Stop all movement
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    const chaserBody = this.chaser.body as Phaser.Physics.Arcade.Body;
    playerBody.setVelocity(0, 0);
    chaserBody.setVelocity(0, 0);

    // Flash effect
    this.cameras.main.flash(300, 255, 0, 0);
    this.cameras.main.shake(500, 0.02);

    // Show "CAUGHT!" text
    const { width, height } = this.scale;
    const caughtText = this.add
      .text(width / 2, height / 2 - 80, "CAUGHT!", {
        fontSize: "64px",
        color: "#ff0000",
        fontFamily: "Arial",
        stroke: "#000000",
        strokeThickness: 6,
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Show level reached
    const levelReachedText = this.add
      .text(width / 2, height / 2, `Level Reached: ${this.currentLevel}`, {
        fontSize: "36px",
        color: "#ffd700",
        fontFamily: "Arial",
        stroke: "#000000",
        strokeThickness: 4,
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Animate caught text
    this.tweens.add({
      targets: caughtText,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 300,
      yoyo: true,
      repeat: 1,
    });

    // Animate level text
    this.tweens.add({
      targets: levelReachedText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 300,
      delay: 200,
      yoyo: true,
      repeat: 1,
    });

    // Create game result
    const duration = Math.floor(this.survivalTime);
    const result: GameResult = {
      score: Math.round(this.survivalTime * 10) / 10,
      accuracy: 100,
      reactionTimes: [],
      duration,
      level: this.currentLevel,
      metadata: {
        survivalTime: this.survivalTime,
        level_reached: this.currentLevel,
        final_police_speed: this.chaserSpeed,
        obstacles_enabled: false,
        gameName: "shadow-pursuit",
        game_type: "pursuit-follow",
      },
    };

    // Delay game end event
    this.time.delayedCall(1000, () => {
      this.events.emit("game-end", result);
      this.game.events.emit("game-end", result);
    });
  };

  startGame() {
    if (this.gameState === "READY" && !this.gameStarted) {
      this.gameStarted = true;
      this.gameState = "PLAYING";
      this.gameStartTime = Date.now();
      this.survivalTime = 0;
      this.currentLevel = 1;
      this.lastLevelUpTime = 0;

      if (this.startPromptText) {
        this.startPromptText.setVisible(false);
      }

      if (this.chaser) {
        this.chaser.clearTint();
        this.chaser.setTint(0xff4444);
        this.chaser.setScale(0.1); // Reduced from 0.2 to 0.1
      }
    }
  }

  restart() {
    if (this.isRestarting) return;
    this.isRestarting = true;
    this.scene.restart();
  }
}
