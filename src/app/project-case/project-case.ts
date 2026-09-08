import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import { TranslateDirective } from '../i18n/translate.directive';

type DemoKey = 'panel' | 'overview' | 'variant';
type Demo = { key: DemoKey; element: HTMLElement; order: string[] };

@Component({ selector: 'app-project-case', standalone: true, hostDirectives: [TranslateDirective], templateUrl: './project-case.html', styleUrl: './project-case.scss' })
export class ProjectCaseComponent implements AfterViewInit, OnDestroy {
  @Input() project: any;
  @Output() back = new EventEmitter<void>();
  @ViewChild('panelMockupDemo', { read: ElementRef }) panelRef?: ElementRef<HTMLElement>;
  @ViewChild('overviewMockupDemo', { read: ElementRef }) overviewRef?: ElementRef<HTMLElement>;
  @ViewChild('variantMockupDemo', { read: ElementRef }) variantRef?: ElementRef<HTMLElement>;
  @ViewChild('metricTagsDemo', { read: ElementRef }) metricTagsRef?: ElementRef<HTMLElement>;
  @ViewChild('flowMetricsDemo', { read: ElementRef }) flowMetricsRef?: ElementRef<HTMLElement>;
  @ViewChild('heroFlowOverlay', { read: ElementRef }) heroFlowOverlayRef?: ElementRef<HTMLElement>;
  @ViewChild('heroPanelTags', { read: ElementRef }) heroPanelTagsRef?: ElementRef<HTMLElement>;
  @ViewChild('challengeFlowOverlay', { read: ElementRef }) challengeFlowOverlayRef?: ElementRef<HTMLElement>;
  @ViewChild('challengePanelTags', { read: ElementRef }) challengePanelTagsRef?: ElementRef<HTMLElement>;
  @ViewChild('nextProjectNav', { read: ElementRef }) nextProjectNavRef?: ElementRef<HTMLElement>;
  @ViewChild('responsiveMobileDemo', { read: ElementRef }) responsiveMobileDemoRef?: ElementRef<HTMLElement>;
  @ViewChild('responsivePanelDemo', { read: ElementRef }) responsivePanelDemoRef?: ElementRef<HTMLElement>;
  activeOverviewHotspot: string | null = null;
  demoPulsingHotspot: string | null = null;
  challengeFrontScreen: 'panel' | 'overview' = 'panel';
  challengeDepthSwitching = false;
  challengePreviewSrc: string | null = null;
  challengePreviewAlt = '';
  challengePreviewOpen = false;
  flowMetricValues = ['0.0 kW', '0%', '0.0 kW', '0.0 kW'];
  responsiveOverviewVariant: 0 | 1 = 0;

  private revealObserver?: IntersectionObserver;
  private storyRevealObserver?: IntersectionObserver;
  private demoObserver?: IntersectionObserver;
  private flowMetricsObserver?: IntersectionObserver;
  private metricTagsObserver?: IntersectionObserver;
  private variantFlowObserver?: IntersectionObserver;
  private variantFlowFrame?: number;
  private mainFlowObserver?: IntersectionObserver;
  private mainFlowFrame?: number;
  private overviewMetricTagTimers = new Map<HTMLElement, ReturnType<typeof setTimeout>>();
  private compactFlowObservers: IntersectionObserver[] = [];
  private compactFlowFrames = new Map<HTMLElement, number>();
  private nextProjectObserver?: IntersectionObserver;
  private responsiveGroupObservers: IntersectionObserver[] = [];
  private responsiveVariantObserver?: IntersectionObserver;
  private responsiveVariantTimer?: ReturnType<typeof setInterval>;
  private demos: Demo[] = [];
  private ratios = new Map<DemoKey, number>();
  private activeDemo: DemoKey | null = null;
  private automaticHotspot: string | null = null;
  private demoIndex = 0;
  private running = false;
  private manuallyPaused = false;
  private demoTimer?: ReturnType<typeof setTimeout>;
  private resumeTimer?: ReturnType<typeof setTimeout>;
  private scrollFrame?: number;
  private heroFrame?: number;
  private challengeDepthTimer?: ReturnType<typeof setTimeout>;
  private challengeDepthResumeTimer?: ReturnType<typeof setTimeout>;
  private challengeDepthMidpointTimer?: ReturnType<typeof setTimeout>;
  private challengeDepthFinishTimer?: ReturnType<typeof setTimeout>;
  private flowMetricsFrame?: number;
  private flowMetricsStartedAt?: number;
  private flowMetricsActive = false;
  private flowMetricsStart?: () => void;
  private flowMetricsReset?: () => void;

  constructor(private readonly cdr: ChangeDetectorRef) {}

  openChallengePreview(src: string, alt: string, event: Event): void {
    event.stopPropagation();
    this.challengePreviewSrc = src;
    this.challengePreviewAlt = alt;
    this.challengePreviewOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeChallengePreview(): void {
    if (!this.challengePreviewOpen && !this.challengePreviewSrc) return;
    this.challengePreviewOpen = false;
    this.challengePreviewSrc = null;
    this.challengePreviewAlt = '';
    document.body.style.overflow = '';
  }

  closeChallengePreviewFromBackdrop(event: Event): void {
    if (event.target === event.currentTarget) this.closeChallengePreview();
  }

  toggleOverviewHotspot(id: string, event: Event): void {
    event.stopPropagation();
    this.pauseForInteraction();
    this.activeOverviewHotspot = this.activeOverviewHotspot === id ? null : id;
  }

  @HostListener('pointerover', ['$event'])
  onPointerOver(event: PointerEvent): void {
    const hotspot = (event.target as Element | null)?.closest('.overview-hotspot');
    if (hotspot && !hotspot.contains(event.relatedTarget as Node | null)) this.pauseForInteraction();
  }

  @HostListener('pointerout', ['$event'])
  onPointerOut(event: PointerEvent): void {
    const hotspot = (event.target as Element | null)?.closest('.overview-hotspot');
    if (hotspot && !hotspot.contains(event.relatedTarget as Node | null)) this.scheduleResume();
  }

  @HostListener('document:click')
  @HostListener('document:keydown.escape')
  closeOverviewHotspot(): void {
    this.activeOverviewHotspot = null;
    if (this.manuallyPaused) this.scheduleResume();
  }

  @HostListener('window:scroll')
  @HostListener('document:scroll')
  onScroll(): void {
    if (this.scrollFrame !== undefined) return;
    this.scrollFrame = requestAnimationFrame(() => {
      this.scrollFrame = undefined;
      this.measureVisibility();
      this.measureFlowMetricsVisibility();
    });
  }

  ngAfterViewInit(): void {
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hero = document.querySelector<HTMLElement>('.civitas-hero');
    const heroItems = Array.from(document.querySelectorAll<HTMLElement>('.civitas-hero .civitas-reveal'));
    if (reducedMotion || typeof IntersectionObserver === 'undefined') {
      hero?.classList.add('is-entered');
      heroItems.forEach(item => item.classList.add('is-visible'));
    } else if (hero) {
      this.revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.intersectionRatio >= .35) {
          hero.classList.add('is-entered');
          heroItems.forEach(item => item.classList.add('is-visible'));
        } else if (entry.intersectionRatio < .08) {
          hero.classList.remove('is-entered');
          heroItems.forEach(item => item.classList.remove('is-visible'));
        }
      }), { threshold:[0,.08,.35,.4] });
      this.revealObserver.observe(hero);
    }
    const panel = document.querySelector<HTMLElement>('.civitas-story-panel');
    const chapters = Array.from(panel?.querySelectorAll<HTMLElement>('.story-chapter') ?? []);
    panel?.classList.add('scroll-reveal-enabled');
    if (reducedMotion || typeof IntersectionObserver === 'undefined') chapters.forEach(item => item.classList.add('is-entered'));
    else {
      this.storyRevealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
        const chapter = entry.target as HTMLElement;
        const revealThreshold = chapter.classList.contains('story-user') ? .4 : .3;
        if (entry.intersectionRatio >= revealThreshold) {
          chapter.classList.add('is-entered');
          if (chapter.classList.contains('story-challenge')) this.scheduleChallengeDepthChange();
        } else if (entry.intersectionRatio < .08 && !chapter.classList.contains('story-architecture')) {
          chapter.classList.remove('is-entered');
          if (chapter.classList.contains('story-challenge')) {
            this.clearChallengeDepthTimers();
            this.challengeFrontScreen = 'panel';
            this.challengeDepthSwitching = false;
            this.render();
          }
        }
      }), { threshold:[0,.08,.3,.4] });
      chapters.forEach(item => this.storyRevealObserver?.observe(item));
    }
    this.setupDemos();
    this.setupMainFlowDemo();
    this.setupVariantFlowDemo();
    this.setupMetricTagsDemo();
    this.setupFlowMetricsDemo();
    this.setupCompactFlowDemo(this.heroFlowOverlayRef?.nativeElement);
    this.setupCompactFlowDemo(this.heroPanelTagsRef?.nativeElement);
    this.setupCompactFlowDemo(this.challengePanelTagsRef?.nativeElement);
    this.setupCompactFlowDemo(this.challengeFlowOverlayRef?.nativeElement);
    this.setupResponsiveGroupReveal(this.responsivePanelDemoRef?.nativeElement, reducedMotion);
    this.setupResponsiveGroupReveal(this.responsiveMobileDemoRef?.nativeElement, reducedMotion);
    this.setupResponsiveVariantDemo(this.responsiveMobileDemoRef?.nativeElement, reducedMotion);
    this.setupNextProjectReveal(reducedMotion);
  }

  private setupResponsiveVariantDemo(element: HTMLElement | undefined, reducedMotion: boolean): void {
    if (!element) return;
    const stop = (): void => {
      if (this.responsiveVariantTimer !== undefined) clearInterval(this.responsiveVariantTimer);
      this.responsiveVariantTimer = undefined;
    };
    const start = (): void => {
      if (this.responsiveVariantTimer !== undefined || reducedMotion) return;
      this.responsiveOverviewVariant = 0;
      this.render();
      this.responsiveVariantTimer = setInterval(() => {
        this.responsiveOverviewVariant = this.responsiveOverviewVariant === 0 ? 1 : 0;
        this.render();
      }, 3000);
    };
    if (reducedMotion || typeof IntersectionObserver === 'undefined') {
      this.responsiveOverviewVariant = 0;
      this.render();
      if (!reducedMotion) start();
      return;
    }
    this.responsiveVariantObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.intersectionRatio >= .25) start();
      else if (entry.intersectionRatio < .08) {
        stop();
        this.responsiveOverviewVariant = 0;
        this.render();
      }
    }), { threshold:[0,.08,.25,.4] });
    this.responsiveVariantObserver.observe(element);
  }

  private setupResponsiveGroupReveal(element: HTMLElement | undefined, reducedMotion: boolean): void {
    if (!element) return;
    if (reducedMotion || typeof IntersectionObserver === 'undefined') {
      element.classList.add('is-visible');
      return;
    }
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.intersectionRatio >= .25) {
        element.classList.add('is-visible');
      }
      else if (entry.intersectionRatio < .08) element.classList.remove('is-visible');
    }), { threshold:[0,.08,.25,.4] });
    observer.observe(element);
    this.responsiveGroupObservers.push(observer);
  }

  private setupNextProjectReveal(reducedMotion: boolean): void {
    const element = this.nextProjectNavRef?.nativeElement;
    if (!element) return;
    if (reducedMotion || typeof IntersectionObserver === 'undefined') {
      element.classList.add('is-visible');
      return;
    }
    this.nextProjectObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.intersectionRatio >= .25) element.classList.add('is-visible');
      else if (entry.intersectionRatio < .08) element.classList.remove('is-visible');
    }), { threshold:[0,.08,.25,.4] });
    this.nextProjectObserver.observe(element);
  }

  private setupCompactFlowDemo(element?: HTMLElement): void {
    if (!element) return;
    const rings = Array.from(element.querySelectorAll<SVGCircleElement>('.compact-flow-ring__progress'));
    const values = Array.from(element.querySelectorAll<HTMLElement>('.compact-flow-value'));
    const fallbackFinals = [72, 64, 81];
    const finals = rings.map((ring, index) => Number(ring.dataset['final'] ?? fallbackFinals[index] ?? 0));
    const formatValue = (value: HTMLElement, amount: number): string => value.dataset['unit'] === '%'
      ? `${Math.round(amount)}%`
      : `${amount.toFixed(1)} kW`;
    let active = false;
    const reset = (): void => {
      const frame = this.compactFlowFrames.get(element);
      if (frame !== undefined) cancelAnimationFrame(frame);
      this.compactFlowFrames.delete(element);
      element.classList.remove('is-running');
      rings.forEach(ring => { ring.style.strokeDasharray = '0 100'; });
      values.forEach(value => { value.textContent = formatValue(value, 0); });
      this.stopOverviewMetricTags(element);
    };
    const finish = (): void => {
      rings.forEach((ring, index) => { ring.style.strokeDasharray = `${finals[index]} ${100 - finals[index]}`; });
      values.forEach(value => { value.textContent = formatValue(value, Number(value.dataset['final'] ?? 0)); });
    };
    const start = (): void => {
      if (active) return;
      active = true;
      reset();
      element.classList.add('is-running');
      this.startOverviewMetricTags(element);
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) { finish(); return; }
      const startedAt = performance.now();
      const tick = (now: number): void => {
        const elapsed = now - startedAt;
        rings.forEach((ring, index) => {
          const progress = this.flowMetricEase(Math.min(1, Math.max(0, elapsed - (index * 100)) / 2400));
          const ringValue = finals[index] * progress;
          ring.style.strokeDasharray = `${ringValue} ${100 - ringValue}`;
          const value = values[index];
          if (value) value.textContent = formatValue(value, Number(value.dataset['final'] ?? 0) * progress);
        });
        if (elapsed >= 2600) { finish(); this.compactFlowFrames.delete(element); return; }
        this.compactFlowFrames.set(element, requestAnimationFrame(tick));
      };
      this.compactFlowFrames.set(element, requestAnimationFrame(tick));
    };
    if (typeof IntersectionObserver === 'undefined') { start(); return; }
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.intersectionRatio >= .3) start();
      else if (entry.intersectionRatio <= .08 && active) { active = false; reset(); }
    }), { threshold:[0,.08,.3,.4] });
    observer.observe(element);
    this.compactFlowObservers.push(observer);
    reset();
  }

  private setupMainFlowDemo(): void {
    const element = this.overviewRef?.nativeElement;
    if (!element) return;
    const rings = Array.from(element.querySelectorAll<SVGCircleElement>('.flow-ring__progress'));
    const values = Array.from(element.querySelectorAll<HTMLElement>('.overview-flow-value'));
    const finals = [72, 64, 81];
    const delays = [0, 100, 200];
    let active = false;
    const reset = (): void => {
      if (this.mainFlowFrame !== undefined) cancelAnimationFrame(this.mainFlowFrame);
      this.mainFlowFrame = undefined;
      element.classList.remove('is-overview-flow-running');
      this.stopOverviewMetricTags(element);
      rings.forEach(ring => { ring.style.strokeDasharray = '0 100'; });
      values.forEach(value => { value.textContent = '0.0 kW'; });
    };
    const finish = (): void => {
      rings.forEach((ring, index) => { ring.style.strokeDasharray = `${finals[index]} ${100 - finals[index]}`; });
      values.forEach(value => { value.textContent = `${Number(value.dataset['final'] ?? 0).toFixed(1)} kW`; });
    };
    const start = (): void => {
      if (active) return;
      active = true;
      reset();
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) { finish(); return; }
      element.classList.add('is-overview-flow-running');
      this.startOverviewMetricTags(element);
      const startedAt = performance.now();
      const tick = (now: number): void => {
        const elapsed = now - startedAt;
        rings.forEach((ring, index) => {
          const progress = this.flowMetricEase(Math.min(1, Math.max(0, elapsed - delays[index]) / 2400));
          const value = finals[index] * progress;
          ring.style.strokeDasharray = `${value} ${100 - value}`;
          const metricValue = values[index];
          if (metricValue) metricValue.textContent = `${(Number(metricValue.dataset['final'] ?? 0) * progress).toFixed(1)} kW`;
        });
        if (elapsed >= 2600) { finish(); this.mainFlowFrame = undefined; return; }
        this.mainFlowFrame = requestAnimationFrame(tick);
      };
      this.mainFlowFrame = requestAnimationFrame(tick);
    };
    if (typeof IntersectionObserver === 'undefined') { start(); return; }
    this.mainFlowObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.intersectionRatio >= .3) start();
      else if (entry.intersectionRatio <= .08 && active) { active = false; reset(); }
    }), { threshold:[0,.08,.3,.4] });
    this.mainFlowObserver.observe(element);
    reset();
  }

  private setupVariantFlowDemo(): void {
    const element = this.variantRef?.nativeElement;
    if (!element) return;
    const rings = Array.from(element.querySelectorAll<SVGCircleElement>('.variant-progress-ring__progress'));
    const values = Array.from(element.querySelectorAll<HTMLElement>('.variant-flow-value'));
    const ringFinals = [72, 38, 64, 81];
    const delays = [0, 100, 200, 300];
    let active = false;
    const reset = (): void => {
      if (this.variantFlowFrame !== undefined) cancelAnimationFrame(this.variantFlowFrame);
      this.variantFlowFrame = undefined;
      element.classList.remove('is-variant-flow-running');
      this.stopOverviewMetricTags(element);
      rings.forEach(ring => { ring.style.strokeDasharray = '0 100'; });
      values.forEach(value => { value.textContent = value.dataset['unit'] === '%' ? '0%' : '0.0 kW'; });
    };
    const finish = (): void => {
      rings.forEach((ring, index) => { ring.style.strokeDasharray = `${ringFinals[index]} ${100 - ringFinals[index]}`; });
      values.forEach(value => {
        const final = Number(value.dataset['final'] ?? 0);
        value.textContent = value.dataset['unit'] === '%' ? `${Math.round(final)}%` : `${final.toFixed(1)} kW`;
      });
    };
    const start = (): void => {
      if (active) return;
      active = true;
      reset();
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) { finish(); return; }
      element.classList.add('is-variant-flow-running');
      this.startOverviewMetricTags(element);
      const startedAt = performance.now();
      const tick = (now: number): void => {
        const elapsed = now - startedAt;
        rings.forEach((ring, index) => {
          const progress = this.flowMetricEase(Math.min(1, Math.max(0, elapsed - delays[index]) / 2400));
          const ringValue = ringFinals[index] * progress;
          ring.style.strokeDasharray = `${ringValue} ${100 - ringValue}`;
          const value = values[index];
          const final = Number(value?.dataset['final'] ?? 0);
          if (value) value.textContent = value.dataset['unit'] === '%' ? `${Math.round(final * progress)}%` : `${(final * progress).toFixed(1)} kW`;
        });
        if (elapsed >= 2700) { finish(); this.variantFlowFrame = undefined; return; }
        this.variantFlowFrame = requestAnimationFrame(tick);
      };
      this.variantFlowFrame = requestAnimationFrame(tick);
    };
    if (typeof IntersectionObserver === 'undefined') { start(); return; }
    this.variantFlowObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.intersectionRatio >= .3) start();
      else if (entry.intersectionRatio <= .08 && active) { active = false; reset(); }
    }), { threshold:[0,.08,.3,.4] });
    this.variantFlowObserver.observe(element);
    reset();
  }

  private startOverviewMetricTags(element: HTMLElement): void {
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tags = Array.from(element.querySelectorAll<HTMLElement>('.overview-metric-state-tag'));
    tags.forEach((tag, index) => {
      const existing = this.overviewMetricTagTimers.get(tag);
      if (existing !== undefined) clearTimeout(existing);
      tag.classList.toggle('is-positive', index % 2 === 0);
      if (reducedMotion) return;
      const alternate = (): void => {
        tag.classList.toggle('is-positive');
        const timer = setTimeout(alternate, 2500 + Math.random() * 500);
        this.overviewMetricTagTimers.set(tag, timer);
      };
      const timer = setTimeout(alternate, 2500 + Math.random() * 500 + (index * 130));
      this.overviewMetricTagTimers.set(tag, timer);
    });
  }

  private stopOverviewMetricTags(element?: HTMLElement): void {
    const tags = element
      ? Array.from(element.querySelectorAll<HTMLElement>('.overview-metric-state-tag'))
      : Array.from(this.overviewMetricTagTimers.keys());
    tags.forEach(tag => {
      const timer = this.overviewMetricTagTimers.get(tag);
      if (timer !== undefined) clearTimeout(timer);
      this.overviewMetricTagTimers.delete(tag);
      tag.classList.remove('is-positive');
    });
  }

  private setupMetricTagsDemo(): void {
    const element = this.metricTagsRef?.nativeElement;
    if (!element) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || typeof IntersectionObserver === 'undefined') return;
    this.metricTagsObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.intersectionRatio >= .3) element.classList.add('is-metric-tags-running');
      else if (entry.intersectionRatio <= .08) element.classList.remove('is-metric-tags-running');
    }), { threshold:[0,.08,.3,.4] });
    this.metricTagsObserver.observe(element);
  }

  private setupFlowMetricsDemo(): void {
    const element = this.flowMetricsRef?.nativeElement;
    if (!element) return;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const rings = Array.from(element.querySelectorAll<SVGCircleElement>('.flow-ring__progress'));
    const ringFinals = [72, 38, 64, 81];
    const initialValues = ['0.0 kW', '0%', '0.0 kW', '0.0 kW'];
    const finalValues = ['1.8 kW', '38%', '0.9 kW', '1.5 kW'];
    const reset = (): void => {
      if (this.flowMetricsFrame !== undefined) cancelAnimationFrame(this.flowMetricsFrame);
      this.flowMetricsFrame = undefined;
      this.flowMetricsStartedAt = undefined;
      element.classList.remove('is-flow-metrics-running');
      rings.forEach(ring => { ring.style.strokeDasharray = '0 100'; });
      this.flowMetricValues = initialValues;
      this.render();
    };
    const start = (): void => {
      if (this.flowMetricsActive) return;
      this.flowMetricsActive = true;
      if (reducedMotion) {
        rings.forEach((ring, index) => { ring.style.strokeDasharray = `${ringFinals[index]} ${100 - ringFinals[index]}`; });
        this.flowMetricValues = finalValues;
        this.render();
        return;
      }
      if (this.flowMetricsFrame !== undefined) cancelAnimationFrame(this.flowMetricsFrame);
      this.flowMetricsFrame = undefined;
      element.classList.remove('is-flow-metrics-running');
      void element.offsetWidth;
      element.classList.add('is-flow-metrics-running');
      this.flowMetricsStartedAt = performance.now();
      const tick = (now: number): void => {
        const elapsed = now - (this.flowMetricsStartedAt ?? now);
        const starts = [0, 0, 0, 0];
        const ends = [1.8, 38, .9, 1.5];
        const delays = [0, 100, 200, 300];
        const values = starts.map((initial, index) => {
          const local = Math.max(0, elapsed - delays[index]);
          const progress = this.flowMetricEase(Math.min(1, local / 2400));
          return initial + ((ends[index] - initial) * progress);
        });
        rings.forEach((ring, index) => {
          const local = Math.max(0, elapsed - delays[index]);
          const progress = this.flowMetricEase(Math.min(1, local / 2400));
          const value = ringFinals[index] * progress;
          ring.style.strokeDasharray = `${value} ${100 - value}`;
        });
        this.flowMetricValues = [
          `${values[0].toFixed(1)} kW`,
          `${Math.round(values[1])}%`,
          `${values[2].toFixed(1)} kW`,
          `${values[3].toFixed(1)} kW`,
        ];
        this.render();
        if (elapsed >= 2700) {
          rings.forEach((ring, index) => { ring.style.strokeDasharray = `${ringFinals[index]} ${100 - ringFinals[index]}`; });
          this.flowMetricValues = finalValues;
          this.flowMetricsFrame = undefined;
          this.render();
          return;
        }
        this.flowMetricsFrame = requestAnimationFrame(tick);
      };
      this.flowMetricsFrame = requestAnimationFrame(tick);
    };
    this.flowMetricsStart = start;
    this.flowMetricsReset = reset;
    if (typeof IntersectionObserver === 'undefined') start();
    else {
      this.flowMetricsObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.intersectionRatio >= .3) start();
          else if (entry.intersectionRatio <= .08 && this.flowMetricsActive) {
            this.flowMetricsActive = false;
            reset();
          }
        });
      }, { threshold:[0,.08,.3,.4] });
      this.flowMetricsObserver.observe(element);
    }
    this.measureFlowMetricsVisibility();
  }

  private measureFlowMetricsVisibility(): void {
    const element = this.flowMetricsRef?.nativeElement;
    if (!element || !this.flowMetricsStart || !this.flowMetricsReset) return;
    const rect = element.getBoundingClientRect();
    const visibleWidth = Math.max(0, Math.min(rect.right, innerWidth) - Math.max(rect.left, 0));
    const visibleHeight = Math.max(0, Math.min(rect.bottom, innerHeight) - Math.max(rect.top, 0));
    const ratio = (visibleWidth * visibleHeight) / Math.max(1, rect.width * rect.height);
    if (ratio >= .3) this.flowMetricsStart();
    else if (ratio <= .08 && this.flowMetricsActive) {
      this.flowMetricsActive = false;
      this.flowMetricsReset();
    }
  }

  private flowMetricEase(value: number): number {
    return 1 - Math.pow(1 - value, 4);
  }

  bringChallengeScreenToFront(screen: 'panel' | 'overview'): void {
    this.clearChallengeDepthTimers();
    this.challengeDepthSwitching = false;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.challengeFrontScreen = screen;
      this.render();
      return;
    }
    if (screen === this.challengeFrontScreen) {
      this.render();
      this.challengeDepthResumeTimer = setTimeout(() => this.scheduleChallengeDepthChange(), 6000);
      return;
    }
    this.transitionChallengeDepthTo(screen, true);
  }

  private scheduleChallengeDepthChange(): void {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (this.challengeDepthTimer !== undefined) clearTimeout(this.challengeDepthTimer);
    this.challengeDepthTimer = setTimeout(() => {
      this.challengeDepthTimer = undefined;
      this.transitionChallengeDepthTo(this.challengeFrontScreen === 'panel' ? 'overview' : 'panel', false);
    }, 5800);
  }

  private transitionChallengeDepthTo(screen: 'panel' | 'overview', manual: boolean): void {
    this.challengeDepthSwitching = true;
    this.render();
    this.challengeDepthMidpointTimer = setTimeout(() => {
      this.challengeDepthMidpointTimer = undefined;
      this.challengeFrontScreen = screen;
      this.render();
    }, 900);
    this.challengeDepthFinishTimer = setTimeout(() => {
      this.challengeDepthFinishTimer = undefined;
      this.challengeDepthSwitching = false;
      this.render();
      if (manual) this.challengeDepthResumeTimer = setTimeout(() => this.scheduleChallengeDepthChange(), 6000);
      else this.scheduleChallengeDepthChange();
    }, 1800);
  }

  private clearChallengeDepthTimers(): void {
    if (this.challengeDepthTimer !== undefined) clearTimeout(this.challengeDepthTimer);
    if (this.challengeDepthResumeTimer !== undefined) clearTimeout(this.challengeDepthResumeTimer);
    if (this.challengeDepthMidpointTimer !== undefined) clearTimeout(this.challengeDepthMidpointTimer);
    if (this.challengeDepthFinishTimer !== undefined) clearTimeout(this.challengeDepthFinishTimer);
    this.challengeDepthTimer = undefined;
    this.challengeDepthResumeTimer = undefined;
    this.challengeDepthMidpointTimer = undefined;
    this.challengeDepthFinishTimer = undefined;
  }

  private setupDemos(): void {
    const panel = this.panelRef?.nativeElement, overview = this.overviewRef?.nativeElement, variant = this.variantRef?.nativeElement;
    if (!panel || !overview || !variant) return;
    this.demos = [
      { key: 'panel', element: panel, order: ['panel-1', 'panel-2', 'panel-3', 'panel-4'] },
      { key: 'overview', element: overview, order: ['overview-3', 'overview-1', 'overview-4', 'overview-2', 'overview-5'] },
      { key: 'variant', element: variant, order: ['overview-variant-quota', 'overview-variant-1', 'overview-variant-3', 'overview-variant-4', 'overview-variant-5', 'overview-variant-2'] },
    ];
    this.demos.forEach(demo => this.ratios.set(demo.key, 0));
    if (typeof IntersectionObserver !== 'undefined') {
      this.demoObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          const demo = this.demos.find(item => item.element === entry.target);
          if (demo) {
            const ratio = entry.isIntersecting ? entry.intersectionRatio : 0;
            this.ratios.set(demo.key, ratio);
            if (demo.key === 'panel') {
              if (ratio >= .3 && !demo.element.classList.contains('is-panel-tags-running')) {
                demo.element.classList.add('is-panel-tags-running');
                this.startOverviewMetricTags(demo.element);
              } else if (ratio <= .08 && demo.element.classList.contains('is-panel-tags-running')) {
                demo.element.classList.remove('is-panel-tags-running');
                this.stopOverviewMetricTags(demo.element);
              }
            }
            if (demo.key === 'overview') {
              if (ratio >= .3) demo.element.classList.add('is-overview-flow-running');
              else if (ratio <= .08) demo.element.classList.remove('is-overview-flow-running');
            }
            if (demo.key === 'variant') {
              if (ratio >= .3) demo.element.classList.add('is-variant-flow-running');
              else if (ratio <= .08) demo.element.classList.remove('is-variant-flow-running');
            }
          }
        });
        this.selectDominant();
      }, { threshold: [0, .1, .2, .35, .5, .75, 1] });
      this.demos.forEach(demo => this.demoObserver?.observe(demo.element));
    }
    this.measureVisibility();
  }

  private measureVisibility(): void {
    this.demos.forEach(demo => {
      const r = demo.element.getBoundingClientRect();
      const w = Math.max(0, Math.min(r.right, innerWidth) - Math.max(r.left, 0));
      const h = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0));
      const ratio = w * h / Math.max(1, r.width * r.height);
      this.ratios.set(demo.key, ratio);
      if (demo.key === 'panel') {
        if (ratio >= .3 && !demo.element.classList.contains('is-panel-tags-running')) {
          demo.element.classList.add('is-panel-tags-running');
          this.startOverviewMetricTags(demo.element);
        } else if (ratio <= .08 && demo.element.classList.contains('is-panel-tags-running')) {
          demo.element.classList.remove('is-panel-tags-running');
          this.stopOverviewMetricTags(demo.element);
        }
      }
      if (demo.key === 'overview') {
        if (ratio >= .3) demo.element.classList.add('is-overview-flow-running');
        else if (ratio <= .08) demo.element.classList.remove('is-overview-flow-running');
      }
      if (demo.key === 'variant') {
        if (ratio >= .3) demo.element.classList.add('is-variant-flow-running');
        else if (ratio <= .08) demo.element.classList.remove('is-variant-flow-running');
      }
    });
    this.selectDominant();
  }

  private selectDominant(): void {
    const visible = this.demos.map(demo => ({ demo, ratio: this.ratios.get(demo.key) ?? 0 }));
    const candidate = visible.filter(item => item.ratio >= .35).sort((a, b) => b.ratio - a.ratio)[0]?.demo ?? null;
    const activeRatio = this.activeDemo ? (this.ratios.get(this.activeDemo) ?? 0) : 0;
    const next = candidate ?? (activeRatio >= .1 ? this.demos.find(item => item.key === this.activeDemo) ?? null : null);
    if (next?.key === this.activeDemo) {
      if (!this.running && !this.manuallyPaused) this.startCycle();
      return;
    }
    this.stopCycle(true);
    this.activeDemo = next?.key ?? null;
    this.demoIndex = 0;
    this.manuallyPaused = false;
    this.clearResume();
    if (next) this.startCycle();
  }

  private startCycle(): void {
    const demo = this.demos.find(item => item.key === this.activeDemo);
    if (!demo || this.running || this.manuallyPaused) return;
    this.running = true;
    this.runStep(demo);
  }

  private runStep(demo: Demo): void {
    if (!this.running || this.activeDemo !== demo.key) return;
    const id = demo.order[this.demoIndex];
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.openAutomatic(id);
      this.queue(() => this.closeAndContinue(demo, 900), 2600);
      return;
    }
    this.demoPulsingHotspot = id; this.render();
    this.queue(() => {
      this.demoPulsingHotspot = null; this.render();
      this.queue(() => { this.openAutomatic(id); this.queue(() => this.closeAndContinue(demo, 650), 2200); }, 180);
    }, 700);
  }

  private closeAndContinue(demo: Demo, pause: number): void {
    if (!this.running || this.activeDemo !== demo.key) return;
    if (this.activeOverviewHotspot === this.automaticHotspot) this.activeOverviewHotspot = null;
    this.automaticHotspot = null; this.render();
    const last = this.demoIndex === demo.order.length - 1;
    this.demoIndex = last ? 0 : this.demoIndex + 1;
    this.queue(() => this.runStep(demo), last ? 1400 : pause);
  }

  private openAutomatic(id: string): void {
    this.automaticHotspot = id; this.activeOverviewHotspot = id; this.render();
  }

  private queue(action: () => void, delay: number): void {
    if (this.demoTimer !== undefined) clearTimeout(this.demoTimer);
    this.demoTimer = setTimeout(() => { this.demoTimer = undefined; action(); }, delay);
  }

  private pauseForInteraction(): void {
    if (!this.activeDemo) return;
    this.manuallyPaused = true;
    if (this.activeOverviewHotspot === this.automaticHotspot) this.activeOverviewHotspot = null;
    this.stopCycle(false);
    this.clearResume();
  }

  private scheduleResume(): void {
    if (!this.manuallyPaused || !this.activeDemo) return;
    this.clearResume();
    this.resumeTimer = setTimeout(() => {
      this.resumeTimer = undefined;
      this.measureVisibility();
      if (!this.activeDemo) return;
      this.manuallyPaused = false; this.demoIndex = 0; this.startCycle();
    }, 4000);
  }

  private stopCycle(clearPopover: boolean): void {
    if (this.demoTimer !== undefined) clearTimeout(this.demoTimer);
    this.demoTimer = undefined; this.demoPulsingHotspot = null;
    if (clearPopover && this.activeOverviewHotspot === this.automaticHotspot) this.activeOverviewHotspot = null;
    this.automaticHotspot = null; this.running = false; this.render();
  }

  private clearResume(): void { if (this.resumeTimer !== undefined) clearTimeout(this.resumeTimer); this.resumeTimer = undefined; }
  private render(): void { this.cdr.detectChanges(); }

  ngOnDestroy(): void {
    this.closeChallengePreview();
    if (this.heroFrame !== undefined) cancelAnimationFrame(this.heroFrame);
    if (this.scrollFrame !== undefined) cancelAnimationFrame(this.scrollFrame);
    if (this.flowMetricsFrame !== undefined) cancelAnimationFrame(this.flowMetricsFrame);
    if (this.variantFlowFrame !== undefined) cancelAnimationFrame(this.variantFlowFrame);
    if (this.mainFlowFrame !== undefined) cancelAnimationFrame(this.mainFlowFrame);
    if (this.demoTimer !== undefined) clearTimeout(this.demoTimer);
    this.stopOverviewMetricTags();
    this.compactFlowFrames.forEach(frame => cancelAnimationFrame(frame));
    this.compactFlowObservers.forEach(observer => observer.disconnect());
    this.responsiveGroupObservers.forEach(observer => observer.disconnect());
    if (this.responsiveVariantTimer !== undefined) clearInterval(this.responsiveVariantTimer);
    this.responsiveVariantObserver?.disconnect();
    this.clearChallengeDepthTimers();
    this.clearResume(); this.revealObserver?.disconnect(); this.storyRevealObserver?.disconnect(); this.demoObserver?.disconnect(); this.flowMetricsObserver?.disconnect(); this.metricTagsObserver?.disconnect(); this.variantFlowObserver?.disconnect(); this.mainFlowObserver?.disconnect(); this.nextProjectObserver?.disconnect();
  }

  goBack(): void { this.back.emit(); }
  goToSection(sectionId: string): void { this.back.emit(); setTimeout(() => document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 250); }
}
