// lib/utils/cn.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combine Tailwind class names with conditional logic and proper merge behavior.
 * Late classes override earlier ones (e.g. cn("p-2", "p-4") yields "p-4").
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
