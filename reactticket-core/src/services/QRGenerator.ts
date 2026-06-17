import * as qrcodegen from 'reactticket-core/utils/qrcodegen';

export const QRGenerator = {
  generate: (payload: string, timestamp: number = Date.now()): string => {
    // Include timestamp in payload to make it dynamic
    const dynamicPayload = `${payload}|${timestamp}`;
    const ecc = qrcodegen.QrCode.Ecc.MEDIUM;
    const qr = qrcodegen.QrCode.encodeText(dynamicPayload, ecc);

    const canvas = document.createElement('canvas');
    const scale = 4;
    const border = 4;
    canvas.width = (qr.size + border * 2) * scale;
    canvas.height = canvas.width;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error("Canvas context not available");
    }

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'black';
    for (let y = 0; y < qr.size; y++) {
      for (let x = 0; x < qr.size; x++) {
        if (qr.getModule(x, y)) {
          ctx.fillRect((x + border) * scale, (y + border) * scale, scale, scale);
        }
      }
    }
    
    return canvas.toDataURL();
  }
};
