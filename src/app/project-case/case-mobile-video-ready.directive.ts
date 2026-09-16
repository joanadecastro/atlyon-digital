import { AfterViewInit, Directive, ElementRef, EventEmitter, HostListener, OnDestroy, Output, inject } from '@angular/core';

/** Hide only the mobile media frame until its intrinsic geometry is available. */
@Directive({ selector: 'video[caseMobileVideoReady]', standalone: true })
export class CaseMobileVideoReadyDirective implements AfterViewInit, OnDestroy {
  @Output() readonly caseMobileVideoReady = new EventEmitter<void>();
  private readonly video = inject<ElementRef<HTMLVideoElement>>(ElementRef).nativeElement;
  private panel?: HTMLElement;
  private revealFrame?: number;
  private revealed = false;

  ngAfterViewInit(): void {
    if (!matchMedia('(max-width: 768px)').matches) return;
    this.panel = this.video.closest<HTMLElement>('.licita-video-preview__panel') ?? undefined;
    this.panel?.style.setProperty('visibility', 'hidden');
    this.prepareGeometry();
  }

  @HostListener('loadedmetadata')
  @HostListener('loadeddata')
  @HostListener('canplay')
  @HostListener('seeked')
  prepareGeometry(): void {
    if (!this.panel || this.revealed || !this.video.videoWidth || !this.video.videoHeight) return;
    const ratio = this.video.videoWidth / this.video.videoHeight;
    this.video.style.setProperty('width', `min(calc(100dvh - 40px), calc((100vw - 32px) * ${ratio}))`, 'important');
    this.video.style.setProperty('aspect-ratio', String(ratio));
    // HAVE_CURRENT_DATA means a decoded frame exists; metadata alone is not enough.
    if (this.video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || this.video.seeking) return;
    if (this.revealFrame !== undefined) cancelAnimationFrame(this.revealFrame);
    this.revealFrame = requestAnimationFrame(() => {
      this.revealFrame = undefined;
      if (this.video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || this.video.seeking) return;
      this.revealed = true;
      this.panel?.style.removeProperty('visibility');
      this.caseMobileVideoReady.emit();
    });
  }

  ngOnDestroy(): void {
    if (this.revealFrame !== undefined) cancelAnimationFrame(this.revealFrame);
  }
}
