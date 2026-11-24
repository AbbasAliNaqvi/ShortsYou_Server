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
 * Google-level 60fps pixel-by-pixel, left-to-right, row-by-row AI image reveal:
 * - Blurry base layer underneath
 * - Sharp image revealed row-by-row left-to-right via 6-vertex raster clip-path
 * - 60fps Canvas glowing raster write-head + crystallizing micro-pixels
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

    type Spark = {
      dx: number;
      dy: number;
      size: number;
      phase: number;
      speed: number;
      colorIdx: number;
    };

    const sparks: Spark[] = Array.from({ length: 48 }, (_, i) => ({
      dx: ((i * 37) % 56) - 28,
      dy: ((i * 53) % 24) - 12,
      size: 2 + (i % 3),
      phase: (i * 0.61) % (Math.PI * 2),
      speed: 0.7 + ((i * 29) % 100) / 100,
      colorIdx: i % 4,
    }));

    const COLORS = [
      [56, 189, 248],  // sky-400
      [99, 102, 241],  // indigo-500
      [168, 85, 247],  // purple-500
      [251, 191, 36],  // amber-400
    ] as const;

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
      // Smoothly interpolate toward target progress for 60fps raster motion
      const target = targetProgressRef.current;
      const current = smoothProgressRef.current;
      const next = current + (target - current) * 0.08;
      smoothProgressRef.current = Math.abs(target - next) < 0.01 ? target : next;
      setSmoothProgress(smoothProgressRef.current);

      ctx.clearRect(0, 0, width, height);

      const clamped = Math.max(0, Math.min(99.9, smoothProgressRef.current));
      const rowFloat = (clamped / 100) * ROWS;
      const rowIdx = Math.floor(rowFloat);
      const colFrac = rowFloat - rowIdx;

      const rowH = height / ROWS;
      const headX = colFrac * width;
      const headY = (rowIdx + 0.5) * rowH;

      // Subtle glowing horizontal trail on the active row behind the write-head
      const trailGrad = ctx.createLinearGradient(Math.max(0, headX - 90), headY, headX + 12, headY);
      trailGrad.addColorStop(0, "rgba(56, 189, 248, 0)");
      trailGrad.addColorStop(0.6, "rgba(99, 102, 241, 0.28)");
      trailGrad.addColorStop(1, "rgba(255, 255, 255, 0.85)");
      ctx.fillStyle = trailGrad;
      ctx.fillRect(Math.max(0, headX - 90), headY - rowH * 0.45, Math.min(headX + 12, 102), rowH * 0.9);

      // Luminous radial bloom at the raster write-head
      const bloom = ctx.createRadialGradient(headX, headY, 1, headX, headY, 26);
      bloom.addColorStop(0, "rgba(255, 255, 255, 0.95)");
      bloom.addColorStop(0.3, "rgba(56, 189, 248, 0.55)");
      bloom.addColorStop(0.65, "rgba(168, 85, 247, 0.22)");
      bloom.addColorStop(1, "rgba(168, 85, 247, 0)");
      ctx.fillStyle = bloom;
      ctx.beginPath();
      ctx.arc(headX, headY, 26, 0, Math.PI * 2);
      ctx.fill();

      // Pixel-crystallization sparks around the active write-head
      for (const s of sparks) {
        const px = headX + s.dx + Math.sin(now * 0.004 * s.speed + s.phase) * 4;
        const py = headY + s.dy + Math.cos(now * 0.003 * s.speed + s.phase) * 3;
        if (px < 0 || px > width || py < 0 || py > height) continue;

        const twinkle = 0.25 + 0.75 * ((Math.sin(now * 0.01 * s.speed + s.phase) + 1) / 2);
        const dist = Math.hypot(px - headX, py - headY);
        const falloff = Math.max(0, 1 - dist / 34);
        const alpha = twinkle * falloff * 0.95;
        if (alpha <= 0.03) continue;

        const [r, g, b] = COLORS[s.colorIdx];
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.fillRect(Math.round(px), Math.round(py), s.size, s.size);
      }

      rafId = requestAnimationFrame(render);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    resize();
    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
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
      {/* 60fps Raster Write-Head & Pixel Crystallization Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 size-full" />
    </div>
  );
}
