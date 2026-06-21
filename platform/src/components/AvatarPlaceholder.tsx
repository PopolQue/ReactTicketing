import React from 'react';

export const AvatarPlaceholder = ({ size = 32 }: { size?: number }) => (
  <div
    style={{
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '50%',
      backgroundColor: 'var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--text-secondary)',
      fontSize: `${size / 2}px`,
      fontWeight: 'bold',
    }}
  >
    ?
  </div>
);
