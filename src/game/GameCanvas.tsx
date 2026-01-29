import React, { useEffect, useRef } from "react";
import { useGameEngine } from "./useGameEngine";

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    isPlaying,
    score,
    gameOver,
    playerY,
    obstacles,
    jump,
    frameRef,
    setScore,
    setGameOver,
    playerVel,
  } = useGameEngine();

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    let gameSpeed = 5;
    const gravity = 0.6;

    // Helpers (pixel-ish)
    const W = 600;
    const H = 200;
    const groundY = H - 2;

    const clear = () => {
      // Base purple background
      ctx.fillStyle = "#0a0218";
      ctx.fillRect(0, 0, W, H);

      // Glows (radial gradients)
      const g1 = ctx.createRadialGradient(W * 0.55, H * 0.05, 10, W * 0.55, H * 0.05, 220);
      g1.addColorStop(0, "rgba(255,49,201,0.18)");
      g1.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, W, H);

      const g2 = ctx.createRadialGradient(W * 0.2, H * 0.35, 10, W * 0.2, H * 0.35, 240);
      g2.addColorStop(0, "rgba(25,242,255,0.12)");
      g2.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, W, H);

      // Vignette
      const vg = ctx.createRadialGradient(W * 0.5, H * 0.35, 40, W * 0.5, H * 0.35, 420);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(0,0,0,0.65)");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);
    };

    const drawDottedGrid = () => {
      // Dotted/pixel grid (Jules-ish)
      ctx.fillStyle = "rgba(165,70,255,0.18)";
      const step = 14;
      const dot = 2;

      for (let y = 10; y < H; y += step) {
        for (let x = 10; x < W; x += step) {
          // Random-ish sparseness
          if (((x + y) / step) % 3 === 0) continue;
          ctx.fillRect(x, y, dot, dot);
        }
      }

      // Big sparse squares (like pixel islands)
      ctx.fillStyle = "rgba(165,70,255,0.30)";
      for (let i = 0; i < 16; i++) {
        const x = (i * 37) % W;
        const y = (i * 19) % H;
        if (x < 80 && y < 60) continue;
        ctx.fillRect(x, y, 4, 4);
      }

      // Cyan/Magenta accents
      ctx.fillStyle = "rgba(25,242,255,0.55)";
      ctx.fillRect(W - 54, 28, 4, 4);
      ctx.fillStyle = "rgba(255,49,201,0.55)";
      ctx.fillRect(W - 40, 20, 4, 4);
    };

    const drawGround = () => {
      // Ground line (cyan)
      ctx.strokeStyle = "rgba(25,242,255,0.65)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(W, groundY);
      ctx.stroke();

      // Pixel teeth along ground
      ctx.fillStyle = "rgba(255,255,255,0.10)";
      for (let x = 0; x < W; x += 12) ctx.fillRect(x, groundY - 6, 6, 2);
    };

    const drawPlayer = (x: number, y: number, size: number, dead: boolean) => {
      // Pixel sprite cube
      // Outer
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(x, y, size, size);

      // Stroke
      ctx.strokeStyle = dead ? "rgba(255,49,201,0.85)" : "rgba(25,242,255,0.85)";
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);

      // Inner highlight pixels
      ctx.fillStyle = dead ? "rgba(255,49,201,0.35)" : "rgba(25,242,255,0.35)";
      ctx.fillRect(x + 4, y + 4, 4, 4);
      ctx.fillRect(x + size - 8, y + 8, 2, 2);

      // Shadow pixels
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(x + 2, y + size - 6, size - 4, 2);
    };

    const drawObstacle = (x: number, w: number, h: number) => {
      const y = H - h;

      // Base block
      ctx.fillStyle = "rgba(165,70,255,0.55)";
      ctx.fillRect(x, y, w, h);

      // Top highlight
      ctx.fillStyle = "rgba(25,242,255,0.45)";
      ctx.fillRect(x, y, w, 3);

      // Inner shading
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(x + 3, y + 6, Math.max(0, w - 6), Math.max(0, h - 10));

      // Pixel notches
      ctx.fillStyle = "rgba(255,49,201,0.35)";
      for (let i = 0; i < w; i += 10) ctx.fillRect(x + i, y + Math.min(10, h - 4), 3, 3);
    };

    const drawHUD = () => {
      // small HUD label
      ctx.font = '700 12px "JetBrains Mono", monospace';
      ctx.fillStyle = "rgba(25,242,255,0.9)";
      ctx.fillText(`SCORE: ${score}`, W - 140, 24);
    };

    const loop = () => {
      // 1) Update logic
      if (isPlaying && !gameOver) {
        playerVel.current += gravity;
        playerY.current += playerVel.current;

        // Ground clamp
        if (playerY.current > 0) {
          playerY.current = 0;
          playerVel.current = 0;
        }

        // Spawn
        if (Math.random() < 0.02) {
          obstacles.current.push({ x: W, w: 18 + Math.random() * 26, h: 26 + Math.random() * 30 });
        }

        // Move obstacles
        obstacles.current.forEach((obs) => (obs.x -= gameSpeed));
        obstacles.current = obstacles.current.filter((obs) => obs.x > -50);

        // Collisions
        obstacles.current.forEach((obs) => {
          const pX = 64;
          const pY = H - 30 - playerY.current;
          const oY = H - obs.h;

          if (pX < obs.x + obs.w && pX + 30 > obs.x && pY < oY + obs.h && pY + 30 > oY) {
            setGameOver(true);
          }
        });

        setScore((s) => s + 1);
      }

      // 2) Draw
      clear();
      drawDottedGrid();
      drawGround();

      // Player
      const pX = 64;
      const pY = H - 30 - playerY.current;
      drawPlayer(pX, pY, 30, gameOver);

      // Obstacles
      obstacles.current.forEach((obs) => drawObstacle(obs.x, obs.w, obs.h));

      drawHUD();

      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameRef.current);
  }, [isPlaying, gameOver, score, frameRef, obstacles, playerVel, playerY, setGameOver, setScore]);

  return (
    <div
      className="relative w-full h-full overflow-hidden rounded-[6px] cursor-pointer select-none"
      onClick={jump}
    >
      {/* Frame + subtle panel like Jules */}
      <div className="jules-panel p-3">
        <div className="jules-leds">
          <span className="jules-led led-magenta" />
          <span className="jules-led led-yellow" />
          <span className="jules-led led-cyan" />
        </div>

        <div className="flex items-center justify-between pr-10 mb-3">
          <div>
            <div className="jules-field-label">interactive demo</div>
            <div className="jules-title text-sm mt-1">PRESS / TAP TO JUMP</div>
          </div>
          <div className="jules-chip">LIVE</div>
        </div>

        <div className="jules-divider mb-3" />

        <div className="relative">
          <canvas
            ref={canvasRef}
            width={600}
            height={200}
            className="w-full h-full object-cover rendering-pixelated rounded-[4px]"
          />

          {/* Not playing overlay */}
          {!isPlaying && !gameOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/35 backdrop-blur-[2px]">
              <div className="jules-panel-soft px-5 py-4 text-center">
                <div className="jules-title text-base">PRESS TO START</div>
                <div className="jules-sub mt-1">SYSTEM_READY</div>
              </div>
            </div>
          )}

          {/* Game over overlay */}
          {gameOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/35 backdrop-blur-[2px]">
              <div className="jules-panel-soft px-5 py-4 text-center" style={{ borderColor: "rgba(255,49,201,0.35)" }}>
                <div className="jules-title text-base">SYSTEM_FAILURE</div>
                <div className="jules-sub mt-1">SCORE: {score}</div>
                <div className="jules-sub mt-3">TAP TO REBOOT</div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-3 text-white/55 font-mono text-[11px]">
          interactive_demo_v0.9 · collisions + gravity · 600x200
        </div>
      </div>
    </div>
  );
}
