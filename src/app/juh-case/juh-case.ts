import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, inject } from '@angular/core';
import { JUH_SNIPPETS } from './juh-snippets';
import { CaseHeroScrollIndicatorComponent } from '../project-case/case-hero-scroll-indicator.component';
import { CaseImagePreviewComponent } from '../project-case/case-image-preview.component';
import { bindCaseExpandableMedia } from '../project-case/case-expandable-media';

@Component({
  selector: 'app-juh-case',
  standalone: true,
  imports: [CaseHeroScrollIndicatorComponent, CaseImagePreviewComponent],
  templateUrl: './juh-case.html',
  styleUrl: './juh-case.scss',
})
export class JuhCaseComponent implements AfterViewInit, OnDestroy {
  readonly github = 'https://github.com/joanadecastro/juh-angular-ecommerce';
  readonly snippets = JUH_SNIPPETS;
  private readonly checkoutClipStart = 18.7;
  private readonly checkoutClipEnd = 27.6;
  private readonly element: ElementRef<HTMLElement> = inject(ElementRef);
  private observer?: IntersectionObserver;
  private resultsObserver?: IntersectionObserver;
  private resultsCounterRafId?: number;
  private unbindExpandableMedia?: () => void;
  videoPreviewSrc: string | null = null;
  videoPreviewLabel = '';
  videoPreviewOpen = false;
  private videoPreviewUsesCheckoutClip = false;
  private bodyOverflowBeforePreview = '';
  private bodyScrollLocked = false;
  @ViewChild(CaseImagePreviewComponent) private imagePreview?: CaseImagePreviewComponent;

  openImagePreview(src: string, alt: string): void { this.imagePreview?.open(src, alt); }

  openVideoPreview(src: string, label: string): void {
    this.videoPreviewUsesCheckoutClip = false;
    this.videoPreviewSrc = src;
    this.videoPreviewLabel = label;
    if (!this.bodyScrollLocked) {
      this.bodyOverflowBeforePreview = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      this.bodyScrollLocked = true;
    }
    this.videoPreviewOpen = true;
  }

  openCheckoutVideoPreview(): void {
    this.videoPreviewUsesCheckoutClip = true;
    this.videoPreviewSrc = '/projects/juh/video_juhecommerce.mp4';
    this.videoPreviewLabel = 'Micro-demo de checkout e validação do JUH';
    if (!this.bodyScrollLocked) {
      this.bodyOverflowBeforePreview = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      this.bodyScrollLocked = true;
    }
    this.videoPreviewOpen = true;
  }

  closeVideoPreview(): void {
    this.videoPreviewOpen = false;
    this.videoPreviewSrc = null;
    this.videoPreviewLabel = '';
    this.videoPreviewUsesCheckoutClip = false;
    if (this.bodyScrollLocked) {
      document.body.style.overflow = this.bodyOverflowBeforePreview;
      this.bodyScrollLocked = false;
    }
  }

  closeVideoPreviewFromBackdrop(event: Event): void {
    if (event.target === event.currentTarget) this.closeVideoPreview();
  }

  setFlowVideoRate(event: Event): void {
    const video = event.currentTarget as HTMLVideoElement;
    video.defaultPlaybackRate = 1.25;
    video.playbackRate = 1.25;
  }

  configureFlowVideo(event: Event): void {
    const video = event.currentTarget as HTMLVideoElement;
    video.defaultPlaybackRate = 1.25;
    video.playbackRate = 1.25;
    video.defaultMuted = true;
    video.muted = true;
    void video.play().catch(() => undefined);
  }

  configureCheckoutDemo(event: Event): void {
    const video = event.currentTarget as HTMLVideoElement;
    video.defaultPlaybackRate = 1.25;
    video.playbackRate = 1.25;
    video.defaultMuted = true;
    video.muted = true;
    video.currentTime = this.checkoutClipStart;
    void video.play().catch(() => undefined);
  }

  limitCheckoutDemo(event: Event): void {
    const video = event.currentTarget as HTMLVideoElement;
    if (video.currentTime < this.checkoutClipEnd) return;
    video.pause();
    video.currentTime = this.checkoutClipEnd;
  }

  restartCheckoutDemo(event: Event): void {
    const video = event.currentTarget as HTMLVideoElement;
    if (video.currentTime < this.checkoutClipStart || video.currentTime >= this.checkoutClipEnd - .05) {
      video.addEventListener('seeked', () => void video.play().catch(() => undefined), { once: true });
      video.currentTime = this.checkoutClipStart;
    }
  }

  keepCheckoutDemoInRange(event: Event): void {
    const video = event.currentTarget as HTMLVideoElement;
    if (video.currentTime < this.checkoutClipStart) video.currentTime = this.checkoutClipStart;
    if (video.currentTime > this.checkoutClipEnd) video.currentTime = this.checkoutClipEnd;
  }

  configureVideoPreview(event: Event): void {
    if (!this.videoPreviewUsesCheckoutClip) return;
    this.configureCheckoutDemo(event);
  }

  limitVideoPreview(event: Event): void {
    if (this.videoPreviewUsesCheckoutClip) this.limitCheckoutDemo(event);
  }

  restartVideoPreview(event: Event): void {
    if (this.videoPreviewUsesCheckoutClip) this.restartCheckoutDemo(event);
  }

  keepVideoPreviewInRange(event: Event): void {
    if (this.videoPreviewUsesCheckoutClip) this.keepCheckoutDemoInRange(event);
  }

  ngAfterViewInit(): void {
    this.unbindExpandableMedia = bindCaseExpandableMedia(this.element.nativeElement, (src, alt) => this.imagePreview?.open(src, alt));
    this.initResultsCounter();
    const hero = this.element.nativeElement.querySelector<HTMLElement>('.case-hero');
    if (!hero) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || typeof IntersectionObserver === 'undefined') {
      hero.classList.add('is-entered');
      return;
    }
    this.observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) hero.classList.add('is-entered');
      }
    }, { threshold: .2 });
    this.observer.observe(hero);
  }

  ngOnDestroy(): void {
    this.closeVideoPreview();
    this.unbindExpandableMedia?.();
    this.observer?.disconnect();
    this.resultsObserver?.disconnect();
    if (this.resultsCounterRafId !== undefined) cancelAnimationFrame(this.resultsCounterRafId);
  }

  private initResultsCounter(): void {
    const results = this.element.nativeElement.querySelector<HTMLElement>('.juh-results');
    if (!results) return;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion || typeof IntersectionObserver === 'undefined') {
      this.setResultsCounterValues(results, 1);
      return;
    }
    this.resultsObserver = new IntersectionObserver((entries, observer) => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.unobserve(results);
      this.animateResultsCounters(results);
    }, { threshold:.3, rootMargin:'0px 0px -8% 0px' });
    this.resultsObserver.observe(results);
  }

  private animateResultsCounters(results: HTMLElement): void {
    const duration = 2800;
    const startedAt = performance.now();
    const renderFrame = (now: number): void => {
      const progress = Math.min(1, (now - startedAt) / duration);
      this.setResultsCounterValues(results, 1 - Math.pow(1 - progress, 3));
      if (progress < 1) this.resultsCounterRafId = requestAnimationFrame(renderFrame);
      else this.resultsCounterRafId = undefined;
    };
    this.resultsCounterRafId = requestAnimationFrame(renderFrame);
  }

  private setResultsCounterValues(results: HTMLElement, progress: number): void {
    results.querySelectorAll<HTMLElement>('[data-count-target]').forEach(metric => {
      const target = Number(metric.dataset['countTarget'] ?? 0);
      const counter = metric.querySelector<HTMLElement>('.juh-result-counter');
      if (counter) counter.textContent = String(Math.round(target * progress));
    });
  }
}
