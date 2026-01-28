import React, { useEffect, useRef, useState } from "react";

type Mode = "idle" | "play";

export default function GameDemoShowroom() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const raf = useRef<number | null>(null);
  const lastT = useRef<number>(0);

  const modeRef = useRef<Mode>("idle");
  const [mode, setMode] = useState<Mode>("idle");

  const scoreRef = useRef(0);
  const [scoreUi, setScoreUi] = useState(0);
  const scoreTickRef = useRef(0);

  const world = useRef({
    t: 0,
    speed: 260,
    floor: 0,
    gravity: 1500,
    jumpV: -600,
  });

  const player = useRef({
    x: 64,
    y: 0,
    w: 22,
    h: 28,
    vy: 0,
    onGround: true,
  });

  const spikes = useRef<{ x: number; y: number; s: number }[]>([]);
  const spawn = useRef(0.65);

  function resize() {
    const c = canvasRef.current;
    if (!c) return;
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const cssW = Math.max(320, Math.min(560, c.parentElement?.clientWidth ?? 360));
    const cssH = 220;

    c.style.width = cssW + "px";
    c.style.height = cssH + "px";
    c.width = Math.floor(cssW * dpr);
    c.height = Math.floor(cssH * dpr);

    world.current.floor = Math.floor((cssH - 52) * dpr);

    const p = player.current;
    p.y = world.current.floor - p.h * dpr;
    p.vy = 0;
    p.onGround = true;
  }

  function setModeSafe(m: Mode) {
    modeRef.current = m;
    setMode(m);
  }

  function reset() {
    const c = canvasRef.current;
    if (!c) return;
    const dpr = c.width / Number(c.style.width.replace("px", "") || c.clientWidth || 1);

    world.current.t = 0;
    world.current.speed = 260;

    const p = player.current;
    p.vy = 0;
    p.onGround = true;
    p.y = world.current.floor - p.h * dpr;

    spikes.current = [];
    spawn.current = 0.6;

    scoreRef.current = 0;
    setScoreUi(0);
    scoreTickRef.current = 0;
  }

  function jump() {
    if (modeRef.current === "idle") {
      reset();
      setModeSafe("play");
    }

    const c = canvasRef.current;
    if (!c) return;
    const dpr = c.width / Number(c.style.width.replace("px", "") || c.clientWidth || 1);

    const p = player.current;
    const w = world.current;

    if (p.onGround) {
      p.vy = w.jumpV;
      p.onGround = false;
    } else {
      // micro-boost para que se sienta responsivo en móvil
      p.vy += -80 * dpr;
    }
  }

  function collidePlayerSpike(dpr: number, sp: { x: number; y: number; s: number }) {
    const p = player.current;
    const px = p.x * dpr;
    const py = p.y;
    const pw = p.w * dpr;
    const ph = p.h * dpr;

    // AABB aproximado contra triángulo: suficiente para demo
    const sx = sp.x;
    const sy = sp.y;
    const ss = sp.s;

    return (
      px < sx + ss &&
      px + pw > sx &&
      py < sy + ss &&
      py + ph > sy
    );
  }

  function draw(ctx: CanvasRenderingContext2D, dpr: number) {
    const c = ctx.canvas;
    const W = c.width;
    const H = c.height;
    const w = world.current;
    const p = player.current;

    // BG
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#060814");
    bg.addColorStop(1, "#070A12");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // glow lines
    ctx.fillStyle = "rgba(46,233,255,.08)";
    ctx.fillRect(0, w.floor - 88 * dpr, W, 2 * dpr);
    ctx.fillStyle = "rgba(180,108,255,.08)";
    ctx.fillRect(0, w.floor - 128 * dpr, W, 2 * dpr);

    // floor
    ctx.fillStyle = "rgba(255, 0, 180, 0.18)";
    ctx.fillRect(0, w.floor, W, H - w.floor);

    // floor blocks (scroll illusion)
    ctx.strokeStyle = "rgba(46,233,255,.14)";
    ctx.lineWidth = 1.2 * dpr;
    const block = 44 * dpr;
    const gap = 10 * dpr;
    const offset = (w.t * w.speed * dpr * 0.25) % (block + gap);
    for (let x = -offset; x < W + block; x += block + gap) {
      ctx.strokeRect(x, w.floor + 10 * dpr, block, 28 * dpr);
    }

    // spikes
    for (const sp of spikes.current) {
      ctx.fillStyle = "rgba(54,255,141,.22)";
      ctx.strokeStyle = "rgba(54,255,141,.65)";
      ctx.lineWidth = 1.2 * dpr;

      ctx.beginPath();
      ctx.moveTo(sp.x, sp.y + sp.s);
      ctx.lineTo(sp.x + sp.s / 2, sp.y);
      ctx.lineTo(sp.x + sp.s, sp.y + sp.s);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // player
    const px = p.x * dpr;
    const py = p.y;
    const pw = p.w * dpr;
    const ph = p.h * dpr;

    const body = ctx.createLinearGradient(px, py, px + pw, py + ph);
    body.addColorStop(0, "rgba(46,233,255,.78)");
    body.addColorStop(1, "rgba(180,108,255,.62)");
    ctx.fillStyle = body;
    roundRect(ctx, px, py, pw, ph, 10 * dpr);
    ctx.fill();
    ctx.strokeStyle = "rgba(46,233,255,.60)";
    ctx.stroke();

    // HUD
    hud(ctx, dpr, W, scoreUi);

    // overlay
    if (modeRef.current === "idle") {
      overlay(ctx, dpr, W, H, "Demo del juego", "Tap para saltar • Así se siente el gameplay");
    }
  }

  function loop(t: number) {
    const c = canvasRef.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;

    if (!lastT.current) lastT.current = t;
    const dt = Math.min(0.033, (t - lastT.current) / 1000);
    lastT.current = t;

    const dpr = c.width / Number(c.style.width.replace("px", "") || c.clientWidth || 1);

    // Update world
    const w = world.current;
    const p = player.current;

    w.t += dt;

    if (modeRef.current === "play") {
      w.speed = Math.min(560, w.speed + dt * 14);

      // score in ref (no rerender per frame)
      scoreRef.current += Math.floor(dt * (w.speed / 10));

      // throttle UI score updates
      scoreTickRef.current += dt;
      if (scoreTickRef.current >= 0.12) {
        scoreTickRef.current = 0;
        setScoreUi(scoreRef.current);
      }

      // physics
      p.vy += w.gravity * dt;
      p.y += p.vy * dt;

      const floorTop = w.floor - p.h * dpr;
      if (p.y >= floorTop) {
        p.y = floorTop;
        p.vy = 0;
        p.onGround = true;
      } else {
        p.onGround = false;
      }

      // spawn spikes
      spawn.current -= dt;
      if (spawn.current <= 0) {
        spikes.current.push({
          x: c.width + 40 * dpr,
          y: w.floor - 18 * dpr,
          s: (14 + Math.random() * 8) * dpr,
        });
        // más rápido y más constante
        spawn.current = 0.55 + Math.random() * 0.25;
      }

      // move spikes
      for (const sp of spikes.current) {
        sp.x -= w.speed * dt * dpr;
      }
      spikes.current = spikes.current.filter((sp) => sp.x > -140 * dpr);

      // collision => reset to idle (demo)
      for (const sp of spikes.current) {
        if (collidePlayerSpike(dpr, sp)) {
          setModeSafe("idle");
          break;
        }
      }
    }

    draw(ctx, dpr);
    raf.current = requestAnimationFrame(loop);
  }

  useEffect(() => {
    resize();
    const onR = () => resize();
    window.addEventListener("resize", onR);

    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener("keydown", onKey, { passive: false });

    raf.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", onR);
      window.removeEventListener("keydown", onKey as any);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="badge">
        <span style={{ color: "var(--neon-purple)" }}>DEMO</span>
        <span>•</span>
        <span className="mono">tap para saltar</span>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <div className="inner" style={{ padding: 12 }}>
          <canvas
            ref={canvasRef}
            style={{
              width: "100%",
              height: 220,
              display: "block",
              borderRadius: 14,
              border: "1px solid rgba(46,233,255,.18)",
              background: "rgba(7,10,18,.55)",
              touchAction: "manipulation",
            }}
            onPointerDown={() => jump()}
          />

          <div className="small" style={{ marginTop: 10 }}>
            Control: <span className="kbd">tap</span> / <span className="kbd">espacio</span>
            {mode === "play" ? (
              <span> • <span className="mono">score:</span> {scoreUi}</span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

/* helpers */
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

function hud(ctx: CanvasRenderingContext2D, dpr: number, W: number, score: number) {
  const pad = 12 * dpr;
  ctx.fillStyle = "rgba(10,15,28,.60)";
  roundRect(ctx, pad, pad, 190 * dpr, 48 * dpr, 14 * dpr);
  ctx.fill();
  ctx.strokeStyle = "rgba(46,233,255,.16)";
  ctx.lineWidth = 1.2 * dpr;
  ctx.stroke();

  ctx.fillStyle = "rgba(234,242,255,.92)";
  ctx.font = `${12 * dpr}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono"`;
  ctx.fillText(`SCORE: ${score}`, pad + 14 * dpr, pad + 30 * dpr);

  // mini hint right
  ctx.fillStyle = "rgba(168,179,207,.85)";
  ctx.fillText(`TAP`, W - 68 * dpr, pad + 30 * dpr);
}

function overlay(ctx: CanvasRenderingContext2D, dpr: number, W: number, H: number, title: string, subtitle: string) {
  ctx.fillStyle = "rgba(7,10,18,.52)";
  ctx.fillRect(0, 0, W, H);

  const panelW = Math.min(W - 44 * dpr, 520 * dpr);
  const panelH = 110 * dpr;
  const x = (W - panelW) / 2;
  const y = (H - panelH) / 2;

  ctx.fillStyle = "rgba(10,15,28,.78)";
  roundRect(ctx, x, y, panelW, panelH, 18 * dpr);
  ctx.fill();
  ctx.strokeStyle = "rgba(46,233,255,.22)";
  ctx.lineWidth = 1.2 * dpr;
  ctx.stroke();

  ctx.fillStyle = "rgba(234,242,255,.95)";
  ctx.font = `700 ${18 * dpr}px ui-sans-serif, system-ui`;
  ctx.fillText(title, x + 16 * dpr, y + 44 * dpr);

  ctx.fillStyle = "rgba(168,179,207,.95)";
  ctx.font = `${12 * dpr}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono"`;
  ctx.fillText(subtitle, x + 16 * dpr, y + 72 * dpr);
}
