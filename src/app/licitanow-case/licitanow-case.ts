import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { TranslateDirective } from '../i18n/translate.directive';
import { CaseHeroScrollIndicatorComponent } from '../project-case/case-hero-scroll-indicator.component';
import { CaseImagePreviewComponent } from '../project-case/case-image-preview.component';
import { bindCaseExpandableMedia } from '../project-case/case-expandable-media';
import { bindCaseExpandableCode } from '../project-case/case-expandable-code';
import { isMobileCasePreview } from '../project-case/case-preview-mobile';
import { CASE_STUDY_NEXT } from '../case-study-navigation';
import { bindCaseViewportVideos, configureCaseVideo } from '../project-case/case-viewport-video';

type DecisionCarousel = 'hero' | 'process' | 'principles' | 'about' | 'references' | 'composition' | 'illustration' | 'palette';
type BeforeAfterCarousel = 'hero' | 'process' | 'principles' | 'about' | 'final';

@Component({
  selector: 'app-licitanow-case',
  standalone: true,
  imports: [CaseHeroScrollIndicatorComponent, CaseImagePreviewComponent],
  hostDirectives: [TranslateDirective],
  templateUrl: './licitanow-case.html',
  styleUrl: './licitanow-case.scss',
})
export class LicitaNowCaseComponent implements AfterViewInit, OnDestroy {
  readonly nextProject = CASE_STUDY_NEXT.licitanow;
  openSolution: number | null = null;
  responsiveMockupSlide = 0;
  implementationSlide = 0;
  globalViewSlide = 0;
  beforeAfterSlides: Record<BeforeAfterCarousel, number> = { hero: 0, process: 0, principles: 0, about: 0, final: 0 };
  decisionSlides: Record<DecisionCarousel, number> = {
    hero: 0,
    process: 0,
    principles: 0,
    about: 0,
    references: 0,
    composition: 0,
    illustration: 0,
    palette: 0,
  };
  videoPreviewSrc: string | null = null;
  videoPreviewLabel = '';
  videoPreviewOpen = false;
  videoPreviewClosing = false;
  @ViewChild(CaseImagePreviewComponent) private imagePreview?: CaseImagePreviewComponent;
  @ViewChild('nextProjectNav', { read: ElementRef }) private nextProjectNavRef?: ElementRef<HTMLElement>;

  private observer?: IntersectionObserver;
  private nextProjectObserver?: IntersectionObserver;
  private unbindViewportVideos?: () => void;
  private bodyOverflowBeforePreview = '';
  private bodyScrollLocked = false;
  private videoPreviewCloseTimer?: number;
  private unbindExpandableMedia?: () => void;
  private unbindExpandableCode?: () => void;
  private decisionSwipeStart: { carousel: DecisionCarousel; x: number; y: number } | null = null;
  private implementationPointerStart: {
    x: number;
    y: number;
    slide: number;
    pointerId: number;
    snippet: HTMLElement | null;
    snippetScrollLeft: number;
    snippetMaxScroll: number;
  } | null = null;
  private globalViewPointerStart: { x: number; y: number; slide: number } | null = null;
  private readonly decisionCarouselOrder: DecisionCarousel[] = ['hero', 'process', 'principles', 'about', 'references', 'composition', 'illustration', 'palette'];
  private readonly decisionCarouselTimers = new Map<DecisionCarousel, number>();
  private readonly animatingDecisionCarousels = new Set<DecisionCarousel>();
  private desktopCarouselMedia?: MediaQueryList;
  private readonly handleDesktopCarouselChange = (): void => this.syncDesktopCarousels();

  constructor(private readonly host: ElementRef<HTMLElement>) {}

  toggleSolution(solution: number): void {
    this.openSolution = this.openSolution === solution ? null : solution;
  }

  setDecisionSlide(carousel: DecisionCarousel, slide: number): void {
    const normalizedSlide = (slide + 3) % 3;
    if (this.animatingDecisionCarousels.has(carousel)) return;

    const currentSlide = this.decisionSlides[carousel];
    const track = this.decisionTrack(carousel);
    if (!track || currentSlide === normalizedSlide) return;

    const wrapsForward = currentSlide === 2 && normalizedSlide === 0;
    const wrapsBackward = currentSlide === 0 && normalizedSlide === 2;
    const technicalSlide = wrapsForward ? 4 : wrapsBackward ? 0 : normalizedSlide + 1;
    this.decisionSlides[carousel] = normalizedSlide;
    this.animatingDecisionCarousels.add(carousel);
    track.style.transform = `translateX(-${technicalSlide * 100}%)`;

    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => {
      if (wrapsForward || wrapsBackward) {
        track.style.transition = 'none';
        track.style.transform = `translateX(-${(normalizedSlide + 1) * 100}%)`;
        void track.offsetWidth;
        track.style.removeProperty('transition');
      }
      this.animatingDecisionCarousels.delete(carousel);
      this.decisionCarouselTimers.delete(carousel);
    }, reducedMotion ? 0 : this.desktopCarouselMedia?.matches ? 820 : 540);
    this.decisionCarouselTimers.set(carousel, timer);
  }

  startDecisionSwipe(carousel: DecisionCarousel, event: PointerEvent): void {
    if (!isMobileCasePreview()) return;
    this.decisionSwipeStart = { carousel, x: event.clientX, y: event.clientY };
  }

  endDecisionSwipe(carousel: DecisionCarousel, event: PointerEvent): void {
    const start = this.decisionSwipeStart;
    this.decisionSwipeStart = null;
    if (!start || start.carousel !== carousel || !isMobileCasePreview()) return;
    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.abs(deltaX) < 36 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
    this.setDecisionSlide(carousel, this.decisionSlides[carousel] + (deltaX < 0 ? 1 : -1));
  }

  cancelDecisionSwipe(): void {
    this.decisionSwipeStart = null;
  }

  onBeforeAfterScroll(carousel: BeforeAfterCarousel, event: Event): void {
    const rail = event.currentTarget;
    if (!(rail instanceof HTMLElement)) return;
    const slides = Array.from(rail.querySelectorAll<HTMLElement>(':scope > figure'));
    if (!slides.length) return;
    const railLeft = rail.getBoundingClientRect().left;
    this.beforeAfterSlides[carousel] = slides.reduce((nearest, slide, index) => {
      const distance = Math.abs(slide.getBoundingClientRect().left - railLeft);
      return distance < nearest.distance ? { index, distance } : nearest;
    }, { index: 0, distance: Number.POSITIVE_INFINITY }).index;
  }

  setBeforeAfterSlide(carousel: BeforeAfterCarousel, slide: number): void {
    const rail = this.host.nativeElement.querySelector<HTMLElement>(`[data-before-after="${carousel}"]`);
    const target = rail?.querySelectorAll<HTMLElement>(':scope > figure').item(slide);
    if (!rail || !target) return;
    const left = target.getBoundingClientRect().left - rail.getBoundingClientRect().left + rail.scrollLeft;
    rail.scrollTo({ left, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    this.beforeAfterSlides[carousel] = slide;
  }

  onResponsiveMockupScroll(event: Event): void {
    const rail = event.currentTarget;
    if (!(rail instanceof HTMLElement)) return;
    const slides = Array.from(rail.children).filter((child): child is HTMLElement => child instanceof HTMLElement);
    if (!slides.length) return;
    const railLeft = rail.getBoundingClientRect().left;
    const active = slides.reduce((nearest, slide, index) => {
      const distance = Math.abs(slide.getBoundingClientRect().left - railLeft);
      return distance < nearest.distance ? { index, distance } : nearest;
    }, { index: 0, distance: Number.POSITIVE_INFINITY }).index;
    this.responsiveMockupSlide = active;
  }

  setResponsiveMockupSlide(slide: number): void {
    const rail = this.host.nativeElement.querySelector<HTMLElement>('.licita-responsive-implementation__screens');
    const target = rail?.children.item(slide);
    if (!rail || !(target instanceof HTMLElement)) return;
    const left = target.getBoundingClientRect().left - rail.getBoundingClientRect().left + rail.scrollLeft;
    rail.scrollTo({ left, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    this.responsiveMockupSlide = slide;
  }

  onImplementationScroll(event: Event): void {
    const rail = event.currentTarget;
    if (!(rail instanceof HTMLElement)) return;
    const slides = Array.from(rail.children).filter((child): child is HTMLElement => child instanceof HTMLElement);
    if (!slides.length) return;
    const railLeft = rail.getBoundingClientRect().left;
    this.implementationSlide = slides.reduce((nearest, slide, index) => {
      const distance = Math.abs(slide.getBoundingClientRect().left - railLeft);
      return distance < nearest.distance ? { index, distance } : nearest;
    }, { index: 0, distance: Number.POSITIVE_INFINITY }).index;
  }

  setImplementationSlide(slide: number): void {
    const rail = this.host.nativeElement.querySelector<HTMLElement>('.licita-implementation__blocks');
    const target = rail?.children.item(slide);
    if (!rail || !(target instanceof HTMLElement)) return;
    const left = target.getBoundingClientRect().left - rail.getBoundingClientRect().left + rail.scrollLeft;
    rail.scrollTo({ left, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    this.implementationSlide = slide;
  }

  startImplementationPointer(event: PointerEvent): void {
    if (!isMobileCasePreview()) return;
    const target = event.target instanceof Element ? event.target : null;
    const snippet = target?.closest<HTMLElement>('.licita-implementation__code') ?? null;
    this.implementationPointerStart = {
      x: event.clientX,
      y: event.clientY,
      slide: this.implementationSlide,
      pointerId: event.pointerId,
      snippet,
      snippetScrollLeft: snippet?.scrollLeft ?? 0,
      snippetMaxScroll: snippet ? Math.max(0, snippet.scrollWidth - snippet.clientWidth) : 0,
    };
    if (event.currentTarget instanceof HTMLElement) event.currentTarget.setPointerCapture(event.pointerId);
  }

  moveImplementationPointer(event: PointerEvent): void {
    const start = this.implementationPointerStart;
    if (!start?.snippet || start.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.abs(deltaX) <= Math.abs(deltaY)) return;
    start.snippet.scrollLeft = Math.max(0, Math.min(start.snippetMaxScroll, start.snippetScrollLeft - deltaX));
  }

  endImplementationPointer(event: PointerEvent): void {
    const start = this.implementationPointerStart;
    this.implementationPointerStart = null;
    if (!start || !isMobileCasePreview()) return;
    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.abs(deltaX) < 36 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
    if (start.snippet) {
      const atLeftEdge = start.snippetScrollLeft <= 1;
      const atRightEdge = start.snippetScrollLeft >= start.snippetMaxScroll - 1;
      const movingToPrevious = deltaX > 0;
      const movingToNext = deltaX < 0;
      if ((movingToPrevious && !atLeftEdge) || (movingToNext && !atRightEdge)) return;
    }
    this.setImplementationSlide(Math.max(0, Math.min(1, start.slide + (deltaX < 0 ? 1 : -1))));
  }

  cancelImplementationPointer(): void {
    this.implementationPointerStart = null;
  }

  onGlobalViewScroll(event: Event): void {
    const rail = event.currentTarget;
    if (!(rail instanceof HTMLElement)) return;
    const slides = Array.from(rail.querySelectorAll<HTMLElement>(':scope > figure'));
    if (!slides.length) return;
    const railLeft = rail.getBoundingClientRect().left;
    this.globalViewSlide = slides.reduce((nearest, slide, index) => {
      const distance = Math.abs(slide.getBoundingClientRect().left - railLeft);
      return distance < nearest.distance ? { index, distance } : nearest;
    }, { index: 0, distance: Number.POSITIVE_INFINITY }).index;
  }

  setGlobalViewSlide(slide: number): void {
    const rail = this.host.nativeElement.querySelector<HTMLElement>('.licita-global-view__comparison');
    const target = rail?.querySelectorAll<HTMLElement>(':scope > figure').item(slide);
    if (!rail || !target) return;
    const left = target.getBoundingClientRect().left - rail.getBoundingClientRect().left + rail.scrollLeft;
    rail.scrollTo({ left, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    this.globalViewSlide = slide;
  }

  startGlobalViewPointer(event: PointerEvent): void {
    if (!isMobileCasePreview()) return;
    this.globalViewPointerStart = { x: event.clientX, y: event.clientY, slide: this.globalViewSlide };
  }

  endGlobalViewPointer(event: PointerEvent): void {
    const start = this.globalViewPointerStart;
    this.globalViewPointerStart = null;
    if (!start || !isMobileCasePreview()) return;
    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.abs(deltaX) < 36 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
    this.setGlobalViewSlide(Math.max(0, Math.min(1, start.slide + (deltaX < 0 ? 1 : -1))));
  }

  cancelGlobalViewPointer(): void {
    this.globalViewPointerStart = null;
  }

  openComparisonPreview(event: Event): void {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const trigger = target.closest<HTMLButtonElement>('.licita-applied-comparison__expand');
    const image = trigger?.closest('figure')?.querySelector<HTMLImageElement>('.licita-applied-comparison__media img');
    if (!trigger || !image) return;

    this.imagePreview?.open(image.currentSrc || image.src, image.alt, image.classList.contains('licita-global-view__image'));
  }

  openHeroPreviousPreview(event: Event): void {
    if (!isMobileCasePreview()) return;
    event.preventDefault();
    event.stopPropagation();
    this.imagePreview?.open('/projects/licita/Frame 9 (2).png', 'Hero da landing anterior do LicitaNow');
  }

  closeComparisonPreview(): void {
    this.imagePreview?.close();
  }

  closeComparisonPreviewFromBackdrop(event: Event): void {
    if (event.target === event.currentTarget) this.closeComparisonPreview();
  }

  openVideoPreview(src: string, label: string): void {
    if (this.videoPreviewClosing) return;
    this.videoPreviewSrc = src;
    this.videoPreviewLabel = label;
    if (!this.bodyScrollLocked) {
      this.bodyOverflowBeforePreview = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      this.bodyScrollLocked = true;
    }
    this.videoPreviewOpen = true;
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      requestAnimationFrame(() => {
        const previewVideo = document.querySelector<HTMLVideoElement>('.licita-video-preview video');
        if (previewVideo) {
          configureCaseVideo(previewVideo, true);
          void previewVideo.play().catch(() => undefined);
        }
      });
    }
  }

  closeVideoPreview(): void {
    if (this.videoPreviewClosing || !this.videoPreviewOpen) return;
    if (!isMobileCasePreview()) {
      this.videoPreviewOpen = false;
      this.videoPreviewSrc = null;
      this.videoPreviewLabel = '';
      this.restoreBodyScroll();
      return;
    }
    this.videoPreviewClosing = true;
    this.videoPreviewOpen = false;
    if (this.videoPreviewCloseTimer !== undefined) window.clearTimeout(this.videoPreviewCloseTimer);
    this.videoPreviewCloseTimer = window.setTimeout(() => {
      this.videoPreviewSrc = null;
      this.videoPreviewLabel = '';
      this.videoPreviewClosing = false;
      this.restoreBodyScroll();
    }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 120 : 550);
  }

  closeVideoPreviewFromBackdrop(event: Event): void {
    if (this.videoPreviewClosing) { event.stopPropagation(); return; }
    if (event.target === event.currentTarget) this.closeVideoPreview();
  }

  handleVideoPreviewPanelPointer(event: PointerEvent): void {
    event.stopPropagation();
  }

  ngAfterViewInit(): void {
    this.unbindExpandableMedia = bindCaseExpandableMedia(
      this.host.nativeElement,
      (src, alt) => this.imagePreview?.open(src, alt),
      (src, label) => this.openVideoPreview(src, label),
    );
    this.unbindExpandableCode = bindCaseExpandableCode(this.host.nativeElement, (label, code) => this.imagePreview?.openCode(label, code));
    this.desktopCarouselMedia = matchMedia('(min-width: 769px)');
    this.syncDesktopCarousels();
    this.desktopCarouselMedia.addEventListener('change', this.handleDesktopCarouselChange);
    this.unbindViewportVideos = bindCaseViewportVideos(this.host.nativeElement);

    const hero = document.querySelector<HTMLElement>('.licitanow-page .civitas-hero');
    const items = Array.from(document.querySelectorAll<HTMLElement>('.licitanow-page .civitas-reveal'));
    const chapters = Array.from(document.querySelectorAll<HTMLElement>('.licitanow-page .story-chapter'));
    const observed = [hero, ...chapters].filter((item): item is HTMLElement => Boolean(item));
    const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobileViewport = matchMedia('(max-width: 768px)').matches;
    this.setupNextProjectReveal(prefersReducedMotion);
    if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
      hero?.classList.add('is-entered'); items.forEach((item) => item.classList.add('is-visible')); chapters.forEach((item) => item.classList.add('is-entered'));
      return;
    }

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const section = entry.target as HTMLElement;
        const hasEntered = isMobileViewport ? entry.isIntersecting : entry.intersectionRatio >= .18;
        const hasExited = isMobileViewport ? !entry.isIntersecting : entry.intersectionRatio < .05;
        if (hasEntered) { section.classList.add('is-entered'); section.querySelectorAll<HTMLElement>('.civitas-reveal').forEach((item) => item.classList.add('is-visible')); }
        else if (hasExited) { section.classList.remove('is-entered'); section.querySelectorAll<HTMLElement>('.civitas-reveal').forEach((item) => item.classList.remove('is-visible')); }
      });
    }, { threshold: [0, .05, .18, .3], rootMargin: '0px 0px -6% 0px' });
    observed.forEach((item) => this.observer?.observe(item));
  }

  ngOnDestroy(): void {
    this.unbindExpandableMedia?.();
    this.unbindExpandableCode?.();
    this.videoPreviewSrc = null;
    this.restoreBodyScroll();
    this.observer?.disconnect();
    this.unbindViewportVideos?.();
    this.nextProjectObserver?.disconnect();
    this.desktopCarouselMedia?.removeEventListener('change', this.handleDesktopCarouselChange);
    this.decisionCarouselTimers.forEach((timer) => window.clearTimeout(timer));
  }

  private setupNextProjectReveal(reducedMotion: boolean): void {
    const element = this.nextProjectNavRef?.nativeElement;
    if (!element) return;
    if (reducedMotion || typeof IntersectionObserver === 'undefined') {
      element.classList.add('is-visible');
      return;
    }

    this.nextProjectObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.intersectionRatio >= .25) element.classList.add('is-visible');
      else if (entry.intersectionRatio < .08) element.classList.remove('is-visible');
    }), { threshold: [0, .08, .25, .4] });
    this.nextProjectObserver.observe(element);
  }

  private decisionTrack(carousel: DecisionCarousel): HTMLOListElement | null {
    const index = this.decisionCarouselOrder.indexOf(carousel);
    return this.host.nativeElement.querySelectorAll<HTMLOListElement>('.licita-hero-decisions-carousel')[index] ?? null;
  }

  private syncDesktopCarousels(): void {
    this.decisionCarouselOrder.forEach((carousel) => {
      const track = this.decisionTrack(carousel);
      if (!track) return;
      track.querySelectorAll(':scope > [data-carousel-clone]').forEach((clone) => clone.remove());
      track.style.transition = 'none';
      const slides = Array.from(track.children) as HTMLElement[];
      const before = slides.at(-1)?.cloneNode(true) as HTMLElement | undefined;
      const after = slides[0]?.cloneNode(true) as HTMLElement | undefined;
      if (before && after) {
        before.dataset['carouselClone'] = 'before';
        after.dataset['carouselClone'] = 'after';
        before.setAttribute('aria-hidden', 'true');
        after.setAttribute('aria-hidden', 'true');
        track.prepend(before);
        track.append(after);
      }
      track.style.transform = `translateX(-${(this.decisionSlides[carousel] + 1) * 100}%)`;
      void track.offsetWidth;
      track.style.removeProperty('transition');
    });
  }

  private restoreBodyScroll(): void {
    if (!this.bodyScrollLocked) return;
    document.body.style.overflow = this.bodyOverflowBeforePreview;
    this.bodyScrollLocked = false;
  }
}
