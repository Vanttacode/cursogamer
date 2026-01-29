import React from "react";

type BadgeColor = "blue" | "green" | "purple" | "magenta" | "cyan" | "yellow" | "neutral";

export const Badge = ({
  children,
  color = "blue",
  led = true,
}: {
  children: React.ReactNode;
  color?: BadgeColor;
  led?: boolean;
}) => {
  const map: Record<BadgeColor, { text: string; border: string; bg: string; led: string }> = {
    blue: {
      text: "text-[#7aa7ff]",
      border: "border-[rgba(122,167,255,0.28)]",
      bg: "bg-[rgba(122,167,255,0.08)]",
      led: "bg-[#7aa7ff]",
    },
    green: {
      text: "text-[#56f28f]",
      border: "border-[rgba(86,242,143,0.28)]",
      bg: "bg-[rgba(86,242,143,0.08)]",
      led: "bg-[#56f28f]",
    },
    purple: {
      text: "text-[#a546ff]",
      border: "border-[rgba(165,70,255,0.28)]",
      bg: "bg-[rgba(165,70,255,0.08)]",
      led: "bg-[#a546ff]",
    },
    magenta: {
      text: "text-[#ff31c9]",
      border: "border-[rgba(255,49,201,0.28)]",
      bg: "bg-[rgba(255,49,201,0.08)]",
      led: "bg-[#ff31c9]",
    },
    cyan: {
      text: "text-[#19f2ff]",
      border: "border-[rgba(25,242,255,0.28)]",
      bg: "bg-[rgba(25,242,255,0.08)]",
      led: "bg-[#19f2ff]",
    },
    yellow: {
      text: "text-[#ffe85a]",
      border: "border-[rgba(255,232,90,0.28)]",
      bg: "bg-[rgba(255,232,90,0.08)]",
      led: "bg-[#ffe85a]",
    },
    neutral: {
      text: "text-white/70",
      border: "border-white/15",
      bg: "bg-white/[0.04]",
      led: "bg-white/70",
    },
  };

  const s = map[color];

  return (
    <span
      className={[
        "inline-flex items-center gap-2",
        "px-3 py-1",
        "border",
        "rounded-[4px]",
        "font-mono font-semibold",
        "text-[10px]",
        "uppercase",
        "tracking-[0.18em]",
        "select-none",
        "shadow-[0_0_0_1px_rgba(0,0,0,0.75)_inset]",
        s.text,
        s.border,
        s.bg,
      ].join(" ")}
    >
      {led && <span className={`w-2 h-2 rounded-[2px] shadow-[0_0_0_1px_rgba(0,0,0,0.55)_inset] ${s.led}`} />}
      <span className="leading-none">{children}</span>
    </span>
  );
};
