"use client";

import React, { useEffect, useRef, useState } from "react";

interface ScrollRevealProps {
  children: React.ReactNode;
  direction?: "up" | "down" | "left" | "right" | "fade";
  delay?: number; // ms
  duration?: number; // ms
  threshold?: number;
  className?: string;
}

export function ScrollReveal({
  children,
  direction = "up",
  delay = 0,
  duration = 700,
  threshold = 0.05,
  className = "",
}: ScrollRevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      setIsVisible(true);
      return;
    }

    // Fallback de seguridad: NUNCA dejar el contenido invisible si IntersectionObserver falla o tarda
    const safetyTimer = setTimeout(() => {
      setIsVisible(true);
    }, Math.max(delay + 150, 300));

    // Si el navegador no soporta IntersectionObserver, mostrar directamente
    if (typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return () => clearTimeout(safetyTimer);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.01,
        rootMargin: "80px 0px 80px 0px", // Margen amplio positivo para dispararse de inmediato al aproximarse
      }
    );

    observer.observe(el);

    return () => {
      clearTimeout(safetyTimer);
      observer.disconnect();
    };
  }, [delay, threshold]);

  const getTransformStyle = () => {
    if (isVisible) return "translate-x-0 translate-y-0 opacity-100 scale-100";

    switch (direction) {
      case "up":
        return "translate-y-8 opacity-0 scale-[0.98]";
      case "down":
        return "-translate-y-8 opacity-0 scale-[0.98]";
      case "left":
        return "translate-x-8 opacity-0";
      case "right":
        return "-translate-x-8 opacity-0";
      case "fade":
      default:
        return "opacity-0 scale-95";
    }
  };

  return (
    <div
      ref={ref}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
      }}
      className={`transition-all ease-out transform-gpu will-change-transform ${getTransformStyle()} ${className}`}
    >
      {children}
    </div>
  );
}

