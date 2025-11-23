"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import Head from "next/head";
import { RoundCompleteModal } from "@/components/game/round-complete-modal";
import { useRoundComplete } from "@/hooks/useRoundComplete";

// Game constants
const GAME_DURATION = 30; // 30 seconds game duration

// Calculate responsive game dimensions
const getGameDimensions = () => {
  if (typeof window === "undefined") {
    return { width: 800, height: 600 };
  }

  const isMobile = window.innerWidth < 768;
  
  if (isMobile) {
    // Mobile: Use 90% of viewport width and 80% of viewport height
    const width = Math.min(window.innerWidth * 0.9, 800);
    const height = Math.min(window.innerHeight * 0.8, 600);
    return { width, height };
  }
  
  // Desktop: Use fixed dimensions
  return { width: 800, height: 600 };
};

// Physics constants for fruit trajectory
// We want fruits to reach at least 50% screen height and stay visible 0.8-1.2s
const GRAVITY = 1200; // Gravity acceleration
const MIN_AIRTIME = 0.8; // Minimum time visible (seconds)
const MAX_AIRTIME = 1.2; // Maximum time visible (seconds)
// Fruits naturally reach >50% height with the calculated velocities

// Difficulty settings
const DIFFICULTY: {
  easy: { maxConcurrentFruits: number; spawnRate: number; bombChance: number };
  medium: {
    maxConcurrentFruits: number;
    spawnRate: number;
    bombChance: number;
  };
  hard: { maxConcurrentFruits: number; spawnRate: number; bombChance: number };
} = {
  easy: { maxConcurrentFruits: 2, spawnRate: 1200, bombChance: 0.05 },
  medium: { maxConcurrentFruits: 4, spawnRate: 900, bombChance: 0.1 },
  hard: { maxConcurrentFruits: 6, spawnRate: 600, bombChance: 0.15 },
};

// Declare Phaser types for TypeScript
declare global {
  interface Window {
    Phaser?: typeof import("phaser");
    selectedDifficulty?: string;
  }
}

// Factory function to create the game scene class when Phaser is available
function createFruitNinjaScene(Phaser: typeof import("phaser")) {
  class FruitNinjaScene extends Phaser.Scene {
    score!: number;
    combo!: number;
    maxCombo!: number;
    lives!: number;
    timeLeft!: number;
    fruitsSliced!: number;
    totalFruits!: number;
    isGameOver!: boolean;
    spawnTimer!: Phaser.Time.TimerEvent | null;
    comboTimer!: Phaser.Time.TimerEvent | null;
    difficulty!: "easy" | "medium" | "hard";
    sliceTrail!: Array<{ x: number; y: number }>;
    fruits!: Phaser.Physics.Arcade.Group;
    bombs!: Phaser.Physics.Arcade.Group;
    sliceGraphics!: Phaser.GameObjects.Graphics;
    comboText!: Phaser.GameObjects.Text;
    scorePopups!: Phaser.GameObjects.Container;
    juiceEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
    explosionEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
    trailEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
    sparkEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
    criticalEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
    isSlicing!: boolean;
    sliceSound!: Phaser.Sound.BaseSound | null;
    bombSound!: Phaser.Sound.BaseSound | null;
    comboSound!: Phaser.Sound.BaseSound | null;
    backgroundMusic!: Phaser.Sound.BaseSound | null;
    criticalHitChance!: number;

    constructor() {
      super({ key: "FruitNinjaScene" });
      this.score = 0;
      this.combo = 0;
      this.maxCombo = 0;
      this.lives = 3;
      this.timeLeft = GAME_DURATION;
      this.fruitsSliced = 0;
      this.totalFruits = 0;
      this.isGameOver = false;
      this.spawnTimer = null;
      this.comboTimer = null;
      this.difficulty = "easy";
      this.sliceTrail = [];
      this.isSlicing = false;
      this.sliceSound = null;
      this.bombSound = null;
      this.comboSound = null;
      this.backgroundMusic = null;
      this.criticalHitChance = 0.15;
    }

    preload() {
      // Load local fruit assets from public/games/fruit-ninja/
      this.load.image("apple", "/games/fruit-ninja/apple.png");
      this.load.image("banana", "/games/fruit-ninja/banana.png");
      this.load.image("mango", "/games/fruit-ninja/mango.png");
      this.load.image("orange", "/games/fruit-ninja/orange.png");
      this.load.image("pineapple", "/games/fruit-ninja/pineapple.png");
      this.load.image("watermelon", "/games/fruit-ninja/watermelon.png");
      this.load.image("bomb", "/games/fruit-ninja/bomb.png");
    }

    init() {
      console.log("FruitNinjaScene initialized");
    }

    create() {
      console.log("FruitNinjaScene create() called");
      this.isGameOver = false;
      this.score = 0;
      this.combo = 0;
      this.maxCombo = 0;
      this.lives = 3;
      this.timeLeft = GAME_DURATION;
      this.fruitsSliced = 0;
      this.totalFruits = 0;
      this.sliceTrail = [];

      // Get actual canvas dimensions
      const { width, height } = this.scale;

      // Dark theme background
      const graphics = this.add.graphics();
      graphics.fillGradientStyle(0x0f0f1e, 0x0f0f1e, 0x1a1a2e, 0x1a1a2e, 1);
      graphics.fillRect(0, 0, width, height);
      graphics.setDepth(-1);

      this.fruits = this.physics.add.group();
      this.bombs = this.physics.add.group();

      this.createParticleEmitters();

      this.sliceGraphics = this.add.graphics();
      this.sliceGraphics.setDepth(100);

      this.input.on("pointerdown", this.onSliceStart, this);
      this.input.on("pointermove", this.onSliceMove, this);
      this.input.on("pointerup", this.onSliceEnd, this);

      this.comboText = this.add
        .text(width / 2, 100, "", {
          fontSize: "56px",
          fontFamily: "Arial Black",
          color: "#ffff00",
          stroke: "#ff0000",
          strokeThickness: 8,
          shadow: {
            blur: 15,
            color: "#000000",
            fill: true,
          },
        })
        .setOrigin(0.5)
        .setDepth(200)
        .setAlpha(0);

      this.scorePopups = this.add.container(0, 0).setDepth(150);

      window.addEventListener("startFruitNinja", ((e: CustomEvent) => {
        this.difficulty = (e.detail?.difficulty || "easy") as
          | "easy"
          | "medium"
          | "hard";
        this.startGame();
      }) as EventListener);

      window.addEventListener("restartFruitNinja", () => {
        this.scene.restart();
      });
    }

    createParticleEmitters() {
      // Create particle textures
      const particleGraphics = this.make.graphics({ x: 0, y: 0 });
      particleGraphics.fillStyle(0xffffff, 1);
      particleGraphics.fillCircle(4, 4, 4);
      particleGraphics.generateTexture("particle", 8, 8);
      particleGraphics.destroy();

      // Star particle for special effects
      const starGraphics = this.make.graphics({ x: 0, y: 0 });
      starGraphics.fillStyle(0xffffff, 1);
      // Draw a simple star shape
      starGraphics.fillCircle(4, 4, 3);
      starGraphics.generateTexture("star", 8, 8);
      starGraphics.destroy();

      // 1. Create the particle MANAGER first for juice
      const juiceParticles = this.add.particles(0, 0, "particle");
      // 2. Create the actual EMITTER (using type assertion for Phaser API)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.juiceEmitter = (juiceParticles as any).createEmitter({
        speed: { min: 100, max: 400 },
        angle: { min: 0, max: 360 },
        scale: { start: 1.2, end: 0 },
        lifespan: 800,
        gravityY: 400,
        quantity: 20,
        blendMode: "ADD",
        on: false, // important: do not emit automatically
      });

      // 1. Create the particle MANAGER first for explosion
      const explosionParticles = this.add.particles(0, 0, "particle");
      // 2. Create the actual EMITTER
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.explosionEmitter = (explosionParticles as any).createEmitter({
        speed: { min: 300, max: 600 },
        angle: { min: 0, max: 360 },
        scale: { start: 2.5, end: 0 },
        lifespan: 1000,
        gravityY: 300,
        quantity: 40,
        blendMode: "ADD",
        tint: 0xff3300,
        on: false, // important: do not emit automatically
      });

      // 1. Create the particle MANAGER first for trail
      const trailParticles = this.add.particles(0, 0, "particle");
      // 2. Create the actual EMITTER
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.trailEmitter = (trailParticles as any).createEmitter({
        speed: 0,
        scale: { start: 1, end: 0 },
        alpha: { start: 0.9, end: 0 },
        lifespan: 300,
        blendMode: "ADD",
        tint: 0xffffff,
        quantity: 2,
        frequency: 15,
        on: false, // important: do not emit automatically
      });

      // 1. Create the particle MANAGER first for spark
      const sparkParticles = this.add.particles(0, 0, "star");
      // 2. Create the actual EMITTER
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.sparkEmitter = (sparkParticles as any).createEmitter({
        speed: { min: 50, max: 200 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.8, end: 0 },
        lifespan: 600,
        quantity: 10,
        blendMode: "ADD",
        tint: 0xffff00,
        on: false, // important: do not emit automatically
      });

      // 1. Create the particle MANAGER first for critical
      const criticalParticles = this.add.particles(0, 0, "star");
      // 2. Create the actual EMITTER
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.criticalEmitter = (criticalParticles as any).createEmitter({
        speed: { min: 100, max: 300 },
        angle: { min: 0, max: 360 },
        scale: { start: 1.5, end: 0 },
        lifespan: 800,
        quantity: 25,
        blendMode: "ADD",
        tint: 0xff00ff,
        gravityY: 200,
        on: false, // important: do not emit automatically
      });

      // Validate emitters (optional but recommended)
      console.log("Juice Emitter:", this.juiceEmitter);
      console.log("Explosion Emitter:", this.explosionEmitter);
      console.log("Trail Emitter:", this.trailEmitter);
      console.log("Spark Emitter:", this.sparkEmitter);
      console.log("Critical Emitter:", this.criticalEmitter);
    }

    startGame() {
      const config = DIFFICULTY[this.difficulty]!;
      this.spawnTimer = this.time.addEvent({
        delay: config.spawnRate,
        callback: this.spawnFruit,
        callbackScope: this,
        loop: true,
      });

      this.time.addEvent({
        delay: 1000,
        callback: this.updateTimer,
        callbackScope: this,
        loop: true,
      });

      this.updateUI();
    }

    spawnFruit() {
      if (this.isGameOver) return;

      const config = DIFFICULTY[this.difficulty]!;

      // Check if we've reached max concurrent fruits for this difficulty
      const activeFruits = this.fruits
        .getChildren()
        .filter((f: Phaser.GameObjects.GameObject) => {
          const obj = f as Phaser.Physics.Arcade.Image;
          return obj.active;
        }).length;

      const activeBombs = this.bombs
        .getChildren()
        .filter((b: Phaser.GameObjects.GameObject) => {
          const obj = b as Phaser.Physics.Arcade.Image;
          return obj.active;
        }).length;

      if (activeFruits + activeBombs >= config.maxConcurrentFruits) {
        return; // Don't spawn more if at max
      }

      const isBomb = Math.random() < config.bombChance;

      // Get actual canvas dimensions
      const { width, height } = this.scale;
      const startX = Phaser.Math.Between(100, width - 100);
      const startY = height + 50;

      // Physics-based trajectory calculation
      // Target airtime between 0.8-1.2 seconds
      const targetAirtime =
        MIN_AIRTIME + Math.random() * (MAX_AIRTIME - MIN_AIRTIME);

      // Calculate initial velocity needed for the desired airtime
      // Using: v = g * t / 2 (for projectile motion)
      const initialVelocityY = -(GRAVITY * targetAirtime) * 0.75;

      // Calculate horizontal velocity for variety
      const horizontalSpeed = Phaser.Math.Between(-250, 250);

      let item;
      if (isBomb) {
        item = this.bombs.create(startX, startY, "bomb");
        item.setData("isBomb", true);

        // Bomb pulsing animation (reduced to match collision area)
        this.tweens.add({
          targets: item,
          scale: { from: 0.4, to: 0.48 },
          duration: 300,
          yoyo: true,
          repeat: -1,
        });
      } else {
        this.totalFruits++;
        const fruitTypes = [
          "apple",
          "banana",
          "mango",
          "orange",
          "pineapple",
          "watermelon",
        ];
        const fruitType = Phaser.Utils.Array.GetRandom(fruitTypes);
        item = this.fruits.create(startX, startY, fruitType);
        item.setData("points", 10);
        item.setData("isBomb", false);
        item.setData("fruitType", fruitType);
      }

      // Apply physics-based velocities
      item.setVelocity(horizontalSpeed, initialVelocityY);
      item.setAngularVelocity(Phaser.Math.Between(-200, 200));
      item.setGravityY(GRAVITY);
      item.setScale(0.4); // Reduced to match collision area (40px radius)
      item.setInteractive();

      // Spawn animation
      item.setAlpha(0);
      this.tweens.add({
        targets: item,
        alpha: 1,
        scale: 0.45, // Reduced to match collision area
        duration: 150,
        ease: "Back.easeOut",
      });

      item.on("pointerdown", () => this.sliceItem(item));
    }

    onSliceStart(pointer: Phaser.Input.Pointer) {
      this.isSlicing = true;
      this.sliceTrail = [{ x: pointer.x, y: pointer.y }];
      this.trailEmitter.start();
    }

    onSliceMove(pointer: Phaser.Input.Pointer) {
      if (!this.isSlicing) return;

      this.sliceTrail.push({ x: pointer.x, y: pointer.y });
      this.trailEmitter.emitParticleAt(pointer.x, pointer.y);

      if (this.sliceTrail.length > 25) {
        this.sliceTrail.shift();
      }

      // Enhanced trail rendering with glow
      this.sliceGraphics.clear();

      // Outer glow
      this.sliceGraphics.lineStyle(12, 0xffffff, 0.3);
      this.sliceGraphics.beginPath();
      for (let i = 0; i < this.sliceTrail.length; i++) {
        const point = this.sliceTrail[i];
        if (i === 0) {
          this.sliceGraphics.moveTo(point.x, point.y);
        } else {
          this.sliceGraphics.lineTo(point.x, point.y);
        }
      }
      this.sliceGraphics.strokePath();

      // Main trail
      this.sliceGraphics.lineStyle(6, 0xffffff, 0.9);
      this.sliceGraphics.beginPath();
      for (let i = 0; i < this.sliceTrail.length; i++) {
        const point = this.sliceTrail[i];
        if (i === 0) {
          this.sliceGraphics.moveTo(point.x, point.y);
        } else {
          this.sliceGraphics.lineTo(point.x, point.y);
        }
      }
      this.sliceGraphics.strokePath();

      // Inner highlight
      this.sliceGraphics.lineStyle(2, 0xaaffff, 1);
      this.sliceGraphics.beginPath();
      for (let i = 0; i < this.sliceTrail.length; i++) {
        const point = this.sliceTrail[i];
        if (i === 0) {
          this.sliceGraphics.moveTo(point.x, point.y);
        } else {
          this.sliceGraphics.lineTo(point.x, point.y);
        }
      }
      this.sliceGraphics.strokePath();

      if (this.sliceTrail.length > 2) {
        this.checkSliceCollisions(pointer);
      }
    }

    onSliceEnd() {
      this.isSlicing = false;
      this.trailEmitter.stop();
      this.tweens.add({
        targets: this.sliceGraphics,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          this.sliceGraphics.clear();
          this.sliceGraphics.setAlpha(1);
        },
      });
    }

    checkSliceCollisions(pointer: Phaser.Input.Pointer) {
      this.fruits.children.entries.forEach(
        (fruit: Phaser.GameObjects.GameObject) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const f = fruit as any;
          if (
            f.active &&
            Phaser.Geom.Circle.Contains(
              new Phaser.Geom.Circle(f.x, f.y, 25), // Reduced to match smaller fruit size
              pointer.x,
              pointer.y
            )
          ) {
            this.sliceItem(fruit);
          }
        }
      );

      this.bombs.children.entries.forEach(
        (bomb: Phaser.GameObjects.GameObject) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const b = bomb as any;
          if (
            b.active &&
            Phaser.Geom.Circle.Contains(
              new Phaser.Geom.Circle(b.x, b.y, 25), // Reduced to match smaller bomb size
              pointer.x,
              pointer.y
            )
          ) {
            this.sliceItem(bomb);
          }
        }
      );
    }

    sliceItem(item: Phaser.GameObjects.GameObject) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const gameObj = item as any;
      if (!gameObj.active) return;

      const x = gameObj.x;
      const y = gameObj.y;

      if (gameObj.getData("isBomb")) {
        this.sliceBomb(x, y);
      } else {
        this.sliceFruit(item, x, y);
      }

      gameObj.destroy();
    }

    sliceFruit(item: Phaser.GameObjects.GameObject, x: number, y: number) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const gameObj = item as any;
      this.fruitsSliced++;
      this.combo++;
      this.maxCombo = Math.max(this.maxCombo, this.combo);

      const isCritical = Math.random() < this.criticalHitChance;
      const basePoints = gameObj.getData("points") || 10;
      const comboBonus = this.combo > 1 ? this.combo * 5 : 0;
      const criticalBonus = isCritical ? basePoints * 2 : 0;
      const points = basePoints + comboBonus + criticalBonus;

      this.score += points;

      const fruitColors: { [key: string]: number } = {
        apple: 0xff0000,
        orange: 0xff8800,
        banana: 0xffff00,
        watermelon: 0x00ff88,
        mango: 0xffa500,
        pineapple: 0xffcc00,
      };

      const color = fruitColors[gameObj.getData("fruitType")] || 0xff0000;
      // Set tint on the emitter (using type assertion for Phaser API)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.juiceEmitter as any).setTint(color);
      this.juiceEmitter.explode(20, x, y);

      // Critical hit effects
      if (isCritical) {
        this.criticalEmitter.explode(25, x, y);
        this.showCriticalText(x, y);
        this.cameras.main.shake(150, 0.008);
      }

      this.createFruitHalves(item, x, y, color);
      this.showScorePopup(x, y, points, isCritical, false);

      if (this.combo > 1) {
        this.showCombo();
      }

      if (this.combo >= 5) {
        this.cameras.main.shake(120, 0.006);
      }

      if (this.combo >= 10) {
        this.showSpecialComboEffect();
      }

      if (this.comboTimer) {
        this.comboTimer.destroy();
      }
      this.comboTimer = this.time.delayedCall(1200, () => {
        this.combo = 0;
        this.comboText.setAlpha(0);
      });

      this.cameras.main.flash(50, 100, 255, 255, false, undefined, 0.1);
      this.updateUI();
    }

    createFruitHalves(
      item: Phaser.GameObjects.GameObject,
      x: number,
      y: number,
      color: number
    ) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const texture = (item as any).texture.key;
      for (let i = 0; i < 2; i++) {
        const half = this.add.image(x, y, texture);
        half.setScale(0.45); // Match the new smaller fruit size
        half.setTint(i === 0 ? 0xffffff : 0xdddddd);

        const velocityX = (i === 0 ? -1 : 1) * Phaser.Math.Between(150, 250);
        const velocityY = Phaser.Math.Between(-250, -150);
        const rotationSpeed = (i === 0 ? -1 : 1) * 720;

        // Create juice trail for halves
        // Create the particle MANAGER first
        const juiceTrailParticles = this.add.particles(x, y, "particle");
        // Create the actual EMITTER
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const juiceTrail = (juiceTrailParticles as any).createEmitter({
          scale: { start: 0.6, end: 0 },
          alpha: { start: 0.8, end: 0 },
          lifespan: 400,
          quantity: 1,
          frequency: 30,
          tint: color,
          blendMode: "ADD",
          on: true, // Start emitting automatically
        });
        // Make the emitter follow the half
        juiceTrail.startFollow(half);

        this.tweens.add({
          targets: half,
          x: x + velocityX,
          y: y + velocityY + 300,
          angle: rotationSpeed,
          alpha: 0,
          scale: 0.2, // End at smaller size
          duration: 1000,
          ease: "Cubic.easeIn",
          onComplete: () => {
            juiceTrail.stop();
            this.time.delayedCall(500, () => {
              // Destroy the manager (which will destroy the emitter)
              juiceTrailParticles.destroy();
            });
            half.destroy();
          },
        });
      }
    }

    showScorePopup(
      x: number,
      y: number,
      points: number,
      isCritical: boolean,
      isGolden: boolean
    ) {
      const fontSize = isCritical || isGolden ? "42px" : "32px";
      const color = isGolden ? "#ffd700" : isCritical ? "#ff00ff" : "#ffff00";
      const strokeColor = isGolden
        ? "#ff8c00"
        : isCritical
        ? "#8b008b"
        : "#ff8800";

      const text = this.add
        .text(x, y, `+${points}`, {
          fontSize: fontSize,
          fontFamily: "Arial Black",
          color: color,
          stroke: strokeColor,
          strokeThickness: 6,
          shadow: {
            blur: 10,
            color: "#000000",
            fill: true,
          },
        })
        .setOrigin(0.5);

      this.scorePopups.add(text);

      const targetScale = isCritical || isGolden ? 2 : 1.5;
      this.tweens.add({
        targets: text,
        y: y - 100,
        alpha: 0,
        scale: targetScale,
        duration: 1000,
        ease: "Cubic.easeOut",
        onComplete: () => text.destroy(),
      });
    }

    showCriticalText(x: number, y: number) {
      const text = this.add
        .text(x, y - 40, "CRITICAL!", {
          fontSize: "28px",
          fontFamily: "Arial Black",
          color: "#ff00ff",
          stroke: "#ffffff",
          strokeThickness: 4,
        })
        .setOrigin(0.5);

      this.tweens.add({
        targets: text,
        y: y - 120,
        alpha: 0,
        scale: 1.5,
        duration: 800,
        ease: "Back.easeOut",
        onComplete: () => text.destroy(),
      });
    }

    showCombo() {
      this.comboText.setText(`${this.combo}x COMBO!`);
      this.comboText.setAlpha(1);
      this.comboText.setScale(0.5);

      this.tweens.add({
        targets: this.comboText,
        scale: 1.3,
        duration: 250,
        yoyo: true,
        ease: "Back.easeOut",
      });

      const colors = [
        "#ffff00",
        "#ff8800",
        "#ff0000",
        "#ff00ff",
        "#00ffff",
        "#00ff00",
      ];
      const colorIndex = Math.min(
        Math.floor(this.combo / 3),
        colors.length - 1
      );
      this.comboText.setColor(colors[colorIndex]);

      // Combo milestone effects
      if (this.combo % 5 === 0) {
        const { width } = this.scale;
        this.sparkEmitter.explode(15, width / 2, 100);
      }
    }

    showSpecialComboEffect() {
      const { width, height } = this.scale;
      const text = this.add
        .text(width / 2, height / 2, "🔥 MEGA COMBO! 🔥", {
          fontSize: "64px",
          fontFamily: "Arial Black",
          color: "#ff00ff",
          stroke: "#ffffff",
          strokeThickness: 10,
          shadow: {
            blur: 20,
            color: "#000000",
            fill: true,
          },
        })
        .setOrigin(0.5)
        .setDepth(250);

      this.tweens.add({
        targets: text,
        scale: { from: 0.5, to: 1.5 },
        alpha: { from: 1, to: 0 },
        duration: 1500,
        ease: "Cubic.easeOut",
        onComplete: () => text.destroy(),
      });

      this.cameras.main.flash(300, 255, 0, 255);
    }

    sliceBomb(x: number, y: number) {
      this.explosionEmitter.explode(50, x, y);
      this.sparkEmitter.explode(30, x, y);

      this.cameras.main.shake(400, 0.03);
      this.cameras.main.flash(300, 255, 0, 0);

      // Screen red tint
      const { width, height } = this.scale;
      const redOverlay = this.add.rectangle(
        width / 2,
        height / 2,
        width,
        height,
        0xff0000,
        0.3
      );
      redOverlay.setDepth(180);
      this.tweens.add({
        targets: redOverlay,
        alpha: 0,
        duration: 500,
        onComplete: () => redOverlay.destroy(),
      });

      // Show damage text
      const damageText = this.add
        .text(x, y, "-1 LIFE!", {
          fontSize: "48px",
          fontFamily: "Arial Black",
          color: "#ff0000",
          stroke: "#000000",
          strokeThickness: 8,
        })
        .setOrigin(0.5)
        .setDepth(200);

      this.tweens.add({
        targets: damageText,
        y: y - 100,
        alpha: 0,
        scale: 2,
        duration: 1000,
        ease: "Cubic.easeOut",
        onComplete: () => damageText.destroy(),
      });

      this.lives--;
      this.combo = 0;

      if (this.lives <= 0) {
        this.gameOver();
      }
      this.updateUI();
    }

    updateTimer() {
      if (this.isGameOver) return;
      this.timeLeft--;

      // Warning when time is low
      if (this.timeLeft === 10) {
        const { width, height } = this.scale;
        const warningText = this.add
          .text(width / 2, height / 2, "⏰ 10 SECONDS LEFT! ⏰", {
            fontSize: "48px",
            fontFamily: "Arial Black",
            color: "#ff0000",
            stroke: "#ffffff",
            strokeThickness: 6,
          })
          .setOrigin(0.5)
          .setDepth(200);

        this.tweens.add({
          targets: warningText,
          scale: { from: 0.5, to: 1.2 },
          alpha: { from: 1, to: 0 },
          duration: 2000,
          ease: "Cubic.easeOut",
          onComplete: () => warningText.destroy(),
        });
      }

      if (this.timeLeft <= 0) {
        this.gameOver();
      }
      this.updateUI();
    }

    updateUI() {
      const scoreEl = document.getElementById("score");
      const comboEl = document.getElementById("combo");
      const livesEl = document.getElementById("lives");
      const timerEl = document.getElementById("timer");

      if (scoreEl) scoreEl.textContent = String(this.score);
      if (comboEl) {
        comboEl.textContent = `${this.combo}x`;
        // Change combo color based on value
        if (this.combo >= 10) {
          comboEl.className = "text-3xl font-black text-white";
          comboEl.style.color = "#a855f7";
        } else if (this.combo >= 5) {
          comboEl.className = "text-3xl font-black text-white";
          comboEl.style.color = "#ef4444";
        } else if (this.combo >= 3) {
          comboEl.className = "text-3xl font-black text-white";
          comboEl.style.color = "#f97316";
        } else {
          comboEl.className = "text-3xl font-black text-white";
          comboEl.style.color = "#eab308";
        }
      }
      if (livesEl) livesEl.textContent = "❤️".repeat(Math.max(0, this.lives));
      if (timerEl) {
        timerEl.textContent = String(this.timeLeft) + "s";
        // Change timer color when low
        if (this.timeLeft <= 5) {
          timerEl.className = "text-3xl font-black";
          timerEl.style.color = "#ef4444";
          timerEl.style.animation = "pulse 1s infinite";
        } else if (this.timeLeft <= 10) {
          timerEl.className = "text-3xl font-black";
          timerEl.style.color = "#f97316";
        } else {
          timerEl.className = "text-3xl font-black";
          timerEl.style.color = "#22c55e";
        }
      }
    }

    async gameOver() {
      this.isGameOver = true;

      if (this.spawnTimer) {
        this.spawnTimer.destroy();
      }
      if (this.comboTimer) {
        this.comboTimer.destroy();
      }

      const accuracy =
        this.totalFruits > 0
          ? Math.round((this.fruitsSliced / this.totalFruits) * 100)
          : 0;

      // Dispatch custom event for React component to handle
      if (typeof window !== "undefined") {
        const event = new CustomEvent("fruitNinjaGameOver", {
          detail: {
            score: this.score,
            accuracy: accuracy,
            duration: GAME_DURATION,
            metadata: {
              difficulty: this.difficulty,
              fruits_sliced: this.fruitsSliced,
              total_fruits: this.totalFruits,
              max_combo: this.maxCombo,
              lives_remaining: this.lives,
            },
          },
        });
        window.dispatchEvent(event);
      }

      this.fruits.clear(true, true);
      this.bombs.clear(true, true);
    }

    update() {
      const { height } = this.scale;
      
      this.fruits.children.entries.forEach(
        (fruit: Phaser.GameObjects.GameObject) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const f = fruit as any;
          if (f.y > height + 100) {
            if (!f.getData("missed")) {
              f.setData("missed", true);
              this.lives--;
              this.combo = 0;
              if (this.lives <= 0) {
                this.gameOver();
              }
              this.updateUI();
            }
            f.destroy();
          }
        }
      );

      this.bombs.children.entries.forEach(
        (bomb: Phaser.GameObjects.GameObject) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const b = bomb as any;
          if (b.y > height + 100) {
            b.destroy();
          }
        }
      );
    }
  }

  return FruitNinjaScene;
}

export default function FruitNinjaPage() {
  const gameRef = useRef<Phaser.Game | null>(null);
  const phaserReadyRef = useRef(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState("easy");
  const [gameDimensions, setGameDimensions] = useState(getGameDimensions());

  // Update dimensions on resize
  useEffect(() => {
    const handleResize = () => {
      setGameDimensions(getGameDimensions());
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  const {
    isOpen: isRoundCompleteOpen,
    roundData,
    showRoundComplete,
    handleClose: handleRoundClose,
    handleRestart: handleRoundRestart,
  } = useRoundComplete({
    onRestart: () => {
      handleRestart();
    },
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (phaserReadyRef.current && gameRef.current) {
      return;
    }

    const initGame = () => {
      if (!window.Phaser || gameRef.current) return;

      const gameContainer = document.getElementById("game");
      if (!gameContainer) {
        console.error("Game container not found");
        return;
      }

      const FruitNinjaScene = createFruitNinjaScene(window.Phaser);
      const dimensions = getGameDimensions();

      const config = {
        type: window.Phaser.AUTO,
        width: dimensions.width,
        height: dimensions.height,
        parent: "game",
        backgroundColor: "#87ceeb",
        physics: {
          default: "arcade",
          arcade: {
            gravity: { x: 0, y: 0 },
            debug: false,
          },
        },
        scene: FruitNinjaScene,
        scale: {
          mode: window.Phaser.Scale.FIT,
          autoCenter: window.Phaser.Scale.CENTER_BOTH,
          width: dimensions.width,
          height: dimensions.height,
        },
      };

      if (gameRef.current) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (gameRef.current as any).destroy(true);
        } catch (e) {
          console.error("Error destroying game:", e);
        }
        gameRef.current = null;
      }

      try {
        gameRef.current = new window.Phaser.Game(config);
        phaserReadyRef.current = true;
        console.log("Phaser game initialized successfully");
      } catch (error) {
        console.error("Error initializing Phaser game:", error);
      }
    };

    const checkPhaser = setInterval(() => {
      if (window.Phaser && document.getElementById("game")) {
        clearInterval(checkPhaser);
        setTimeout(() => {
          initGame();
        }, 100);
      }
    }, 100);

    const timeout = setTimeout(() => {
      clearInterval(checkPhaser);
      if (!window.Phaser) {
        console.error("Phaser failed to load after 10 seconds");
      }
    }, 10000);

    return () => {
      clearInterval(checkPhaser);
      clearTimeout(timeout);
      if (gameRef.current) {
        try {
          gameRef.current.destroy(true);
        } catch (e) {
          console.error("Error destroying game:", e);
        }
        gameRef.current = null;
        phaserReadyRef.current = false;
      }
    };
  }, []);

  const handleDifficultySelect = (difficulty: string) => {
    setSelectedDifficulty(difficulty);
    if (typeof window !== "undefined") {
      window.selectedDifficulty = difficulty;
    }
  };

  const handleStartGame = () => {
    const startScreen = document.getElementById("start-screen");
    if (startScreen) {
      startScreen.style.display = "none";
    }
    if (typeof window !== "undefined") {
      const event = new CustomEvent("startFruitNinja", {
        detail: { difficulty: selectedDifficulty },
      });
      window.dispatchEvent(event);
    }
  };

  const handleRestart = () => {
    const startScreen = document.getElementById("start-screen");
    if (startScreen) {
      startScreen.style.display = "flex";
    }
    if (typeof window !== "undefined") {
      const event = new CustomEvent("restartFruitNinja");
      window.dispatchEvent(event);
    }
    // Reset UI elements
    const scoreEl = document.getElementById("score");
    const comboEl = document.getElementById("combo");
    const livesEl = document.getElementById("lives");
    const timerEl = document.getElementById("timer");
    if (scoreEl) scoreEl.textContent = "0";
    if (comboEl) {
      comboEl.textContent = "0x";
      comboEl.className =
        "text-3xl font-black text-white drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]";
      comboEl.style.color = "";
    }
    if (livesEl) livesEl.textContent = "❤️❤️❤️";
    if (timerEl) {
      timerEl.textContent = "30s";
      timerEl.className =
        "text-3xl font-black text-white drop-shadow-[0_0_10px_rgba(34,197,94,0.8)]";
      timerEl.style.color = "";
      timerEl.style.animation = "";
    }
  };

  // Listen for game over event from Phaser
  useEffect(() => {
    const handleGameOver = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { score, accuracy, duration, metadata } = customEvent.detail;
      showRoundComplete({
        score,
        accuracy,
        duration,
        metadata,
      });
    };

    if (typeof window !== "undefined") {
      window.addEventListener("fruitNinjaGameOver", handleGameOver);
      return () => {
        window.removeEventListener("fruitNinjaGameOver", handleGameOver);
      };
    }
  }, [showRoundComplete]);

  return (
    <>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
      </Head>
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900 flex flex-col items-center justify-center p-2 sm:p-4 touch-none overflow-hidden">
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/phaser/3.55.2/phaser.min.js"
          strategy="beforeInteractive"
        />

      <div className="mb-2 sm:mb-4 w-full px-2">
        <Link
          href="/games"
          className="inline-block px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold shadow-lg transition-all hover:scale-105 border-2 border-purple-400"
        >
          ← Back to Games
        </Link>
      </div>

      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-3 sm:mb-6 text-center bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(168,85,247,0.5)] px-2">
        🍉 FRUIT NINJA 🔪
      </h1>

      <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-2xl border-2 border-purple-500/30 p-3 sm:p-6 mb-3 sm:mb-6 w-full max-w-4xl mx-2">
        <div className="flex justify-around sm:grid sm:grid-cols-4 gap-2 sm:gap-4 text-center">
          <div className="bg-gradient-to-br from-cyan-600 to-blue-700 rounded-lg sm:rounded-xl p-2 sm:p-4 shadow-lg border border-cyan-400/30 min-w-0">
            <div className="text-[10px] sm:text-sm font-bold text-cyan-200 mb-0.5 sm:mb-1">SCORE</div>
            <div
              id="score"
              className="text-lg sm:text-3xl font-black text-white drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]"
            >
              0
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg sm:rounded-xl p-2 sm:p-4 shadow-lg border border-purple-400/30 min-w-0">
            <div className="text-[10px] sm:text-sm font-bold text-purple-200 mb-0.5 sm:mb-1">COMBO</div>
            <div
              id="combo"
              className="text-lg sm:text-3xl font-black text-white drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]"
            >
              0x
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-600 to-pink-600 rounded-lg sm:rounded-xl p-2 sm:p-4 shadow-lg border border-red-400/30 min-w-0">
            <div className="text-[10px] sm:text-sm font-bold text-red-200 mb-0.5 sm:mb-1">LIVES</div>
            <div
              id="lives"
              className="text-lg sm:text-3xl drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]"
            >
              ❤️❤️❤️
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg sm:rounded-xl p-2 sm:p-4 shadow-lg border border-green-400/30 min-w-0">
            <div className="text-[10px] sm:text-sm font-bold text-green-200 mb-0.5 sm:mb-1">TIME</div>
            <div
              id="timer"
              className="text-lg sm:text-3xl font-black text-white drop-shadow-[0_0_10px_rgba(34,197,94,0.8)]"
            >
              30s
            </div>
          </div>
        </div>
      </div>

      <div
        className="relative mx-auto w-full flex justify-center px-2"
        style={{ 
          maxWidth: gameDimensions.width,
        }}
      >
        <div
          id="game"
          className="rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border-2 sm:border-4 border-white/50 touch-none"
          style={{ 
            width: gameDimensions.width, 
            height: gameDimensions.height,
            maxWidth: '100%',
          }}
        ></div>

        {/* Start Screen */}
        <div
          id="start-screen"
          className="absolute inset-0 bg-gradient-to-br from-purple-900/95 via-pink-900/95 to-gray-900/95 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl sm:rounded-2xl z-10 border-2 border-purple-500/50 overflow-y-auto"
          style={{ 
            width: gameDimensions.width, 
            height: gameDimensions.height,
            maxWidth: '100%',
          }}
        >
          <div className="text-center space-y-3 sm:space-y-6 p-3 sm:p-8 max-h-full overflow-y-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(168,85,247,0.8)] animate-pulse">
              🔪 SLICE THE FRUITS! 🔪
            </h2>
            <p className="text-sm sm:text-base md:text-xl text-purple-200 font-bold drop-shadow-md">
              {typeof window !== 'undefined' && window.innerWidth < 640 
                ? "Tap to slice fruits! Avoid bombs! 30 seconds!"
                : "Swipe to slice fruits! Avoid bombs! 30 seconds!"}
            </p>

            <div className="space-y-2 sm:space-y-4">
              <p className="text-base sm:text-lg font-bold text-cyan-300 drop-shadow-md">
                ⚔️ SELECT DIFFICULTY:
              </p>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
                <button
                  onClick={() => handleDifficultySelect("easy")}
                  className={`px-4 sm:px-6 py-2 rounded-xl font-black text-sm sm:text-base transition-all transform hover:scale-110 shadow-lg border-2 touch-manipulation min-h-[44px] ${
                    selectedDifficulty === "easy"
                      ? "bg-green-500 text-white border-green-300 scale-110 shadow-green-500/50"
                      : "bg-gray-800/80 text-green-400 border-green-500/50 hover:bg-gray-700 active:bg-gray-600"
                  }`}
                >
                  🍎 EASY (2 Fruits)
                </button>
                <button
                  onClick={() => handleDifficultySelect("medium")}
                  className={`px-4 sm:px-6 py-2 rounded-xl font-black text-sm sm:text-base transition-all transform hover:scale-110 shadow-lg border-2 touch-manipulation min-h-[44px] ${
                    selectedDifficulty === "medium"
                      ? "bg-orange-500 text-white border-orange-300 scale-110 shadow-orange-500/50"
                      : "bg-gray-800/80 text-orange-400 border-orange-500/50 hover:bg-gray-700 active:bg-gray-600"
                  }`}
                >
                  🍊 MEDIUM (4 Fruits)
                </button>
                <button
                  onClick={() => handleDifficultySelect("hard")}
                  className={`px-4 sm:px-6 py-2 rounded-xl font-black text-sm sm:text-base transition-all transform hover:scale-110 shadow-lg border-2 touch-manipulation min-h-[44px] ${
                    selectedDifficulty === "hard"
                      ? "bg-red-500 text-white border-red-300 scale-110 shadow-red-500/50"
                      : "bg-gray-800/80 text-red-400 border-red-500/50 hover:bg-gray-700 active:bg-gray-600"
                  }`}
                >
                  💣 HARD (6 Fruits)
                </button>
              </div>
            </div>

            <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-3 sm:p-4 space-y-1.5 sm:space-y-2 text-left max-w-md mx-auto border border-purple-500/30">
              <div className="flex items-center gap-2 sm:gap-3 text-purple-200 text-xs sm:text-sm">
                <span className="text-xl sm:text-2xl">🍎</span>
                <span className="font-bold">
                  {typeof window !== 'undefined' && window.innerWidth < 640 
                    ? "Tap fruits to slice them"
                    : "Click/swipe fruits to slice them"}
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 text-purple-200 text-xs sm:text-sm">
                <span className="text-xl sm:text-2xl">⚡</span>
                <span className="font-bold">Build combos for bonus points</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 text-purple-200 text-xs sm:text-sm">
                <span className="text-xl sm:text-2xl">💣</span>
                <span className="font-bold">Avoid slicing bombs!</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 text-purple-200 text-xs sm:text-sm">
                <span className="text-xl sm:text-2xl">❤️</span>
                <span className="font-bold">Don&apos;t let fruits fall</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 text-cyan-300 text-xs sm:text-sm">
                <span className="text-xl sm:text-2xl">⏱️</span>
                <span className="font-bold">Survive for 30 seconds!</span>
              </div>
            </div>

            <button
              onClick={handleStartGame}
              className="px-8 sm:px-12 py-3 sm:py-4 bg-gradient-to-r from-pink-600 via-purple-600 to-cyan-600 text-white rounded-xl font-black text-lg sm:text-2xl shadow-2xl hover:from-pink-500 hover:via-purple-500 hover:to-cyan-500 active:from-pink-700 active:via-purple-700 active:to-cyan-700 transition-all transform hover:scale-110 animate-pulse border-2 border-white/30 touch-manipulation min-h-[48px]"
            >
              ⚔️ START GAME ⚔️
            </button>
          </div>
        </div>

        {/* Round Complete Modal */}
        {roundData && (
          <RoundCompleteModal
            open={isRoundCompleteOpen}
            gameType="saccadic-movement"
            gameName="fruit-ninja"
            data={roundData}
            onRestart={handleRoundRestart}
            onClose={handleRoundClose}
          />
        )}
      </div>

      <div className="mt-3 sm:mt-6 text-center max-w-2xl bg-gray-900/60 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-purple-500/30 mx-2">
        <p className="text-base sm:text-lg font-bold mb-1 sm:mb-2 bg-gradient-to-r from-pink-400 to-cyan-400 bg-clip-text text-transparent">
          💡 Pro Tips:
        </p>
        <p className="text-xs sm:text-sm text-purple-200">
          Slice multiple fruits in one {typeof window !== 'undefined' && window.innerWidth < 640 ? "tap" : "swipe"} for massive combos! Critical hits
          give 3x points! Chain 10+ combos for mega bonuses! Different
          difficulties spawn different numbers of fruits at once!
        </p>
      </div>
      </div>
    </>
  );
}
