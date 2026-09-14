export function isMobileCasePreview(): boolean {
  return matchMedia('(max-width: 768px)').matches;
}

export function isNativeVideoControlPointer(event: PointerEvent): boolean {
  if (!isMobileCasePreview() || !(event.target instanceof HTMLVideoElement)) return false;
  const rect = event.target.getBoundingClientRect();
  const controlStripHeight = Math.min(64, rect.height * .22);
  return event.clientY >= rect.bottom - controlStripHeight;
}
