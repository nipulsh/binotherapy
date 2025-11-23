/**
 * GalaxyModel Component
 *
 * Loads and displays the GLB galaxy model with scroll-driven animations.
 * Exposes animation hooks for rotation, pulsing, and layer visibility.
 *
 * Scroll Section Mapping:
 * - 0-25%: Hero section - slow rotation, camera dolly out
 * - 25-60%: Content reveal - increased rotation, particle bursts
 * - 60-100%: Footer/CTA - tilt/rotate to reveal darker side, camera pan
 */

"use client";

import { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { gsap } from "gsap";

export interface GalaxyModelRef {
  rotate: (amount: number) => void;
  pulseAt: (screenPosition: { x: number; y: number }) => void;
  setVisibilityLayer: (layerIndex: number) => void;
  setRotationSpeed: (speed: number) => void;
  setCameraDolly: (distance: number) => void;
}

interface GalaxyModelProps {
  scrollProgress?: number;
  isMobile?: boolean;
  prefersReducedMotion?: boolean;
}

const GalaxyModel = forwardRef<GalaxyModelRef, GalaxyModelProps>(
  (
    { scrollProgress = 0, isMobile = false, prefersReducedMotion = false },
    ref
  ) => {
    const groupRef = useRef<THREE.Group>(null);
    const { scene, camera } = useThree();
    const pulseRef = useRef<THREE.PointLight | null>(null);
    const particlesRef = useRef<THREE.Points | null>(null);
    const idleRotationRef = useRef({ y: 0, x: 0, z: 0 });
    const modelLoadedRef = useRef(false);

    // Load GLB model - useGLTF is a hook and must be called unconditionally
    const gltf = useGLTF("/landing/need_some_space.glb");

    // Idle rotation animation (only when scroll is at 0)
    useFrame(() => {
      if (!groupRef.current || prefersReducedMotion) return;

      // Only apply idle rotation if scroll progress is very low
      if (scrollProgress < 0.01) {
        const idleSpeed = 0.002;
        idleRotationRef.current.y += idleSpeed;
        idleRotationRef.current.x += idleSpeed * 0.3;
        idleRotationRef.current.z += idleSpeed * 0.1;

        // Apply idle rotation as base
        groupRef.current.rotation.y = idleRotationRef.current.y;
        groupRef.current.rotation.x = idleRotationRef.current.x;
        groupRef.current.rotation.z = idleRotationRef.current.z;
      }
    });

    // Scroll-driven animations
    useFrame(() => {
      if (!groupRef.current || prefersReducedMotion) return;

      const progress = scrollProgress;

      // Only override idle rotation if scroll progress is significant
      if (progress >= 0.01) {
        // Section 1 (0-25%): Slow rotation, camera dolly out
        if (progress <= 0.25) {
          const sectionProgress = progress / 0.25;
          const rotationAmount = sectionProgress * 0.5;
          groupRef.current.rotation.y =
            idleRotationRef.current.y + rotationAmount;
          groupRef.current.rotation.x = idleRotationRef.current.x;
          groupRef.current.rotation.z = idleRotationRef.current.z;
        }
        // Section 2 (25-60%): Increased rotation, reveal layers
        else if (progress <= 0.6) {
          const sectionProgress = (progress - 0.25) / 0.35;
          const rotationAmount = 0.5 + sectionProgress * 1.5;
          groupRef.current.rotation.y =
            idleRotationRef.current.y + rotationAmount;
          groupRef.current.rotation.x =
            idleRotationRef.current.x + sectionProgress * 0.3;
          groupRef.current.rotation.z = idleRotationRef.current.z;
        }
        // Section 3 (60-100%): Tilt to reveal darker side
        else {
          const sectionProgress = (progress - 0.6) / 0.4;
          const rotationAmount = 2.0 + sectionProgress * 0.8;
          const tiltAmount = sectionProgress * 0.5;
          groupRef.current.rotation.y =
            idleRotationRef.current.y + rotationAmount;
          groupRef.current.rotation.x =
            idleRotationRef.current.x + 0.3 + tiltAmount;
          groupRef.current.rotation.z =
            idleRotationRef.current.z + sectionProgress * 0.2;
        }
      }
    });

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      rotate: (amount: number) => {
        if (groupRef.current) {
          gsap.to(groupRef.current.rotation, {
            y: `+=${amount}`,
            duration: 0.8,
            ease: "power2.out",
          });
        }
      },
      pulseAt: (screenPosition: { x: number; y: number }) => {
        // Convert screen position to 3D world position
        const vector = new THREE.Vector3();
        vector.set(
          (screenPosition.x / window.innerWidth) * 2 - 1,
          -(screenPosition.y / window.innerHeight) * 2 + 1,
          0.5
        );
        vector.unproject(camera);

        // Create particle burst
        if (particlesRef.current) {
          // Trigger particle animation
          const particles = particlesRef.current;
          gsap.to(particles.position, {
            x: vector.x,
            y: vector.y,
            z: vector.z,
            duration: 0.3,
            ease: "power2.out",
          });
        }

        // Create light pulse
        if (pulseRef.current) {
          pulseRef.current.position.set(vector.x, vector.y, vector.z);
          gsap.to(pulseRef.current, {
            intensity: 2,
            duration: 0.2,
            ease: "power2.out",
            yoyo: true,
            repeat: 1,
          });
        }
      },
      setVisibilityLayer: (layerIndex: number) => {
        // Adjust opacity of different parts based on layer
        if (groupRef.current) {
          groupRef.current.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              gsap.to(child.material, {
                opacity: layerIndex > 0 ? 1 : 0.5,
                duration: 1,
                ease: "power2.out",
              });
            }
          });
        }
      },
      setRotationSpeed: (speed: number) => {
        // Adjust rotation speed
        if (groupRef.current) {
          gsap.to(groupRef.current.rotation, {
            y: `+=${speed}`,
            duration: 0.8,
            ease: "power2.out",
          });
        }
      },
      setCameraDolly: (distance: number) => {
        // Camera dolly effect
        const currentZ = camera.position.z;
        gsap.to(camera.position, {
          z: currentZ + distance,
          duration: 1.5,
          ease: "power2.out",
        });
      },
    }));

    // Particle system for bursts
    useEffect(() => {
      if (!particlesRef.current) {
        const geometry = new THREE.BufferGeometry();
        const count = isMobile ? 50 : 100;
        const positions = new Float32Array(count * 3);

        for (let i = 0; i < count * 3; i++) {
          positions[i] = (Math.random() - 0.5) * 0.1;
        }

        geometry.setAttribute(
          "position",
          new THREE.BufferAttribute(positions, 3)
        );

        const material = new THREE.PointsMaterial({
          color: 0x00d4ff,
          size: 0.02,
          transparent: true,
          opacity: 0.8,
        });

        const points = new THREE.Points(geometry, material);
        points.visible = false;
        scene.add(points);
        particlesRef.current = points;
      }
    }, [scene, isMobile]);

    // Pulse light
    useEffect(() => {
      if (!pulseRef.current) {
        const light = new THREE.PointLight(0x00d4ff, 0, 5);
        light.visible = false;
        scene.add(light);
        pulseRef.current = light;
      }
    }, [scene]);

    // Calculate appropriate scale and add model
    useEffect(() => {
      // Prevent multiple loads
      if (modelLoadedRef.current || !gltf?.scene || !groupRef.current) return;

      // Check if model already exists in the group
      const hasModel = groupRef.current.children.some(
        (child) => child instanceof THREE.Group && child.userData.isGalaxyModel
      );

      if (hasModel) {
        modelLoadedRef.current = true;
        return;
      }

      // Calculate bounding box
      const box = new THREE.Box3().setFromObject(gltf.scene);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);

      // Scale model to fit nicely in view
      const targetSize = 5;
      const scale = maxDim > 0 ? targetSize / maxDim : 1;

      // Clone and configure the scene
      const clonedScene = gltf.scene.clone();
      clonedScene.scale.setScalar(scale);
      clonedScene.position.set(0, 0, 0);
      clonedScene.userData.isGalaxyModel = true; // Mark as galaxy model

      // Ensure all materials are visible and properly lit
      clonedScene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.material) {
            // Ensure material is visible
            if (Array.isArray(child.material)) {
              child.material.forEach((mat) => {
                if (mat instanceof THREE.Material) {
                  mat.needsUpdate = true;
                }
              });
            } else if (child.material instanceof THREE.Material) {
              child.material.needsUpdate = true;
            }
          }
        }
      });

      // Remove existing model meshes (keep lights)
      const toRemove: THREE.Object3D[] = [];
      groupRef.current.children.forEach((child) => {
        if (
          child instanceof THREE.Mesh ||
          (child instanceof THREE.Group &&
            child !== clonedScene &&
            !child.userData.isGalaxyModel)
        ) {
          toRemove.push(child);
        }
      });
      toRemove.forEach((child) => groupRef.current!.remove(child));

      // Add the model
      groupRef.current.add(clonedScene);

      // Log once when model is first loaded (before setting the ref)
      if (!modelLoadedRef.current) {
        console.log("Galaxy model loaded and added to scene", {
          scale,
          size,
          maxDim,
        });
      }
      modelLoadedRef.current = true;
    }, [gltf?.scene]);

    return (
      <group ref={groupRef}>
        {/* Model is added via useEffect above */}
        {/* Ambient light for rim lighting */}
        <ambientLight intensity={0.3} color="#6b4cff" />
        {/* Rim light behind galaxy */}
        <directionalLight
          position={[0, 0, -10]}
          intensity={0.5}
          color="#9d5cff"
        />
      </group>
    );
  }
);

GalaxyModel.displayName = "GalaxyModel";

// Preload the model
useGLTF.preload("/landing/need_some_space.glb");

export default GalaxyModel;
