/**
 * Animated Number - net-noir
 * Terminal-style number with phosphor highlight
 */

"use client";

import { useEffect, useState } from "react";

export function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (value !== displayValue) {
      setIsAnimating(true);
      const timeout = setTimeout(() => {
        setDisplayValue(value);
        setIsAnimating(false);
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [value]);

  return (
    <span 
      className={isAnimating ? "text-phosphor" : ""}
      style={{
        transition: 'color 0.1s ease-out',
      }}
    >
      {displayValue.toLocaleString()}
    </span>
  );
}