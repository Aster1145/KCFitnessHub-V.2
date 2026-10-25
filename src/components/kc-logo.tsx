import React from "react";

export function KcLogo({
  className = "size-8",
  textColor = "text-white",
  badgeBg = "bg-volt",
}: {
  className?: string;
  textColor?: string;
  badgeBg?: string;
}) {
  return (
    <div className={`flex items-center gap-2.5`}>
      <span
        className={`grid ${className} place-items-center rounded-xl ${badgeBg} p-1.5 text-carbon shadow-lg shadow-volt/20`}
      >
        {/* Geometric Stylized KC Monogram */}
        <svg
          viewBox="0 0 100 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="size-full"
        >
          {/* Vertical stem of K */}
          <path
            d="M8 8 H26 V72 H8 Z"
            fill="currentColor"
          />
          {/* Upper arm forming K into top of C */}
          <path
            d="M32 46 L58 18 H92 L62 48 H44 Z"
            fill="currentColor"
          />
          <path
            d="M56 18 H92 V30 H68 Z"
            fill="currentColor"
          />
          {/* Lower arm forming K into bottom of C */}
          <path
            d="M32 46 L60 72 H94 L58 46 H42 Z"
            fill="currentColor"
          />
          <path
            d="M58 72 H94 V60 H70 Z"
            fill="currentColor"
          />
        </svg>
      </span>
      <span className={`font-display text-2xl tracking-wider ${textColor}`}>
        KC
      </span>
    </div>
  );
}

export function KcLogoIcon({ className = "size-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 80"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Vertical stem of K */}
      <rect x="10" y="10" width="16" height="60" rx="3" />
      {/* Top angled arm transitioning to C roof */}
      <path
        d="M32 42 L56 14 H90 L60 42 Z"
        strokeLinejoin="round"
      />
      <path d="M56 14 H92 V26 H66 Z" />
      {/* Bottom angled arm transitioning to C floor */}
      <path
        d="M32 42 L58 70 H92 L58 42 Z"
        strokeLinejoin="round"
      />
      <path d="M58 70 H92 V58 H68 Z" />
    </svg>
  );
}

export function InstagramIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}
