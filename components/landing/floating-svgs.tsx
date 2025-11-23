/**
 * FloatingSVGs Component
 * 
 * Interactive SVG elements that react to hover, mouse position, and clicks.
 * Triggers 3D reactions in the galaxy model when clicked.
 */

"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface FloatingSVGProps {
  id: string;
  path: string;
  position: { x: number; y: number };
  size?: number;
  onPulse?: (position: { x: number; y: number }) => void;
  isMobile?: boolean;
}

function FloatingSVG({
  id,
  path,
  position,
  size = 60,
  onPulse,
  isMobile = false,
}: FloatingSVGProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springX = useSpring(mouseX, { stiffness: 150, damping: 15 });
  const springY = useSpring(mouseY, { stiffness: 150, damping: 15 });
  
  useTransform(
    useMotionValue(isHovered ? 1 : 0),
    [0, 1],
    [0.3, 1]
  );

  // Mouse follow effect
  useEffect(() => {
    if (isMobile) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const distance = Math.sqrt(
        Math.pow(e.clientX - centerX, 2) + Math.pow(e.clientY - centerY, 2)
      );
      
      if (distance < 200) {
        const offsetX = (e.clientX - centerX) * 0.1;
        const offsetY = (e.clientY - centerY) * 0.1;
        mouseX.set(offsetX);
        mouseY.set(offsetY);
      } else {
        mouseX.set(0);
        mouseY.set(0);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isMobile, mouseX, mouseY]);

  const handleClick = useCallback(() => {
    if (!containerRef.current || !onPulse) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    onPulse({ x: centerX, y: centerY });
  }, [onPulse]);

  return (
    <motion.div
      ref={containerRef}
      className="absolute pointer-events-auto"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        x: springX,
        y: springY,
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: 1,
        scale: isHovered ? 1.05 : 1,
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={handleClick}
      onTap={isMobile ? handleClick : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className="drop-shadow-lg focus:outline-none focus:ring-2 focus:ring-[var(--galaxy-accent)] focus:ring-offset-2 focus:ring-offset-transparent rounded-full"
        style={{
          filter: `drop-shadow(0 0 ${isHovered ? 20 : 10}px var(--galaxy-accent))`,
        }}
        role="button"
        aria-label={`Interactive ${id} element`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        <defs>
          <linearGradient id={`gradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--galaxy-accent)" />
            <stop offset="100%" stopColor="var(--galaxy-secondary)" />
          </linearGradient>
          <filter id={`glow-${id}`}>
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <motion.path
          d={path}
          fill="none"
          stroke={`url(#gradient-${id})`}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#glow-${id})`}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{
            pathLength: 1,
            opacity: 1,
            strokeWidth: isHovered ? 3 : 2,
          }}
          transition={{
            pathLength: { duration: 1.5, ease: "easeInOut" },
            strokeWidth: { duration: 0.2 },
          }}
        />
      </svg>
    </motion.div>
  );
}

interface FloatingSVGsProps {
  onPulse?: (position: { x: number; y: number }) => void;
  isMobile?: boolean;
}

export default function FloatingSVGs({
  onPulse,
  isMobile = false,
}: FloatingSVGsProps) {
  const svgPaths = [
    {
      id: "star-1",
      path: "M50 10 L55 40 L85 40 L62 58 L68 88 L50 70 L32 88 L38 58 L15 40 L45 40 Z",
      position: { x: 15, y: 20 },
    },
    {
      id: "circle-1",
      path: "M50 20 A30 30 0 1 1 50 19.9",
      position: { x: 80, y: 30 },
    },
    {
      id: "spiral-1",
      path: "M50 50 Q60 40 70 50 T90 50 Q80 60 70 50 T50 50",
      position: { x: 25, y: 60 },
    },
    {
      id: "star-2",
      path: "M50 10 L55 40 L85 40 L62 58 L68 88 L50 70 L32 88 L38 58 L15 40 L45 40 Z",
      position: { x: 70, y: 70 },
    },
  ];

  return (
    <div className="fixed inset-0 z-10 pointer-events-none">
      {svgPaths.map((svg) => (
        <FloatingSVG
          key={svg.id}
          id={svg.id}
          path={svg.path}
          position={svg.position}
          size={isMobile ? 40 : 60}
          onPulse={onPulse}
          isMobile={isMobile}
        />
      ))}
    </div>
  );
}

