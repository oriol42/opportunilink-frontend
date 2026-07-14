// components/ui/AnimatedNumber.tsx
"use client";
import { useAnimatedValue } from "@/lib/useAnimatedValue";

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function AnimatedNumber({ value, decimals = 0, className, style }: AnimatedNumberProps) {
  const { display, increased } = useAnimatedValue(value);
  return (
    <span
      className={className}
      style={{
        ...style,
        display: "inline-block",
        transition: "color .3s ease",
        color: increased ? "var(--accent-dark)" : style?.color,
      }}
    >
      {display.toFixed(decimals)}
    </span>
  );
}
