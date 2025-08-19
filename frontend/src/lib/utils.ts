import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function fetchTokenPriceUsd(coingeckoId: string): Promise<number | null> {
  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoId}&vs_currencies=usd`, {
      cache: "no-store",
    });
    const data = await res.json();
    const price = data?.[coingeckoId]?.usd;
    return typeof price === "number" ? price : null;
  } catch {
    return null;
  }
}
