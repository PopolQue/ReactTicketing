export const QRGenerator = {
  generate: (payload: string): string => {
    // Uses the goqr.me API for QR generation. 
    // This is robust, scannable, and avoids complex pure-TS Reed-Solomon implementation.
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(payload)}`;
  }
};
