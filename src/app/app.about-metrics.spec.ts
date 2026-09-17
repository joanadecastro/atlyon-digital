import { ChangeDetectorRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './app';
import { LanguageService } from './i18n/language.service';

describe('Homepage mobile metrics entry (JUH timing reference)', () => {
  let app: App;
  let notify: IntersectionObserverCallback;
  let observer: IntersectionObserver;
  let metrics: HTMLElement;
  let frames: Map<number, FrameRequestCallback>;
  let reduced = false;
  const targets = [15, 4, 95, 19];
  const values = () => Array.from(metrics.querySelectorAll('.about-section__metric-number'),
    element => Number(element.textContent));
  const frame = (time: number) => {
    const pending = [...frames.values()];
    frames.clear();
    pending.forEach(callback => callback(time));
  };
  const intersect = (visible: boolean, ratio = 0.8) => notify([
    { target: metrics, isIntersecting: visible, intersectionRatio: visible ? ratio : 0,
      boundingClientRect: metrics.getBoundingClientRect(), intersectionRect: metrics.getBoundingClientRect(),
      rootBounds: null, time: 0 },
  ], observer);

  beforeEach(() => {
    reduced = false;
    frames = new Map();
    let id = 0;
    vi.stubGlobal('innerWidth', 393);
    vi.stubGlobal('innerHeight', 852);
    vi.spyOn(performance, 'now').mockReturnValue(0);
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frames.set(++id, callback);
      return id;
    });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
    vi.stubGlobal('matchMedia', () => ({ matches: reduced }));
    vi.stubGlobal('IntersectionObserver', class {
      observe = vi.fn();
      disconnect = vi.fn();
      constructor(callback: IntersectionObserverCallback, options: IntersectionObserverInit) {
        notify = callback;
        observer = this as unknown as IntersectionObserver;
        expect(options).toEqual({ threshold: 0.3, rootMargin: '0px 0px -8% 0px' });
      }
    });
    document.body.innerHTML = `<section id="sobre"><div class="about-editorial-metrics">${targets.map(target =>
      `<div class="about-metric" data-count-target="${target}" data-count-duration="900"><span class="about-section__metric-number">0</span><span>+</span></div>`
    ).join('')}</div></section>`;
    metrics = document.querySelector('.about-editorial-metrics')!;
    vi.spyOn(metrics, 'getBoundingClientRect').mockReturnValue({
      top: 500, bottom: 700, height: 200,
    } as DOMRect);
    app = TestBed.runInInjectionContext(() => new App(
      { markForCheck: vi.fn() } as unknown as ChangeDetectorRef, {} as LanguageService,
    ));
    app['initMobileAboutMetricsObserver']();
    frame(0);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('waits outside the viewport, progresses on entry and never restarts', () => {
    intersect(false);
    frame(1000);
    expect(values()).toEqual([0, 0, 0, 0]);
    expect(frames.size).toBe(0);
    intersect(true);
    frame(700);
    expect(values().every((value, index) => value > 0 && value < targets[index])).toBe(true);
    frame(2800);
    expect(values()).toEqual(targets);
    expect(observer.disconnect).toHaveBeenCalled();
    intersect(false);
    intersect(true);
    app['initMobileAboutMetricsObserver']();
    expect(frames.size).toBe(0);
    expect(values()).toEqual(targets);
  });

  it('rejects a stale intersection when the real metrics are below the viewport', () => {
    vi.mocked(metrics.getBoundingClientRect).mockReturnValue({ top: 900, bottom: 1100, height: 200 } as DOMRect);
    intersect(true);
    expect(frames.size).toBe(0);
    expect(values()).toEqual([0, 0, 0, 0]);
    vi.mocked(metrics.getBoundingClientRect).mockReturnValue({ top: 500, bottom: 700, height: 200 } as DOMRect);
    intersect(true);
    frame(2800);
    expect(values()).toEqual(targets);
  });

  it('keeps reduced-motion final values gated by actual entry', () => {
    reduced = true;
    intersect(false);
    expect(values()).toEqual([0, 0, 0, 0]);
    intersect(true);
    expect(values()).toEqual(targets);
    expect(frames.size).toBe(0);
  });
});
