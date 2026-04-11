import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export const SIZE = 16;
export const FRAMES = 60;
export const ZERO_VALUE_FRAMES = Object.freeze(new Array(FRAMES).fill(0)) as readonly number[];
export const ONE_VALUE_FRAMES = Object.freeze(new Array(FRAMES).fill(1)) as readonly number[];

export function createConstantValueFrames(value: number) {
  return new Array(FRAMES).fill(value);
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
