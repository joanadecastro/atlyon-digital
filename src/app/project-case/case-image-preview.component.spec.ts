import { ChangeDetectorRef, ElementRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CaseImagePreviewComponent } from './case-image-preview.component';

describe('Prepared mobile landing preview', () => {
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

  function setup(mobile: boolean) {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: mobile } as MediaQueryList);
    const raf = vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
    const host = document.createElement('div');
    const component = TestBed.runInInjectionContext(() => new CaseImagePreviewComponent(
      new ElementRef(host),
      { detectChanges: vi.fn() } as unknown as ChangeDetectorRef,
    ));
    const image = document.createElement('img');
    image.src = '/projects/licita/Group 1803.png';
    Object.defineProperties(image, {
      complete: { value: true }, naturalWidth: { value: 5604 }, naturalHeight: { value: 20691 },
    });
    return { component, image, raf, host };
  }

  it('prepares heavy mobile evidence in a worker and closes without waiting for a timer', async () => {
    const { component } = setup(true);
    let worker: { onmessage: ((event: MessageEvent) => void) | null; postMessage: ReturnType<typeof vi.fn>; terminate: ReturnType<typeof vi.fn> };
    vi.stubGlobal('Worker', class {
      onmessage = null;
      postMessage = vi.fn();
      terminate = vi.fn();
      constructor() { worker = this; }
    });
    vi.stubGlobal('Image', class { src = ''; decoding = ''; decode = () => Promise.resolve(); });
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:lossless-surface');
    try {
      component.mobileTapClose = true;
      component.loadingPreviews = { '/large.png': '/preview.webp' };
      component.open('/large.png', 'Large');
      const prepared = component.preloadOriginal('/large.png');
      expect(worker!.postMessage).toHaveBeenCalledWith(expect.objectContaining({ width: expect.any(Number) }));
      worker!.onmessage!({ data: { blob: new Blob() } } as MessageEvent);
      await prepared;
      await Promise.resolve();
      expect(component.displaySrc).toBe('blob:lossless-surface');
      component.close();
      expect(component.isOpen).toBe(false);
      expect(component.isClosing).toBe(false);
      expect(component.src).toBeNull();
      component.ngOnDestroy();
      expect(revoke).toHaveBeenCalledWith('blob:lossless-surface');
    } finally { vi.unstubAllGlobals(); }
  });

  it('deduplicates intent preloads and swaps only after the original decodes', async () => {
    const { component } = setup(false);
    let finish!: () => void;
    const decode = vi.fn(() => new Promise<void>(resolve => { finish = resolve; }));
    vi.stubGlobal('Image', class { src = ''; decode = decode; });
    try {
      component.loadingPreviews = { '/large.png': '/preview.webp' };
      const pending = component.preloadOriginal('/large.png');
      expect(component.preloadOriginal('/large.png')).toBe(pending);
      component.open('/large.png', 'Large');
      expect(component.displaySrc).toBe('/preview.webp');
      expect(decode).toHaveBeenCalledOnce();
      finish();
      await pending;
      await Promise.resolve();
      expect(component.displaySrc).toBeNull();
      component.open('/large.png', 'Large');
      expect(component.displaySrc).toBeNull();
      expect(decode).toHaveBeenCalledOnce();
    } finally { vi.unstubAllGlobals(); component.ngOnDestroy(); }
  });

  it('does not replace a later image when an earlier original finishes decoding', async () => {
    const { component } = setup(false);
    let finish!: () => void;
    vi.stubGlobal('Image', class { src = ''; decode = () => new Promise<void>(resolve => { finish = resolve; }); });
    try {
      component.loadingPreviews = { '/large.png': '/preview.webp' };
      component.open('/large.png', 'Large');
      component.open('/other.png', 'Other');
      finish();
      await component.preloadOriginal('/large.png');
      expect(component.src).toBe('/other.png');
      expect(component.displaySrc).toBeNull();
    } finally { vi.unstubAllGlobals(); component.ngOnDestroy(); }
  });

  it('retains the preview after a failed original and allows retry', async () => {
    const { component } = setup(false);
    const decode = vi.fn().mockRejectedValue(new Error('Network failure'));
    vi.stubGlobal('Image', class { src = ''; decode = decode; });
    try {
      component.loadingPreviews = { '/large.png': '/preview.webp' };
      component.open('/large.png', 'Large');
      await component.preloadOriginal('/large.png');
      expect(component.displaySrc).toBe('/preview.webp');
      await component.preloadOriginal('/large.png');
      expect(decode).toHaveBeenCalledTimes(2);
      await component.preloadOriginal('/unconfigured.png');
      expect(decode).toHaveBeenCalledTimes(2);
    } finally { vi.unstubAllGlobals(); component.ngOnDestroy(); }
  });

  it('keeps the dialog hidden until the mounted image loads, then reveals without RAF waits', () => {
    const { component, image, raf } = setup(true);
    component.openPreparedImage(image, true);
    expect(component.src).toBe(image.src);
    expect(component.isOpen).toBe(false);
    expect(component.isImageEntered).toBe(false);
    const event = new Event('load');
    Object.defineProperty(event, 'currentTarget', { value: image });
    component.onImageLoad(event);
    expect(component.isOpen).toBe(true);
    expect(component.isImageEntered).toBe(true);
    expect(component.isVerticalLanding).toBe(true);
    expect(raf).not.toHaveBeenCalled();
  });

  it('preserves the existing opening path for other mobile images', () => {
    const { component, image, raf } = setup(true);
    component.open(image.src, image.alt, true);
    expect(raf).toHaveBeenCalledOnce();
    expect(component.isOpen).toBe(false);
  });

  it('preserves the existing desktop opening path', () => {
    const { component, image, raf } = setup(false);
    component.openPreparedImage(image, true);
    expect(raf).toHaveBeenCalledOnce();
    expect(component.isOpen).toBe(false);
  });

  it('applies expanded viewport fitting only to the configured evidence, including encoded URLs', () => {
    const { component } = setup(true);
    component.expandedViewportSources = ['/projects/carregadoresEletricos/Group 3204 (1).png'];
    component.open('/projects/carregadoresEletricos/Group%203204%20(1).png', 'Product landscape');
    expect(component.hasExpandedViewport).toBe(true);
    component.open('/projects/carregadoresEletricos/Group 3191.png', 'Geographic view');
    expect(component.hasExpandedViewport).toBe(false);
    component.openCode('Example', 'const value = 1;');
    expect(component.hasExpandedViewport).toBe(false);
    component.ngOnDestroy();
  });

  it.each([
    { prepared: false, nested: false },
    { prepared: true, nested: false },
    { prepared: false, nested: true },
  ])('reveals the retained loaded image across ten fade/reopen cycles (%j)', ({ prepared, nested }) => {
    vi.useFakeTimers();
    const { component, image, raf, host } = setup(true);
    const composition = document.createElement('div');
    composition.className = 'case-image-preview__composition';
    if (nested) {
      const template = document.createElement('div');
      template.append(image);
      composition.append(template);
    } else composition.append(image);
    host.append(composition);
    const frames: FrameRequestCallback[] = [];
    raf.mockImplementation(callback => { frames.push(callback); return frames.length; });
    const flushFrames = () => {
      while (frames.length) frames.splice(0).forEach(callback => callback(0));
    };
    for (let cycle = 0; cycle < 10; cycle++) {
      if (prepared) component.openPreparedImage(image, true);
      else component.open(image.src, image.alt);
      flushFrames();
      expect(component.isOpen).toBe(true);
      expect(component.isImageEntered).toBe(true);
      expect(component.isClosing).toBe(false);
      expect(composition.querySelector('img')).toBe(image);
      component.close();
      vi.advanceTimersByTime(100);
      expect(component.isOpen).toBe(false);
      expect(component.isClosing).toBe(true);
      expect(component.src).toBe(image.src);
    }
    component.ngOnDestroy();
  });

  it('cycles within the selected group without reopening or unlocking the modal', () => {
    const { component } = setup(false);
    const a = { src: '/group/first image.png', alt: 'First' };
    const b = { src: '/group/second.png', alt: 'Second' };
    component.imageGroups = [[a, b], [{ src: '/other/a.png', alt: 'Other' }, { src: '/other/b.png', alt: 'Other B' }]];
    component.src = '/group/first%20image.png';
    component.isOpen = true;
    component.isImageEntered = true;
    const open = vi.spyOn(component, 'open');
    const close = vi.spyOn(component, 'close');
    component.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(component.src).toBe(b.src);
    expect(component.alt).toBe('Second');
    component.navigateImage(1);
    expect(component.src).toBe(a.src);
    expect(component.isOpen).toBe(true);
    expect(component.isImageEntered).toBe(true);
    expect(open).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();
    component.src = '/isolated.png';
    component.navigateImage(1);
    expect(component.src).toBe('/isolated.png');
    expect(component.activeImageGroup).toHaveLength(0);
    component.singleImageSources = [a.src];
    component.src = '/group/first%20image.png';
    component.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(component.src).toBe('/group/first%20image.png');
    expect(component.activeImageGroup).toHaveLength(0);
    expect(component.isSingleImage).toBe(true);
  });

  it('does not reveal a closing dialog when an image load arrives late', () => {
    vi.useFakeTimers();
    const { component, image } = setup(true);
    component.openPreparedImage(image, true);
    component.close();
    const event = new Event('load');
    Object.defineProperty(event, 'currentTarget', { value: image });
    component.onImageLoad(event);
    expect(component.isOpen).toBe(false);
    expect(component.isImageEntered).toBe(false);
    component.ngOnDestroy();
  });
});
