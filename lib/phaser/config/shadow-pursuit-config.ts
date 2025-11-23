import * as Phaser from "phaser";
import { ShadowPursuitScene } from "../games/shadow-pursuit-game";

export const shadowPursuitConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  backgroundColor: "#0a0a0a",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 800,
    height: 600,
  },
  scene: [ShadowPursuitScene],
};

