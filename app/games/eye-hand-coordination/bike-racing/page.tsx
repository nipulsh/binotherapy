"use client";

import { GameWrapper } from "@/components/game/game-wrapper";
import { GameType } from "@/lib/types/game.types";
import { useRef, useState, useCallback, useEffect } from "react";
import { GameResult as HookGameResult } from "@/hooks/useGame";
import { Button } from "@/components/ui/button";
import Script from "next/script";

// Game settings
const ROAD_WIDTH = 8;
const LANE_COUNT = 3;
const LANE_WIDTH = ROAD_WIDTH / LANE_COUNT;
const ACCELERATION = 0.5;
const MAX_SPEED = 200;

// Street Bike Racing Game Component
const StreetBikeRacingGameComponent = ({
  onGameEnd,
}: {
  onGameEnd?: (result: HookGameResult) => void;
}) => {
  const gameRef = useRef<HTMLDivElement>(null);
  const minimapCanvasRef = useRef<HTMLCanvasElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [threeLoaded, setThreeLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  // Load high score from localStorage
  const [highScore, setHighScore] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("bikeRacingHighScore");
      if (stored) {
        return parseInt(stored, 10);
      }
    }
    return 0;
  });

  // Game state refs
  const gameStateRef = useRef<{
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    scene: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    camera: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    renderer: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    bike: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    road: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    roadLines: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    traffic: any[];
    gameActive: boolean;
    score: number;
    distance: number;
    speed: number;
    maxSpeed: number;
    bikePosition: number;
    targetBikePosition: number;
    keys: Record<string, boolean>;
    gameStartTime: number | null;
    animationId: number | null;
    trafficSpawnTimeout: NodeJS.Timeout | null;
  }>({
    scene: null,
    camera: null,
    renderer: null,
    bike: null,
    road: null,
    roadLines: [],
    traffic: [],
    gameActive: false,
    score: 0,
    distance: 0,
    speed: 60,
    maxSpeed: 60,
    bikePosition: 0,
    targetBikePosition: 0,
    keys: {},
    gameStartTime: null,
    animationId: null,
    trafficSpawnTimeout: null,
  });

  // Ref to store spawnTraffic function to avoid circular dependency
  const spawnTrafficRef = useRef<() => void>(() => {});
  const initializeGameRef = useRef<() => void>(() => {});
  const isTouchingRef = useRef(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createRoad = useCallback((scene: any) => {
    if (!window.THREE) return { road: null, roadLines: [] };
    const THREE = window.THREE;
    // Road surface
    const roadGeometry = new THREE.PlaneGeometry(ROAD_WIDTH, 200);
    const roadMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.8,
    });
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.z = -50;
    road.receiveShadow = true;
    scene.add(road);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const roadLines: any[] = [];

    // Road lines
    for (let i = 0; i < 40; i++) {
      const lineGeometry = new THREE.BoxGeometry(0.2, 0.1, 2);
      const lineMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
      });
      const line = new THREE.Mesh(lineGeometry, lineMaterial);

      // Position lines in the center of lanes
      const laneOffset = i % 2 === 0 ? -LANE_WIDTH : LANE_WIDTH;
      line.position.set(laneOffset, 0.05, -i * 5);

      roadLines.push(line);
      scene.add(line);
    }

    // Road edges
    const edgeGeometry = new THREE.BoxGeometry(0.5, 0.3, 200);
    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000,
    });

    const leftEdge = new THREE.Mesh(edgeGeometry, edgeMaterial);
    leftEdge.position.set(-ROAD_WIDTH / 2, 0.15, -50);
    scene.add(leftEdge);

    const rightEdge = new THREE.Mesh(edgeGeometry, edgeMaterial);
    rightEdge.position.set(ROAD_WIDTH / 2, 0.15, -50);
    scene.add(rightEdge);

    // Sidewalks
    const sidewalkGeometry = new THREE.PlaneGeometry(2, 200);
    const sidewalkMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
    });

    const leftSidewalk = new THREE.Mesh(
      sidewalkGeometry,
      sidewalkMaterial
    );
    leftSidewalk.rotation.x = -Math.PI / 2;
    leftSidewalk.position.set(-ROAD_WIDTH / 2 - 1, 0, -50);
    scene.add(leftSidewalk);

    const rightSidewalk = new THREE.Mesh(
      sidewalkGeometry,
      sidewalkMaterial
    );
    rightSidewalk.rotation.x = -Math.PI / 2;
    rightSidewalk.position.set(ROAD_WIDTH / 2 + 1, 0, -50);
    scene.add(rightSidewalk);

    return { road, roadLines };
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createBike = useCallback((scene: any) => {
    if (!window.THREE) return null;
    const THREE = window.THREE;
    const bike = new THREE.Group();

    // Bike body
    const bodyGeometry = new THREE.BoxGeometry(0.6, 0.8, 1.5);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.8;
    body.castShadow = true;
    bike.add(body);

    // Bike seat
    const seatGeometry = new THREE.BoxGeometry(0.5, 0.2, 0.6);
    const seatMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
    });
    const seat = new THREE.Mesh(seatGeometry, seatMaterial);
    seat.position.set(0, 1.3, -0.2);
    bike.add(seat);

    // Handlebars
    const handleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.8);
    const handleMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
    });
    const handlebar = new THREE.Mesh(handleGeometry, handleMaterial);
    handlebar.rotation.z = Math.PI / 2;
    handlebar.position.set(0, 1.4, 0.5);
    bike.add(handlebar);

    // Front wheel
    const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.2, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
    });
    const frontWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    frontWheel.rotation.x = Math.PI / 2;
    frontWheel.position.set(0, 0.4, 0.8);
    frontWheel.castShadow = true;
    bike.add(frontWheel);

    // Back wheel
    const backWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    backWheel.rotation.x = Math.PI / 2;
    backWheel.position.set(0, 0.4, -0.8);
    backWheel.castShadow = true;
    bike.add(backWheel);

    // Headlight
    const lightGeometry = new THREE.SphereGeometry(0.15);
    const lightMaterial = new THREE.MeshStandardMaterial({
      color: 0xffff00,
      emissive: 0xffff00,
      emissiveIntensity: 0.8,
    });
    const headlight = new THREE.Mesh(lightGeometry, lightMaterial);
    headlight.position.set(0, 0.9, 1);
    bike.add(headlight);

    bike.position.set(0, 0, 0);
    scene.add(bike);
    return bike;
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createBuildings = useCallback((scene: any) => {
    if (!window.THREE) return;
    const THREE = window.THREE;
    for (let i = 0; i < 20; i++) {
      const height = Math.random() * 15 + 5;
      const width = Math.random() * 3 + 2;
      const depth = Math.random() * 4 + 3;

      const buildingGeometry = new THREE.BoxGeometry(
        width,
        height,
        depth
      );
      const buildingMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(
          Math.random() * 0.1 + 0.5,
          0.5,
          0.5
        ),
      });
      const building = new THREE.Mesh(
        buildingGeometry,
        buildingMaterial
      );

      const side = Math.random() < 0.5 ? -1 : 1;
      building.position.set(
        side * (ROAD_WIDTH / 2 + 3 + Math.random() * 5),
        height / 2,
        -i * 10 - Math.random() * 10
      );

      building.castShadow = true;
      building.receiveShadow = true;
      scene.add(building);
    }
  }, []);

  const createTrafficCar = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (scene: any, lane: number, zPosition: number) => {
      if (!window.THREE) return null;
      const THREE = window.THREE;
      const car = new THREE.Group();

      // Car body
      const bodyGeometry = new THREE.BoxGeometry(1.2, 0.8, 2.5);
      const colors = [
        0x0000ff, 0x00ff00, 0xffff00, 0xff00ff, 0x00ffff, 0xffa500,
      ];
      const bodyMaterial = new THREE.MeshStandardMaterial({
        color: colors[Math.floor(Math.random() * colors.length)],
      });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.y = 0.7;
      body.castShadow = true;
      car.add(body);

      // Car roof
      const roofGeometry = new THREE.BoxGeometry(1.0, 0.6, 1.5);
      const roofMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
      });
      const roof = new THREE.Mesh(roofGeometry, roofMaterial);
      roof.position.y = 1.4;
      car.add(roof);

      // Wheels
      const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 8);
      const wheelMaterial = new THREE.MeshStandardMaterial({
        color: 0x000000,
      });

      const wheels = [
        [-0.6, 0.3, 1],
        [0.6, 0.3, 1],
        [-0.6, 0.3, -1],
        [0.6, 0.3, -1],
      ];

      wheels.forEach(([x, y, z]) => {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(x, y, z);
        car.add(wheel);
      });

      // Position car in lane
      const laneX = (lane - 1) * LANE_WIDTH;
      car.position.set(laneX, 0, zPosition);
      car.userData = { lane, speed: Math.random() * 20 + 40 };

      scene.add(car);
      return car;
    },
    []
  );

  const spawnTraffic = useCallback(() => {
    const state = gameStateRef.current;
    if (!state.gameActive || !state.scene) return;

    const lane = Math.floor(Math.random() * LANE_COUNT);
    const zPosition = state.camera.position.z - 50 - Math.random() * 20;

    // Check if lane is clear
    const isClear = !state.traffic.some((car) => {
      const carLane = Math.round(car.position.x / LANE_WIDTH) + 1;
      return carLane === lane && Math.abs(car.position.z - zPosition) < 10;
    });

    if (isClear) {
      const car = createTrafficCar(state.scene, lane, zPosition);
      state.traffic.push(car);
    }

    // Spawn next car
    const spawnDelay = Math.max(800, 2000 - state.score * 5);
    state.trafficSpawnTimeout = setTimeout(
      () => spawnTrafficRef.current(),
      spawnDelay
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) as any;
  }, [createTrafficCar]);

  // Update the ref when spawnTraffic changes
  useEffect(() => {
    spawnTrafficRef.current = spawnTraffic;
  }, [spawnTraffic]);

  useEffect(() => {
    const handleResize = () => {
      if (typeof window === "undefined") return;
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const state = gameStateRef.current;
      if (state.animationId) {
        cancelAnimationFrame(state.animationId);
        state.animationId = null;
      }
      if (state.trafficSpawnTimeout) {
        clearTimeout(state.trafficSpawnTimeout);
        state.trafficSpawnTimeout = null;
      }
      if (state.renderer) {
        // Dispose renderer
        state.renderer.dispose();
        // Remove canvas from DOM
        const canvas = state.renderer.domElement;
        if (canvas && canvas.parentNode) {
          canvas.parentNode.removeChild(canvas);
        }
        state.renderer = null;
      }
      if (state.scene && window.THREE) {
        // Dispose scene resources
        state.scene.traverse((object: unknown) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const obj = object as any;
          if (obj.geometry) {
            obj.geometry.dispose();
          }
            if (obj.material) {
              if (Array.isArray(obj.material)) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              obj.material.forEach((mat: any) => mat.dispose());
              } else {
                obj.material.dispose();
            }
          }
        });
        state.scene = null;
      }
    };
  }, []);

  const updateMinimap = useCallback(() => {
    const canvas = minimapCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const state = gameStateRef.current;
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const roadPadding = width * 0.15;
    const roadWidth = width - roadPadding * 2;

    // Draw road
    ctx.fillStyle = "#333";
    ctx.fillRect(roadPadding, 0, roadWidth, height);

    // Draw lanes
    ctx.strokeStyle = "#FFF";
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(roadPadding + roadWidth / 3, 0);
    ctx.lineTo(roadPadding + roadWidth / 3, height);
    ctx.moveTo(roadPadding + (roadWidth * 2) / 3, 0);
    ctx.lineTo(roadPadding + (roadWidth * 2) / 3, height);
    ctx.stroke();
    ctx.setLineDash([]);

    const bikeRelativeX =
      state.bike && state.bike.position
        ? (state.bike.position.x + ROAD_WIDTH / 2) / ROAD_WIDTH
        : 0.5;
    const bikeX = roadPadding + bikeRelativeX * roadWidth;
    const bikeWidth = roadWidth * 0.12;
    const bikeHeight = height * 0.09;

    // Draw bike (player)
    ctx.fillStyle = "#FF0000";
    ctx.fillRect(bikeX - bikeWidth / 2, height - bikeHeight - 10, bikeWidth, bikeHeight);

    // Draw traffic
    ctx.fillStyle = "#00FF00";
    state.traffic.forEach((car) => {
      const relativeZ = car.position.z - state.camera.position.z;
      if (relativeZ > -60 && relativeZ < 15) {
        const carRelativeX = (car.position.x + ROAD_WIDTH / 2) / ROAD_WIDTH;
        const carX = roadPadding + carRelativeX * roadWidth;
        const carY = height - (relativeZ + 60) * (height / 90) - 20;
        ctx.fillRect(carX - bikeWidth / 2.5, carY, bikeWidth / 1.2, bikeHeight / 1.5);
      }
    });
  }, []);

  const updateUI = useCallback(() => {
    const state = gameStateRef.current;
    const scoreEl = gameRef.current?.querySelector("#score");
    const speedEl = gameRef.current?.querySelector("#speed");
    const distanceEl = gameRef.current?.querySelector("#distance");

    if (scoreEl) scoreEl.textContent = Math.floor(state.score).toString();
    if (speedEl) speedEl.textContent = Math.floor(state.speed).toString();
    if (distanceEl)
      distanceEl.textContent = Math.floor(state.distance).toString();

    // Speed warning at high speeds
    const hud = gameRef.current?.querySelector(".hud");
    if (hud) {
      if (state.speed > 150) {
        hud.classList.add("speed-warning");
      } else {
        hud.classList.remove("speed-warning");
      }
    }
  }, []);

  const initializeGame = useCallback(() => {
    if (!gameRef.current || !window.THREE) return;

    const container = gameRef.current.querySelector(
      "#game-canvas"
    ) as HTMLElement;
    if (!container) return;

    const state = gameStateRef.current;

    // Create scene
    const scene = new window.THREE.Scene();
    scene.fog = new window.THREE.Fog(0x87ceeb, 10, 100);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const isMobileDevice = window.innerWidth <= 768;

    // Camera
    const camera = new window.THREE.PerspectiveCamera(
      75,
      width / height,
      0.1,
      1000
    );
    camera.position.set(0, 3, 5);
    camera.lookAt(0, 0, -10);

    // Renderer
    const renderer = new window.THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    renderer.domElement.style.touchAction = "none";
    container.appendChild(renderer.domElement);

    // Handle WebGL context loss
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      console.warn(
        "WebGL context lost in bike-racing game, attempting to restore..."
      );
      // Stop animation loop
      if (state.animationId) {
        cancelAnimationFrame(state.animationId);
        state.animationId = null;
      }
      state.gameActive = false;
    };

    const handleContextRestored = () => {
      console.log("WebGL context restored in bike-racing game");
      // Reinitialize the game - use ref to avoid circular dependency
      setTimeout(() => {
        if (gameRef.current && window.THREE && initializeGameRef.current) {
          initializeGameRef.current();
        }
      }, 100);
    };

    renderer.domElement.addEventListener("webglcontextlost", handleContextLost);
    renderer.domElement.addEventListener(
      "webglcontextrestored",
      handleContextRestored
    );

    // Lighting
    const ambientLight = new window.THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const sunLight = new window.THREE.DirectionalLight(0xffffff, 0.8);
    sunLight.position.set(5, 10, 5);
    sunLight.castShadow = true;
    scene.add(sunLight);

    // Create road
    const { road, roadLines } = createRoad(scene);

    // Create bike
    const bike = createBike(scene);

    // Create buildings
    createBuildings(scene);

    // Update state
    state.scene = scene;
    state.camera = camera;
    state.renderer = renderer;
    state.bike = bike;
    state.road = road;
    state.roadLines = roadLines;
    state.traffic = [];
    state.gameActive = true;
    state.score = 0;
    state.distance = 0;
    state.speed = 60;
    state.maxSpeed = 60;
    state.bikePosition = 0;
    state.targetBikePosition = 0;
    state.gameStartTime = Date.now();

    // Start spawning traffic
    setTimeout(() => spawnTrafficRef.current(), 2000);

    // Controls
    const handleKeyDown = (e: KeyboardEvent) => {
      if (state.keys.hasOwnProperty(e.key)) {
        state.keys[e.key] = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (state.keys.hasOwnProperty(e.key)) {
        state.keys[e.key] = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    const updateTargetPositionFromClientX = (clientX: number) => {
      if (!renderer.domElement) return;
      const rect = renderer.domElement.getBoundingClientRect();
      if (!rect.width) return;
      const relativeX = (clientX - rect.left) / rect.width;
      const normalized = (relativeX - 0.5) * 2;
      state.targetBikePosition = Math.max(-1, Math.min(1, normalized * 1.05));
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (!isMobileDevice) return;
      const touch = event.touches[0];
      if (!touch) return;
      isTouchingRef.current = true;
      event.preventDefault();
      updateTargetPositionFromClientX(touch.clientX);
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!isMobileDevice || !isTouchingRef.current) return;
      const touch = event.touches[0];
      if (!touch) return;
      event.preventDefault();
      updateTargetPositionFromClientX(touch.clientX);
    };

    const handleTouchEnd = () => {
      if (!isMobileDevice) return;
      isTouchingRef.current = false;
    };

    renderer.domElement.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    renderer.domElement.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    renderer.domElement.addEventListener("touchend", handleTouchEnd);
    renderer.domElement.addEventListener("touchcancel", handleTouchEnd);

    // Handle window resize
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);

    // Game loop
    const animate = () => {
      if (!state.gameActive) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      state.animationId = requestAnimationFrame(animate) as any;

      // Update speed (gradually increase)
      state.speed = Math.min(MAX_SPEED, state.speed + ACCELERATION * 0.01);
      state.maxSpeed = Math.max(state.maxSpeed, state.speed);

      // Update distance
      state.distance += (state.speed * 0.016) / 3.6; // Convert km/h to m/frame

      // Update score
      state.score += state.speed * 0.01;

      // Handle steering
      if (state.keys.ArrowLeft || state.keys.a) {
        state.targetBikePosition = Math.max(
          -1,
          state.targetBikePosition - 0.05
        );
      }
      if (state.keys.ArrowRight || state.keys.d) {
        state.targetBikePosition = Math.min(1, state.targetBikePosition + 0.05);
      }

      // Smooth bike movement
      state.bikePosition +=
        (state.targetBikePosition - state.bikePosition) * 0.1;
      if (state.bike) {
        state.bike.position.x = state.bikePosition * LANE_WIDTH;

        // Tilt bike when turning
        state.bike.rotation.z = -state.bikePosition * 0.2;
      }

      // Move road lines
      state.roadLines.forEach((line) => {
        line.position.z += state.speed * 0.03;
        if (line.position.z > 5) {
          line.position.z -= 200;
        }
      });

      // Move and update traffic
      state.traffic.forEach((car, index) => {
        const relativeSpeed = state.speed - car.userData.speed;
        car.position.z += relativeSpeed * 0.03;

        // Remove cars that are behind
        if (car.position.z > state.camera.position.z + 10) {
          state.scene.remove(car);
          state.traffic.splice(index, 1);
        }

        // Check collision
        const distanceToCar = Math.abs(state.bike.position.x - car.position.x);
        const distanceZ = Math.abs(state.bike.position.z - car.position.z);

        if (distanceToCar < 0.9 && distanceZ < 2) {
          endGame();
        }
      });

      updateUI();
      updateMinimap();
      renderer.render(scene, camera);
    };

    const endGame = () => {
      state.gameActive = false;

      // Update high score
      if (state.score > highScore) {
        const newHighScore = Math.floor(state.score);
        setHighScore(newHighScore);
        localStorage.setItem("bikeRacingHighScore", newHighScore.toString());
      }

      const duration = state.gameStartTime
        ? Math.floor((Date.now() - state.gameStartTime) / 1000)
        : 0;

      const result = {
        score: Math.floor(state.score),
        accuracy: 100,
        duration,
        level: Math.floor(state.distance / 500) + 1,
        metadata: {
          distance: state.distance,
          maxSpeed: state.maxSpeed,
          gameType: "progressive",
        },
      };

      // Cleanup
      if (state.animationId) {
        cancelAnimationFrame(state.animationId);
      }
      if (state.trafficSpawnTimeout) {
        clearTimeout(state.trafficSpawnTimeout);
      }

      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("touchstart", handleTouchStart);
      renderer.domElement.removeEventListener("touchmove", handleTouchMove);
      renderer.domElement.removeEventListener("touchend", handleTouchEnd);
      renderer.domElement.removeEventListener("touchcancel", handleTouchEnd);

      // Use global handleGameEnd if available
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((window as any).handleGameEnd) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).handleGameEnd(result);
      } else {
        onGameEnd(result);
      }
    };

    // Initialize keys object
    state.keys = {
      ArrowLeft: false,
      ArrowRight: false,
      a: false,
      d: false,
    };

    animate();
  }, [
    createRoad,
    createBike,
    createBuildings,
    updateUI,
    updateMinimap,
    onGameEnd,
    highScore,
  ]);

  // Update ref when initializeGame changes
  useEffect(() => {
    initializeGameRef.current = initializeGame;
  }, [initializeGame]);

  const startGameInternal = useCallback(() => {
    if (!gameRef.current || !window.THREE) return;
    setGameStarted(true);
    initializeGame();
  }, [initializeGame]);

  const minimapDimensions = isMobile
    ? { width: 110, height: 150 }
    : { width: 150, height: 200 };

  return (
    <>
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"
        onLoad={() => {
          setThreeLoaded(true);
        }}
      />
      <div
        ref={gameRef}
        className="w-full min-h-screen flex flex-col bg-black overflow-hidden relative"
        style={{ touchAction: isMobile ? "none" : "auto" }}
      >
        {/* HUD */}
        <div
          className={`hud absolute left-1/2 transform -translate-x-1/2 z-50 flex bg-black/70 rounded-2xl border-4 border-yellow-400 shadow-lg shadow-yellow-400/50 ${
            isMobile ? "top-2 flex-col gap-3 px-4 py-3 w-[92%]" : "top-5 flex-row gap-10 px-10 py-5"
          }`}
        >
          <div className="text-center">
            <span className="block text-yellow-400 text-sm mb-1 uppercase tracking-wider">
              Score:
            </span>
            <span
              id="score"
            className="inline-block text-white text-2xl sm:text-3xl font-bold text-shadow min-w-[70px]"
            >
              0
            </span>
          </div>
          <div className="text-center">
            <span className="block text-yellow-400 text-sm mb-1 uppercase tracking-wider">
              Speed:
            </span>
            <span
              id="speed"
            className="inline-block text-white text-2xl sm:text-3xl font-bold text-shadow min-w-[70px]"
            >
              60
            </span>
            <span className="text-yellow-400 text-base ml-1">km/h</span>
          </div>
          <div className="text-center">
            <span className="block text-yellow-400 text-sm mb-1 uppercase tracking-wider">
              Distance:
            </span>
            <span
              id="distance"
            className="inline-block text-white text-2xl sm:text-3xl font-bold text-shadow min-w-[70px]"
            >
              0
            </span>
            <span className="text-yellow-400 text-base ml-1">m</span>
          </div>
        </div>

        {/* Game Canvas */}
        <div
          id="game-canvas"
          className="flex-1 relative min-h-0 w-full"
          style={{
            height: isMobile ? "65vh" : "100%",
            minHeight: isMobile ? "360px" : "100%",
            maxHeight: isMobile ? "720px" : "none",
          }}
        />

        {/* Minimap */}
        <div
          className={`minimap absolute z-50 bg-black/80 rounded-lg border-2 border-yellow-400 ${
            isMobile ? "top-3 right-3 p-1.5" : "bottom-5 right-5 p-2.5"
          }`}
        >
          <canvas
            ref={minimapCanvasRef}
            width={minimapDimensions.width}
            height={minimapDimensions.height}
            className="block rounded"
            style={{
              width: minimapDimensions.width,
              height: minimapDimensions.height,
            }}
          />
        </div>

        {/* Start Screen */}
        {!gameStarted && threeLoaded && (
          <div className="overlay-screen absolute inset-0 bg-black/95 flex justify-center items-center z-[1000] animate-fadeIn">
            <div className="screen-content text-center p-10 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border-4 border-yellow-400 shadow-2xl shadow-yellow-400/50 max-w-[600px]">
              <h1 className="game-title text-6xl text-yellow-400 mb-5 tracking-wider drop-shadow-lg">
                🏍️ STREET BIKE RACING 🏍️
              </h1>
              <p className="game-subtitle text-2xl text-white mb-8">
                Navigate through busy traffic!
              </p>
              <div className="controls-info bg-black/50 p-5 rounded-xl my-8">
                <h3 className="text-yellow-400 text-xl mb-4">Controls:</h3>
                <p className="text-white text-lg my-2">
                  {isMobile
                    ? "Drag your finger anywhere on the road to steer smoothly."
                    : "← → Arrow Keys or A/D - Steer Left/Right"}
                </p>
                <p className="text-white text-lg my-2">
                  {isMobile
                    ? "Keep your finger on the screen for precise control."
                    : "Speed increases as you go!"}
                </p>
              </div>
              <Button
                onClick={startGameInternal}
                className="btn-large px-12 py-4 text-2xl font-bold text-black bg-gradient-to-r from-yellow-400 to-orange-500 border-none rounded-full cursor-pointer shadow-lg shadow-yellow-400/50 transition-all hover:transform hover:-translate-y-1 hover:shadow-xl hover:shadow-yellow-400/70 uppercase tracking-wider mt-5"
              >
                START RACE
              </Button>
            </div>
          </div>
        )}

      </div>

      <style jsx>{`
        .text-shadow {
          text-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
        }
        .speed-warning .hud-value {
          animation: pulse 0.5s ease infinite;
          color: #ff4444;
          text-shadow: 0 0 20px rgba(255, 68, 68, 0.8);
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-10px) rotate(-2deg);
          }
          75% {
            transform: translateX(10px) rotate(2deg);
          }
        }
        @keyframes pulse {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease;
        }
        .animate-shake {
          animation: shake 0.5s ease;
        }
      `}</style>
    </>
  );
};

export default function StreetBikeRacingPage() {
  return (
    <GameWrapper
      title="Street Bike Racing"
      gameType={"eye-hand-coordination" as GameType}
      gameName="bike-racing"
    >
      <StreetBikeRacingGameComponent />
    </GameWrapper>
  );
}
