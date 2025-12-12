/// <reference lib="webworker" />

addEventListener('message', ({ data }) => {
  const { imageData, quality } = data;

  // Создаём canvas для сжатия
  const canvas = new OffscreenCanvas(imageData.width, imageData.height);
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    postMessage({ error: 'Failed to get canvas context' });
    return;
  }

  // Рисуем изображение
  ctx.putImageData(imageData, 0, 0);

  // Конвертируем в blob с указанным качеством
  canvas.convertToBlob({
    type: 'image/jpeg',
    quality: quality || 0.7
  }).then(blob => {
    postMessage({ blob });
  }).catch(error => {
    postMessage({ error: error.message });
  });
});