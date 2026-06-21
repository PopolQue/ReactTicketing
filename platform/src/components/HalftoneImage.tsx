import React, { useEffect, useRef } from 'react';

interface HalftoneMorphProps {
  srcs: string[];
  dotSpacing?: number;
  dotColor?: string;
  intervalMs?: number;
  transitionMs?: number;
  baseRadiusMultiplier?: number;
  style?: React.CSSProperties;
}

export default function HalftoneImage({
  srcs,
  dotSpacing = 12,
  dotColor = '#a2aa5c',
  intervalMs = 3000,
  transitionMs = 500,
  baseRadiusMultiplier = 0.2,
  style,
}: HalftoneMorphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let animationFrameId: number;
    let timeoutId: NodeJS.Timeout;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    let width = 0;
    let height = 0;

    const imageRadii: Float32Array[] = [];
    let currentRadii: Float32Array | null = null;
    let targetRadii: Float32Array | null = null;

    let currentIdx = 0;
    let isTransitioning = false;
    let transitionStartTime = 0;
    let startRadii: Float32Array | null = null;

    const loadImages = async () => {
      // Responsive width, fixed 300px height
      const targetWidth = canvas.parentElement?.clientWidth || 1280;
      const targetHeight = 300;
      width = targetWidth;
      height = targetHeight;

      // Canvas internal buffer size scaled for high-DPI
      canvas.width = width * dpr;
      canvas.height = height * dpr;

      // CSS display size matches responsive dimensions
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      // Context scale to handle coordinate mapping for high-DPI
      ctx.scale(dpr, dpr);

      const cols = Math.ceil(width / dotSpacing);
      const rows = Math.ceil(height / dotSpacing);
      const totalDots = cols * rows;

      // Offscreen canvas for processing images
      const offscreen = document.createElement('canvas');
      offscreen.width = width;
      offscreen.height = height;
      const offCtx = offscreen.getContext('2d', { willReadFrequently: true });
      if (!offCtx) return;

      for (let i = 0; i < srcs.length; i++) {
        const img = new Image();
        img.src = srcs[i];
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });

        if (!img.width) continue;

        // Cover fill: scale image to fill width x 300
        offCtx.clearRect(0, 0, width, height);
        const ratio = Math.max(width / img.width, height / img.height);
        const w = img.width * ratio;
        const h = img.height * ratio;
        const x = (width - w) / 2;
        const y = (height - h) / 2;
        offCtx.drawImage(img, x, y, w, h);

        const imgData = offCtx.getImageData(0, 0, width, height);
        const pixels = imgData.data;

        const radii = new Float32Array(totalDots);

        let dotIdx = 0;
        for (let y = 0; y < height; y += dotSpacing) {
          for (let x = 0; x < width; x += dotSpacing) {
            let totalLum = 0;
            let count = 0;

            for (let cy = 0; cy < dotSpacing; cy++) {
              for (let cx = 0; cx < dotSpacing; cx++) {
                const py = y + cy;
                const px = x + cx;
                if (px < width && py < height) {
                  const pIdx = (py * width + px) * 4;
                  totalLum +=
                    0.299 * pixels[pIdx] + 0.587 * pixels[pIdx + 1] + 0.114 * pixels[pIdx + 2];
                  count++;
                }
              }
            }

            const brightness = (count > 0 ? totalLum / count : 0) / 255;
            const maxRadius = dotSpacing / 1.5;
            radii[dotIdx] = Math.max(brightness * maxRadius, maxRadius * baseRadiusMultiplier);
            dotIdx++;
          }
        }
        imageRadii.push(radii);
      }

      if (imageRadii.length === 0) return;

      currentRadii = new Float32Array(imageRadii[0]);
      startRadii = new Float32Array(imageRadii[0]);
      targetRadii = imageRadii[0];

      requestAnimationFrame(render);
      scheduleNext();
    };

    const scheduleNext = () => {
      timeoutId = setTimeout(() => {
        currentIdx = (currentIdx + 1) % srcs.length;
        startRadii = new Float32Array(currentRadii!);
        targetRadii = imageRadii[currentIdx];
        isTransitioning = true;
        transitionStartTime = performance.now();
        scheduleNext();
      }, intervalMs);
    };

    const render = (time: number) => {
      // Clear canvas based on logical size (ctx is scaled, so clearing logical size clears all)
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = dotColor;

      // Apply bloom effect
      ctx.shadowColor = dotColor;
      ctx.shadowBlur = 8 * dpr; // Scale blur by dpr to look consistent on high-res

      if (isTransitioning) {
        const elapsed = time - transitionStartTime;
        let progress = Math.min(elapsed / transitionMs, 1);
        if (progress >= 1) isTransitioning = false;

        // ease-in-out-cubic
        const ease =
          progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        for (let i = 0; i < currentRadii!.length; i++) {
          currentRadii![i] = startRadii![i] + (targetRadii![i] - startRadii![i]) * ease;
        }
      }

      let dotIdx = 0;
      ctx.beginPath();
      for (let y = 0; y < height; y += dotSpacing) {
        for (let x = 0; x < width; x += dotSpacing) {
          const radius = currentRadii![dotIdx];
          if (radius > 0) {
            ctx.moveTo(x + dotSpacing / 2 + radius, y + dotSpacing / 2);
            ctx.arc(x + dotSpacing / 2, y + dotSpacing / 2, radius, 0, Math.PI * 2);
          }
          dotIdx++;
        }
      }
      ctx.fill();

      animationFrameId = requestAnimationFrame(render);
    };

    loadImages();

    return () => {
      clearTimeout(timeoutId);
      cancelAnimationFrame(animationFrameId);
    };
  }, [srcs, dotSpacing, dotColor, intervalMs, transitionMs, baseRadiusMultiplier]);

  return (
    <div style={{ ...style, position: 'relative', overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />
    </div>
  );
}
