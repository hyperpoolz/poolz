"use client";

import { PropsWithChildren } from "react";

type TooltipProps = PropsWithChildren<{
  text: string;
  className?: string;
  side?: "top" | "bottom" | "left" | "right";
}>;

export default function Tooltip({ text, className = "", side = "top", children }: TooltipProps) {
  const sideClasses =
    side === "top"
      ? "bottom-full left-1/2 -translate-x-1/2 mb-2"
      : side === "bottom"
      ? "top-full left-1/2 -translate-x-1/2 mt-2"
      : side === "left"
      ? "right-full top-1/2 -translate-y-1/2 mr-2"
      : "left-full top-1/2 -translate-y-1/2 ml-2";

  return (
    <span className={`relative inline-flex group ${className}`}>
      {children}
      <span
        className={`pointer-events-none absolute ${sideClasses} z-20 hidden whitespace-pre rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground shadow-sm group-hover:block`}
      >
        {text}
      </span>
    </span>
  );
}


