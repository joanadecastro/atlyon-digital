import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, inject } from '@angular/core';
import { JUH_SNIPPETS } from './juh-snippets';
import { CaseHeroScrollIndicatorComponent } from '../project-case/case-hero-scroll-indicator.component';
import { CaseImagePreviewComponent } from '../project-case/case-image-preview.component';
import { bindCaseExpandableMedia } from '../project-case/case-expandable-media';
import { bindCaseExpandableCode } from '../project-case/case-expandable-code';
import { isMobileCasePreview } from '../project-case/case-preview-mobile';
import { LanguageService } from '../i18n/language.service';
import { CASE_STUDY_NEXT } from '../case-study-navigation';
import { bindCaseViewportVideos, configureCaseVideo } from '../project-case/case-viewport-video';

@Component({
  selector: 'app-juh-case',
  standalone: true,
  imports: [CaseHeroScrollIndicatorComponent, CaseImagePreviewComponent],
  templateUrl: './juh-case.html',
  styleUrl: './juh-case.scss',
})
export class JuhCaseComponent implements AfterViewInit, OnDestroy {
  readonly nextProject = CASE_STUDY_NEXT.juh;
  readonly github = 'https://github.com/joanadecastro/juh-angular-ecommerce';
  readonly snippets = JUH_SNIPPETS;
  mobileGallerySlide = 0;
  private readonly checkoutClipStart = 18.7;
  private readonly checkoutClipEnd = 27.6;
  private readonly element: ElementRef<HTMLElement> = inject(ElementRef);
  readonly language = inject(LanguageService);
  private observer?: IntersectionObserver;
  private resultsObserver?: IntersectionObserver;
  private codeOverflowObserver?: ResizeObserver;
  private resultsCounterRafId?: number;
  private unbindExpandableMedia?: () => void;
  private unbindExpandableCode?: () => void;
  private unbindViewportVideos?: () => void;
  videoPreviewSrc: string | null = null;
  videoPreviewLabel = '';
  videoPreviewOpen = false;
  videoPreviewClosing = false;
  private videoPreviewUsesCheckoutClip = false;
  private bodyOverflowBeforePreview = '';
  private bodyScrollLocked = false;
  private videoPreviewCloseTimer?: number;
  private mobileGalleryPointerStart: { x: number; y: number; slide: number } | null = null;
  @ViewChild(CaseImagePreviewComponent) private imagePreview?: CaseImagePreviewComponent;

  openImagePreview(src: string, alt: string): void {
    const trimMobileRightEdge = src.endsWith('/projects/juh/hero_desktop.png');
    this.imagePreview?.open(src, this.language.translate(alt), false, [], null, '', trimMobileRightEdge);
  }

  onMobileGalleryScroll(event: Event): void {
    const rail = event.currentTarget;
    if (!(rail instanceof HTMLElement)) return;
    const slides = Array.from(rail.children).filter((child): child is HTMLElement => child instanceof HTMLElement);
    if (!slides.length) return;
    const railLeft = rail.getBoundingClientRect().left;
    this.mobileGallerySlide = slides.reduce((nearest, slide, index) => {
      const distance = Math.abs(slide.getBoundingClientRect().left - railLeft);
      return distance < nearest.distance ? { index, distance } : nearest;
    }, { index: 0, distance: Number.POSITIVE_INFINITY }).index;
  }

  setMobileGallerySlide(slide: number): void {
    const rail = this.element.nativeElement.querySelector<HTMLElement>('.juh-mobile-gallery');
    const target = rail?.children.item(slide);
    if (!rail || !(target instanceof HTMLElement)) return;
    const left = target.getBoundingClientRect().left - rail.getBoundingClientRect().left + rail.scrollLeft;
    rail.scrollTo({ left, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    this.mobileGallerySlide = slide;
  }

  startMobileGalleryPointer(event: PointerEvent): void {
    if (!isMobileCasePreview()) return;
    this.mobileGalleryPointerStart = { x: event.clientX, y: event.clientY, slide: this.mobileGallerySlide };
  }

  endMobileGalleryPointer(event: PointerEvent): void {
    const start = this.mobileGalleryPointerStart;
    this.mobileGalleryPointerStart = null;
    if (!start || !isMobileCasePreview()) return;
    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.abs(deltaX) < 36 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
    this.setMobileGallerySlide(Math.max(0, Math.min(2, start.slide + (deltaX < 0 ? 1 : -1))));
  }

  cancelMobileGalleryPointer(): void {
    this.mobileGalleryPointerStart = null;
  }

  openVideoPreview(src: string, label: string): void {
    if (this.videoPreviewClosing) return;
    this.videoPreviewUsesCheckoutClip = false;
    this.videoPreviewSrc = src;
    this.videoPreviewLabel = this.language.translate(label);
    if (!this.bodyScrollLocked) {
      this.bodyOverflowBeforePreview = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      this.bodyScrollLocked = true;
    }
    this.videoPreviewOpen = true;
    this.autoplayVideoPreview();
  }

  openCheckoutVideoPreview(): void {
    if (this.videoPreviewClosing) return;
    this.videoPreviewUsesCheckoutClip = true;
    this.videoPreviewSrc = '/projects/juh/video_juhecommerce.mp4';
    this.videoPreviewLabel = this.language.translate('Micro-demo de checkout e validação do JUH');
    if (!this.bodyScrollLocked) {
      this.bodyOverflowBeforePreview = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      this.bodyScrollLocked = true;
    }
    this.videoPreviewOpen = true;
    this.autoplayVideoPreview();
  }

  private autoplayVideoPreview(): void {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    requestAnimationFrame(() => {
      const previewVideo = this.element.nativeElement.querySelector<HTMLVideoElement>('.juh-video-preview video');
      if (previewVideo) {
        configureCaseVideo(previewVideo, true);
        void previewVideo.play().catch(() => undefined);
      }
    });
  }

  closeVideoPreview(): void {
    if (this.videoPreviewClosing || !this.videoPreviewOpen) return;
    if (!isMobileCasePreview()) {
      this.videoPreviewOpen = false;
      this.videoPreviewSrc = null;
      this.videoPreviewLabel = '';
      this.videoPreviewUsesCheckoutClip = false;
      if (this.bodyScrollLocked) {
        document.body.style.overflow = this.bodyOverflowBeforePreview;
        this.bodyScrollLocked = false;
      }
      return;
    }
    this.videoPreviewClosing = true;
    this.videoPreviewOpen = false;
    if (this.videoPreviewCloseTimer !== undefined) window.clearTimeout(this.videoPreviewCloseTimer);
    this.videoPreviewCloseTimer = window.setTimeout(() => {
      this.videoPreviewSrc = null;
      this.videoPreviewLabel = '';
      this.videoPreviewUsesCheckoutClip = false;
      this.videoPreviewClosing = false;
      if (this.bodyScrollLocked) {
        document.body.style.overflow = this.bodyOverflowBeforePreview;
        this.bodyScrollLocked = false;
      }
    }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 120 : 550);
  }

  closeVideoPreviewFromBackdrop(event: Event): void {
    if (this.videoPreviewClosing) { event.stopPropagation(); return; }
    if (event.target === event.currentTarget) this.closeVideoPreview();
  }

  handleVideoPreviewPanelPointer(event: PointerEvent): void {
    event.stopPropagation();
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
  }

  configureCheckoutDemo(event: Event): void {
    const video = event.currentTarget as HTMLVideoElement;
    video.defaultPlaybackRate = 1.25;
    video.playbackRate = 1.25;
    video.defaultMuted = true;
    video.muted = true;
    video.currentTime = this.checkoutClipStart;
  }

  limitCheckoutDemo(event: Event): void {
    const video = event.currentTarget as HTMLVideoElement;
    if (video.currentTime < this.checkoutClipEnd) return;
    video.currentTime = this.checkoutClipStart;
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
    this.unbindExpandableCode = bindCaseExpandableCode(this.element.nativeElement, (label, code) => this.imagePreview?.openCode(label, code));
    this.unbindViewportVideos = bindCaseViewportVideos(this.element.nativeElement);
    this.initCodeOverflowDetection();
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
    this.unbindExpandableCode?.();
    this.unbindViewportVideos?.();
    this.observer?.disconnect();
    this.resultsObserver?.disconnect();
    this.codeOverflowObserver?.disconnect();
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

  private initCodeOverflowDetection(): void {
    const snippets = Array.from(this.element.nativeElement.querySelectorAll<HTMLElement>('.juh-code pre'));
    const update = (snippet: HTMLElement): void => {
      snippet.classList.toggle('has-horizontal-code-overflow', snippet.scrollWidth > snippet.clientWidth + 1);
    };
    snippets.forEach(update);
    if (typeof ResizeObserver === 'undefined') return;
    this.codeOverflowObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => update(entry.target as HTMLElement));
    });
    snippets.forEach((snippet) => this.codeOverflowObserver?.observe(snippet));
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
