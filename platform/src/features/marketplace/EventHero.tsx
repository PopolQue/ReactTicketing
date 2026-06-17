import { useLanguage } from "../../contexts/LanguageContext";
import React from 'react';

export default function EventHero({
  event,
  images,
  currentImageIndex,
  setCurrentImageIndex,
  customAccentColor
}: {
  event: any;
  images: string[];
  currentImageIndex: number;
  setCurrentImageIndex: any;
  customAccentColor: string;
}) {
  const {
    t
  } = useLanguage();
  return <>
      {images.length > 0 && <div style={{
      width: '100%',
      height: '400px',
      backgroundColor: '#000',
      position: 'relative',
      overflow: 'hidden'
    }}>
          <img src={images[currentImageIndex]} alt={t("event")} style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        opacity: 0.8
      }} />
          {images.length > 1 && <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '0',
        right: '0',
        display: 'flex',
        justifyContent: 'center',
        gap: '8px'
      }}>
              {images.map((_: any, idx: number) => <button key={idx} onClick={() => setCurrentImageIndex(idx)} style={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
          backgroundColor: idx === currentImageIndex ? customAccentColor : 'rgba(255,255,255,0.4)'
        }} />)}
            </div>}
        </div>}
    </>;
}