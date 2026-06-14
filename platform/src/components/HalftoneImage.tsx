import React, { useEffect, useRef } from 'react';

interface HalftoneMorphProps {
  srcs: string[];
  dotSpacing?: number;
  dotColor?: string;
  intervalMs?: number;
  transitionMs?: number;
  style?: React.CSSProperties;
}

export default function HalftoneImage({ 
  srcs, 
  dotSpacing = 12, 
  dotColor = '#a2aa5c',
  intervalMs = 6000,
  transitionMs = 2000,
  style 
}: HalftoneMorphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let animationFrameId: number;
    let timeoutId: NodeJS.Timeout;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    
    // Store all target radii arrays for each image
    const imageRadii: Float32Array[] = [];
    let currentRadii: Float32Array | null = null;
    let targetRadii: Float32Array | null = null;
    
    let currentIdx = 0;
    let isTransitioning = false;
    let transitionStartTime = 0;
    let startRadii: Float32Array | null = null;

    // Load all images and calculate their radii
    const loadImages = async () => {
      // First image dictates canvas size
      const firstImg = new Image();
      firstImg.src = srcs[0];
      await new Promise((resolve) => {
        firstImg.onload = resolve;
        firstImg.onerror = resolve;
      });

      if (!firstImg.width) return; // Failed to load first image

      width = firstImg.width;
      height = firstImg.height;
      canvas.width = width;
      canvas.height = height;

      const cols = Math.ceil(width / dotSpacing);
      const rows = Math.ceil(height / dotSpacing);
      const totalDots = cols * rows;

      // Offscreen canvas for reading pixels
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

        offCtx.clearRect(0, 0, width, height);
        offCtx.drawImage(img, 0, 0, width, height);
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
                  const rVal = pixels[pIdx];
                  const gVal = pixels[pIdx + 1];
                  const bVal = pixels[pIdx + 2];
                  totalLum += 0.299 * rVal + 0.587 * gVal + 0.114 * bVal;
                  count++;
                }
              }
            }
            
            const avgLum = count > 0 ? totalLum / count : 0;
            const brightness = avgLum / 255;
            const maxRadius = dotSpacing / 1.5; 
            radii[dotIdx] = brightness * maxRadius;
            dotIdx++;
          }
        }
        imageRadii.push(radii);
      }

      if (imageRadii.length === 0) return;

      currentRadii = new Float32Array(imageRadii[0]);
      startRadii = new Float32Array(imageRadii[0]);
      targetRadii = imageRadii[0];

      // Start rendering loop
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
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = dotColor;

      if (isTransitioning) {
        const elapsed = time - transitionStartTime;
        let progress = elapsed / transitionMs;
        if (progress >= 1) {
          progress = 1;
          isTransitioning = false;
        }

        // Ease in-out cubic
        const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        for (let i = 0; i < currentRadii!.length; i++) {
          currentRadii![i] = startRadii![i] + (targetRadii![i] - startRadii![i]) * ease;
        }
      }

      let dotIdx = 0;
      ctx.beginPath();
      for (let y = 0; y < height; y += dotSpacing) {
        for (let x = 0; x < width; x += dotSpacing) {
          const radius = currentRadii![dotIdx];
          if (radius > 0.5) {
            // moveTo prevents connecting lines when drawing multiple arcs in one path
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
  }, [srcs, dotSpacing, dotColor, intervalMs, transitionMs]);

  return (
    <div style={{ ...style, position: 'relative', overflow: 'hidden' }}>
      <canvas 
        ref={canvasRef} 
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'cover',
          filter: 'drop-shadow(var(--bloom-glow))' 
        }} 
      />
    </div>
  );
}
