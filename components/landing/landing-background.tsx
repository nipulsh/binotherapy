/**
 * LandingBackground Component
 *
 * Main 3D canvas container with global camera control.
 * Handles scroll-driven camera movements and galaxy model integration.
 */

"use client";

import { useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import GalaxyModel, { GalaxyModelRef } from "./galaxy-model";

interface LandingBackgroundProps {
  scrollProgress: number;
  mousePosition: { x: number; y: number };
  isMobile: boolean;
  prefersReducedMotion: boolean;
  onModelReady?: (ref: GalaxyModelRef) => void;
}

function SceneContent({
  scrollProgress,
  mousePosition,
  isMobile,
  prefersReducedMotion,
  onModelReady,
}: LandingBackgroundProps) {
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const galaxyRef = useRef<GalaxyModelRef>(null);

  // Camera scroll-driven dolly
  useEffect(() => {
    if (!cameraRef.current || prefersReducedMotion) return;

    const progress = scrollProgress;

    // Section 1: Dolly out
    if (progress <= 0.25) {
      const sectionProgress = progress / 0.25;
      const baseZ = isMobile ? 8 : 6;
      const dollyDistance = sectionProgress * 2;
      cameraRef.current.position.z = baseZ + dollyDistance;
    }
    // Section 2: Maintain distance
    else if (progress <= 0.6) {
      const baseZ = isMobile ? 8 : 6;
      cameraRef.current.position.z = baseZ + 2;
    }
    // Section 3: Pan for depth
    else {
      const sectionProgress = (progress - 0.6) / 0.4;
      const baseZ = isMobile ? 8 : 6;
      const panX = sectionProgress * 1.5;
      cameraRef.current.position.z = baseZ + 2;
      cameraRef.current.position.x = panX;
      cameraRef.current.lookAt(panX * 0.5, 0, 0);
    }
  }, [scrollProgress, isMobile, prefersReducedMotion]);

  // Mouse parallax for camera target
  useFrame(() => {
    if (!cameraRef.current || prefersReducedMotion) return;

    const parallaxAmount = 0.3;
    const targetX = mousePosition.x * parallaxAmount;
    const targetY = mousePosition.y * parallaxAmount;

    cameraRef.current.position.x +=
      (targetX - cameraRef.current.position.x) * 0.05;
    cameraRef.current.position.y +=
      (targetY - cameraRef.current.position.y) * 0.05;
  });

  // Notify parent when model is ready
  useEffect(() => {
    if (galaxyRef.current && onModelReady) {
      onModelReady(galaxyRef.current);
    }
  }, [onModelReady]);

  return (
    <>
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        fov={isMobile ? 60 : 50}
        position={[0, 0, isMobile ? 8 : 6]}
      />
      {/* Volumetric fog - translucent blend of galaxy palette */}
      <fogExp2 args={[0x2a1f66, 0.015]} attach="fog" />
      <GalaxyModel
        ref={galaxyRef}
        scrollProgress={scrollProgress}
        isMobile={isMobile}
        prefersReducedMotion={prefersReducedMotion}
      />
      {/* Soft rim light */}
      <directionalLight
        position={[0, 0, -10]}
        intensity={0.4}
        color="#6b4cff"
      />
      {/* Low ambient fill */}
      <ambientLight intensity={0.2} color="#1a1a2e" />
    </>
  );
}

export default function LandingBackground({
  scrollProgress,
  mousePosition,
  isMobile,
  prefersReducedMotion,
  onModelReady,
}: LandingBackgroundProps) {
  const [canvasKey, setCanvasKey] = useState(0);
  const canvasKeyRef = useRef(0);
  const contextLostRef = useRef(false);

  return (
    <div className="fixed inset-0 z-0">
      <Canvas
        key={canvasKey}
        gl={{
          antialias: !isMobile,
          alpha: true,
          powerPreference: isMobile ? "low-power" : "high-performance",
          preserveDrawingBuffer: false,
          failIfMajorPerformanceCaveat: false,
        }}
        dpr={isMobile ? [1, 1.5] : [1, 2]}
        onCreated={({ gl }) => {
          // Handle WebGL context loss
          const handleContextLost = (event: Event) => {
            event.preventDefault();
            contextLostRef.current = true;
            console.warn("WebGL context lost, attempting to restore...");
          };

          const handleContextRestored = () => {
            console.log("WebGL context restored");
            contextLostRef.current = false;
            // Force canvas recreation to restore state
            canvasKeyRef.current += 1;
            setCanvasKey(canvasKeyRef.current);
          };

          gl.domElement.addEventListener("webglcontextlost", handleContextLost);
          gl.domElement.addEventListener(
            "webglcontextrestored",
            handleContextRestored
          );

          // Cleanup on unmount
          return () => {
            gl.domElement.removeEventListener(
              "webglcontextlost",
              handleContextLost
            );
            gl.domElement.removeEventListener(
              "webglcontextrestored",
              handleContextRestored
            );
          };
        }}
      >
        <SceneContent
          scrollProgress={scrollProgress}
          mousePosition={mousePosition}
          isMobile={isMobile}
          prefersReducedMotion={prefersReducedMotion}
          onModelReady={onModelReady}
        />
      </Canvas>
    </div>
  );
}
