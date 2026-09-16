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
