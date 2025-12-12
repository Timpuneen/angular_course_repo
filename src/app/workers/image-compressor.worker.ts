/// <reference lib="webworker" />

addEventListener('message', ({ data }) => {
  const { imageData, quality } = data;

  const canvas = new OffscreenCanvas(imageData.width, imageData.height);
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    postMessage({ error: 'Failed to get canvas context' });
    return;
  }

  ctx.putImageData(imageData, 0, 0);

  canvas.convertToBlob({
    type: 'image/jpeg',
    quality: quality || 0.7
  }).then(blob => {
    postMessage({ blob });
  }).catch(error => {
    postMessage({ error: error.message });
  });

  console.log('[Web Worker] Image compression task processed');
});