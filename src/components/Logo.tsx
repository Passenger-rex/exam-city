import React from "react";

export function Logo({
  className = "",
  onClick,
}: {
  className?: string;
  onClick?: () => void;
}) {
  return (
    <span
      className={`inline-flex items-center font-extrabold tracking-tighter transition-opacity lowercase ${onClick ? "cursor-pointer hover:opacity-90" : ""} ${className}`}
      onClick={onClick}
    >
      <span className="text-primary leading-none" style={{ fontSize: "1em" }}>
        exam cit
      </span>
      <svg
        className="text-on-surface"
        style={{
          width: "0.85em",
          height: "0.85em",
          transform: "translateY(0.15em)",
          marginLeft: "0.02em",
        }}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="21 4 9 20 2 12" />
      </svg>
    </span>
  );
}
