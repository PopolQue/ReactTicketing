import React, { useEffect, useRef, useState } from 'react';

interface UpscaledImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  scaleFactor?: number;
  sharpen?: boolean;
}

/**
 * UpscaledImage
 * 
 * Takes a compressed low-res image (e.g. WebP) and uses a hidden canvas 
 * to artificially "upscale" and decompress it on the client side.
 * This saves bandwidth and hosting costs while presenting a high-quality visual.
 */
export default function UpscaledImage({ src, scaleFactor = 2, sharpen = true, style, ...props }: UpscaledImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [upscaledDataUrl, setUpscaledDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    if (!src) return;

    const img = new Image();
    img.crossOrigin = "anonymous"; // Needed if fetching from external storage like Supabase
    
    img.onload = () => {
      if (!isMounted) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set the canvas to the upscaled resolution
      canvas.width = img.width * scaleFactor;
      canvas.height = img.height * scaleFactor;

      // Enable high-quality image smoothing (bicubic interpolation)
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Optional: Add a subtle contrast/saturation boost to mimic "AI Sharpening"
      if (sharpen) {
        ctx.filter = 'contrast(1.05) saturate(1.1)';
      }

      // Draw the image scaled up
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Extract the high-quality decompressed image data
      const dataUrl = canvas.toDataURL('image/png');
      setUpscaledDataUrl(dataUrl);
    };

    img.src = src;

    return () => {
      isMounted = false;
    };
  }, [src, scaleFactor, sharpen]);

  return (
    <>
      {/* Hidden canvas used for the upscaling engine */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      {/* The rendered image element */}
      <img 
        src={upscaledDataUrl || src} 
        style={{
          ...style,
          transition: 'filter 0.5s ease',
          filter: upscaledDataUrl ? 'none' : 'blur(4px)', // Blur while upscaling
        }} 
        {...props} 
      />
    </>
  );
}
