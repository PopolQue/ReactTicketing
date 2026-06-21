import React from 'react';

export default function Skeleton({
  width = '100%',
  height = '20px',
  borderRadius = '8px',
  style = {},
}: {
  width?: string;
  height?: string;
  borderRadius?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        animation: 'pulse 1.5s infinite ease-in-out',
        ...style,
      }}
    >
      <style>{`
        @keyframes pulse {
          0% { opacity: 0.8; }
          50% { opacity: 0.4; }
          100% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
