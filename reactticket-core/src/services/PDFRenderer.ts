export class PDFRenderer {
  static async render(ticketId: string, eventName: string): Promise<Blob> {
    const canvas = document.createElement('canvas');
    // A6 landscape: 888 x 630 px
    canvas.width = 888;
    canvas.height = 630;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context unavailable');

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header & Details
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText(`Event: ${eventName}`, 50, 60);
    ctx.font = '20px sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText(`Ticket ID: ${ticketId}`, 50, 110);

    return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob!)));
  }

  static async renderMultiTicketPDF(
    tickets: Array<{ id: string; ticketTypeName?: string; holderName?: string }>,
    eventName: string
  ): Promise<Blob> {
    const canvas = document.createElement('canvas');
    // A4 Portrait at 150 DPI: ~1240 x 1754 px
    canvas.width = 1240;
    canvas.height = 1754;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context unavailable');

    // Page Background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Document Header
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 40px sans-serif';
    ctx.fillText(eventName, 60, 80);
    ctx.font = '22px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(`Print-at-Home Multi-Ticket Pass (${tickets.length} tickets)`, 60, 125);

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(60, 150);
    ctx.lineTo(canvas.width - 60, 150);
    ctx.stroke();

    // 2x2 or 2x3 Grid Layout
    const startY = 180;
    const cardWidth = 530;
    const cardHeight = 340;
    const gapX = 60;
    const gapY = 40;

    tickets.slice(0, 8).forEach((ticket, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = 60 + col * (cardWidth + gapX);
      const y = startY + row * (cardHeight + gapY);

      // Ticket Card Background
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(x, y, cardWidth, cardHeight, 16);
      ctx.fill();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Card Header Accent
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.roundRect(x, y, cardWidth, 12, [16, 16, 0, 0]);
      ctx.fill();

      // Ticket Details
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(ticket.ticketTypeName || 'General Admission', x + 24, y + 50);

      ctx.font = '16px sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText(`Ticket ID: ${ticket.id}`, x + 24, y + 90);
      if (ticket.holderName) {
        ctx.fillText(`Holder: ${ticket.holderName}`, x + 24, y + 120);
      }

      // Border cut-guide
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = '#94a3b8';
      ctx.strokeRect(x - 5, y - 5, cardWidth + 10, cardHeight + 10);
      ctx.setLineDash([]);
    });

    return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob!)));
  }
}
