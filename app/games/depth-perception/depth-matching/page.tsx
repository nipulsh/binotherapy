"use client";

import { GameWrapper } from "@/components/game/game-wrapper";
import { GameType } from "@/lib/types/game.types";
import { useEffect, useRef, useState, useCallback } from "react";
import { GameResult as HookGameResult } from "@/hooks/useGame";
import { Button } from "@/components/ui/button";
import Script from "next/script";

// Depth Matching Game Component
const DepthMatchingGameComponent = ({
  onGameEnd,
}: {
  onGameEnd: (result: HookGameResult) => void;
}) => {
  const gameRef = useRef<HTMLDivElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [threeLoaded, setThreeLoaded] = useState(false);
  const [gsapLoaded, setGsapLoaded] = useState(false);
  const [difficulty, setDifficulty] = useState("easy");
  const [showStartScreen, setShowStartScreen] = useState(true);
  const [showGameOver, setShowGameOver] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  // Screen dimensions (currently unused but may be needed for future responsive features)
  // const [screenWidth] = useState(800);
  // const [screenHeight] = useState(600);

  const gameStateRef = useRef({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    scene: null as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    camera: null as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    renderer: null as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    targetObjects: [] as any[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    movingObjects: [] as any[],
    targetDepths: [] as number[],
    currentDepths: [] as number[],
    activeObjectIndex: 0,
    score: 0,
    level: 1,
    lives: 3,
    isPlaying: false,
    accuracyHistory: [] as number[],
    animationId: null as number | null,
    startTime: 0,
    objectCount: 1, // Number of objects based on difficulty
    difficulty: "easy" as string,
  });

  const difficultySettings = {
    easy: {
      tolerance: 15,
      pointsPerLevel: 100,
      speedMultiplier: 0.5,
    },
    medium: {
      tolerance: 10,
      pointsPerLevel: 200,
      speedMultiplier: 1,
    },
    hard: {
      tolerance: 5,
      pointsPerLevel: 300,
      speedMultiplier: 1.5,
    },
  };

  const initScene = useCallback(() => {
    if (!gameRef.current || !window.THREE) return;

    const container = gameRef.current.querySelector(
      "#game-canvas"
    ) as HTMLElement;
    if (!container) return;

    // Wait for container to have dimensions
    const checkDimensions = () => {
      if (container.clientWidth === 0 || container.clientHeight === 0) {
        setTimeout(checkDimensions, 100);
        return;
      }

      if (!window.THREE) return;

      const state = gameStateRef.current;
      const THREE = window.THREE;

      // Clear any existing renderer
      if (state.renderer) {
        container.removeChild(state.renderer.domElement);
        state.renderer.dispose();
      }

      // Create scene
      state.scene = new THREE.Scene();
      state.scene.background = new THREE.Color(0x1a1a2e);

      // Create camera
      const width = container.clientWidth || 800;
      const height = container.clientHeight || 600;

      // Responsive camera settings
      const fov = isMobile ? 85 : 75; // Wider FOV for mobile
      state.camera = new THREE.PerspectiveCamera(
        fov,
        width / height,
        0.1,
        1000
      );

      // Adjust camera position for mobile
      if (isMobile) {
        state.camera.position.set(0, 3, 18); // Further back for mobile
      } else {
        state.camera.position.set(0, 5, 15); // Desktop position
      }
      state.camera.lookAt(0, 0, 0);

      // Create renderer
      state.renderer = new THREE.WebGLRenderer({ antialias: true });
      state.renderer.setSize(width, height);
      state.renderer.shadowMap.enabled = true;
      state.renderer.domElement.style.width = "100%";
      state.renderer.domElement.style.height = "100%";
      state.renderer.domElement.style.display = "block";
      state.renderer.domElement.style.position = "absolute";
      state.renderer.domElement.style.top = "0";
      state.renderer.domElement.style.left = "0";
      container.appendChild(state.renderer.domElement);

      // Handle WebGL context loss
      const handleContextLost = (event: Event) => {
        event.preventDefault();
        console.warn(
          "WebGL context lost in depth-matching game, attempting to restore..."
        );
        // Stop animation loop
        if (state.animationId) {
          cancelAnimationFrame(state.animationId);
          state.animationId = null;
        }
      };

      const handleContextRestored = () => {
        console.log("WebGL context restored in depth-matching game");
        // Reinitialize the scene
        setTimeout(() => {
          if (gameRef.current && window.THREE) {
            initScene();
          }
        }, 100);
      };

      state.renderer.domElement.addEventListener(
        "webglcontextlost",
        handleContextLost
      );
      state.renderer.domElement.addEventListener(
        "webglcontextrestored",
        handleContextRestored
      );

      // Add lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      state.scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(10, 10, 10);
      directionalLight.castShadow = true;
      state.scene.add(directionalLight);

      // Add grid helper
      const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
      gridHelper.position.y = -3;
      state.scene.add(gridHelper);

      // Create reference planes
      const planeGeometry = new THREE.PlaneGeometry(1, 10);
      const positions = [-8, -4, 0, 4, 8];
      positions.forEach((z) => {
        const material = new THREE.MeshBasicMaterial({
          color: 0x00ff00,
          transparent: true,
          opacity: 0.1,
          side: THREE.DoubleSide,
        });
        const plane = new THREE.Mesh(planeGeometry, material);
        plane.position.set(0, 0, z);
        state.scene.add(plane);
      });

      // Create target and moving objects based on difficulty
      // This will be updated when game starts with selected difficulty
      // For now, create placeholder arrays
      state.targetObjects = [];
      state.movingObjects = [];
      state.targetDepths = [];
      state.currentDepths = [];

      // Add a test object to verify rendering works
      const testGeometry = new THREE.BoxGeometry(1, 1, 1);
      const testMaterial = new THREE.MeshStandardMaterial({
        color: 0xff0000,
      });
      const testCube = new THREE.Mesh(testGeometry, testMaterial);
      testCube.position.set(0, 0, 0);
      state.scene.add(testCube);

      // Remove test cube after objects are created
      setTimeout(() => {
        if (testCube && state.scene) {
          state.scene.remove(testCube);
        }
      }, 1000);

      // Handle window resize
      const handleResize = () => {
        if (!container || !state.camera || !state.renderer) return;
        const width = container.clientWidth || 800;
        const height = container.clientHeight || 600;
        state.camera.aspect = width / height;
        state.camera.updateProjectionMatrix();
        state.renderer.setSize(width, height);
      };
      window.addEventListener("resize", handleResize);

      // Animation loop - always render, rotate objects when playing
      const animate = () => {
        state.animationId = requestAnimationFrame(animate);

        // Always rotate objects for visual effect
        state.targetObjects.forEach((target) => {
          if (target) target.rotation.y += 0.01;
        });
        state.movingObjects.forEach((moving) => {
          if (moving) {
            moving.rotation.x += 0.01;
            moving.rotation.y += 0.01;
          }
        });

        // Always render the scene - ensure it's visible
        if (state.renderer && state.scene && state.camera) {
          state.renderer.render(state.scene, state.camera);
        }
      };
      animate();

      // Force initial render
      if (state.renderer && state.scene && state.camera) {
        state.renderer.render(state.scene, state.camera);
      }
    };

    checkDimensions();
  }, [isMobile]);

  const updateActiveObjectDisplay = useCallback(() => {
    const state = gameStateRef.current;
    const activeIndex = state.activeObjectIndex;

    // Highlight active object
    state.movingObjects.forEach((obj, index) => {
      if (obj && obj.material) {
        obj.material.emissiveIntensity = index === activeIndex ? 0.5 : 0.3;
        obj.scale.setScalar(index === activeIndex ? 1.2 : 1.0);
      }
    });

    // Highlight target objects too
    state.targetObjects.forEach((obj, index) => {
      if (obj && obj.material) {
        obj.material.emissiveIntensity = index === activeIndex ? 0.5 : 0.3;
      }
    });

    // Update slider to current depth of active object
    const slider = gameRef.current?.querySelector(
      "#depth-slider"
    ) as HTMLInputElement;
    const depthValueEl = gameRef.current?.querySelector("#depth-value");
    if (slider && state.currentDepths[activeIndex] !== undefined) {
      const currentDepth = state.currentDepths[activeIndex];
      slider.value = currentDepth.toString();
      if (depthValueEl) depthValueEl.textContent = currentDepth.toString();

      // Update Z position for active object
      const z = (currentDepth / 100) * 16 - 8;
      if (state.movingObjects[activeIndex]) {
        state.movingObjects[activeIndex].position.z = z;
      }
    }

    // Update object indicator
    const indicator = gameRef.current?.querySelector("#object-indicator");
    if (indicator) {
      indicator.textContent = `Object ${activeIndex + 1} of ${
        state.objectCount
      }`;
    }

    // Show/hide object selector buttons
    const selectorContainer = gameRef.current?.querySelector(
      "#object-selector-container"
    );
    if (selectorContainer) {
      if (state.objectCount > 1) {
        selectorContainer.classList.remove("hidden");
        // Update button states
        [0, 1, 2].forEach((index) => {
          const btn = gameRef.current?.querySelector(
            `#object-btn-${index}`
          ) as HTMLElement;
          if (btn) {
            if (index < state.objectCount) {
              btn.style.display = "block";
              if (index === activeIndex) {
                btn.classList.add("bg-white/30");
              } else {
                btn.classList.remove("bg-white/30");
              }
            } else {
              btn.style.display = "none";
            }
          }
        });
      } else {
        selectorContainer.classList.add("hidden");
      }
    }
  }, []);

  const createObjects = useCallback(
    (count: number) => {
      const state = gameStateRef.current;
      if (!state.scene || !window.THREE) return;

      const THREE = window.THREE;

      // Clear existing objects
      state.targetObjects.forEach((obj) => {
        if (obj) state.scene.remove(obj);
      });
      state.movingObjects.forEach((obj) => {
        if (obj) state.scene.remove(obj);
      });

      state.targetObjects = [];
      state.movingObjects = [];
      state.targetDepths = [];
      state.currentDepths = [];

      // Create objects based on count
      const colors = [0x00ff00, 0x00aaff, 0xff00ff]; // Green, Blue, Magenta

      // SAFE POSITIONING: Reference objects on LEFT, Player objects on RIGHT
      const referenceX = -8; // Left side
      const playerX = 8; // Right side

      // Vertical positions for stacking (when multiple objects)
      const yPositions: { [key: number]: number[] } = {
        1: [0], // Single object: centered
        2: [-2, 2], // Two objects: stacked vertically
        3: [-3, 0, 3], // Three objects: stacked vertically
      };

      const yPos = yPositions[count] || [0];

      // Adaptive scaling based on mobile and object count
      const baseScale = isMobile ? 0.7 : 1.0;
      const objectScale = count > 2 ? baseScale * 0.8 : baseScale;

      for (let i = 0; i < count; i++) {
        // Create target object (colored sphere) - LEFT SIDE
        const targetGeometry = new THREE.SphereGeometry(
          1 * objectScale,
          32,
          32
        );
        const targetMaterial = new THREE.MeshStandardMaterial({
          color: colors[i],
          emissive: colors[i],
          emissiveIntensity: 0.3,
        });
        const targetObject = new THREE.Mesh(targetGeometry, targetMaterial);
        targetObject.position.set(referenceX, yPos[i], 0);
        state.scene.add(targetObject);

        // Add ring around target
        const ringGeometry = new THREE.TorusGeometry(
          1.3 * objectScale,
          0.1 * objectScale,
          16,
          100
        );
        const ringMaterial = new THREE.MeshBasicMaterial({
          color: colors[i],
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.y = Math.PI / 2;
        targetObject.add(ring);

        state.targetObjects.push(targetObject);

        // Create moving object (matching colored cube) - RIGHT SIDE
        const movingGeometry = new THREE.BoxGeometry(
          1.5 * objectScale,
          1.5 * objectScale,
          1.5 * objectScale
        );
        const movingMaterial = new THREE.MeshStandardMaterial({
          color: colors[i],
          emissive: colors[i],
          emissiveIntensity: 0.3,
        });
        const movingObject = new THREE.Mesh(movingGeometry, movingMaterial);
        const initialZ = (50 / 100) * 16 - 8;
        movingObject.position.set(playerX, yPos[i], initialZ); // RIGHT SIDE
        state.scene.add(movingObject);

        state.movingObjects.push(movingObject);
        state.targetDepths.push(0);
        state.currentDepths.push(50);
      }

      state.activeObjectIndex = 0;
      updateActiveObjectDisplay();
    },
    [updateActiveObjectDisplay, isMobile]
  );

  const updateUI = useCallback(() => {
    const state = gameStateRef.current;
    const scoreEl = gameRef.current?.querySelector("#score");
    const levelEl = gameRef.current?.querySelector("#level");
    const livesEl = gameRef.current?.querySelector("#lives");
    const accuracyEl = gameRef.current?.querySelector("#accuracy");

    if (scoreEl) scoreEl.textContent = state.score.toString();
    if (levelEl) levelEl.textContent = state.level.toString();
    if (livesEl) livesEl.textContent = state.lives.toString();

    const avgAccuracy =
      state.accuracyHistory.length > 0
        ? state.accuracyHistory.reduce((a, b) => a + b, 0) /
          state.accuracyHistory.length
        : 0;
    if (accuracyEl) accuracyEl.textContent = Math.round(avgAccuracy) + "%";
  }, []);

  const showFeedback = useCallback((text: string, type: string) => {
    const feedback = gameRef.current?.querySelector("#feedback") as HTMLElement;
    if (!feedback || !window.gsap) return;

    feedback.textContent = text;
    feedback.className = `feedback ${type}`;

    if (window.gsap) {
      window.gsap.to(feedback, {
        opacity: 1,
        duration: 0.3,
        onComplete: () => {
          if (window.gsap) {
            window.gsap.to(feedback, {
              opacity: 0,
              duration: 0.3,
              delay: 1,
            });
          }
        },
      });
    }
  }, []);

  const endGame = useCallback(() => {
    const state = gameStateRef.current;
    state.isPlaying = false;

    if (state.animationId) {
      cancelAnimationFrame(state.animationId);
    }

    const avgAccuracy =
      state.accuracyHistory.length > 0
        ? state.accuracyHistory.reduce((a, b) => a + b, 0) /
          state.accuracyHistory.length
        : 0;

    const duration = Math.floor((Date.now() - state.startTime) / 1000);

    // Update final stats display
    const finalScoreEl = gameRef.current?.querySelector("#final-score");
    const finalLevelEl = gameRef.current?.querySelector("#final-level");
    const finalAccuracyEl = gameRef.current?.querySelector("#final-accuracy");

    if (finalScoreEl) finalScoreEl.textContent = state.score.toString();
    if (finalLevelEl) finalLevelEl.textContent = (state.level - 1).toString();
    if (finalAccuracyEl)
      finalAccuracyEl.textContent = Math.round(avgAccuracy) + "%";

    // Show game over screen
    setShowGameOver(true);

    // Call onGameEnd with results
    onGameEnd({
      score: state.score,
      accuracy: Math.round(avgAccuracy),
      duration,
      level: state.level - 1,
      metadata: {
        roundsCompleted: state.level - 1,
        accuracyHistory: state.accuracyHistory,
        difficulty: state.difficulty,
      },
    });
  }, [onGameEnd]);

  const updateMovingObjectDepth = useCallback((value: number) => {
    const state = gameStateRef.current;
    const activeIndex = state.activeObjectIndex;

    if (state.currentDepths[activeIndex] !== undefined) {
      state.currentDepths[activeIndex] = value;
    }

    const depthValueEl = gameRef.current?.querySelector("#depth-value");
    if (depthValueEl) depthValueEl.textContent = value.toString();

    // Map slider value to Z position for active object
    const z = (value / 100) * 16 - 8;
    if (state.movingObjects[activeIndex]) {
      state.movingObjects[activeIndex].position.z = z;
    }
  }, []);

  const startNewRound = useCallback(() => {
    const state = gameStateRef.current;
    if (state.targetObjects.length === 0 || !window.gsap) return;

    // Set random target depths for all objects
    state.targetDepths = state.targetObjects.map(() =>
      Math.floor(Math.random() * 100)
    );

    // Animate all targets to their new positions
    state.targetObjects.forEach((target, index) => {
      const targetZ = (state.targetDepths[index] / 100) * 16 - 8;
      if (window.gsap) {
        window.gsap.to(target.position, {
          z: targetZ,
          duration: 1,
          ease: "power2.out",
        });
      }
    });

    // Reset all sliders to 50
    state.currentDepths = state.targetObjects.map(() => 50);
    state.activeObjectIndex = 0;

    const slider = gameRef.current?.querySelector(
      "#depth-slider"
    ) as HTMLInputElement;
    if (slider) {
      slider.value = "50";
      updateMovingObjectDepth(50);
    }

    updateActiveObjectDisplay();

    // Enable submit button
    const submitBtn = gameRef.current?.querySelector(
      "#submit-btn"
    ) as HTMLButtonElement;
    if (submitBtn) submitBtn.disabled = false;
  }, [updateActiveObjectDisplay, updateMovingObjectDepth]);

  const checkMatch = useCallback(() => {
    const state = gameStateRef.current;
    const settings =
      difficultySettings[state.difficulty as keyof typeof difficultySettings];

    // Check all objects are matched
    let allMatched = true;
    let totalDifference = 0;
    const differences: number[] = [];

    for (let i = 0; i < state.objectCount; i++) {
      const difference = Math.abs(
        state.currentDepths[i] - state.targetDepths[i]
      );
      differences.push(difference);
      totalDifference += difference;

      if (difference > settings.tolerance) {
        allMatched = false;
      }
    }

    const avgDifference = totalDifference / state.objectCount;
    let points = 0;
    const accuracy = Math.max(0, 100 - avgDifference);
    let feedbackType = "miss";
    let feedbackText = "MISS!";

    const submitBtn = gameRef.current?.querySelector(
      "#submit-btn"
    ) as HTMLButtonElement;
    if (submitBtn) submitBtn.disabled = true;

    if (allMatched) {
      // All objects matched
      const maxDiff = Math.max(...differences);
      if (maxDiff <= 3) {
        points = settings.pointsPerLevel * 2 * state.objectCount;
        feedbackType = "perfect";
        feedbackText = `PERFECT! +${points}`;
      } else if (maxDiff <= 7) {
        points = Math.floor(settings.pointsPerLevel * 1.5 * state.objectCount);
        feedbackType = "good";
        feedbackText = `GOOD! +${points}`;
      } else {
        points = settings.pointsPerLevel * state.objectCount;
        feedbackType = "close";
        feedbackText = `CLOSE! +${points}`;
      }

      state.score += points;
      state.accuracyHistory.push(accuracy);
      state.level++;
      updateUI();

      // Start new round after delay
      setTimeout(() => {
        startNewRound();
      }, 1500);
    } else {
      // Miss - lose a life
      feedbackType = "miss";
      feedbackText = "MISS! -1 Life";
      state.lives--;
      state.accuracyHistory.push(accuracy);
      updateUI();

      if (state.lives <= 0) {
        // Game over
        setTimeout(() => {
          endGame();
        }, 1500);
      } else {
        // Try again with same targets
        setTimeout(() => {
          if (submitBtn) submitBtn.disabled = false;
        }, 1500);
      }
    }

    // Show feedback
    showFeedback(feedbackText, feedbackType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateUI, endGame, showFeedback, startNewRound]);

  const startGame = useCallback(
    (selectedDifficulty: string) => {
      const state = gameStateRef.current;
      state.difficulty = selectedDifficulty;

      // Set object count based on difficulty
      if (selectedDifficulty === "easy") {
        state.objectCount = 1;
      } else if (selectedDifficulty === "medium") {
        state.objectCount = 2;
      } else {
        state.objectCount = 3;
      }

      state.score = 0;
      state.level = 1;
      state.lives = 3;
      state.accuracyHistory = [];
      state.isPlaying = true;
      state.startTime = Date.now();

      setDifficulty(selectedDifficulty);
      setShowStartScreen(false);
      setGameStarted(true);

      // Create objects based on difficulty
      createObjects(state.objectCount);
      updateUI();

      // Start first round after a short delay to ensure objects are created
      setTimeout(() => {
        startNewRound();
      }, 100);
    },
    [createObjects, startNewRound, updateUI]
  );

  useEffect(() => {
    // Mobile detection and resize handler
    const handleResize = () => {
      const width = window.innerWidth;
      // const height = window.innerHeight;
      // setScreenWidth(width);
      // setScreenHeight(height);
      setIsMobile(width < 900);
    };

    // Initial detection
    handleResize();

    // Add resize listener
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (threeLoaded && gsapLoaded && gameRef.current) {
      initScene();
    }

    // Cleanup on unmount
    return () => {
      // Capture current ref value to avoid stale closure
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const state = gameStateRef.current;
      if (state.animationId) {
        cancelAnimationFrame(state.animationId);
        state.animationId = null;
      }
      if (state.renderer) {
        // Dispose renderer (event listeners will be cleaned up automatically)
        const canvas = state.renderer.domElement;
        state.renderer.dispose();
        // Remove canvas from DOM
        if (canvas && canvas.parentNode) {
          canvas.parentNode.removeChild(canvas);
        }
        state.renderer = null;
      }
      if (state.scene && window.THREE) {
        // Dispose scene resources
        const THREE = window.THREE;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        state.scene.traverse((object: any) => {
          if ("geometry" in object && object.geometry) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const obj = object as any;
            if (obj.geometry) obj.geometry.dispose();
          }
          if ("material" in object && object.material) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const obj = object as any;
            if (obj.material) {
              if (Array.isArray(obj.material)) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                obj.material.forEach((mat: any) => mat.dispose());
              } else {
                obj.material.dispose();
              }
            }
          }
        });
        state.scene = null;
      }
    };
  }, [threeLoaded, gsapLoaded, initScene]);

  useEffect(() => {
    if (!gameStarted) return;

    const slider = gameRef.current?.querySelector(
      "#depth-slider"
    ) as HTMLInputElement;
    const submitBtn = gameRef.current?.querySelector(
      "#submit-btn"
    ) as HTMLButtonElement;
    const canvas = gameRef.current?.querySelector(
      "#game-canvas"
    ) as HTMLElement;

    const handleSliderChange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      updateMovingObjectDepth(parseInt(target.value));
    };

    const handleSubmit = () => {
      checkMatch();
    };

    // Touch controls for mobile
    let touchStartY = 0;
    let touchStartDepth = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (!isMobile) return;
      touchStartY = e.touches[0].clientY;
      const state = gameStateRef.current;
      touchStartDepth = state.currentDepths[state.activeObjectIndex] || 50;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isMobile) return;
      e.preventDefault();
      const touchY = e.touches[0].clientY;
      const deltaY = touchStartY - touchY;

      // Lower sensitivity for touch (divide by 5)
      const depthChange = deltaY / 5;
      const newDepth = Math.max(
        0,
        Math.min(100, touchStartDepth + depthChange)
      );

      updateMovingObjectDepth(Math.round(newDepth));
      if (slider) slider.value = Math.round(newDepth).toString();
    };

    const handleTouchEnd = () => {
      if (!isMobile) return;
      // Touch ended, depth is finalized
    };

    // Keyboard controls for desktop
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isMobile) return; // Disable on mobile

      const state = gameStateRef.current;
      const activeIndex = state.activeObjectIndex;
      const currentDepth = state.currentDepths[activeIndex] || 50;

      switch (e.key) {
        case "ArrowLeft":
        case "ArrowDown":
          e.preventDefault();
          const newDepthDown = Math.max(0, currentDepth - 1);
          updateMovingObjectDepth(newDepthDown);
          if (slider) slider.value = newDepthDown.toString();
          break;
        case "ArrowRight":
        case "ArrowUp":
          e.preventDefault();
          const newDepthUp = Math.min(100, currentDepth + 1);
          updateMovingObjectDepth(newDepthUp);
          if (slider) slider.value = newDepthUp.toString();
          break;
        case "Enter":
          e.preventDefault();
          if (submitBtn && !submitBtn.disabled) {
            checkMatch();
          }
          break;
        case "1":
        case "2":
        case "3":
          e.preventDefault();
          const objIndex = parseInt(e.key) - 1;
          if (objIndex < state.objectCount) {
            state.activeObjectIndex = objIndex;
            updateActiveObjectDisplay();
          }
          break;
      }
    };

    if (slider) {
      slider.addEventListener("input", handleSliderChange);
    }
    if (submitBtn) {
      submitBtn.addEventListener("click", handleSubmit);
    }
    if (canvas) {
      canvas.addEventListener("touchstart", handleTouchStart);
      canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
      canvas.addEventListener("touchend", handleTouchEnd);
    }
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      if (slider) slider.removeEventListener("input", handleSliderChange);
      if (submitBtn) submitBtn.removeEventListener("click", handleSubmit);
      if (canvas) {
        canvas.removeEventListener("touchstart", handleTouchStart);
        canvas.removeEventListener("touchmove", handleTouchMove);
        canvas.removeEventListener("touchend", handleTouchEnd);
      }
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    gameStarted,
    updateMovingObjectDepth,
    checkMatch,
    updateActiveObjectDisplay,
    isMobile,
  ]);

  return (
    <>
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"
        onLoad={() => setThreeLoaded(true)}
      />
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"
        onLoad={() => setGsapLoaded(true)}
      />
      <div
        ref={gameRef}
        className="w-full h-screen flex flex-col bg-[#1a1a2e] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-2 sm:p-4 flex-shrink-0">
          <h1 className="text-lg sm:text-2xl font-bold text-center mb-2 sm:mb-4">
            📏 DEPTH MATCHING 📏
          </h1>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-6">
            <div className="bg-white/20 px-2 sm:px-4 py-1 sm:py-2 rounded-lg backdrop-blur-sm">
              <span className="text-xs sm:text-sm opacity-90 mr-1 sm:mr-2">
                Score:
              </span>
              <span id="score" className="text-sm sm:text-xl font-bold">
                0
              </span>
            </div>
            <div className="bg-white/20 px-2 sm:px-4 py-1 sm:py-2 rounded-lg backdrop-blur-sm">
              <span className="text-xs sm:text-sm opacity-90 mr-1 sm:mr-2">
                Level:
              </span>
              <span id="level" className="text-sm sm:text-xl font-bold">
                1
              </span>
            </div>
            <div className="bg-white/20 px-2 sm:px-4 py-1 sm:py-2 rounded-lg backdrop-blur-sm">
              <span className="text-xs sm:text-sm opacity-90 mr-1 sm:mr-2">
                Accuracy:
              </span>
              <span id="accuracy" className="text-sm sm:text-xl font-bold">
                0%
              </span>
            </div>
            <div className="bg-white/20 px-2 sm:px-4 py-1 sm:py-2 rounded-lg backdrop-blur-sm">
              <span className="text-xs sm:text-sm opacity-90 mr-1 sm:mr-2">
                Lives:
              </span>
              <span id="lives" className="text-sm sm:text-xl font-bold">
                3
              </span>
            </div>
          </div>
          <p className="text-center text-xs sm:text-sm mt-2 opacity-90">
            {isMobile
              ? "Drag on screen or use slider"
              : "Use slider, arrow keys, or drag"}
          </p>
        </div>

        {/* Game Canvas */}
        <div
          id="game-canvas"
          className="flex-1 relative min-h-0 w-full"
          style={{
            height: "100%",
            position: "relative",
            overflow: "hidden",
            backgroundColor: "#1a1a2e",
          }}
        />

        {/* Controls Panel */}
        <div className="bg-[#2c3e50] p-2 sm:p-4 flex flex-col gap-2 sm:gap-4 flex-shrink-0">
          {/* Object Selector (only show if multiple objects) */}
          <div
            id="object-selector-container"
            className="flex justify-center gap-2 flex-wrap hidden"
          >
            {[0, 1, 2].map((index) => (
              <Button
                key={index}
                id={`object-btn-${index}`}
                onClick={(e) => {
                  e.preventDefault();
                  const state = gameStateRef.current;
                  if (index < state.objectCount) {
                    state.activeObjectIndex = index;
                    updateActiveObjectDisplay();
                  }
                }}
                variant="outline"
                className="text-white border-white/30 hover:bg-white/20 min-h-[44px] px-4"
              >
                Object {index + 1}
              </Button>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-white w-full">
              <label
                htmlFor="depth-slider"
                className="font-semibold text-sm sm:text-base whitespace-nowrap"
              >
                Adjust Depth:
              </label>
              <input
                type="range"
                id="depth-slider"
                min="0"
                max="100"
                defaultValue="50"
                className="flex-1 h-3 sm:h-2 bg-white/20 rounded-lg appearance-none cursor-pointer w-full"
                style={{
                  background: "rgba(255, 255, 255, 0.2)",
                }}
              />
              <span
                id="depth-value"
                className="text-lg sm:text-xl font-bold min-w-[50px] text-center bg-white/10 px-3 sm:px-4 py-2 rounded-lg"
              >
                50
              </span>
            </div>
            <div className="flex flex-col items-center gap-2 w-full">
              <span
                id="object-indicator"
                className="text-white text-xs sm:text-sm font-semibold"
              >
                Object 1 of 1
              </span>
              <Button
                id="submit-btn"
                className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white px-10 py-4 sm:px-8 sm:py-3 text-base sm:text-lg font-bold rounded-lg shadow-lg min-h-[44px] w-full sm:w-auto"
              >
                SUBMIT MATCH
              </Button>
            </div>
          </div>
        </div>

        {/* Start Screen */}
        {showStartScreen && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white p-4 sm:p-8 rounded-2xl text-center max-w-[90vw] sm:max-w-md shadow-2xl">
              <h2 className="text-2xl sm:text-3xl font-bold text-indigo-600 mb-3 sm:mb-4">
                🎯 Match the Depth!
              </h2>
              <p className="text-sm sm:text-lg text-gray-600 mb-4 sm:mb-6">
                {isMobile
                  ? "Drag on screen or use the slider to match object depths."
                  : "Use the slider, arrow keys, or drag to match the depth of objects."}
              </p>
              <div className="mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">
                  Select Difficulty:
                </h3>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  {["easy", "medium", "hard"].map((d) => (
                    <Button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      variant={difficulty === d ? "default" : "outline"}
                      className="uppercase min-h-[44px] w-full sm:w-auto"
                    >
                      {d}
                    </Button>
                  ))}
                </div>
              </div>
              <Button
                onClick={() => startGame(difficulty)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-10 sm:px-12 py-4 sm:py-3 text-base sm:text-lg font-bold rounded-lg min-h-[44px] w-full sm:w-auto"
              >
                START GAME
              </Button>
            </div>
          </div>
        )}

        {/* Game Over Screen */}
        {showGameOver && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white p-4 sm:p-8 rounded-2xl text-center max-w-[90vw] sm:max-w-md shadow-2xl">
              <h2
                id="game-over-title"
                className="text-2xl sm:text-3xl font-bold text-indigo-600 mb-3 sm:mb-4"
              >
                🎉 GAME COMPLETE 🎉
              </h2>
              <div className="bg-gray-100 p-4 sm:p-6 rounded-lg mb-4 sm:mb-6">
                <p className="text-base sm:text-lg mb-2">
                  Final Score:{" "}
                  <span id="final-score" className="font-bold text-indigo-600">
                    0
                  </span>
                </p>
                <p className="text-base sm:text-lg mb-2">
                  Levels Completed:{" "}
                  <span id="final-level" className="font-bold text-indigo-600">
                    0
                  </span>
                </p>
                <p className="text-base sm:text-lg">
                  Average Accuracy:{" "}
                  <span
                    id="final-accuracy"
                    className="font-bold text-indigo-600"
                  >
                    0%
                  </span>
                </p>
              </div>
              <Button
                onClick={() => {
                  setShowGameOver(false);
                  setShowStartScreen(true);
                  setGameStarted(false);
                  // Reset game state
                  const state = gameStateRef.current;
                  state.score = 0;
                  state.level = 1;
                  state.lives = 3;
                  state.accuracyHistory = [];
                  state.isPlaying = false;
                }}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-10 sm:px-12 py-4 sm:py-3 text-base sm:text-lg font-bold rounded-lg min-h-[44px] w-full sm:w-auto"
              >
                PLAY AGAIN
              </Button>
            </div>
          </div>
        )}

        {/* Feedback */}
        <div
          id="feedback"
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-5xl font-bold text-white opacity-0 z-40 pointer-events-none px-10 py-5 rounded-2xl backdrop-blur-md"
        />
      </div>
    </>
  );
};

export default function DepthMatchingPage() {
  return (
    <GameWrapper
      title="Depth Matching"
      gameType={"depth-perception" as GameType}
      gameName="depth-matching"
    >
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 h-screen w-full overflow-hidden">
        <DepthMatchingGameComponent
          onGameEnd={(result) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((window as any).handleGameEnd) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (window as any).handleGameEnd(result);
            }
          }}
        />
      </div>
    </GameWrapper>
  );
}
