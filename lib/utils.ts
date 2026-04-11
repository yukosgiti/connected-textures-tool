import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export const SIZE = 16;
export const FRAMES = 60;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
