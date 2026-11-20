import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Standard className merger. Tailwind v4 utilities are merged by tailwind-merge
 * so a later override (e.g. `px-2` after `px-4`) actually wins instead of both
 * landing in the class string and fighting in the cascade.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
