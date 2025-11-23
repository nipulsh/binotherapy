/**
 * Landing Page - Galaxy Theme
 *
 * DESIGN DOCUMENTATION:
 *
 * Color Palette (derived from galaxy model):
 * - Primary (#6b4cff): Deep space blue-purple - galaxy core
 * - Secondary (#9d5cff): Nebula purple-pink - spiral arms
 * - Accent (#00d4ff): Star highlight cyan-blue - bright stars
 * - Highlight (#ffb84d): Warm star glow - golden stars
 *
 * Scroll Section → Galaxy Reaction Mapping:
 * - 0-25% (Hero): Slow rotation, camera dolly out
 * - 25-60% (Content): Increased rotation, particle bursts on section reveals
 * - 60-100% (Footer/CTA): Tilt/rotate to reveal darker side, camera pan for depth
 *
 * Interactive Behaviors:
 * - Mouse hover: Subtle parallax on galaxy (camera target shifts)
 * - SVG click: Triggers 3D pulse in galaxy nearest region
 * - Mobile tap: Single tap = pulse, long-press = tooltip
 */

"use client";

import { useEffect, useRef, useState, useCallback, Suspense } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Eye, Target, Zap, TrendingUp } from "lucide-react";
import LandingBackground from "@/components/landing/landing-background";
import FloatingSVGs from "@/components/landing/floating-svgs";
import Hero from "@/components/landing/hero";
import Loader from "@/components/landing/loader";
import { GalaxyModelRef } from "@/components/landing/galaxy-model";
import { getLenis } from "@/components/lenis-provider";
import Lenis from "lenis";

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Home() {
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const galaxyRef = useRef<GalaxyModelRef | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionsRef = useRef<HTMLDivElement[]>([]);

  // Check mobile and reduced motion preferences
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    const checkReducedMotion = () => {
      setPrefersReducedMotion(
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      );
    };

    checkMobile();
    checkReducedMotion();

    window.addEventListener("resize", checkMobile);
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    mediaQuery.addEventListener("change", checkReducedMotion);

    return () => {
      window.removeEventListener("resize", checkMobile);
      mediaQuery.removeEventListener("change", checkReducedMotion);
    };
  }, []);

  // Mouse position tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        setMousePosition({
          x: (e.touches[0].clientX / window.innerWidth) * 2 - 1,
          y: -(e.touches[0].clientY / window.innerHeight) * 2 + 1,
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  // GSAP ScrollTrigger setup with Lenis integration
  useEffect(() => {
    if (prefersReducedMotion) return;

    // Wait for Lenis to be initialized
    const lenis = getLenis();
    if (!lenis) {
      // Retry after a short delay if Lenis isn't ready yet
      const timeout = setTimeout(() => {
        const retryLenis = getLenis();
        if (retryLenis) {
          setupScrollTrigger(retryLenis);
        }
      }, 100);
      return () => clearTimeout(timeout);
    }

    setupScrollTrigger(lenis);

    function setupScrollTrigger(lenisInstance: Lenis) {
      // Integrate Lenis with ScrollTrigger
      lenisInstance.on("scroll", ScrollTrigger.update);

      gsap.ticker.add((time) => {
        lenisInstance.raf(time * 1000);
      });

      gsap.ticker.lagSmoothing(0);

      // Calculate scroll progress
      const updateScrollProgress = () => {
        const scrollHeight =
          document.documentElement.scrollHeight - window.innerHeight;
        const scrollTop = lenisInstance.scroll;
        const progress = Math.min(scrollTop / scrollHeight, 1);
        setScrollProgress(progress);
      };

      // Section 1: Hero (0-25% scroll)
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top top",
        end: "25% top",
        scrub: true,
        onUpdate: () => {
          updateScrollProgress();
        },
      });

      // Section 2: Content reveal (25-60% scroll)
      ScrollTrigger.create({
        trigger: sectionsRef.current[0],
        start: "top 80%",
        end: "bottom 20%",
        scrub: true,
        onEnter: () => {
          // Trigger particle burst
          if (galaxyRef.current) {
            galaxyRef.current.setRotationSpeed(0.5);
          }
        },
        onUpdate: () => {
          updateScrollProgress();
        },
      });

      // Section 3: Footer/CTA (60-100% scroll)
      ScrollTrigger.create({
        trigger: sectionsRef.current[1],
        start: "top 80%",
        end: "bottom top",
        scrub: true,
        onUpdate: () => {
          updateScrollProgress();
        },
      });

      // Initial scroll progress
      updateScrollProgress();
    }

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      gsap.ticker.remove((time) => {
        const lenis = getLenis();
        if (lenis) {
          lenis.raf(time * 1000);
        }
      });
    };
  }, [prefersReducedMotion]);

  // Handle model ready
  const handleModelReady = useCallback((ref: GalaxyModelRef) => {
    galaxyRef.current = ref;
    // Simulate loading delay for smooth transition
    setTimeout(() => setIsLoading(false), 500);
  }, []);

  // Handle SVG pulse
  const handleSVGPulse = useCallback((position: { x: number; y: number }) => {
    if (galaxyRef.current) {
      galaxyRef.current.pulseAt(position);
    }
  }, []);

  const features = [
    {
      icon: <Eye className="h-8 w-8" />,
      title: "Depth Perception",
      description:
        "Test your ability to judge distances and spatial relationships",
      href: "/games/depth-perception",
    },
    {
      icon: <Target className="h-8 w-8" />,
      title: "Eye-Hand Coordination",
      description:
        "Improve your hand-eye coordination through precision targeting",
      href: "/games/eye-hand-coordination",
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Pursuit & Follow",
      description: "Enhance your ability to track moving objects smoothly",
      href: "/games/pursuit-follow",
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: "Saccadic Movement",
      description: "Train rapid eye movements between fixed points",
      href: "/games/saccadic-movement",
    },
  ];

  return (
    <div
      ref={containerRef}
      className="relative w-full min-h-screen overflow-x-hidden"
      style={{ backgroundColor: "#0a0a1a" }}
    >
      {/* Loading State */}
      {isLoading && <Loader />}

      {/* 3D Galaxy Background */}
      <Suspense fallback={null}>
        <LandingBackground
          scrollProgress={scrollProgress}
          mousePosition={mousePosition}
          isMobile={isMobile}
          prefersReducedMotion={prefersReducedMotion}
          onModelReady={handleModelReady}
        />
      </Suspense>

      {/* Subtle gradient overlay for text readability */}
      <div
        className="fixed inset-0 z-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(107, 76, 255, 0.1) 0%, rgba(10, 10, 26, 0.8) 70%, rgba(0, 0, 0, 0.95) 100%)",
        }}
      />

      {/* Interactive SVGs */}
      <FloatingSVGs onPulse={handleSVGPulse} isMobile={isMobile} />

      {/* Content Layer */}
      <main
        id="main-content"
        className="relative z-20 flex flex-col min-h-screen"
      >
        {/* Hero Section */}
        <Hero isMobile={isMobile} />

        {/* Features Grid Section */}
        <motion.section
          ref={(el: HTMLDivElement | null) => {
            if (el) sectionsRef.current[0] = el;
          }}
          className="container py-12 sm:py-16 md:py-20 px-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="text-center mb-8 sm:mb-12 md:mb-16"
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2
              className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white mb-2 sm:mb-4"
              style={{ color: "var(--galaxy-primary)" }}
            >
              Game Domains
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-400 font-light">
              Four specialized training areas to improve your visual skills
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-7xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="group relative p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:border-[var(--galaxy-accent)]/50 transition-all duration-300 hover:bg-white/10 hover:shadow-2xl transform hover:scale-105"
                style={{
                  boxShadow: "0 0 20px rgba(0, 212, 255, 0.1)",
                }}
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 100,
                }}
                whileHover={{
                  boxShadow: "0 0 30px rgba(0, 212, 255, 0.3)",
                }}
              >
                <div
                  className="mb-3 sm:mb-4 transition-colors"
                  style={{ color: "var(--galaxy-accent)" }}
                >
                  {feature.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-400 mb-3 sm:mb-4">
                  {feature.description}
                </p>
                <Button
                  asChild
                  variant="ghost"
                  size={isMobile ? "sm" : "default"}
                  className="w-full text-xs sm:text-sm transition-colors"
                  style={{
                    color: "var(--galaxy-accent)",
                  }}
                >
                  <Link href={feature.href}>Learn More</Link>
                </Button>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* CTA Section */}
        <motion.section
          ref={(el: HTMLDivElement | null) => {
            if (el) sectionsRef.current[1] = el;
          }}
          className="container py-12 sm:py-16 md:py-20 px-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 sm:p-8 md:p-12 text-center max-w-4xl mx-auto"
            style={{
              borderColor: "var(--galaxy-secondary)",
              boxShadow: "0 0 40px rgba(157, 92, 255, 0.2)",
            }}
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
          >
            <h2
              className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4"
              style={{ color: "var(--galaxy-primary)" }}
            >
              Start Your Visual Training Journey
            </h2>
            <p className="mb-6 sm:mb-8 text-gray-400 text-sm sm:text-base md:text-lg">
              Track your progress, improve your skills, and achieve better
              visual performance
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                asChild
                size={isMobile ? "default" : "lg"}
                className="w-full sm:w-auto text-white border-0 shadow-lg transition-all duration-300"
                style={{
                  background: `linear-gradient(to right, var(--galaxy-primary), var(--galaxy-secondary))`,
                  boxShadow: "0 10px 30px rgba(107, 76, 255, 0.4)",
                }}
              >
                <Link href="/login">Sign Up Now</Link>
              </Button>
            </motion.div>
          </motion.div>
        </motion.section>
      </main>

      {/* Motion Reduction Indicator (Accessibility) */}
      {prefersReducedMotion && (
        <div
          className="fixed bottom-4 right-4 z-30 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg text-white text-sm"
          role="status"
          aria-live="polite"
        >
          Reduced motion enabled
        </div>
      )}

      {/* Skip to main content link (Accessibility) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--galaxy-primary)] focus:text-white focus:rounded-lg"
      >
        Skip to main content
      </a>
    </div>
  );
}
