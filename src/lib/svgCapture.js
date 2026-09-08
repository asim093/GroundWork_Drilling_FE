const readViewBox = (svg) => {
  const parts = (svg.getAttribute('viewBox') || '').split(/\s+/).map(Number);
  if (parts.length === 4 && parts.every((value) => Number.isFinite(value)) && parts[2] > 0) {
    return { width: parts[2], height: parts[3] };
  }
  const rect = svg.getBoundingClientRect();
  return { width: rect.width || 640, height: rect.height || 260 };
};

export const svgToPngDataUrl = (svg, { scale = 2, background = '#ffffff' } = {}) =>
  new Promise((resolve, reject) => {
    if (!svg) {
      reject(new Error('Chart is not ready to export'));
      return;
    }

    const { width, height } = readViewBox(svg);
    const clone = svg.cloneNode(true);
    clone.removeAttribute('style');
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', String(width));
    clone.setAttribute('height', String(height));
    clone.setAttribute('viewBox', `0 0 ${width} ${height}`);

    const markup = new XMLSerializer().serializeToString(clone);
    const source = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml;charset=utf-8' }));
    const image = new Image();

    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(width * scale));
        canvas.height = Math.max(1, Math.round(height * scale));
        const context = canvas.getContext('2d');
        context.fillStyle = background;
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/png'));
      } catch (error) {
        reject(error instanceof Error ? error : new Error('Chart image could not be generated'));
      } finally {
        URL.revokeObjectURL(source);
      }
    };

    image.onerror = () => {
      URL.revokeObjectURL(source);
      reject(new Error('Chart image could not be generated'));
    };

    image.src = source;
  });
