import React from "react";
import { Monitor, Code2, Terminal, Cpu } from "lucide-react";

type Item = {
  key: string;
  label: string;
  hint: string;
  Icon: React.ElementType;
  accent: "cyan" | "magenta" | "yellow" | "purple";
};

const ITEMS: Item[] = [
  { key: "react", label: "REACT", hint: "UI + State", Icon: Code2, accent: "cyan" },
  { key: "vscode", label: "VS_CODE", hint: "Editor", Icon: Monitor, accent: "blue" as any }, // fallback handled
  { key: "bash", label: "BASH", hint: "Terminal", Icon: Terminal, accent: "yellow" },
  { key: "logic", label: "LOGIC", hint: "Game loop", Icon: Cpu, accent: "purple" },
];

function accentStyles(accent: Item["accent"]) {
  switch (accent) {
    case "cyan":
      return {
        ring: "hover:border-[rgba(25,242,255,0.40)]",
        icon: "group-hover:text-[#19f2ff]",
        chip: "border-[rgba(25,242,255,0.35)] text-[#19f2ff]",
      };
    case "magenta":
      return {
        ring: "hover:border-[rgba(255,49,201,0.40)]",
        icon: "group-hover:text-[#ff31c9]",
        chip: "border-[rgba(255,49,201,0.35)] text-[#ff31c9]",
      };
    case "yellow":
      return {
        ring: "hover:border-[rgba(255,232,90,0.40)]",
        icon: "group-hover:text-[#ffe85a]",
        chip: "border-[rgba(255,232,90,0.35)] text-[#ffe85a]",
      };
    case "purple":
    default:
      return {
        ring: "hover:border-[rgba(165,70,255,0.45)]",
        icon: "group-hover:text-[#a546ff]",
        chip: "border-[rgba(165,70,255,0.35)] text-[#a546ff]",
      };
  }
}

export const TechStackDisplay = () => {
  return (
    <div className="max-w-[520px]">
      <div className="jules-panel p-4">
        {/* LEDs (como Jules) */}
        <div className="jules-leds">
          <span className="jules-led led-magenta" />
          <span className="jules-led led-yellow" />
          <span className="jules-led led-cyan" />
        </div>

        {/* Header mini */}
        <div className="flex items-center justify-between gap-4 pr-10">
          <div className="min-w-0">
            <div className="jules-field-label">powered by</div>
            <div className="jules-title text-sm mt-1">TOOLCHAIN</div>
          </div>

          <div className="jules-chip">LIVE</div>
        </div>

        <div className="jules-divider my-4" />

        {/* Slots */}
        <div className="grid grid-cols-4 gap-3">
          {ITEMS.map((it) => {
            const a = accentStyles(it.accent);
            const Icon = it.Icon;

            return (
              <div
                key={it.key}
                className="group select-none"
                title={it.hint}
              >
                <div
                  className={[
                    "jules-panel-soft p-3",
                    "flex flex-col items-center justify-center gap-2",
                    "border transition-colors",
                    "border-[rgba(255,255,255,0.10)]",
                    a.ring,
                  ].join(" ")}
                >
                  <Icon
                    size={22}
                    className={[
                      "text-white/60 transition-colors",
                      a.icon,
                    ].join(" ")}
                  />

                  <div className="text-[10px] font-mono tracking-[0.20em] text-white/60 group-hover:text-white/85 transition-colors">
                    {it.label}
                  </div>

                  {/* mini chip */}
                  <div
                    className={[
                      "text-[9px] font-mono tracking-[0.16em] uppercase",
                      "px-2 py-[3px] rounded-full border",
                      "bg-white/[0.03]",
                      a.chip,
                      "opacity-80 group-hover:opacity-100 transition-opacity",
                    ].join(" ")}
                  >
                    {it.hint}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* footer micro text */}
        <div className="mt-4 text-white/55 font-mono text-[11px]">
          More time for the code you <span className="text-white/85 font-semibold">want</span> to write.
        </div>
      </div>
    </div>
  );
};
