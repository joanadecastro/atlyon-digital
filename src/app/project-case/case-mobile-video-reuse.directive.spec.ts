import { ElementRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CaseMobileVideoReuseDirective, findCasePreviewVideo } from './case-mobile-video-reuse.directive';

describe('Mobile video lightbox reuse', () => {
  let host: HTMLElement;

  afterEach(() => {
    host?.remove();
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  function setup(readyState: number = HTMLMediaElement.HAVE_ENOUGH_DATA) {
    host = document.createElement('div');
    host.innerHTML = '<figure><video autoplay muted loop playsinline preload="metadata" style="width: 100%" src="/projects/juh/video_juhecommerce.mp4"></video><button>Ampliar</button></figure><div class="licita-video-preview"><div class="licita-video-preview__panel"><span></span></div></div>';
    document.body.append(host);
    const video = host.querySelector('video')!;
    const originalParent = video.parentElement!;
    const anchor = host.querySelector('.licita-video-preview__panel span') as HTMLElement;
    const panel = anchor.parentElement!;
    const play = vi.spyOn(video, 'play').mockResolvedValue(undefined);
    const load = vi.spyOn(video, 'load').mockImplementation(() => undefined);
    const raf = vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
    Object.defineProperties(video, {
      videoWidth: { value: 1080 }, videoHeight: { value: 2160 },
      readyState: { value: readyState, configurable: true },
      seeking: { value: false, configurable: true }, paused: { value: false },
    });
    video.currentTime = 20;
    TestBed.configureTestingModule({ providers: [{ provide: ElementRef, useValue: new ElementRef(anchor) }] });
    const directive = TestBed.runInInjectionContext(() => new CaseMobileVideoReuseDirective());
    directive.caseMobileVideoReuse = video;
    const ready = vi.fn();
    directive.caseMobileVideoReuseReady.subscribe(ready);
    return { directive, video, originalParent, panel, ready, play, load, raf };
  }

  it('moves the same ready player without another source/load and restores its exact preview attributes', () => {
    const { directive, video, originalParent, panel, ready, play, load, raf } = setup();
    const attributes = video.outerHTML;
    directive.ngAfterViewInit();
    expect(panel.querySelector('video')).toBe(video);
    expect(host.querySelectorAll('video')).toHaveLength(1);
    expect(video.currentTime).toBe(20);
    expect(video.autoplay && video.loop && video.playsInline).toBe(true);
    expect(video.preload).toBe('metadata');
    expect(ready).toHaveBeenCalledOnce();
    expect(load).not.toHaveBeenCalled();
    expect(raf).not.toHaveBeenCalled();
    directive.restore();
    expect(originalParent.firstElementChild).toBe(video);
    expect(video.nextElementSibling?.tagName).toBe('BUTTON');
    expect(video.outerHTML).toBe(attributes);
    expect(play).toHaveBeenCalledTimes(2);
    directive.ngOnDestroy();
    expect(play).toHaveBeenCalledTimes(2);
  });

  it('keeps an unready or seeking player hidden and reveals once a real readiness event arrives', () => {
    const { directive, video, panel, ready, raf } = setup(HTMLMediaElement.HAVE_METADATA);
    directive.ngAfterViewInit();
    expect(panel.style.visibility).toBe('hidden');
    expect(ready).not.toHaveBeenCalled();
    Object.defineProperties(video, { readyState: { value: 4 }, seeking: { value: true, configurable: true } });
    video.dispatchEvent(new Event('loadeddata'));
    expect(ready).not.toHaveBeenCalled();
    Object.defineProperty(video, 'seeking', { value: false });
    video.dispatchEvent(new Event('seeked'));
    expect(panel.style.visibility).toBe('');
    expect(ready).toHaveBeenCalledOnce();
    video.dispatchEvent(new Event('canplay'));
    expect(ready).toHaveBeenCalledOnce();
    expect(raf).not.toHaveBeenCalled();
    directive.ngOnDestroy();
  });

  it('restores the player on teardown and removes pending readiness listeners without resuming a destroyed route', () => {
    const { directive, video, originalParent, ready, play } = setup(HTMLMediaElement.HAVE_METADATA);
    directive.ngAfterViewInit();
    directive.ngOnDestroy();
    expect(video.parentElement).toBe(originalParent);
    expect(play).toHaveBeenCalledOnce();
    Object.defineProperty(video, 'readyState', { value: 4 });
    video.dispatchEvent(new Event('loadeddata'));
    expect(ready).not.toHaveBeenCalled();
    directive.restore();
    expect(play).toHaveBeenCalledOnce();
  });

  it('selects the tapped preview when two players share the same source', () => {
    const { video } = setup();
    const secondFigure = document.createElement('figure');
    secondFigure.innerHTML = '<video src="/projects/juh/video_juhecommerce.mp4"></video><button>Ampliar checkout</button>';
    host.prepend(secondFigure);
    const secondVideo = secondFigure.querySelector('video')!;
    const event = new Event('click');
    Object.defineProperty(event, 'target', { value: secondFigure.querySelector('button') });
    expect(findCasePreviewVideo(host, video.src, event)).toBe(secondVideo);
  });
});
