"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";

export interface PixelRevealLoaderProps {
  /** Poster / thumbnail image URL to reveal from blurry to sharp */
  image?: string | null;
  /** Overall generation progress (0 - 100) */
  progress: number;
}

const ROWS = 36;

/**
 * 60fps Google-level pixel-by-pixel AI image generation loader:
 * - Blurry base layer underneath
 * - Sharp image revealed row-by-row left-to-right via 6-vertex raster clip-path
 * - Additive-blended glowing fire/plasma raster write-head & firing pixel embers
 * - Live neural pixel-ignition grid across the unrevealed region
 * - Interactive pointer-move ember burst
 */
export function PixelRevealLoader({ image, progress }: PixelRevealLoaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetProgressRef = useRef(progress);
  const smoothProgressRef = useRef(progress);
  const [smoothProgress, setSmoothProgress] = useState(progress);

  useEffect(() => {
    targetProgressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let rafId = 0;
    const start = performance.now();

    const pointer = { x: -999, y: -999, active: false };

    const onPointerMove = (e: PointerEvent) => {
      const rect = parent.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = true;
    };
    const onPointerLeave = () => {
      pointer.active = false;
    };

    parent.addEventListener("pointermove", onPointerMove);
    parent.addEventListener("pointerleave", onPointerLeave);

    type Ember = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      size: number;
      palette: number;
    };

    const embers: Ember[] = [];
    const PALETTE = [
      [255, 255, 255], // hot white core
      [251, 191, 36],  // amber fire
      [249, 115, 22],  // orange blaze
      [244, 63, 94],   // rose ember
      [56, 189, 248],  // cyan AI spark
    ] as const;

    const spawnEmber = (originX: number, originY: number, burst = false) => {
      if (embers.length > 160) return;
      const angle = burst ? Math.random() * Math.PI * 2 : -Math.PI * 0.5 + (Math.random() - 0.5) * 2.2;
      const speed = (burst ? 1.4 : 0.6) + Math.random() * 1.8;
      embers.push({
        x: originX + (Math.random() - 0.5) * 14,
        y: originY + (Math.random() - 0.5) * 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.35,
        life: 0,
        maxLife: 24 + Math.random() * 28,
        size: 2 + Math.floor(Math.random() * 3),
        palette: Math.floor(Math.random() * PALETTE.length),
      });
    };

    // Background neural pixel grid cells that continuously fire/shimmer
    const gridNodes = Array.from({ length: 75 }, (_, i) => ({
      xNorm: ((i * 137 + 41) % 1000) / 1000,
      yNorm: ((i * 293 + 83) % 1000) / 1000,
      phase: (i * 0.79) % (Math.PI * 2),
      speed: 1.5 + ((i * 19) % 100) / 40,
      size: 3 + (i % 3) * 2,
      palette: i % PALETTE.length,
    }));

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const render = (now: number) => {
      const target = targetProgressRef.current;
      const current = smoothProgressRef.current;
      const next = current + (target - current) * 0.08;
      smoothProgressRef.current = Math.abs(target - next) < 0.01 ? target : next;
      setSmoothProgress(smoothProgressRef.current);

      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";

      const clamped = Math.max(0, Math.min(99.9, smoothProgressRef.current));
      const rowFloat = (clamped / 100) * ROWS;
      const rowIdx = Math.floor(rowFloat);
      const colFrac = rowFloat - rowIdx;

      const rowH = height / ROWS;
      const headX = colFrac * width;
      const headY = (rowIdx + 0.5) * rowH;

      // 1. Continuous 60fps sweeping AI energy wave across the card so it's always alive
      const waveCycle = ((now - start) % 2600) / 2600;
      const waveY = -40 + waveCycle * (height + 80);
      const waveGrad = ctx.createLinearGradient(0, waveY - 36, 0, waveY + 36);
      waveGrad.addColorStop(0, "rgba(249, 115, 22, 0)");
      waveGrad.addColorStop(0.45, "rgba(249, 115, 22, 0.14)");
      waveGrad.addColorStop(0.5, "rgba(251, 191, 36, 0.28)");
      waveGrad.addColorStop(0.55, "rgba(56, 189, 248, 0.16)");
      waveGrad.addColorStop(1, "rgba(56, 189, 248, 0)");
      ctx.fillStyle = waveGrad;
      ctx.fillRect(0, waveY - 36, width, 72);

      // 2. Firing neural pixels across the frame (stronger in unrevealed region)
      for (const g of gridNodes) {
        const gx = g.xNorm * width;
        const gy = g.yNorm * height;
        const pulse = Math.pow((Math.sin(now * 0.004 * g.speed + g.phase) + 1) / 2, 3);
        const waveBoost = Math.max(0, 1 - Math.abs(gy - waveY) / 48) * 0.7;
        const alpha = Math.min(0.85, pulse * 0.45 + waveBoost);
        if (alpha < 0.08) continue;

        const [r, gr, b] = PALETTE[g.palette];
        ctx.fillStyle = `rgba(${r}, ${gr}, ${b}, ${alpha})`;
        ctx.fillRect(Math.round(gx), Math.round(gy), g.size, g.size);
      }

      // 3. Hot fire-glow trail along the active raster row
      const trailLen = 110;
      const trailGrad = ctx.createLinearGradient(Math.max(0, headX - trailLen), headY, headX + 16, headY);
      trailGrad.addColorStop(0, "rgba(244, 63, 94, 0)");
      trailGrad.addColorStop(0.4, "rgba(249, 115, 22, 0.35)");
      trailGrad.addColorStop(0.8, "rgba(251, 191, 36, 0.75)");
      trailGrad.addColorStop(1, "rgba(255, 255, 255, 0.95)");
      ctx.fillStyle = trailGrad;
      ctx.fillRect(Math.max(0, headX - trailLen), headY - rowH * 0.55, Math.min(headX + 16, trailLen + 16), rowH * 1.1);

      // 4. Fire-bloom at the raster write-head
      const flicker = 0.85 + 0.3 * Math.sin(now * 0.02);
      const bloomR = 32 * flicker;
      const bloom = ctx.createRadialGradient(headX, headY, 1, headX, headY, bloomR);
      bloom.addColorStop(0, "rgba(255, 255, 255, 1)");
      bloom.addColorStop(0.25, "rgba(251, 191, 36, 0.85)");
      bloom.addColorStop(0.55, "rgba(249, 115, 22, 0.45)");
      bloom.addColorStop(0.85, "rgba(244, 63, 94, 0.15)");
      bloom.addColorStop(1, "rgba(244, 63, 94, 0)");
      ctx.fillStyle = bloom;
      ctx.beginPath();
      ctx.arc(headX, headY, bloomR, 0, Math.PI * 2);
      ctx.fill();

      // 5. Spawn firing pixel embers from write-head & interactive pointer
      spawnEmber(headX, headY, false);
      if (Math.random() > 0.45) spawnEmber(headX, headY, false);
      if (pointer.active) {
        spawnEmber(pointer.x, pointer.y, true);
        spawnEmber(pointer.x, pointer.y, true);
      }

      // Update & draw embers
      for (let i = embers.length - 1; i >= 0; i--) {
        const e = embers[i];
        e.x += e.vx;
        e.y += e.vy;
        e.vy -= 0.025; // slight upward fire buoyancy
        e.life += 1;
        if (e.life >= e.maxLife) {
          embers.splice(i, 1);
          continue;
        }
        const t = 1 - e.life / e.maxLife;
        const [r, g, b] = PALETTE[e.palette];
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${(t * 0.95).toFixed(2)})`;
        ctx.fillRect(Math.round(e.x), Math.round(e.y), e.size, e.size);
      }

      ctx.globalCompositeOperation = "source-over";
      rafId = requestAnimationFrame(render);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    resize();
    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      parent.removeEventListener("pointermove", onPointerMove);
      parent.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  const clamped = Math.max(0, Math.min(99.9, smoothProgress));
  const rowFloat = (clamped / 100) * ROWS;
  const rowIdx = Math.floor(rowFloat);
  const colFrac = rowFloat - rowIdx;

  const yTop = ((rowIdx / ROWS) * 100).toFixed(3);
  const yBot = (((rowIdx + 1) / ROWS) * 100).toFixed(3);
  const xPct = (colFrac * 100).toFixed(3);

  const clipPolygon = `polygon(0% 0%, 100% 0%, 100% ${yTop}%, ${xPct}% ${yTop}%, ${xPct}% ${yBot}%, 0% ${yBot}%)`;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      {/* Sharp crystal-clear layer revealed pixel-by-pixel, left-to-right, row-by-row */}
      {image && (
        <img
          src={image}
          alt=""
          className="absolute inset-0 size-full object-cover"
          style={{
            clipPath: clipPolygon,
          }}
        />
      )}
      {/* 60fps Fire-Glow & Firing Pixel Embers Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 size-full" />
    </div>
  );
}
