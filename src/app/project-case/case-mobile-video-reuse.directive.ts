import { AfterViewInit, Directive, ElementRef, EventEmitter, Input, OnDestroy, Output, inject } from '@angular/core';

export function findCasePreviewVideo(host: HTMLElement, src: string, event?: Event): HTMLVideoElement | undefined {
  const expected = new URL(src, document.baseURI).href;
  const matches = (video: HTMLVideoElement) =>
    (video.currentSrc || video.src || video.querySelector<HTMLSourceElement>('source')?.src) === expected;
  const target = event?.target;
  const clicked = target instanceof Element ? target.closest('figure')?.querySelector('video') : null;
  if (clicked && matches(clicked)) return clicked;
  return [...host.querySelectorAll<HTMLVideoElement>('video[data-case-viewport-video]')]
    .filter(video => matches(video) && video.getBoundingClientRect().width > 0)
    .sort((a, b) => {
      const distance = (video: HTMLVideoElement) => Math.abs(video.getBoundingClientRect().top + video.getBoundingClientRect().height / 2 - innerHeight / 2);
      return distance(a) - distance(b);
    })[0];
}

/** Borrow the already-decoded media without creating another player/stream. */
@Directive({ selector: '[caseMobileVideoReuse]', standalone: true })
export class CaseMobileVideoReuseDirective implements AfterViewInit, OnDestroy {
  @Input({ required: true }) caseMobileVideoReuse!: HTMLVideoElement;
  @Output() readonly caseMobileVideoReuseReady = new EventEmitter<void>();
  private readonly anchor = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private slot?: HTMLElement;
  private previousStyle: string | null = null;
  private previousControls: string | null = null;
  private wasPlaying = false;
  private overlay?: HTMLElement;
  private previousTransition = '';
  private revealed = false;
  private readonly readinessEvents = ['loadedmetadata', 'loadeddata', 'canplay', 'seeked'];
  private readonly prepare = (): void => {
    const video = this.caseMobileVideoReuse;
    const panel = video.closest<HTMLElement>('.licita-video-preview__panel');
    if (!video.videoWidth || !video.videoHeight) return;
    const ratio = video.videoWidth / video.videoHeight;
    video.style.setProperty('width', `min(calc(100dvh - 40px), calc((100vw - 32px) * ${ratio}))`, 'important');
    video.style.setProperty('height', 'auto', 'important');
    video.style.setProperty('aspect-ratio', String(ratio));
    if (this.revealed || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || video.seeking) return;
    this.revealed = true;
    panel?.style.removeProperty('visibility');
    this.caseMobileVideoReuseReady.emit();
  };

  ngAfterViewInit(): void {
    const video = this.caseMobileVideoReuse;
    const style = getComputedStyle(video);
    const rect = video.getBoundingClientRect();
    this.previousStyle = video.getAttribute('style');
    this.previousControls = video.getAttribute('controls');
    this.wasPlaying = !video.paused;
    this.slot = document.createElement('span');
    this.slot.setAttribute('aria-hidden', 'true');
    this.slot.style.cssText = `display:${style.display === 'inline' ? 'inline-block' : style.display};width:${rect.width}px;height:${rect.height}px;box-sizing:border-box;margin:${style.margin};flex-shrink:0`;
    video.before(this.slot);
    this.anchor.replaceWith(video);
    video.controls = true;
    const panel = video.closest<HTMLElement>('.licita-video-preview__panel');
    panel?.style.setProperty('visibility', 'hidden');
    this.overlay = panel?.closest<HTMLElement>('.licita-video-preview') ?? undefined;
    if (this.overlay) {
      this.previousTransition = this.overlay.style.transition;
      this.overlay.style.transition = 'none';
    }
    for (const type of this.readinessEvents) video.addEventListener(type, this.prepare);
    this.prepare();
    if (this.wasPlaying) void video.play().catch(() => undefined);
  }

  restore(resume = true): void {
    if (!this.slot) return;
    const video = this.caseMobileVideoReuse;
    for (const type of this.readinessEvents) video.removeEventListener(type, this.prepare);
    video.replaceWith(this.anchor);
    this.slot.replaceWith(video);
    this.slot = undefined;
    if (this.previousStyle === null) video.removeAttribute('style');
    else video.setAttribute('style', this.previousStyle);
    if (this.previousControls === null) video.removeAttribute('controls');
    else video.setAttribute('controls', this.previousControls);
    if (resume && this.wasPlaying && video.isConnected) void video.play().catch(() => undefined);
  }

  ngOnDestroy(): void {
    this.restore(false);
    if (this.overlay) this.overlay.style.transition = this.previousTransition;
  }
}
