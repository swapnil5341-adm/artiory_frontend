import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || "";
  if (!envUrl || envUrl.includes("undefined")) {
    return "https://api.artiory.com";
  }
  return envUrl.replace(/\/+$/, "");
}

export const API_BASE_URL = getApiBaseUrl();
