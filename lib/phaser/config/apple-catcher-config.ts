import * as Phaser from "phaser";
import { AppleCatcherScene } from "../games/apple-catcher-game";

const sizes = {
  width: 500,
  height: 500,
};

const speedDown = 300;

export const appleCatcherConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,
  width: sizes.width,
  height: sizes.height,
  backgroundColor: "#ffffff",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: speedDown },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: sizes.width,
    height: sizes.height,
  },
  scene: [AppleCatcherScene],
};

