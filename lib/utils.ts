import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Extracts the first word from a name string
 * @param name - The full name string
 * @returns The first word of the name, or the original name if it's a single word
 */
export function getFirstName(name: string): string {
  if (!name) return "";
  return name.trim().split(/\s+/)[0];
}
