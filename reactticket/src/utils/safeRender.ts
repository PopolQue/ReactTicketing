// reactticket/src/utils/safeRender.ts
import React from 'react';
export const safeRender = (value: any): React.ReactNode => {
  if (typeof value === 'string' || typeof value === 'number' || value === null || value === undefined) {
    return value;
  }
  if (React.isValidElement(value)) {
    return value;
  }
  console.error("Attempted to render an invalid object:", value);
  return "[OBJECT ERROR]";
};
