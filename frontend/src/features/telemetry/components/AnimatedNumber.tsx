/**
 * Animated Number Component
 * Formats numbers with locale string
 */

export function AnimatedNumber({ value }: { value: number }) {
  return <span>{value.toLocaleString()}</span>;
}