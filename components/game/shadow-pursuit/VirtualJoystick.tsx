"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface VirtualJoystickProps {
  onMove: (direction: { x: number; y: number }) => void;
  onStop: () => void;
  disabled?: boolean;
}

export function VirtualJoystick({
  onMove,
  onStop,
  disabled = false,
}: VirtualJoystickProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [touchId, setTouchId] = useState<number | null>(null);

  const baseRadius = 60;
  const stickRadius = 25;
  const maxDistance = baseRadius - stickRadius - 5;

  const getPositionFromEvent = useCallback(
    (e: TouchEvent | MouseEvent): { x: number; y: number } => {
      const container = containerRef.current;
      if (!container) return { x: 0, y: 0 };

      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      let clientX: number, clientY: number;
      if ("touches" in e) {
        const touch = Array.from(e.touches).find(
          (t) => t.identifier === touchId
        );
        if (!touch) return { x: 0, y: 0 };
        clientX = touch.clientX;
        clientY = touch.clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const x = clientX - centerX;
      const y = clientY - centerY;

      // Limit distance
      const distance = Math.sqrt(x * x + y * y);
      if (distance > maxDistance) {
        const angle = Math.atan2(y, x);
        return {
          x: Math.cos(angle) * maxDistance,
          y: Math.sin(angle) * maxDistance,
        };
      }

      return { x, y };
    },
    [maxDistance, touchId]
  );

  const handleStart = useCallback(
    (e: TouchEvent | MouseEvent) => {
      if (disabled) return;

      e.preventDefault();
      setIsActive(true);

      if ("touches" in e) {
        const touch = e.touches[0];
        setTouchId(touch.identifier);
      }

      const pos = getPositionFromEvent(e);
      setPosition(pos);

      // Normalize and send direction
      const distance = Math.sqrt(pos.x * pos.x + pos.y * pos.y);
      if (distance > 0) {
        const normalizedX = pos.x / maxDistance;
        const normalizedY = pos.y / maxDistance;
        onMove({ x: normalizedX, y: normalizedY });
      }
    },
    [disabled, getPositionFromEvent, maxDistance, onMove]
  );

  const handleMove = useCallback(
    (e: TouchEvent | MouseEvent) => {
      if (!isActive || disabled) return;

      e.preventDefault();
      const pos = getPositionFromEvent(e);
      setPosition(pos);

      // Normalize and send direction
      const distance = Math.sqrt(pos.x * pos.x + pos.y * pos.y);
      if (distance > 0) {
        const normalizedX = pos.x / maxDistance;
        const normalizedY = pos.y / maxDistance;
        onMove({ x: normalizedX, y: normalizedY });
      } else {
        onStop();
      }
    },
    [isActive, disabled, getPositionFromEvent, maxDistance, onMove, onStop]
  );

  const handleEnd = useCallback(() => {
    if (!isActive) return;

    setIsActive(false);
    setPosition({ x: 0, y: 0 });
    setTouchId(null);
    onStop();
  }, [isActive, onStop]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || disabled) return;

    // Touch events
    container.addEventListener("touchstart", handleStart, { passive: false });
    container.addEventListener("touchmove", handleMove, { passive: false });
    container.addEventListener("touchend", handleEnd);
    container.addEventListener("touchcancel", handleEnd);

    // Mouse events (for testing on desktop)
    container.addEventListener("mousedown", handleStart);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleEnd);

    return () => {
      container.removeEventListener("touchstart", handleStart);
      container.removeEventListener("touchmove", handleMove);
      container.removeEventListener("touchend", handleEnd);
      container.removeEventListener("touchcancel", handleEnd);
      container.removeEventListener("mousedown", handleStart);
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
    };
  }, [handleStart, handleMove, handleEnd, disabled]);

  return (
    <div
      ref={containerRef}
      className="relative z-50 touch-none select-none"
      style={{
        width: baseRadius * 2,
        height: baseRadius * 2,
        pointerEvents: disabled ? "none" : "auto",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {/* Base circle */}
      <div
        className="absolute rounded-full border-2"
        style={{
          width: baseRadius * 2,
          height: baseRadius * 2,
          left: 0,
          top: 0,
          backgroundColor: "rgba(107, 76, 255, 0.2)",
          borderColor: "var(--galaxy-primary)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 4px 20px rgba(107, 76, 255, 0.3)",
        }}
      />

      {/* Stick */}
      <div
        ref={stickRef}
        className="absolute rounded-full"
        style={{
          width: stickRadius * 2,
          height: stickRadius * 2,
          left: baseRadius - stickRadius + position.x,
          top: baseRadius - stickRadius + position.y,
          backgroundColor: isActive
            ? "var(--galaxy-accent)"
            : "var(--galaxy-primary)",
          transition: isActive ? "none" : "all 0.2s ease-out",
          boxShadow: isActive
            ? "0 0 20px rgba(0, 212, 255, 0.6)"
            : "0 2px 10px rgba(107, 76, 255, 0.4)",
        }}
      />
    </div>
  );
}
