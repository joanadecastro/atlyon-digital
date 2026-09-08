import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { TranslateDirective } from '../i18n/translate.directive';

@Component({
  selector: 'app-licitanow-case',
  standalone: true,
  hostDirectives: [TranslateDirective],
  templateUrl: './licitanow-case.html',
  styleUrl: './licitanow-case.scss',
})
export class LicitaNowCaseComponent implements AfterViewInit, OnDestroy {
  openSolution: number | null = null;
  previewSrc: string | null = null;
  previewAlt = '';
  previewOpen = false;
  previewIsLanding = false;
  videoPreviewSrc: string | null = null;
  videoPreviewLabel = '';
  videoPreviewOpen = false;
  @ViewChild('challengeVideo', { static: true }) private challengeVideoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('nextProjectNav', { read: ElementRef }) private nextProjectNavRef?: ElementRef<HTMLElement>;

  private observer?: IntersectionObserver;
  private videoObserver?: IntersectionObserver;
  private nextProjectObserver?: IntersectionObserver;
  private videos: HTMLVideoElement[] = [];
  private previewCleanupTimer?: number;
  private bodyOverflowBeforePreview = '';
  private bodyScrollLocked = false;

  toggleSolution(solution: number): void {
    this.openSolution = this.openSolution === solution ? null : solution;
  }

  openComparisonPreview(event: Event): void {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const trigger = target.closest<HTMLButtonElement>('.licita-applied-comparison__expand');
    const image = trigger?.closest('figure')?.querySelector<HTMLImageElement>('.licita-applied-comparison__media img');
    if (!trigger || !image) return;

    if (this.previewCleanupTimer !== undefined) window.clearTimeout(this.previewCleanupTimer);
    this.previewSrc = image.currentSrc || image.src;
    this.previewAlt = image.alt;
    this.previewIsLanding = image.classList.contains('licita-global-view__image');
    if (!this.bodyScrollLocked) {
      this.bodyOverflowBeforePreview = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      this.bodyScrollLocked = true;
    }
    this.previewOpen = true;
  }

  closeComparisonPreview(): void {
    this.previewOpen = false;
    this.restoreBodyScroll();
    if (this.previewCleanupTimer !== undefined) window.clearTimeout(this.previewCleanupTimer);
    this.previewCleanupTimer = window.setTimeout(() => {
      if (!this.previewOpen) {
        this.previewSrc = null;
        this.previewAlt = '';
        this.previewIsLanding = false;
      }
    }, 230);
  }

  closeComparisonPreviewFromBackdrop(event: Event): void {
    if (event.target === event.currentTarget) this.closeComparisonPreview();
  }

  openVideoPreview(src: string, label: string): void {
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
        if (previewVideo) void previewVideo.play().catch(() => undefined);
      });
    }
  }

  closeVideoPreview(): void {
    this.videoPreviewOpen = false;
    this.videoPreviewSrc = null;
    this.videoPreviewLabel = '';
    this.restoreBodyScroll();
  }

  closeVideoPreviewFromBackdrop(event: Event): void {
    if (event.target === event.currentTarget) this.closeVideoPreview();
  }

  ngAfterViewInit(): void {
    const challengeVideo = this.challengeVideoRef.nativeElement;
    challengeVideo.muted = true;
    challengeVideo.defaultMuted = true;
    challengeVideo.autoplay = true;
    challengeVideo.loop = true;
    challengeVideo.playsInline = true;

    const playChallengeVideo = (): void => {
      void challengeVideo.play().catch(() => undefined);
    };

    if (challengeVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) playChallengeVideo();
    else challengeVideo.addEventListener('canplay', playChallengeVideo, { once: true });

    const hero = document.querySelector<HTMLElement>('.licitanow-page .civitas-hero');
    const items = Array.from(document.querySelectorAll<HTMLElement>('.licitanow-page .civitas-reveal'));
    const chapters = Array.from(document.querySelectorAll<HTMLElement>('.licitanow-page .story-chapter'));
    const observed = [hero, ...chapters].filter((item): item is HTMLElement => Boolean(item));
    const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.setupNextProjectReveal(prefersReducedMotion);
    this.videos = Array.from(document.querySelectorAll<HTMLVideoElement>('.licitanow-page video[data-viewport-video]'));
    this.videos.forEach((video) => {
      video.muted = true;
      video.defaultMuted = true;
      video.loop = true;
      video.playsInline = true;
      video.pause();
    });
    if (this.videos.length && !prefersReducedMotion) {
      if (typeof IntersectionObserver === 'undefined') this.videos.forEach((video) => void video.play().catch(() => undefined));
      else {
        this.videoObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
          const video = entry.target as HTMLVideoElement;
          if (entry.isIntersecting && entry.intersectionRatio >= .2) void video.play().catch(() => undefined);
          else video.pause();
        }), { threshold: [0, .2, .5] });
        this.videos.forEach((video) => this.videoObserver?.observe(video));
      }
    }
    if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
      hero?.classList.add('is-entered'); items.forEach((item) => item.classList.add('is-visible')); chapters.forEach((item) => item.classList.add('is-entered'));
      return;
    }

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const section = entry.target as HTMLElement;
        if (entry.intersectionRatio >= .18) { section.classList.add('is-entered'); section.querySelectorAll<HTMLElement>('.civitas-reveal').forEach((item) => item.classList.add('is-visible')); }
        else if (entry.intersectionRatio < .05) { section.classList.remove('is-entered'); section.querySelectorAll<HTMLElement>('.civitas-reveal').forEach((item) => item.classList.remove('is-visible')); }
      });
    }, { threshold: [0, .05, .18, .3], rootMargin: '0px 0px -6% 0px' });
    observed.forEach((item) => this.observer?.observe(item));
  }

  ngOnDestroy(): void {
    if (this.previewCleanupTimer !== undefined) window.clearTimeout(this.previewCleanupTimer);
    this.videoPreviewSrc = null;
    this.restoreBodyScroll();
    this.observer?.disconnect();
    this.videoObserver?.disconnect();
    this.nextProjectObserver?.disconnect();
    this.videos.forEach((video) => video.pause());
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

  private restoreBodyScroll(): void {
    if (!this.bodyScrollLocked) return;
    document.body.style.overflow = this.bodyOverflowBeforePreview;
    this.bodyScrollLocked = false;
  }
}
