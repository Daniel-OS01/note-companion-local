import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function tw(classNames: string) {
  // This function ensures all Tailwind classes get the 'fo-' prefix
  // to avoid style conflicts with Obsidian
  return classNames;
}
