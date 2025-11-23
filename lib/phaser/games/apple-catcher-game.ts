import * as Phaser from "phaser";
import type { GameResult as GameResultType } from "@/lib/types/game.types";

const sizes = {
  width: 500,
  height: 500,
};

const speedDown = 300;

export class AppleCatcherScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Image;
  private cursor!: Phaser.Types.Input.Keyboard.CursorKeys;
  private playerSpeed: number = speedDown + 50;
  private target!: Phaser.Physics.Arcade.Image;
  private points: number = 0;
  private textScore!: Phaser.GameObjects.Text;
  private textTime!: Phaser.GameObjects.Text;
  private timedEvent!: Phaser.Time.TimerEvent;
  private remainingTime: number = 0;
  private coinMusic!: Phaser.Sound.BaseSound;
  private bgMusic!: Phaser.Sound.BaseSound;
  private emitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private gameState:
    | "INITIALIZING"
    | "READY"
    | "PLAYING"
    | "PAUSED"
    | "GAME_OVER" = "INITIALIZING";
  private gameStartTime: number = 0;
  private isMobileOrTablet: boolean = false;
  private isDragging: boolean = false;
  private touchStartX: number = 0;
  private keyboardKeys: {
    left?: Phaser.Input.Keyboard.Key;
    right?: Phaser.Input.Keyboard.Key;
    a?: Phaser.Input.Keyboard.Key;
    d?: Phaser.Input.Keyboard.Key;
  } = {};
  private touchHandlers: {
    pointerdown?: (pointer: Phaser.Input.Pointer) => void;
    pointermove?: (pointer: Phaser.Input.Pointer) => void;
    pointerup?: () => void;
  } = {};
  private resizeHandler?: () => void;

  constructor() {
    super({ key: "AppleCatcherScene" });
  }

  preload() {
    this.load.image("bg", "/games/apple-catcher/assets/bg.png");
    this.load.image("basket", "/games/apple-catcher/assets/basket.png");
    this.load.image("apple", "/games/apple-catcher/assets/apple.png");
    this.load.image("money", "/games/apple-catcher/assets/money.png");
    this.load.audio("coin", "/games/apple-catcher/assets/coin.mp3");
    this.load.audio("bgMusic", "/games/apple-catcher/assets/bgMusic.mp3");
  }

  create() {
    this.scene.pause("AppleCatcherScene");

    // Detect device type using comprehensive detection
    this.detectDeviceType();

    this.coinMusic = this.sound.add("coin");
    this.bgMusic = this.sound.add("bgMusic");
    this.bgMusic.play();

    this.add.image(0, 0, "bg").setOrigin(0, 0);

    this.player = this.physics.add
      .image(0, sizes.height - 100, "basket")
      .setOrigin(0, 0);
    this.player.setImmovable(true);
    // allowGravity is read-only, setImmovable should handle gravity
    this.player.setCollideWorldBounds(true);
    this.player
      .setSize(
        this.player.width - this.player.width / 4,
        this.player.height / 6
      )
      .setOffset(
        this.player.width / 10,
        this.player.height - this.player.height / 10
      );

    this.target = this.physics.add
      .image(this.getRandomX(), 0, "apple")
      .setOrigin(0, 0);
    this.target.setMaxVelocity(0, speedDown);

    this.physics.add.overlap(
      this.target,
      this.player,
      this.targetHit,
      undefined,
      this
    );

    // Setup controls based on device type
    this.setupControls();

    // Listen for window resize to update control mode
    this.setupResizeListener();

    this.textScore = this.add.text(sizes.width - 120, 10, "Score:0", {
      font: "25px Arial",
      color: "#000000",
    });
    this.textTime = this.add.text(10, 10, "Remaining Time: 00", {
      font: "25px Arial",
      color: "#000000",
    });

    this.timedEvent = this.time.delayedCall(30000, this.gameOver, [], this);

    this.emitter = this.add.particles(0, 0, "money", {
      speed: 100,
      gravityY: speedDown - 200,
      scale: 0.04,
      duration: 100,
      emitting: false,
    });
    this.emitter.startFollow(
      this.player,
      this.player.width / 2,
      this.player.height / 2,
      true
    );

    this.gameState = "READY";
    this.gameStartTime = Date.now();
    this.events.emit("game-ready");
  }

  /**
   * Detect device type based on screen size and touch capability
   */
  detectDeviceType() {
    const hasTouch =
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      ((navigator as Navigator & { msMaxTouchPoints?: number }).msMaxTouchPoints ?? 0) > 0;
    const isSmallScreen = window.innerWidth < 1024;

    // Mobile/tablet if: has touch AND (small screen OR touch device)
    this.isMobileOrTablet =
      hasTouch && (isSmallScreen || this.sys.game.device.input.touch);

    // Also check Phaser's device detection as fallback
    if (!this.isMobileOrTablet) {
      this.isMobileOrTablet =
        this.sys.game.device.os.android ||
        this.sys.game.device.os.iOS ||
        this.sys.game.device.os.windowsPhone;
    }
  }

  /**
   * Setup controls based on device type
   */
  setupControls() {
    // Remove existing controls first
    this.removeControls();

    if (this.isMobileOrTablet) {
      this.setupTouchControls();
    } else {
      this.setupKeyboardControls();
    }
  }

  /**
   * Setup keyboard controls for desktop/laptop
   */
  setupKeyboardControls() {
    if (!this.input.keyboard) return;

    // Create cursor keys (arrow keys)
    this.cursor = this.input.keyboard.createCursorKeys();

    // Add A and D keys for alternative controls
    this.keyboardKeys.a = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.A
    );
    this.keyboardKeys.d = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.D
    );
  }

  /**
   * Setup touch/drag controls for mobile/tablet
   */
  setupTouchControls() {
    // Handle touch start
    this.touchHandlers.pointerdown = (pointer: Phaser.Input.Pointer) => {
      if (this.gameState === "PLAYING" || this.gameState === "READY") {
        this.isDragging = true;
        this.touchStartX = pointer.x;
        this.updatePlayerPosition(pointer.x);
      }
    };

    // Handle touch move (dragging)
    this.touchHandlers.pointermove = (pointer: Phaser.Input.Pointer) => {
      if (
        this.isDragging &&
        (this.gameState === "PLAYING" || this.gameState === "READY")
      ) {
        this.updatePlayerPosition(pointer.x);
      }
    };

    // Handle touch end
    this.touchHandlers.pointerup = () => {
      this.isDragging = false;
      if (this.gameState === "PLAYING" || this.gameState === "READY") {
        this.player.setVelocityX(0);
      }
    };

    // Attach event listeners
    this.input.on("pointerdown", this.touchHandlers.pointerdown, this);
    this.input.on("pointermove", this.touchHandlers.pointermove, this);
    this.input.on("pointerup", this.touchHandlers.pointerup, this);
  }

  /**
   * Remove all control handlers to prevent conflicts
   */
  removeControls() {
    // Remove keyboard controls
    if (this.cursor) {
      this.cursor = null as unknown as Phaser.Types.Input.Keyboard.CursorKeys;
    }
    if (this.keyboardKeys.a) {
      this.input.keyboard?.removeKey(this.keyboardKeys.a);
      this.keyboardKeys.a = undefined;
    }
    if (this.keyboardKeys.d) {
      this.input.keyboard?.removeKey(this.keyboardKeys.d);
      this.keyboardKeys.d = undefined;
    }

    // Remove touch controls
    if (this.touchHandlers.pointerdown) {
      this.input.off("pointerdown", this.touchHandlers.pointerdown, this);
      this.touchHandlers.pointerdown = undefined;
    }
    if (this.touchHandlers.pointermove) {
      this.input.off("pointermove", this.touchHandlers.pointermove, this);
      this.touchHandlers.pointermove = undefined;
    }
    if (this.touchHandlers.pointerup) {
      this.input.off("pointerup", this.touchHandlers.pointerup, this);
      this.touchHandlers.pointerup = undefined;
    }

    // Reset dragging state
    this.isDragging = false;
    if (this.player) {
      this.player.setVelocityX(0);
    }
  }

  /**
   * Setup window resize listener to update control mode
   */
  setupResizeListener() {
    this.resizeHandler = () => {
      const wasMobile = this.isMobileOrTablet;
      this.detectDeviceType();

      // Only re-setup controls if device type changed
      if (wasMobile !== this.isMobileOrTablet) {
        this.setupControls();
      }
    };

    window.addEventListener("resize", this.resizeHandler);
  }

  updatePlayerPosition(x: number) {
    // Clamp x position to game bounds
    const clampedX = Phaser.Math.Clamp(x, 0, sizes.width - this.player.width);

    // Use smooth movement for better feel
    const targetX = clampedX;
    const currentX = this.player.x;
    const diff = targetX - currentX;

    // Apply velocity based on distance for smooth movement
    // Match keyboard speed for consistent feel
    const speedMultiplier = 8; // Adjusted to match keyboard speed feel
    if (Math.abs(diff) > 2) {
      this.player.setVelocityX(diff * speedMultiplier);
    } else {
      this.player.setX(targetX);
      this.player.setVelocityX(0);
    }
  }

  update() {
    if (this.gameState !== "PLAYING" && this.gameState !== "READY") return;

    this.remainingTime = this.timedEvent.getRemainingSeconds();
    this.textTime.setText(
      `Remaining Time: ${Math.round(this.remainingTime).toString()}`
    );

    if (this.target.y >= sizes.height) {
      this.target.setY(0);
      this.target.setX(this.getRandomX());
    }

    // Only use keyboard controls on desktop (non-mobile/tablet)
    if (!this.isMobileOrTablet) {
      let movingLeft = false;
      let movingRight = false;

      // Check arrow keys
      if (this.cursor) {
        const { left, right } = this.cursor;
        movingLeft = left.isDown;
        movingRight = right.isDown;
      }

      // Check A/D keys (alternative controls)
      if (this.keyboardKeys.a?.isDown) {
        movingLeft = true;
      }
      if (this.keyboardKeys.d?.isDown) {
        movingRight = true;
      }

      // Apply movement
      if (movingLeft) {
        this.player.setVelocityX(-this.playerSpeed);
      } else if (movingRight) {
        this.player.setVelocityX(this.playerSpeed);
      } else {
        this.player.setVelocityX(0);
      }
    }
    // Touch/drag controls are handled in setupTouchControls callbacks
  }

  getRandomX() {
    return Math.floor(Math.random() * 480);
  }

  targetHit() {
    this.coinMusic.play();
    this.emitter.start();
    this.target.setY(0);
    this.target.setX(this.getRandomX());
    this.points++;
    this.textScore.setText(`Score: ${this.points}`);

    // Emit UI update
    this.events.emit("ui-update", {
      score: this.points,
      remainingTime: Math.round(this.remainingTime),
    });
  }

  gameOver() {
    if (this.gameState === "GAME_OVER") return;

    this.gameState = "GAME_OVER";
    this.bgMusic.stop();

    const duration = Math.floor((Date.now() - this.gameStartTime) / 1000);
    const won = this.points >= 10;

    // Create result compatible with both type definitions
    const result: GameResultType & { reaction_time?: number | number[] } = {
      score: this.points,
      accuracy: won ? 100 : (this.points / 10) * 100,
      reactionTimes: [], // For lib/types/game.types.ts compatibility
      reaction_time: undefined, // For hooks/useGame.ts compatibility
      duration,
      level: Math.floor(this.points / 10) + 1,
      metadata: {
        points: this.points,
        won: won,
        gameName: "apple-catcher",
      },
    };

    this.events.emit("game-end", result);
    this.game.events.emit("game-end", result);
  }

  startGame() {
    if (this.gameState === "READY") {
      this.scene.resume("AppleCatcherScene");
      this.gameState = "PLAYING";
    }
  }

  restart() {
    // Reset game state
    this.points = 0;
    this.textScore.setText("Score:0");
    this.target.setY(0);
    this.target.setX(this.getRandomX());
    this.player.setX(0);
    this.player.setVelocityX(0);
    this.isDragging = false;

    // Reset timer
    if (this.timedEvent) {
      this.timedEvent.destroy();
    }
    this.timedEvent = this.time.delayedCall(30000, this.gameOver, [], this);

    // Reset game state
    this.gameState = "READY";
    this.gameStartTime = Date.now();
    this.scene.pause("AppleCatcherScene");

    // Restart music
    if (this.bgMusic && !this.bgMusic.isPlaying) {
      this.bgMusic.play();
    }

    this.events.emit("game-ready");
  }

  /**
   * Cleanup when scene is destroyed
   */
  destroy() {
    // Remove resize listener
    if (this.resizeHandler) {
      window.removeEventListener("resize", this.resizeHandler);
      this.resizeHandler = undefined;
    }

    // Remove all controls
    this.removeControls();

    // Scene cleanup is handled automatically by Phaser
  }
}
