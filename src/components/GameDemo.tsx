import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Mini-juego: Neon Runner
 * - Jugador salta obstáculos (aliens) y puede "pasar bajo" UFOs (son altos)
 * - Score por distancia + bonus por evitar obstáculos
 * - 3 vidas, speed aumenta progresivamente
 * - Canvas 2D con estética cyberpunk
 */

type GameState = "idle" | "running" | "gameover";

type Obstacle = {
  kind: "alien" | "ufo";
  x: number;
  y: number;
  w: number;
  h: number;
  passed?: boolean;
};

export default function GameDemo() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const rafRef = useRef<number | null>(null);
  const lastTRef = useRef<number>(0);

  const stateRef = useRef<GameState>("idle");
  const [state, setState] = useState<GameState>("idle");

  const [score, setScore] = useState(0);
  const [high, setHigh] = useState(() => {
    try {
      return Number(localStorage.getItem("neonrunner_high") ?? 0);
    } catch {
      return 0;
    }
  });
  const [lives, setLives] = useState(3);

  // physics
  const playerRef = useRef({
    x: 90,
    y: 0,
    w: 22,
    h: 28,
    vy: 0,
    onGround: true,
  });

  const worldRef = useRef({
    t: 0,
    speed: 260, // px/s
    gravity: 1400,
    jumpV: -540,
    floorY: 0, // computed after resize
    shake: 0,
  });

  const obstaclesRef = useRef<Obstacle[]>([]);
  const spawnRef = useRef({
    nextIn: 0.8, // seconds
    ufoChance: 0.25,
  });

  // stars background
  const starsRef = useRef<{ x: number; y: number; r: number; v: number }[]>([]);

  const ui = useMemo(() => {
    return {
      title: "DEMO JUGABLE",
      subtitle: "Neon Runner • React + Canvas",
    };
  }, []);

  function setGameState(s: GameState) {
    stateRef.current = s;
    setState(s);
  }

  function resetGame() {
    const p = playerRef.current;
    p.y = 0;
    p.vy = 0;
    p.onGround = true;

    const w = worldRef.current;
    w.t = 0;
    w.speed = 260;
    w.shake = 0;

    obstaclesRef.current = [];
    spawnRef.current.nextIn = 0.65;
    spawnRef.current.ufoChance = 0.25;

    setScore(0);
    setLives(3);
  }

  function startGame() {
    if (stateRef.current === "running") return;
    if (stateRef.current === "gameover") resetGame();
    setGameState("running");
  }

  function gameOver() {
    setGameState("gameover");
    setHigh((prev) => {
      const next = Math.max(prev, score);
      try {
        localStorage.setItem("neonrunner_high", String(next));
      } catch {}
      return next;
    });
  }

  function loseLife() {
    setLives((prev) => {
      const next = prev - 1;
      if (next <= 0) {
        // will go gameover in effect tick after state updates, but do it now too
        gameOver();
        return 0;
      }
      return next;
    });
    worldRef.current.shake = 0.18;
  }

  function jump() {
    const s = stateRef.current;
    if (s === "idle") startGame();
    if (s !== "running") return;

    const p = playerRef.current;
    const w = worldRef.current;
    if (p.onGround) {
      p.vy = w.jumpV;
      p.onGround = false;
    }
  }

  function fastDrop(on: boolean) {
    // optional: makes it feel more game-like
    const p = playerRef.current;
    if (!p.onGround) {
      // slight multiplier
      p.vy += on ? 120 : 0;
    }
  }

  function collide(a: { x: number; y: number; w: number; h: number }, b: Obstacle) {
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    );
  }

  function ensureCanvasSize() {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const rect = wrap.getBoundingClientRect();

    const cssW = Math.max(320, Math.floor(rect.width));
    const cssH = 300;

    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";

    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);

    const w = worldRef.current;
    // floor placement
    w.floorY = Math.floor((cssH - 54) * dpr);

    // init stars if empty
    if (starsRef.current.length === 0) {
      const count = 70;
      const arr: { x: number; y: number; r: number; v: number }[] = [];
      for (let i = 0; i < count; i++) {
        arr.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: 0.6 + Math.random() * 1.8,
          v: 16 + Math.random() * 38,
        });
      }
      starsRef.current = arr;
    }
  }

  function draw(ctx: CanvasRenderingContext2D, dt: number) {
    const canvas = ctx.canvas;
    const dpr = canvas.width / Number(canvas.style.width.replace("px", "") || canvas.clientWidth || 1);

    const W = canvas.width;
    const H = canvas.height;

    const w = worldRef.current;
    const p = playerRef.current;
    const obs = obstaclesRef.current;

    // screenshake
    let shakeX = 0, shakeY = 0;
    if (w.shake > 0) {
      w.shake = Math.max(0, w.shake - dt);
      const amp = 6 * dpr * (w.shake / 0.18);
      shakeX = (Math.random() - 0.5) * amp;
      shakeY = (Math.random() - 0.5) * amp;
    }

    ctx.save();
    ctx.translate(shakeX, shakeY);

    // background gradient
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#060814");
    bg.addColorStop(1, "#070A12");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // stars
    for (const s of starsRef.current) {
      s.x -= s.v * dt * dpr * 0.9;
      if (s.x < -10) {
        s.x = W + Math.random() * 60;
        s.y = Math.random() * H;
      }
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * dpr, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(234,242,255,0.9)";
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // neon far line
    ctx.strokeStyle = "rgba(46,233,255,.18)";
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    ctx.moveTo(0, w.floorY - 70 * dpr);
    ctx.lineTo(W, w.floorY - 70 * dpr);
    ctx.stroke();

    // floor + platforms (magenta blocks vibe)
    const floorH = 46 * dpr;
    ctx.fillStyle = "rgba(180,108,255,0.10)";
    ctx.fillRect(0, w.floorY, W, H - w.floorY);

    // platform blocks
    const blockW = 42 * dpr;
    const blockH = 30 * dpr;
    const gap = 8 * dpr;
    // pseudo scrolling blocks based on time
    const offset = (w.t * w.speed * dpr) % (blockW + gap);
    for (let x = -offset; x < W + blockW; x += blockW + gap) {
      const heightVar = ((Math.sin((x / (blockW + gap)) * 0.9 + w.t * 0.6) + 1) / 2) * 18 * dpr;
      ctx.fillStyle = "rgba(255, 0, 180, 0.25)";
      ctx.fillRect(x, w.floorY + (floorH - blockH - heightVar), blockW, blockH + heightVar);

      ctx.strokeStyle = "rgba(46,233,255,.14)";
      ctx.lineWidth = 1.2 * dpr;
      ctx.strokeRect(x, w.floorY + (floorH - blockH - heightVar), blockW, blockH + heightVar);
    }

    // obstacles
    for (const o of obs) {
      if (o.kind === "alien") {
        // green skull-ish
        const g = ctx.createRadialGradient(o.x + o.w * 0.35, o.y + o.h * 0.35, 2 * dpr, o.x + o.w * 0.35, o.y + o.h * 0.35, o.w);
        g.addColorStop(0, "rgba(54,255,141,.95)");
        g.addColorStop(1, "rgba(54,255,141,.15)");
        ctx.fillStyle = g;
        roundRect(ctx, o.x, o.y, o.w, o.h, 10 * dpr);
        ctx.fill();

        ctx.strokeStyle = "rgba(54,255,141,.55)";
        ctx.lineWidth = 1.5 * dpr;
        ctx.stroke();

        // eyes
        ctx.fillStyle = "rgba(7,10,18,.85)";
        ctx.beginPath();
        ctx.arc(o.x + o.w * 0.35, o.y + o.h * 0.45, 3.2 * dpr, 0, Math.PI * 2);
        ctx.arc(o.x + o.w * 0.68, o.y + o.h * 0.45, 3.2 * dpr, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // UFO: purple disc with cyan glow
        ctx.save();
        const glow = ctx.createRadialGradient(o.x + o.w / 2, o.y + o.h / 2, 6 * dpr, o.x + o.w / 2, o.y + o.h / 2, o.w);
        glow.addColorStop(0, "rgba(180,108,255,.55)");
        glow.addColorStop(1, "rgba(180,108,255,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.ellipse(o.x + o.w / 2, o.y + o.h / 2, o.w * 0.75, o.h * 0.9, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "rgba(180,108,255,.35)";
        ctx.beginPath();
        ctx.ellipse(o.x + o.w / 2, o.y + o.h * 0.65, o.w * 0.55, o.h * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "rgba(46,233,255,.35)";
        ctx.lineWidth = 1.4 * dpr;
        ctx.beginPath();
        ctx.ellipse(o.x + o.w / 2, o.y + o.h * 0.65, o.w * 0.55, o.h * 0.22, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
      }
    }

    // player
    const px = p.x * dpr;
    const py = p.y;
    const pw = p.w * dpr;
    const ph = p.h * dpr;

    // neon outline
    ctx.fillStyle = "rgba(46,233,255,.08)";
    roundRect(ctx, px - 6 * dpr, py - 6 * dpr, pw + 12 * dpr, ph + 12 * dpr, 12 * dpr);
    ctx.fill();

    const body = ctx.createLinearGradient(px, py, px + pw, py + ph);
    body.addColorStop(0, "rgba(46,233,255,.65)");
    body.addColorStop(1, "rgba(180,108,255,.55)");
    ctx.fillStyle = body;
    roundRect(ctx, px, py, pw, ph, 10 * dpr);
    ctx.fill();

    ctx.strokeStyle = "rgba(46,233,255,.55)";
    ctx.lineWidth = 1.2 * dpr;
    ctx.stroke();

    // HUD
    const s = stateRef.current;
    hud(ctx, {
      W,
      dpr,
      score,
      high,
      lives,
      state: s,
    });

    // overlay prompts
    if (s === "idle") {
      overlay(ctx, W, H, dpr, "Presiona ESPACIO para jugar", "Saltar obstáculos • Score infinito");
    }
    if (s === "gameover") {
      overlay(ctx, W, H, dpr, "Game Over", "Presiona ESPACIO para reiniciar");
    }

    ctx.restore();
  }

  function step(t: number) {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !canvasRef.current) return;

    if (!lastTRef.current) lastTRef.current = t;
    const dt = Math.min(0.033, (t - lastTRef.current) / 1000);
    lastTRef.current = t;

    const s = stateRef.current;
    const w = worldRef.current;
    const p = playerRef.current;
    const canvas = canvasRef.current;

    const dpr = canvas.width / Number(canvas.style.width.replace("px", "") || canvas.clientWidth || 1);

    if (s === "running") {
      w.t += dt;

      // speed ramp
      w.speed = Math.min(560, w.speed + dt * 10.5);

      // score: distance-based
      setScore((prev) => prev + Math.floor(dt * (w.speed / 12)));

      // gravity
      p.vy += w.gravity * dt;
      p.y += p.vy * dt;

      // floor collision
      const floorTop = w.floorY - p.h * dpr;
      if (p.y >= floorTop) {
        p.y = floorTop;
        p.vy = 0;
        p.onGround = true;
      } else {
        p.onGround = false;
      }

      // spawn obstacles
      spawnRef.current.nextIn -= dt;
      if (spawnRef.current.nextIn <= 0) {
        const kind: Obstacle["kind"] = Math.random() < spawnRef.current.ufoChance ? "ufo" : "alien";

        const baseX = canvas.width + 60 * dpr;
        if (kind === "alien") {
          const o: Obstacle = {
            kind,
            x: baseX,
            y: w.floorY - 30 * dpr,
            w: 26 * dpr,
            h: 26 * dpr,
          };
          obstaclesRef.current.push(o);
        } else {
          // UFO floats higher: player can pass under (if not jumping)
          const o: Obstacle = {
            kind,
            x: baseX,
            y: w.floorY - 110 * dpr,
            w: 46 * dpr,
            h: 24 * dpr,
          };
          obstaclesRef.current.push(o);
        }

        // next spawn time depends on speed
        const min = 0.55;
        const max = 1.15;
        const speedFactor = (w.speed - 260) / (560 - 260); // 0..1
        const base = max - speedFactor * 0.4;

        spawnRef.current.nextIn = clamp(base + (Math.random() - 0.5) * 0.25, min, max);
        spawnRef.current.ufoChance = clamp(0.22 + speedFactor * 0.18, 0.22, 0.42);
      }

      // move obstacles + collisions
      const playerBox = { x: p.x * dpr, y: p.y, w: p.w * dpr, h: p.h * dpr };
      for (const o of obstaclesRef.current) {
        o.x -= w.speed * dt * dpr;

        if (!o.passed && o.x + o.w < playerBox.x) {
          o.passed = true;
          setScore((prev) => prev + (o.kind === "ufo" ? 55 : 35));
        }

        if (collide(playerBox, o)) {
          // "invulnerability" by removing obstacle & losing life
          obstaclesRef.current = obstaclesRef.current.filter((x) => x !== o);
          loseLife();
          break;
        }
      }

      // cleanup
      obstaclesRef.current = obstaclesRef.current.filter((o) => o.x > -200 * dpr);

      // if lives hit 0 (async set), state may already be gameover
      if (stateRef.current === "gameover") {
        // no-op
      }
    }

    draw(ctx, dt);
    rafRef.current = requestAnimationFrame(step);
  }

  useEffect(() => {
    ensureCanvasSize();
    const onResize = () => ensureCanvasSize();
    window.addEventListener("resize", onResize);

    // start animation loop
    rafRef.current = requestAnimationFrame(step);

    return () => {
      window.removeEventListener("resize", onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // controls
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        if (stateRef.current === "gameover") {
          resetGame();
          setGameState("running");
          return;
        }
        jump();
      }
      if (e.code === "ArrowDown") {
        fastDrop(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "ArrowDown") fastDrop(false);
    };

    window.addEventListener("keydown", onKeyDown, { passive: false });
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown as any);
      window.removeEventListener("keyup", onKeyUp as any);
    };
  }, []);

  return (
    <div ref={wrapRef}>
      <div className="badge">
        <span style={{ color: "var(--neon-purple)" }}>{ui.title}</span>
        <span>•</span>
        <span className="mono">{ui.subtitle}</span>
      </div>

      <div style={{ marginTop: 12 }} className="card">
        <div className="inner" style={{ padding: 12 }}>
          <canvas
            ref={canvasRef}
            role="img"
            aria-label="Mini-juego demo"
            style={{
              width: "100%",
              height: 300,
              display: "block",
              borderRadius: 14,
              border: "1px solid rgba(46,233,255,.18)",
              background: "rgba(7,10,18,.55)",
            }}
            onPointerDown={() => {
              if (stateRef.current === "gameover") {
                resetGame();
                setGameState("running");
              } else {
                jump();
              }
            }}
          />

          <div
            style={{
              marginTop: 10,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <div className="small">
              Control: <span className="kbd">ESPACIO</span> / <span className="kbd">↑</span> para saltar • click/tap para saltar
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              {state !== "running" ? (
                <button className="btn btnPrimary" type="button" onClick={startGame}>
                  {state === "gameover" ? "Reiniciar" : "Jugar"}
                </button>
              ) : (
                <button
                  className="btn"
                  type="button"
                  onClick={() => {
                    setGameState("idle");
                  }}
                >
                  Pausar
                </button>
              )}
            </div>
          </div>

          <div className="small" style={{ marginTop: 8, opacity: 0.9 }}>
            Objetivo: esquiva <span className="mono" style={{ color: "var(--neon-green)" }}>aliens</span> y pasa bajo <span className="mono" style={{ color: "var(--neon-purple)" }}>UFOs</span>.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- drawing helpers ---------- */

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function hud(
  ctx: CanvasRenderingContext2D,
  p: { W: number; dpr: number; score: number; high: number; lives: number; state: GameState }
) {
  const { W, dpr, score, high, lives } = p;

  const pad = 12 * dpr;
  const boxW = 210 * dpr;
  const boxH = 58 * dpr;

  // HUD background
  ctx.fillStyle = "rgba(10,15,28,.55)";
  roundRect(ctx, pad, pad, boxW, boxH, 14 * dpr);
  ctx.fill();
  ctx.strokeStyle = "rgba(46,233,255,.18)";
  ctx.lineWidth = 1.2 * dpr;
  ctx.stroke();

  ctx.fillStyle = "rgba(234,242,255,.92)";
  ctx.font = `${12 * dpr}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono"`;
  ctx.fillText(`SCORE: ${score}`, pad + 14 * dpr, pad + 24 * dpr);
  ctx.fillStyle = "rgba(168,179,207,.95)";
  ctx.fillText(`HIGH : ${high}`, pad + 14 * dpr, pad + 44 * dpr);

  // lives top-right
  const livesW = 128 * dpr;
  roundRect(ctx, W - pad - livesW, pad, livesW, boxH, 14 * dpr);
  ctx.fillStyle = "rgba(10,15,28,.55)";
  ctx.fill();
  ctx.strokeStyle = "rgba(180,108,255,.20)";
  ctx.stroke();

  ctx.fillStyle = "rgba(234,242,255,.9)";
  ctx.fillText("LIVES:", W - pad - livesW + 14 * dpr, pad + 24 * dpr);

  for (let i = 0; i < 3; i++) {
    const x = W - pad - livesW + 68 * dpr + i * 16 * dpr;
    const y = pad + 18 * dpr;
    ctx.globalAlpha = i < lives ? 1 : 0.22;
    ctx.fillStyle = "rgba(54,255,141,.85)";
    ctx.beginPath();
    ctx.arc(x, y, 4.2 * dpr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function overlay(ctx: CanvasRenderingContext2D, W: number, H: number, dpr: number, title: string, subtitle: string) {
  ctx.fillStyle = "rgba(7,10,18,.55)";
  ctx.fillRect(0, 0, W, H);

  const panelW = Math.min(W - 60 * dpr, 520 * dpr);
  const panelH = 140 * dpr;
  const x = (W - panelW) / 2;
  const y = (H - panelH) / 2;

  ctx.fillStyle = "rgba(10,15,28,.75)";
  roundRect(ctx, x, y, panelW, panelH, 18 * dpr);
  ctx.fill();
  ctx.strokeStyle = "rgba(46,233,255,.22)";
  ctx.lineWidth = 1.2 * dpr;
  ctx.stroke();

  ctx.fillStyle = "rgba(234,242,255,.95)";
  ctx.font = `700 ${20 * dpr}px ui-sans-serif, system-ui`;
  ctx.fillText(title, x + 18 * dpr, y + 54 * dpr);

  ctx.fillStyle = "rgba(168,179,207,.95)";
  ctx.font = `${13 * dpr}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono"`;
  ctx.fillText(subtitle, x + 18 * dpr, y + 84 * dpr);

  ctx.fillStyle = "rgba(46,233,255,.65)";
  ctx.font = `${12 * dpr}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono"`;
  ctx.fillText("tap/click para saltar", x + 18 * dpr, y + 110 * dpr);
}
