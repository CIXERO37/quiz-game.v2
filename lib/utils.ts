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

/**
 * Formats a name to fit display constraints with proper line breaking
 * @param name - The full name string
 * @param maxLength - Maximum length before breaking (default: 8)
 * @returns An object with formatted name and whether it was broken
 */
export function formatDisplayName(name: string, maxLength: number = 8): {
  displayName: string;
  isBroken: boolean;
} {
  if (!name) return { displayName: "", isBroken: false };
  
  const firstName = getFirstName(name);
  
  // If first name is short enough, return as is
  if (firstName.length <= maxLength) {
    return { displayName: firstName, isBroken: false };
  }
  
  // For very long names, be more aggressive with breaking
  // Force break at maxLength or earlier for better fit
  let breakPoint = Math.min(maxLength, Math.ceil(firstName.length / 2));
  
  // Try to find a better break point within the first maxLength characters
  const searchLimit = Math.min(maxLength, firstName.length - 1);
  
  for (let i = Math.max(3, breakPoint - 2); i <= searchLimit; i++) {
    const current = firstName[i].toLowerCase();
    const prev = firstName[i - 1].toLowerCase();
    
    // Look for natural break points
    if (
      (!'aeiou'.includes(prev) && 'aeiou'.includes(current)) || // consonant-vowel
      i === Math.floor(firstName.length / 2) // middle
    ) {
      breakPoint = i;
      break;
    }
  }
  
  // Ensure break point doesn't exceed maxLength
  breakPoint = Math.min(breakPoint, maxLength);
  
  // Ensure we don't have tiny parts
  if (breakPoint < 3) breakPoint = Math.min(4, firstName.length - 2);
  if (firstName.length - breakPoint < 2) breakPoint = firstName.length - 2;
  
  const firstPart = firstName.substring(0, breakPoint);
  const secondPart = firstName.substring(breakPoint);
  
  // If second part is still too long, truncate it with ellipsis
  const maxSecondPartLength = maxLength + 2;
  const finalSecondPart = secondPart.length > maxSecondPartLength 
    ? secondPart.substring(0, maxSecondPartLength) + '...'
    : secondPart;
  
  return {
    displayName: `${firstPart}\n${finalSecondPart}`,
    isBroken: true
  };
}