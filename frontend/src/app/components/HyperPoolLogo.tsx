"use client";

interface HyperPoolLogoProps {
  size?: number;
  className?: string;
}

export function HyperPoolLogo({ size = 32, className = "" }: HyperPoolLogoProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 64 64" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="32" cy="32" r="30" fill="#000000"/>
      <path 
        d="M32 4 A28 28 0 0 1 32 60 A14 14 0 0 0 32 46 A14 14 0 0 1 32 18 A14 14 0 0 0 32 4 Z" 
        fill="#4ade80"
      />
      <path 
        d="M32 60 A28 28 0 0 1 32 4 A14 14 0 0 0 32 18 A14 14 0 0 1 32 46 A14 14 0 0 0 32 60 Z" 
        fill="#4ade80"
      />
    </svg>
  );
}