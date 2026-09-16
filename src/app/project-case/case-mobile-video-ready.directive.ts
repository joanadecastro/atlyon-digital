import { AfterViewInit, Directive, ElementRef, HostListener, OnDestroy, inject } from '@angular/core';

/** Hide only the mobile media frame until its intrinsic geometry is available. */
@Directive({ selector: 'video[caseMobileVideoReady]', standalone: true })
export class CaseMobileVideoReadyDirective implements AfterViewInit, OnDestroy {
  private readonly video = inject<ElementRef<HTMLVideoElement>>(ElementRef).nativeElement;
  private panel?: HTMLElement;
  private revealFrame?: number;

  ngAfterViewInit(): void {
    if (!matchMedia('(max-width: 768px)').matches) return;
    this.panel = this.video.closest<HTMLElement>('.licita-video-preview__panel') ?? undefined;
    this.panel?.style.setProperty('visibility', 'hidden');
    this.prepareGeometry();
  }

  @HostListener('loadedmetadata')
  prepareGeometry(): void {
    if (!this.panel || !this.video.videoWidth || !this.video.videoHeight) return;
    const ratio = this.video.videoWidth / this.video.videoHeight;
    this.video.style.setProperty('width', `min(calc(100dvh - 40px), calc((100vw - 32px) * ${ratio}))`, 'important');
    this.video.style.setProperty('aspect-ratio', String(ratio));
    if (this.revealFrame !== undefined) cancelAnimationFrame(this.revealFrame);
    this.revealFrame = requestAnimationFrame(() => {
      this.panel?.style.removeProperty('visibility');
      this.revealFrame = undefined;
    });
  }

  ngOnDestroy(): void {
    if (this.revealFrame !== undefined) cancelAnimationFrame(this.revealFrame);
  }
}
