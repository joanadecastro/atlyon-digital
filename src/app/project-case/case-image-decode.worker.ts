// Decode oversized evidence away from the UI thread. The original stays intact;
// the lossless rendering surface only needs the pixels the viewport can display.
addEventListener('message', async ({ data }: MessageEvent<{ src: string; width: number }>) => {
  try {
    const response = await fetch(data.src);
    if (!response.ok) throw new Error(`Image request failed: ${response.status}`);
    const bitmap = await createImageBitmap(await response.blob(), {
      resizeWidth: data.width, resizeQuality: 'high',
    });
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0);
    bitmap.close();
    const blob = await canvas.convertToBlob({ type: 'image/png' });
    postMessage({ blob });
  } catch {
    postMessage({ error: true });
  }
});
