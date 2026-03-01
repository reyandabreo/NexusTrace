import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date in a compact way to prevent overflow in cards
 * @param date - Date string or number
 * @param includeTime - Whether to include time (default: false)
 * @returns Formatted date string
 */
export function formatCompactDate(date: string | number, includeTime: boolean = false): string {
  const d = new Date(date);
  
  if (isNaN(d.getTime())) {
    return 'N/A';
  }
  
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  };
  
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
    options.hour12 = false;
  }
  
  return d.toLocaleDateString('en-US', options);
}

/**
 * Format a date relative to now (e.g., "Today", "Yesterday", or date)
 * @param date - Date string or number  
 * @returns Formatted date string
 */
export function formatRelativeDate(date: string | number): string {
  const d = new Date(date);
  
  if (isNaN(d.getTime())) {
    return 'N/A';
  }
  
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) {
    return 'Today';
  }
  
  if (diffInDays === 1) {
    return 'Yesterday';
  }
  
  return d.toLocaleDateString('en-US', { 
    day: '2-digit', 
    month: 'short',
    year: diffInDays > 365 ? 'numeric' : undefined
  });
}
