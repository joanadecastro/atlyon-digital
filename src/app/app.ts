import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, ViewChild, afterNextRender } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProjectCaseComponent } from './project-case/project-case';
import { LicitaNowCaseComponent } from './licitanow-case/licitanow-case';
import { LanguageService } from './i18n/language.service';
import { TranslateDirective } from './i18n/translate.directive';

type ProjectChatQuickAction = 'services' | 'pricing' | 'portfolio' | 'client' | 'recruiter' | 'quote';
type ProjectChatActionId =
  | ProjectChatQuickAction
  | 'branding'
  | 'websites'
  | 'ecommerce'
  | 'digital-solutions'
  | 'staff-augmentation'
  | 'estimate'
  | 'case-studies'
  | 'expertise'
  | 'recruiter-uiux'
  | 'recruiter-frontend'
  | 'recruiter-hybrid'
  | 'other'
  | 'cv';

interface ProjectChatAction {
  id: string;
  label: string;
  action: ProjectChatActionId;
  href?: string;
  download?: boolean;
}

interface ProjectChatMessage {
  id: string;
  sender: 'assistant' | 'user';
  text: string;
  intro?: boolean;
  actions?: ProjectChatAction[];
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ProjectCaseComponent, LicitaNowCaseComponent, FormsModule],
  hostDirectives: [TranslateDirective],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements AfterViewInit, OnDestroy {
  @ViewChild('projectChatBody') private projectChatBody?: ElementRef<HTMLElement>;

  selectedProject: any = null;
  isScrolled = false;
  activeSection = '';
  isMenuOpen = false;
  desktopMenuOpen = false;
  desktopMenuHover = false;
  private desktopMenuAutoCloseTimeout?: ReturnType<typeof setTimeout>;
  private desktopMenuHoverCloseTimeout?: ReturnType<typeof setTimeout>;
  readonly serviceIconPaths = [
    'M12 3l1.1 3.4L16.5 7.5l-3.4 1.1L12 12l-1.1-3.4L7.5 7.5l3.4-1.1L12 3zM18.5 13l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2zM5 14l.9 2.6L8.5 17l-2.6.9L5 20.5l-.9-2.6L1.5 17l2.6-.4L5 14z',
    'M4 5h16v11H4zM8 20h8M12 16v4',
    'M6 8h12l-1 12H7L6 8zM9 8V6a3 3 0 016 0v2',
    'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6zM10 7h4M7 10v4M17 10v4M10 17h4',
    'M6 3l6 6M18 3L8.5 12.5M8 16a3 3 0 11-6 0 3 3 0 016 0zM22 16a3 3 0 11-6 0 3 3 0 016 0zM12 13l4 4',
    'M4 7h16v12H4zM9 7V5h6v2M4 12h16M10 12v2h4v-2',
  ];

  projectChatOpen = false;
  projectChatClosing = false;
  projectChatDragging = false;
  projectChatDragOffset = 0;
  private projectChatDragStartY = 0;
  private projectChatDragPointerId?: number;
  private projectChatCloseTimeout?: ReturnType<typeof setTimeout>;
  projectChatStep = 0;
  projectChatSent = false;
  projectChatError = '';
  projectChatInput = '';
  activeProcessStep = -1;
  highestProcessStepReached = -1;
  private processWasResetAbove = false;
  activeAboutPhase = -1;
  private previousAboutPhase = -1;
  private aboutCounterRafId?: number;
  private aboutMetricsRunning = false;
  private aboutMetricsGeneration = 0;
  private aboutMobileMetricsCompleted = false;
  private projectChatMessageId = 1;
  projectChatMessages: ProjectChatMessage[] = [
    {
      id: 'chat-0',
      sender: 'assistant',
      text: 'Olá, sou a Joana\nUI/UX Designer & Front-end Developer\n\nTrabalho entre design e desenvolvimento, criando interfaces, produtos digitais e experiências web.\n\nSe estás a recrutar, tens um projeto ou simplesmente queres saber mais sobre o meu trabalho, escolhe uma opção abaixo.\n\nO que procuras?',
      intro: true,
      actions: [
        { id: 'portfolio', label: 'Portfólio', action: 'portfolio' },
        { id: 'pricing', label: 'Experiência', action: 'pricing' },
        { id: 'services', label: 'Serviços', action: 'services' },
        { id: 'client', label: 'Projeto / Colaboração', action: 'client' },
        { id: 'recruiter', label: 'Sou recrutador', action: 'recruiter' },
      ],
    },
  ];
  projectChat = {
    type: '',
    goal: '',
    budget: '',
    name: '',
    email: '',
  };

  readonly projectTypeOptions = [
    'Website',
    'E-commerce',
    'Produto digital',
    'Identidade visual',
    'Outro',
  ];

  readonly projectBudgetOptions = [
    'Até 2.500 €',
    '2.500 € — 5.000 €',
    '5.000 € — 10.000 €',
    'Acima de 10.000 €',
    'Ainda não sei',
  ];

  private revealObserver?: IntersectionObserver;
  private portfolioTextRevealObserver?: IntersectionObserver;
  private servicesGridRevealObserver?: IntersectionObserver;
  private processRevealObserver?: IntersectionObserver;
  private footerSocialObserver?: IntersectionObserver;
  private processRevealRafId?: number;
  private processRevealSecondRafId?: number;
  private heroStackRafId?: number;
  private servicesSceneElement?: HTMLElement;
  private servicesSceneRafId?: number;
  private servicesSceneListening = false;
  private servicesProgress = 0;
  private servicesPhase = -1;
  private servicesWasResetAbove = false;
  private lastScrollY = 0;
  private scrollDirection: 'up' | 'down' = 'down';
  private readonly servicesSceneScrollHandler = () => this.scheduleServicesSceneUpdate();
  private readonly servicesSceneResizeHandler = () => this.scheduleServicesSceneUpdate();

  constructor(private readonly changeDetectorRef: ChangeDetectorRef, readonly language: LanguageService) {
    afterNextRender(() => {
      const caseRoute = window.location.pathname.replace(/\/$/, '');
      if (caseRoute === '/case-studies/civitas' || caseRoute === '/case-studies/licitanow' || caseRoute === '/case-studies/smart-charging') {
        this.selectedProject = caseRoute.endsWith('/licitanow')
          ? this.projects[1]
          : caseRoute.endsWith('/smart-charging') ? this.projects[2] : this.projects[0];
        this.changeDetectorRef.detectChanges();
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      }
      this.initServicesScene();
      this.updateActiveSection();
    });
  }

  @HostListener('window:popstate')
  onBrowserHistoryChange(): void {
    this.closeProjectChat();
    const caseRoute = window.location.pathname.replace(/\/$/, '');
    this.selectedProject = caseRoute === '/case-studies/civitas'
      ? this.projects[0]
      : caseRoute === '/case-studies/licitanow'
        ? this.projects[1]
        : caseRoute === '/case-studies/smart-charging' ? this.projects[2] : null;
    this.changeDetectorRef.detectChanges();
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    const currentScrollY = window.scrollY;
    this.scrollDirection = currentScrollY < this.lastScrollY ? 'up' : 'down';
    this.lastScrollY = currentScrollY;
    this.updateNarrativeExitClasses();
    this.isScrolled = window.scrollY > 40;
    this.updateActiveSection();
    this.updateAboutPhase();
    this.updateProcessStep();
    this.scheduleHeroStackUpdate();
    this.updateDesktopMenuContrast();
    this.updateFooterSocialVisibility();

    if (this.isMenuOpen) {
      this.closeMenu();
    }

  }

  @HostListener('window:wheel', ['$event'])
  accelerateNarrativeExit(event: WheelEvent): void {
    if (window.innerWidth <= 768 || event.deltaY >= 0) return;

    const activeSection = ['sobre', 'processo', 'servicos']
      .map((id) => document.getElementById(id))
      .find((section) => {
        if (!section) return false;
        const rect = section.getBoundingClientRect();
        return rect.top < window.innerHeight && rect.bottom > 0;
      });

    if (!activeSection) return;

    window.scrollBy({
      top: event.deltaY * 1.5,
      left: 0,
      behavior: 'auto',
    });
  }

  private updateNarrativeExitClasses(): void {
    if (window.innerWidth <= 768) return;

    const states: Array<[string, boolean]> = [
      ['sobre', this.activeAboutPhase > 0],
      ['processo', this.highestProcessStepReached >= 0],
      ['servicos', this.servicesProgress > 0],
    ];

    states.forEach(([id, hasProgress]) => {
      const section = document.getElementById(id);
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const isActive = rect.top < window.innerHeight && rect.bottom > 0;
      section.classList.toggle(
        'is-exiting-up',
        this.scrollDirection === 'up' && isActive && hasProgress
      );
    });
  }

  private updateProcessStep(): void {
    const section = document.getElementById('processo');

    if (!section) {
      return;
    }

    if (window.innerWidth <= 768) {
      this.updateMobileProcessStep(section);
      return;
    }

    const rect = section.getBoundingClientRect();
    const exitedToPreviousSection = rect.top >= window.innerHeight;

    if (exitedToPreviousSection) {
      if (!this.processWasResetAbove) {
        this.resetProcessSequence();
        this.processWasResetAbove = true;
      }
      return;
    }

    this.processWasResetAbove = false;

    const scrollRange = section.offsetHeight - window.innerHeight;
    if (scrollRange <= 0) {
      this.resetProcessSequence();
      return;
    }

    const progress = Math.min(
      1,
      Math.max(0, (window.scrollY - section.offsetTop) / scrollRange)
    );
    const progressMask = section.querySelector<HTMLElement>('.process-section__progress-mask');
    const totalWidth = progressMask?.clientWidth ?? 0;
    const tipWidth = Math.min(86, totalWidth);
    const processPanelHeight = section.querySelector<HTMLElement>('.process-inner')?.offsetHeight ?? window.innerHeight;
    const processPanelTop = Number.parseFloat(
      window.getComputedStyle(section.querySelector<HTMLElement>('.process-inner')!).top
    ) || 0;
    const arrowCompletionPoint = Math.min(
      0.55,
      Math.max(0.5, (section.offsetHeight - processPanelHeight - processPanelTop) / scrollRange)
    );
    const rectangleCompletionPoint = 0.65;
    const arrowGrowthProgress = Math.min(1, progress / arrowCompletionPoint);
    const revealedWidth = arrowGrowthProgress * totalWidth;
    const arrowCoverage = totalWidth > 0 ? revealedWidth / totalWidth : 0;
    const processStepThresholds = [0.04, 0.29, 0.54, 0.79];
    let currentStep = -1;
    processStepThresholds.forEach((threshold, index) => {
      if (arrowCoverage >= threshold) currentStep = index;
    });
    this.highestProcessStepReached = currentStep;
    this.activeProcessStep = currentStep;

    const tipCollapseProgress = Math.min(
      1,
      Math.max(
        0,
        (progress - arrowCompletionPoint) / (rectangleCompletionPoint - arrowCompletionPoint)
      )
    );
    const tipRevealWidth = Math.min(tipWidth, revealedWidth * 0.28) * (1 - tipCollapseProgress);
    const entryOpacity = Math.min(1, Math.max(0, (revealedWidth - 24) / 62));

    progressMask?.style.setProperty('--process-fill-width', `${revealedWidth}px`);
    progressMask?.style.setProperty('--process-tip-width', `${tipRevealWidth}px`);
    progressMask?.style.setProperty('--process-entry-opacity', String(entryOpacity));
    progressMask?.classList.toggle('is-visible', revealedWidth > 24);

    const arrowTipX = (progressMask?.getBoundingClientRect().left ?? 0) + revealedWidth;
    section.querySelectorAll<HTMLElement>('[data-process-text]').forEach((element) => {
      const elementRect = element.getBoundingClientRect();
      const revealProgress = elementRect.width > 0
        ? Math.min(1, Math.max(0, (arrowTipX - elementRect.left) / elementRect.width))
        : 0;
      element.style.setProperty(
        '--process-text-clip-right',
        `${(1 - revealProgress) * 100}%`
      );
    });

  }

  private updateMobileProcessStep(section: HTMLElement): void {
    const progressMask = section.querySelector<HTMLElement>('.process-section__progress-mask');
    const steps = Array.from(
      section.querySelectorAll<HTMLElement>('.process-sticky__number-column')
    ).slice(0, 3);
    if (!progressMask || !steps.length) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const maskRect = progressMask.getBoundingClientRect();
    const totalHeight = progressMask.clientHeight;
    const viewportTrigger = window.innerHeight * 0.78;
    const revealedHeight = reduceMotion
      ? totalHeight
      : Math.min(totalHeight, Math.max(0, viewportTrigger - maskRect.top));
    const tipHeight = Math.min(12, revealedHeight);

    if (!reduceMotion && revealedHeight <= 0) {
      this.highestProcessStepReached = -1;
      this.activeProcessStep = -1;
    }

    progressMask.style.setProperty('--process-fill-height', `${revealedHeight}px`);
    progressMask.style.setProperty('--process-tip-height', `${tipHeight}px`);
    progressMask.style.setProperty('--process-entry-opacity', revealedHeight > 0 ? '1' : '0');
    progressMask.classList.toggle('is-visible', revealedHeight > 0);

    let currentStep = -1;
    const arrowTipY = maskRect.top + revealedHeight;
    steps.forEach((step, index) => {
      const number = step.querySelector<HTMLElement>('.process-sticky__number');
      const triggerRect = (number ?? step).getBoundingClientRect();
      const stepTriggerY = triggerRect.top + (triggerRect.height / 2);
      if (reduceMotion || arrowTipY >= stepTriggerY) currentStep = index;
    });

    this.highestProcessStepReached = Math.max(this.highestProcessStepReached, currentStep);
    this.activeProcessStep = currentStep;
    steps.forEach((step, index) => {
      const revealed = index <= this.highestProcessStepReached;
      step.classList.toggle('is-revealed', revealed);
      step.classList.toggle('is-current', index === currentStep);
      step.querySelectorAll<HTMLElement>('[data-process-text]').forEach((element) => {
        element.style.setProperty('--process-text-clip-right', revealed ? '0%' : '100%');
      });
    });
  }

  private resetProcessSequence(): void {
    this.highestProcessStepReached = -1;
    this.activeProcessStep = -1;

    const section = document.getElementById('processo');
    const progressMask = section?.querySelector<HTMLElement>('.process-section__progress-mask');
    progressMask?.style.setProperty('--process-fill-width', '0px');
    progressMask?.style.setProperty('--process-tip-width', '0px');
    progressMask?.style.setProperty('--process-fill-height', '0px');
    progressMask?.style.setProperty('--process-tip-height', '0px');
    progressMask?.style.setProperty('--process-entry-opacity', '0');
    progressMask?.classList.remove('is-visible');
    section?.querySelectorAll<HTMLElement>('[data-process-text]').forEach((element) => {
      element.style.setProperty('--process-text-clip-right', '100%');
    });

  }

  private hasSectionExitedAbove(section: HTMLElement): boolean {
    return section.getBoundingClientRect().top >= window.innerHeight;
  }

  private updateAboutPhase(): void {
    const section = document.getElementById('sobre');
    if (!section) return;
    const metricsPhase = 7;

    const rect = section.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const isCompletelyBelowViewport = rect.top >= viewportHeight;

    const panel = section.querySelector<HTMLElement>('.about-section__visual');
    const panelTop = panel?.getBoundingClientRect().top ?? section.getBoundingClientRect().top;
    const scrollRange = Math.max(480, Math.min(720, window.innerHeight * 0.72));

    const heroStack = section.closest<HTMLElement>('.hero-stack');
    const heroRevealProgress = heroStack?.classList.contains('is-layered')
      ? Number.parseFloat(heroStack.style.getPropertyValue('--hero-reveal-progress'))
      : Number.NaN;
    const progress = Number.isFinite(heroRevealProgress)
      ? Math.min(1, Math.max(0, heroRevealProgress))
      : isCompletelyBelowViewport
        ? 0
        : Math.min(1, Math.max(0, (viewportHeight - panelTop) / scrollRange));

    let currentPhase = -1;
    if (progress >= 0.04) currentPhase = 0;
    if (progress >= 0.11) currentPhase = 1;
    if (progress >= 0.18) currentPhase = 2;
    if (progress >= 0.31) currentPhase = 3;
    if (progress >= 0.41) currentPhase = 4;
    if (progress >= 0.49) currentPhase = 5;
    if (progress >= 0.64) currentPhase = 6;
    if (progress >= 0.8) currentPhase = 7;

    const previousPhase = this.previousAboutPhase;
    this.activeAboutPhase = currentPhase;
    if (currentPhase >= 0) {
      section.classList.add('is-about-skills-revealed');
    }
    const phaseClasses: Array<[string, number]> = [
      ['is-about-panel-visible', 0],
      ['is-about-title-visible', 1],
      ['is-about-path-visible', 2],
      ['is-about-today-visible', 3],
      ['is-about-approach-visible', 4],
      ['is-about-competencies-visible', 5],
      ['is-about-metrics-visible', metricsPhase],
    ];
    phaseClasses.forEach(([className, phase]) => {
      section.classList.toggle(className, currentPhase >= phase);
    });

    const crossedMetricsForward =
      previousPhase < metricsPhase && currentPhase >= metricsPhase;
    const crossedMetricsBackward =
      previousPhase >= metricsPhase && currentPhase < metricsPhase;

    if (window.innerWidth <= 768) {
      const metricsBlock = section.querySelector<HTMLElement>('.about-editorial-metrics');
      const metricsRect = metricsBlock?.getBoundingClientRect();
      const metricsAreVisible = !!metricsRect
        && metricsRect.top <= viewportHeight * 0.88
        && metricsRect.bottom >= 0;

      if (metricsAreVisible && !this.aboutMobileMetricsCompleted) {
        this.startAboutMetrics(section);
      }
    } else {
      if (crossedMetricsForward) {
        this.startAboutMetrics(section);
      }

      if (crossedMetricsBackward) {
        this.stopAboutMetrics();
      }
    }

    this.previousAboutPhase = currentPhase;
  }

  private startAboutMetrics(section: HTMLElement): void {
    if (this.aboutMetricsRunning) return;

    this.aboutMetricsRunning = true;
    const generation = ++this.aboutMetricsGeneration;
    this.startAboutMetricsCounting(section, generation);
  }

  private stopAboutMetrics(): void {
    if (this.aboutCounterRafId !== undefined) {
      cancelAnimationFrame(this.aboutCounterRafId);
      this.aboutCounterRafId = undefined;
    }
    this.aboutMetricsGeneration += 1;
    this.aboutMetricsRunning = false;
    this.resetAboutCountersToZero();
  }

  private startAboutMetricsCounting(section: HTMLElement, generation: number): void {
    if (!this.isCurrentAboutCycle(generation)) return;

    this.resetAboutCountersToZero();

    const metrics = Array.from(section.querySelectorAll<HTMLElement>('.about-metric'));
    const numberElements = metrics.map((metric) =>
      metric.querySelector<HTMLElement>('.about-section__metric-number')
    );
    const targets = metrics.map((metric) => Number(metric.dataset['countTarget'] ?? 0));
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const easeOutCubic = (value: number): number => 1 - Math.pow(1 - value, 3);
    const duration = 2800;

    const finishCounting = (): void => {
      if (!this.isCurrentAboutCycle(generation)) return;
      numberElements.forEach((element, index) => {
        if (element) element.textContent = String(targets[index]);
      });
      this.aboutCounterRafId = undefined;
      this.aboutMetricsRunning = false;
      if (window.innerWidth <= 768) {
        this.aboutMobileMetricsCompleted = true;
      }
    };

    if (reduceMotion) {
      finishCounting();
      return;
    }

    const startedAt = performance.now();
    const renderFrame = (now: number): void => {
      if (!this.isCurrentAboutCycle(generation)) return;

      const progress = Math.min(1, (now - startedAt) / duration);
      const easedProgress = easeOutCubic(progress);
      numberElements.forEach((element, index) => {
        if (element) element.textContent = String(Math.round(targets[index] * easedProgress));
      });

      if (progress < 1) {
        this.aboutCounterRafId = requestAnimationFrame(renderFrame);
      } else {
        finishCounting();
      }
    };

    this.aboutCounterRafId = requestAnimationFrame(renderFrame);
  }

  private isCurrentAboutCycle(generation: number): boolean {
    return this.aboutMetricsRunning && generation === this.aboutMetricsGeneration;
  }

  private resetAboutCountersToZero(): void {
    if (this.aboutCounterRafId !== undefined) {
      cancelAnimationFrame(this.aboutCounterRafId);
      this.aboutCounterRafId = undefined;
    }

    document.querySelectorAll<HTMLElement>('#sobre .about-metric').forEach((metric) => {
      const numberElement = metric.querySelector<HTMLElement>('.about-section__metric-number');
      if (numberElement) numberElement.textContent = '0';
    });
  }

  private resetAboutSequence(): void {
    this.stopAboutMetrics();
    this.activeAboutPhase = -1;
    this.previousAboutPhase = -1;
    this.resetAboutCountersToZero();
    document
      .getElementById('sobre')
      ?.classList.remove(
        'is-about-panel-visible',
        'is-about-title-visible',
        'is-about-path-visible',
        'is-about-competencies-visible',
        'is-about-today-visible',
        'is-about-approach-visible',
        'is-about-metrics-visible'
      );
  }

  @HostListener('window:resize')
  onWindowResize() {
    this.scheduleHeroStackUpdate();
    this.updateDesktopMenuContrast();

    if (window.innerWidth > 768 && this.isMenuOpen) {
      this.closeMenu();
    }

    if (window.innerWidth < 821 && this.desktopMenuOpen) {
      this.desktopMenuOpen = false;
    }
  }

  @HostListener('document:keydown.escape')
  closeProjectChatOnEscape() {
    if (this.isMenuOpen || this.desktopMenuOpen) this.closeMenu();
    if (this.projectChatOpen) this.closeProjectChat();
  }

  openProjectChat() {
    if (this.projectChatCloseTimeout) {
      clearTimeout(this.projectChatCloseTimeout);
      this.projectChatCloseTimeout = undefined;
    }
    this.projectChatClosing = false;
    this.projectChatDragging = false;
    this.projectChatDragOffset = 0;
    this.projectChatOpen = true;
    this.projectChatError = '';
    if (window.innerWidth <= 768) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    }
  }

  closeProjectChat() {
    if (window.innerWidth <= 768 && this.projectChatOpen) {
      this.projectChatDragging = false;
      this.projectChatDragOffset = 0;
      this.projectChatOpen = false;
      this.projectChatClosing = true;
      this.projectChatCloseTimeout = setTimeout(() => {
        this.projectChatClosing = false;
        this.projectChatCloseTimeout = undefined;
        document.documentElement.style.removeProperty('overflow');
        document.body.style.removeProperty('overflow');
      }, 340);
      return;
    }
    this.projectChatOpen = false;
    this.projectChatClosing = false;
    document.documentElement.style.removeProperty('overflow');
    document.body.style.removeProperty('overflow');
  }

  onProjectChatDragStart(event: PointerEvent): void {
    if (window.innerWidth > 768 || !this.projectChatOpen) return;
    this.projectChatDragging = true;
    this.projectChatDragStartY = event.clientY;
    this.projectChatDragPointerId = event.pointerId;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  onProjectChatDragMove(event: PointerEvent): void {
    if (!this.projectChatDragging || event.pointerId !== this.projectChatDragPointerId) return;
    this.projectChatDragOffset = Math.max(0, event.clientY - this.projectChatDragStartY);
  }

  onProjectChatDragEnd(event: PointerEvent): void {
    if (!this.projectChatDragging || event.pointerId !== this.projectChatDragPointerId) return;
    const header = event.currentTarget as HTMLElement;
    if (header.hasPointerCapture(event.pointerId)) header.releasePointerCapture(event.pointerId);
    const shouldClose = this.projectChatDragOffset >= 105;
    this.projectChatDragging = false;
    this.projectChatDragPointerId = undefined;
    if (shouldClose) {
      this.closeProjectChat();
      return;
    }
    this.projectChatDragOffset = 0;
  }

  chooseProjectType(type: string) {
    this.addProjectChatMessage('user', type);
    this.projectChat.type = type;
    this.projectChatStep = 2;
    this.scrollProjectChatToEnd();
  }

  chooseProjectBudget(budget: string) {
    this.projectChat.budget = budget;
    this.projectChatStep = 4;
  }

  continueProjectChat() {
    this.projectChatError = '';

    if (this.projectChatStep === 4) {
      const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.projectChat.email.trim());

      if (this.projectChat.name.trim().length < 2 || !validEmail) {
        this.projectChatError = 'Indica um nome e um email válidos.';
        return;
      }

      this.projectChatStep = 5;
    }
  }

  previousProjectChatStep() {
    if (this.projectChatStep > 0 && !this.projectChatSent) {
      this.projectChatStep -= 1;
      this.projectChatError = '';
    }
  }

  submitProjectChat() {
    this.projectChatSent = true;
    this.projectChatError = '';
  }

  resetProjectChat() {
    this.projectChatStep = 0;
    this.projectChatSent = false;
    this.projectChatError = '';
    this.projectChatInput = '';
    this.projectChat = { type: '', goal: '', budget: '', name: '', email: '' };
    this.projectChatMessages = [this.createInitialProjectChatMessage()];
    this.scrollProjectChatToEnd();
  }

  handleQuickAction(action: ProjectChatQuickAction): void {
    const labels: Record<ProjectChatQuickAction, string> = {
      services: 'Serviços',
      pricing: 'Experiência',
      portfolio: 'Portfólio',
      client: 'Projeto / Colaboração',
      recruiter: 'Sou recrutador',
      quote: 'Quero um orçamento',
    };

    this.addProjectChatMessage('user', labels[action]);

    if (action === 'services') {
      this.addProjectChatMessage(
        'assistant',
        'Trabalho em UI/UX Design, Front-end Development, Branding, Websites e produtos SaaS.',
        [{ id: 'expertise', label: 'Ver Especialização', action: 'expertise' }]
      );
    } else if (action === 'pricing') {
      this.addProjectChatMessage(
        'assistant',
        'Tenho mais de 15 anos de experiência em design e mais de 4 anos em desenvolvimento front-end, trabalhando entre UI/UX, produtos digitais e implementação.',
        [{ id: 'experience-cv', label: 'Download CV', action: 'cv', href: 'Joana_Castro_CV_2025.pdf', download: true }]
      );
    } else if (action === 'portfolio') {
      this.addProjectChatMessage(
        'assistant',
        'Podes explorar os meus case studies e projetos diretamente no portfolio.',
        [{ id: 'case-studies', label: 'Ver Case Studies', action: 'case-studies' }]
      );
    } else if (action === 'client') {
      this.addProjectChatMessage(
        'assistant',
        'Estou disponível para projetos e colaborações em design e desenvolvimento digital.',
        [{ id: 'collaboration-contact', label: 'Contactar', action: 'other', href: 'mailto:joanacastro.webdeveloper@gmail.com' }]
      );
    } else if (action === 'recruiter') {
      this.addProjectChatMessage(
        'assistant',
        'Estou disponível para novas oportunidades em UI/UX Design, Product Design, Digital Design e Front-end Development.',
        [
          { id: 'recruiter-linkedin', label: 'LinkedIn', action: 'other', href: 'https://www.linkedin.com/company/atlyon-digital/' },
          { id: 'cv', label: 'Download CV', action: 'cv', href: 'Joana_Castro_CV_2025.pdf', download: true },
        ]
      );
    } else {
      this.projectChatStep = 1;
    }

    this.scrollProjectChatToEnd();
  }

  handleProjectChatAction(action: ProjectChatActionId): void {
    if (['services', 'pricing', 'portfolio', 'client', 'recruiter', 'quote'].includes(action)) {
      this.handleQuickAction(action as ProjectChatQuickAction);
      return;
    }

    const serviceTypes: Partial<Record<ProjectChatActionId, string>> = {
      branding: 'Identidade visual',
      websites: 'Website',
      ecommerce: 'E-commerce',
      'digital-solutions': 'Produto digital',
      'staff-augmentation': 'Prestação de serviços',
      other: 'Outro',
    };

    const serviceType = serviceTypes[action];
    if (serviceType) {
      this.chooseProjectType(serviceType);
      return;
    }

    if (action === 'estimate') {
      this.addProjectChatMessage('user', 'Pedir estimativa');
      this.projectChatStep = 1;
    } else if (action === 'case-studies') {
      this.closeProjectChat();
      requestAnimationFrame(() => {
        const section = document.getElementById('portfolio');
        if (!section) return;
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        section.setAttribute('tabindex', '-1');
        section.focus({ preventScroll: true });
      });
    } else if (action === 'expertise') {
      this.closeProjectChat();
      requestAnimationFrame(() => {
        document.getElementById('servicos')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    } else if (action.startsWith('recruiter-')) {
      const role = action === 'recruiter-uiux'
        ? 'UI/UX'
        : action === 'recruiter-frontend'
          ? 'Front-end'
          : 'Função híbrida';
      this.addProjectChatMessage('user', role);
      this.addProjectChatMessage(
        'assistant',
        `Tenho experiência em ${role} e terei todo o gosto em partilhar mais detalhes sobre o meu percurso.`,
        [{ id: `download-${action}`, label: 'DOWNLOAD CV ↗', action: 'cv', href: 'Joana_Castro_CV_2025.pdf', download: true }]
      );
    }

    this.scrollProjectChatToEnd();
  }

  sendProjectChatMessage(): void {
    const message = this.projectChatInput.trim();
    if (!message) return;

    this.addProjectChatMessage('user', message);
    this.projectChatInput = '';

    if (this.projectChatStep === 2) {
      this.projectChat.goal = message;
      this.projectChatError = '';
      this.projectChatStep = 3;
      this.scrollProjectChatToEnd();
      return;
    }

    this.addProjectChatMessage(
      'assistant',
      'Obrigada pela mensagem.\n\nPara eu perceber melhor, podes escolher uma das opções abaixo ou continuar a explicar o que precisas.',
      [
        { id: `services-${this.projectChatMessageId}`, label: 'Serviços', action: 'services' },
        { id: `pricing-${this.projectChatMessageId}`, label: 'Preços', action: 'pricing' },
        { id: `recruiter-${this.projectChatMessageId}`, label: 'Sou recrutador', action: 'recruiter' },
        { id: `quote-${this.projectChatMessageId}`, label: 'Quero um orçamento', action: 'quote' },
      ]
    );
    this.scrollProjectChatToEnd();
  }

  onProjectChatInputKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    this.sendProjectChatMessage();
  }

  private showProjectChatServices(): void {
    this.addProjectChatMessage(
      'assistant',
      'Trabalho sobretudo nestas áreas:\n\n• Branding\n• Websites\n• E-commerce\n• Soluções digitais\n• Prestação de serviços UI/UX e Front-end\n\nQual delas queres explorar?',
      [
        { id: 'branding', label: 'Branding', action: 'branding' },
        { id: 'websites', label: 'Websites', action: 'websites' },
        { id: 'ecommerce', label: 'E-commerce', action: 'ecommerce' },
        { id: 'digital-solutions', label: 'Soluções digitais', action: 'digital-solutions' },
        { id: 'staff-augmentation', label: 'Prestação de serviços', action: 'staff-augmentation' },
      ]
    );
  }

  private addProjectChatMessage(
    sender: ProjectChatMessage['sender'],
    text: string,
    actions?: ProjectChatAction[]
  ): void {
    this.projectChatMessages.push({
      id: `chat-${this.projectChatMessageId++}`,
      sender,
      text,
      actions,
    });
  }

  private createInitialProjectChatMessage(): ProjectChatMessage {
    return {
      id: `chat-${this.projectChatMessageId++}`,
      sender: 'assistant',
      text: 'Olá, sou a Joana\nUI/UX Designer & Front-end Developer\n\nTrabalho entre design e desenvolvimento, criando interfaces, produtos digitais e experiências web.\n\nSe estás a recrutar, tens um projeto ou simplesmente queres saber mais sobre o meu trabalho, escolhe uma opção abaixo.\n\nO que procuras?',
      intro: true,
      actions: [
        { id: `portfolio-${this.projectChatMessageId}`, label: 'Portfólio', action: 'portfolio' },
        { id: `pricing-${this.projectChatMessageId}`, label: 'Experiência', action: 'pricing' },
        { id: `services-${this.projectChatMessageId}`, label: 'Serviços', action: 'services' },
        { id: `client-${this.projectChatMessageId}`, label: 'Projeto / Colaboração', action: 'client' },
        { id: `recruiter-${this.projectChatMessageId}`, label: 'Sou recrutador', action: 'recruiter' },
      ],
    };
  }

  private scrollProjectChatToEnd(): void {
    requestAnimationFrame(() => {
      const body = this.projectChatBody?.nativeElement;
      body?.scrollTo({ top: body.scrollHeight, behavior: 'smooth' });
    });
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    this.syncMobileMenuState();
  }

  toggleDesktopMenu() {
    if (window.innerWidth >= 821) {
      clearTimeout(this.desktopMenuAutoCloseTimeout);
      this.desktopMenuOpen = true;
      this.desktopMenuHover = false;
      this.isMenuOpen = false;
      this.desktopMenuAutoCloseTimeout = setTimeout(() => {
        this.desktopMenuOpen = false;
        this.desktopMenuHover = false;
        this.desktopMenuAutoCloseTimeout = undefined;
      }, 3000);
      requestAnimationFrame(() => this.updateDesktopMenuContrast());
      return;
    }

    this.toggleMenu();
  }

  closeMenu() {
    clearTimeout(this.desktopMenuAutoCloseTimeout);
    clearTimeout(this.desktopMenuHoverCloseTimeout);
    this.desktopMenuAutoCloseTimeout = undefined;
    this.desktopMenuHoverCloseTimeout = undefined;
    this.isMenuOpen = false;
    this.desktopMenuOpen = false;
    this.desktopMenuHover = false;
    this.syncMobileMenuState();
  }

  private syncMobileMenuState(): void {
    if (typeof document === 'undefined') return;
    const shouldLock = this.isMenuOpen && window.innerWidth <= 768;
    document.body.classList.toggle('mobile-menu-open', shouldLock);
    document.body.style.overflow = shouldLock ? 'hidden' : '';
    document.body.style.touchAction = shouldLock ? 'none' : '';
  }

  openDesktopMenuHover() {
    if (window.innerWidth >= 821) {
      clearTimeout(this.desktopMenuHoverCloseTimeout);
      this.desktopMenuHoverCloseTimeout = undefined;
      this.desktopMenuHover = true;
      requestAnimationFrame(() => this.updateDesktopMenuContrast());
    }
  }

  keepDesktopMenuHoverOpen() {
    if (window.innerWidth < 821 || (!this.desktopMenuHover && !this.desktopMenuOpen)) return;
    clearTimeout(this.desktopMenuHoverCloseTimeout);
    this.desktopMenuHoverCloseTimeout = undefined;
  }

  scheduleDesktopMenuHoverClose(event?: FocusEvent) {
    if (window.innerWidth < 821) return;
    if (event?.relatedTarget instanceof Node && (event.currentTarget as HTMLElement | null)?.contains(event.relatedTarget)) return;
    clearTimeout(this.desktopMenuHoverCloseTimeout);
    this.desktopMenuHoverCloseTimeout = setTimeout(() => {
      this.desktopMenuHover = false;
      this.desktopMenuHoverCloseTimeout = undefined;
    }, 1000);
  }

  private updateDesktopMenuContrast(): void {
    if (window.innerWidth < 821) return;

    const darkSurfaceSelector = [
      '.hero-main',
      '.hero-bottom-strip',
      '.portfolio-catalog',
      '.about-section__top',
      '.process-section__progress-fill',
      '.services-scene__sticky',
      '.site-footer',
    ].join(',');

    document.querySelectorAll<HTMLElement>('.navbar .mobile-menu-links a, .social-rail a').forEach((item) => {
      const rect = item.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const underneath = document.elementsFromPoint(x, y).find((element) =>
        !element.closest('.navbar') &&
        !element.closest('.project-chat') &&
        !element.closest('.social-rail') &&
        (element.closest('main') || element.closest('.site-footer'))
      );

      item.classList.toggle('is-on-dark', Boolean(underneath?.closest(darkSurfaceSelector)));
    });
  }

  technologies = ['Angular', 'TypeScript', 'SCSS', 'RxJS', 'REST API', 'Git', 'Figma'];

  activeHeroProjectIndex = 0;

  heroProjects = [
    {
      name: 'LicitaNow',
      category: 'Digital Platform',
      description: 'Plataforma digital com interface editorial e foco em clareza operacional.',
      image: 'projects/image_hero.png',
      thumbnail: 'projects/MacBook Pro 16.png',
      accent: '#315CFF',
      accentColor: '#315CFF',
      buttonColor: '#4a4d53',
    },
    {
      name: 'Smart Charging',
      category: 'Enterprise Platform',
      description: 'Dashboard operacional para processos complexos e dados em tempo real.',
      image: 'projects/image_hero.png',
      thumbnail: 'projects/iPhone Air.png',
      accent: '#315CFF',
      accentColor: '#2d6cdf',
      buttonColor: '#4a4d53',
    },
    {
      name: 'EstateFlow',
      category: 'SaaS Product',
      description: 'Preview editorial temporario para plataforma de gestao imobiliaria.',
      image: 'projects/image_hero.png',
      thumbnail: 'projects/iPad Pro (2022).png',
      accent: '#315CFF',
      accentColor: '#6a6f5f',
      buttonColor: '#4a4d53',
    },
    {
      name: 'E-commerce',
      category: 'Digital Commerce',
      description: 'Experiencia de compra digital com foco em produto e conversao.',
      image: 'projects/image_hero.png',
      thumbnail: 'projects/eccomerce.png',
      accent: '#315CFF',
      accentColor: '#8b5f4f',
      buttonColor: '#4a4d53',
    },
    {
      name: 'Email Marketing',
      category: 'Marketing Product',
      description: 'Preview editorial temporario para sistema de campanhas digitais.',
      image: 'projects/image_hero.png',
      thumbnail: 'projects/mercado_bistro_study.png',
      accent: '#315CFF',
      accentColor: '#b45b48',
      buttonColor: '#4a4d53',
    },
  ];

  get activeHeroProject() {
    return this.heroProjects[this.activeHeroProjectIndex];
  }

  services = [
    {
      id: 'branding',
      number: '01',
      title: 'Marca',
      description:
        'Desenvolvo identidades visuais consistentes, do conceito ao sistema gráfico da marca.',
      projectType: 'Branding',
    },
    {
      id: 'ui-ux-design',
      number: '02',
      title: 'UI/UX Design',
      description:
        'Desenho interfaces claras, funcionais e intuitivas, da arquitetura da informação à experiência final.',
      projectType: 'UI/UX Design',
    },
    {
      id: 'front-end-development',
      number: '03',
      title: 'Desenvolvimento Front-end',
      description:
        'Transformo interfaces em experiências funcionais e responsivas, aproximando design e implementação com HTML, CSS, JavaScript e frameworks front-end.',
      projectType: 'Front-end Development',
    },
    {
      id: 'graphic-design',
      number: '04',
      title: 'Design Gráfico',
      description:
        'Crio comunicação visual para meios digitais e impressos, com coerência, clareza e atenção ao detalhe.',
      projectType: 'Design Gráfico',
    },
    {
      id: 'saas-products',
      number: '05',
      title: 'Produtos SaaS',
      description:
        'Desenho produtos digitais complexos, dashboards e plataformas de gestão, estruturando fluxos, dados e componentes para experiências claras e escaláveis.',
      projectType: 'Produtos SaaS',
    },
    {
      id: 'websites',
      number: '06',
      title: 'Websites',
      description:
        'Desenho e desenvolvo websites e landing pages responsivos, orientados para comunicação, conversão e objetivos de negócio.',
      projectType: 'Websites',
    },
  ];

  processSteps = [
    {
      number: '01',
      title: 'Briefing',
      description:
        'Percebemos o negócio, objetivos, público, necessidades e tipo de solução pretendida.',
    },
    {
      number: '02',
      title: 'Direção e proposta',
      description:
        'Definimos a abordagem visual, técnica e comercial antes de avançar para a criação.',
    },
    {
      number: '03',
      title: 'Design e desenvolvimento',
      description:
        'Criamos a identidade, interface, website ou solução digital com foco em qualidade e funcionalidade.',
    },
    {
      number: '04',
      title: 'Entrega e lançamento',
      description:
        'Finalizamos os detalhes, publicamos o projeto e deixamos tudo pronto para ser usado.',
    },
  ];

  projects = [
    {
      name: 'Civitas Energy Dashboard',
      category: 'UI/UX Design · Product Design · Responsive Design',
      description:
        'Plataforma de monitorização energética desenhada para simplificar dados complexos e tornar mais clara a leitura de produção, consumo e desempenho.',
      desktop: 'projects/civitas/civitas_painel.png',
      mobile: 'projects/civitas/civitasmobile_vistageralcompleta1.png',
      study: 'projects/civitas/civitas_vistageral1.png',
      background: 'projects/civitas/civitas_vistageral2.png',
      caseTitle: 'Energia clara, decisões melhores',
      caseText:
        'A landing page foi concebida para transmitir uma imagem forte, moderna e profissional através de uma linguagem visual minimalista e de elevado contraste. A combinação entre tons escuros e apontamentos em verde foi utilizada para reforçar a identidade da marca, criar destaque visual e conduzir naturalmente a atenção do utilizador pelos elementos mais importantes da página. Toda a estrutura foi desenhada com foco na clareza da informação e na fluidez da navegação. A hierarquia visual, a gestão do espaço e a organização do conteúdo permitem uma leitura intuitiva, facilitando a compreensão da mensagem desde o primeiro contacto.',
      caseText2:
        'O design privilegia uma estética contemporânea, com elementos visuais limpos, tipografia impactante e uma composição equilibrada entre conteúdo e componentes gráficos. Cada secção foi construída para reforçar a credibilidade da marca e criar uma experiência consistente em diferentes dispositivos. O resultado é uma landing page sólida, visualmente marcante e alinhada com uma abordagem digital moderna, onde identidade, legibilidade e experiência de utilização trabalham em conjunto para criar uma presença online diferenciadora.',
      primaryFont: 'Inter',
      secondaryFont: 'Inter',
      accent: '#92c900',
      bg: '#07120d',
      surface: '#101c16',
      colors: [
        { name: 'Verde LicitaNow', hex: '#92c900', role: 'Accent' },
        { name: 'Verde Escuro', hex: '#07120d', role: 'Base' },
        { name: 'Grafite Digital', hex: '#101c16', role: 'Surface' },
      ],
    },
    {
      slug: 'licitanow',
      title: 'LicitaNow',
      subtitle: 'Plataforma para Construção',
      discipline: 'UI/UX · Front-end',
      route: '/case-studies/licitanow',
      name: 'LicitaNow',
      category: 'UI/UX · Front-end',
      description: 'Redesign da presença digital de uma plataforma especializada no setor da construção.',
      desktop: 'projects/licita_desktop.png',
      mobile: 'projects/licita_desktop.png',
      study: 'projects/licita_desktop.png',
      background: 'projects/licita_background.jpg',
      accent: '#ff6534',
      bg: '#0d0f10',
      surface: '#171a1b',
    },
    {
      slug: 'smart-charging',
      route: '/case-studies/smart-charging',
      name: 'Smart Charging',
      title: 'Smart Charging',
      subtitle: 'GestÃ£o inteligente de carregamentos',
      category: 'Produto SaaS Â· UI/UX Â· Front-end',
      description:
        'Ecommerce premium com homepage editorial, carrinho de compras, navegação clara e experiência mobile otimizada para qualquer ecrã.',
      desktop: '/projects/smart_charging.png',
      mobile: '/projects/smart_charging.png',
      study: '/projects/hero/hero_smartcharging.png',
      background: '/projects/smart_charging.png',
      desktop2: 'projects/shopdesktop_eccomerce.jpg',
      mobile2: 'projects/shopmobile_eccomerce.jpg',
      caseTitle: 'Uma experiência de comércio editorial para uma marca premium',
      caseText:
        'VAULT foi concebida como uma experiência digital que vai além da venda de produtos: a interface encapsula a alma da marca através de uma linguagem editorial, sofisticada e rigorosa. A homepage privilegia pureza visual, brancos generosos e uma hierarquia tipográfica precisa, criando um ambiente onde cada peça assume o protagonismo absoluto.',
      caseText2:
        'A navegação foi desenhada para ser clara e silenciosa, removendo ruído decorativo e conduzindo o utilizador com naturalidade da descoberta ao carrinho. Em desktop e mobile, o foco está no produto, na fluidez da experiência de compra e numa sensação de conversão premium, discreta e confiante.',
      primaryFont: 'Bodoni Moda',
      secondaryFont: 'Hanken Grotesk',
      accent: '#0F2F7F',
      bg: '#dce6f5',
      surface: '#c8d8ef',
      text: '#1A1A1A',
      colors: [
        { name: 'Deep Black', hex: '#1A1A1A', role: 'Primary' },
        { name: 'Soft Gray', hex: '#D1D1D1', role: 'Tertiary' },
        { name: 'Off-White', hex: '#FDF8F8', role: 'Background' },
      ],
    },
  ];

  ngAfterViewInit() {
    this.lastScrollY = window.scrollY;
    this.onWindowScroll();
    this.preloadProjectImages();
    this.initRevealAnimations();
    this.initPortfolioTextReveal();
    this.initServicesGridReveal();
    this.initProcessReveal();
    this.initFooterSocialVisibility();
    this.scheduleHeroStackUpdate();
  }

  ngOnDestroy(): void {
    if (this.projectChatCloseTimeout) clearTimeout(this.projectChatCloseTimeout);
    document.documentElement.style.removeProperty('overflow');
    document.body.style.removeProperty('overflow');
    clearTimeout(this.desktopMenuAutoCloseTimeout);
    clearTimeout(this.desktopMenuHoverCloseTimeout);
    this.desktopMenuAutoCloseTimeout = undefined;
    this.desktopMenuHoverCloseTimeout = undefined;
    document.body.classList.remove('hero-menu-dark');
    if (this.heroStackRafId !== undefined) {
      cancelAnimationFrame(this.heroStackRafId);
      this.heroStackRafId = undefined;
    }
    this.stopAboutMetrics();
    this.highestProcessStepReached = -1;
    this.activeProcessStep = -1;
    this.processWasResetAbove = false;
    this.activeAboutPhase = -1;
    this.previousAboutPhase = -1;
    this.resetAboutSequence();
    this.servicesProgress = 0;
    this.servicesWasResetAbove = false;
    ['sobre', 'processo', 'servicos'].forEach((id) => {
      document.getElementById(id)?.classList.remove('is-exiting-up');
    });
    this.revealObserver?.disconnect();
    this.portfolioTextRevealObserver?.disconnect();
    this.portfolioTextRevealObserver = undefined;
    document.documentElement.classList.remove('portfolio-text-reveal-enabled');
    this.servicesGridRevealObserver?.disconnect();
    this.servicesGridRevealObserver = undefined;
    document.documentElement.classList.remove('services-grid-reveal-enabled');
    this.footerSocialObserver?.disconnect();
    this.footerSocialObserver = undefined;
    this.cleanupProcessReveal();
    this.cleanupServicesScene();
  }

  private initFooterSocialVisibility(): void {
    const footer = document.querySelector<HTMLElement>('.site-footer');

    if (!footer || !document.querySelector<HTMLElement>('.social-rail')) {
      return;
    }

    this.updateFooterSocialVisibility();

    this.footerSocialObserver?.disconnect();
    this.footerSocialObserver = new IntersectionObserver(
      ([entry]) => {
        document.querySelector<HTMLElement>('.navbar')?.classList.toggle('is-hidden-on-footer', entry.isIntersecting);
        if (entry.isIntersecting) this.closeMenu();
      },
      {
        threshold: 0,
        rootMargin: '0px',
      },
    );
    this.footerSocialObserver.observe(footer);
  }

  private updateFooterSocialVisibility(): void {
    const footer = document.querySelector<HTMLElement>('.site-footer');
    if (!footer) return;

    const footerRect = footer.getBoundingClientRect();
    document.querySelector<HTMLElement>('.navbar')?.classList.toggle(
      'is-hidden-on-footer',
      footerRect.top < window.innerHeight && footerRect.bottom > 0,
    );
  }

  private scheduleHeroStackUpdate(): void {
    if (this.heroStackRafId !== undefined) return;

    this.heroStackRafId = requestAnimationFrame(() => {
      this.heroStackRafId = undefined;
      this.updateHeroStack();
    });
  }

  private updateHeroStack(): void {
    const stack = document.querySelector<HTMLElement>('.hero-stack');
    const hero = stack?.querySelector<HTMLElement>(':scope > .hero');
    const aboutHold = stack?.querySelector<HTMLElement>(':scope > .about-hold');
    const portfolio = aboutHold?.querySelector<HTMLElement>(':scope > #sobre');
    const heroMain = hero?.querySelector<HTMLElement>(':scope > .hero-main');
    const heroStrip = stack?.querySelector<HTMLElement>(':scope > .hero-bottom-strip');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!stack || !hero || !aboutHold || !portfolio || !heroMain || !heroStrip || reduceMotion) {
      document.body.classList.remove('hero-menu-dark');
      heroStrip?.style.removeProperty('transform');
      stack?.classList.remove('is-layered');
      stack?.classList.remove('is-hero-scrolled');
      stack?.style.removeProperty('height');
      stack?.style.removeProperty('--hero-stack-pin-offset');
      stack?.style.removeProperty('--hero-main-offset');
      stack?.style.removeProperty('--hero-layer-height');
      stack?.style.removeProperty('--hero-reveal-progress');
      return;
    }

    stack.classList.add('is-layered');

    const isMobileHeroStack = window.innerWidth <= 768;
    const heroHeight = hero.offsetHeight;
    const portfolioHeight = aboutHold.offsetHeight;
    const revealDistance = isMobileHeroStack
      ? heroHeight
      : Math.max(heroHeight, window.innerHeight * 1.7);
    const rawScroll = Math.max(0, -stack.getBoundingClientRect().top);
    stack.classList.toggle('is-hero-scrolled', rawScroll > 1);
    const localScroll = Math.min(revealDistance, rawScroll);
    const progress = revealDistance > 0 ? localScroll / revealDistance : 0;
    const aboutHoldDistance = window.innerWidth > 1024
      ? window.innerHeight * 0.65
      : 0;
    const mainOffset = isMobileHeroStack ? 0 : (heroMain.offsetHeight + 24) * progress;
    const stripTravel = window.innerHeight + heroStrip.offsetHeight + 40;
    const stripOffset = isMobileHeroStack ? 0 : stripTravel * progress;

    stack.style.setProperty(
      'height',
      `${revealDistance + aboutHoldDistance + portfolioHeight}px`,
      isMobileHeroStack ? 'important' : '',
    );
    stack.style.setProperty('--hero-stack-pin-offset', `${localScroll}px`);
    stack.style.setProperty('--hero-main-offset', `${mainOffset}px`);
    heroStrip.style.setProperty(
      'transform',
      `translate3d(0, ${stripOffset}px, 0)`,
      isMobileHeroStack ? 'important' : '',
    );
    stack.style.setProperty('--hero-layer-height', `${heroHeight}px`);
    stack.style.setProperty('--hero-reveal-progress', `${progress}`);

    const menuToggle = document.querySelector<HTMLElement>('.navbar .menu-toggle');
    if (menuToggle) {
      const menuRect = menuToggle.getBoundingClientRect();
      const darkSurfaceBottom = heroMain.getBoundingClientRect().bottom;
      document.body.classList.toggle('hero-menu-dark', darkSurfaceBottom <= menuRect.top);
    }

  }

  updateActiveSection() {
    const darkHero = document.querySelector<HTMLElement>('.hero--dark-preview');
    const darkHeroRect = darkHero?.getBoundingClientRect();
    document.body.classList.toggle(
      'hero-nav-active',
      !!darkHeroRect && darkHeroRect.top <= 170 && darkHeroRect.bottom >= 170
    );

    const sections = ['servicos', 'portfolio', 'processo', 'contacto'];

    for (const section of sections) {
      const element = document.getElementById(section);
      if (!element) continue;

      const rect = element.getBoundingClientRect();

      if (rect.top <= 170 && rect.bottom >= 170) {
        this.activeSection = section;
        return;
      }
    }

    this.activeSection = '';
  }

  preloadProjectImages() {
    this.projects.forEach((project) => {
      [
        project.desktop,
        project.mobile,
        project.study,
        project.background,
        project.desktop2,
        project.mobile2,
      ].forEach((src) => {
        if (!src) return;

        const img = new Image();
        img.decoding = 'async';
        img.src = src;
      });
    });
  }

  initRevealAnimations() {
    this.revealObserver?.disconnect();

    setTimeout(() => {
      const elements = document.querySelectorAll('.reveal-card, .reveal-phone, .section-reveal, .reveal-item');

      this.revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
            } else {
              entry.target.classList.remove('is-visible');
            }
          });
        },
        {
          threshold: 0.12,
          rootMargin: '0px 0px -40px 0px',
        }
      );

      elements.forEach((el) => {
        this.revealObserver?.observe(el);
      });
    }, 100);
  }

  private initPortfolioTextReveal(): void {
    this.portfolioTextRevealObserver?.disconnect();
    this.portfolioTextRevealObserver = undefined;

    const catalog = document.querySelector<HTMLElement>(
      '#portfolio .portfolio-catalog--static'
    );
    if (!catalog) return;

    document.documentElement.classList.add('portfolio-text-reveal-enabled');
    catalog.classList.remove('is-text-visible');

    const revealThreshold = window.innerWidth > 768 ? 0.05 : 0.72;

    this.portfolioTextRevealObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= revealThreshold) {
          catalog.classList.add('is-text-visible');
        } else if (!entry.isIntersecting || entry.intersectionRatio <= 0.05) {
          catalog.classList.remove('is-text-visible');
        }
      },
      {
        threshold: [0.05, revealThreshold],
        rootMargin: '0px 0px -20% 0px',
      }
    );

    this.portfolioTextRevealObserver.observe(catalog);
  }

  private initServicesGridReveal(): void {
    this.servicesGridRevealObserver?.disconnect();
    this.servicesGridRevealObserver = undefined;

    const grid = document.querySelector<HTMLElement>('#servicos .services-scene__grid');
    if (!grid) return;

    const section = grid.closest<HTMLElement>('#servicos');
    const serviceItems = grid.querySelectorAll<HTMLElement>('.services-scene__item');
    const lastServiceItem = serviceItems.item(serviceItems.length - 1);

    if (window.innerWidth <= 768) {
      document.documentElement.classList.add('services-grid-reveal-enabled');
      grid.classList.remove('is-services-grid-visible');
      serviceItems.forEach((item) => item.classList.remove('is-services-item-visible'));

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        serviceItems.forEach((item) => item.classList.add('is-services-item-visible'));
        return;
      }

      this.servicesGridRevealObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-services-item-visible');
            observer.unobserve(entry.target);
          });
        },
        {
          threshold: 0.16,
          rootMargin: '0px 0px -10% 0px',
        }
      );

      serviceItems.forEach((item) => this.servicesGridRevealObserver?.observe(item));
      return;
    }

    const armStickyRelease = (): void => {
      if (!section || !lastServiceItem || lastServiceItem.dataset['stickyReleaseBound'] === 'true') return;

      lastServiceItem.dataset['stickyReleaseBound'] = 'true';
      const releaseAfterLastItem = (event: TransitionEvent): void => {
        if (event.propertyName !== 'transform' || !grid.classList.contains('is-services-grid-visible')) return;

        lastServiceItem.removeEventListener('transitionend', releaseAfterLastItem);
        delete lastServiceItem.dataset['stickyReleaseBound'];

        const scrollAlreadyUsed = Math.max(0, -section.getBoundingClientRect().top);
        section.style.setProperty(
          '--services-sticky-scroll-distance',
          `${Math.ceil(scrollAlreadyUsed + 70)}px`
        );
      };

      lastServiceItem.addEventListener('transitionend', releaseAfterLastItem);
    };

    document.documentElement.classList.add('services-grid-reveal-enabled');
    grid.classList.remove('is-services-grid-visible');

    this.servicesGridRevealObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.72) {
          section?.style.removeProperty('--services-sticky-scroll-distance');
          grid.classList.add('is-services-grid-visible');
          armStickyRelease();
        } else if (!entry.isIntersecting || entry.intersectionRatio <= 0.05) {
          grid.classList.remove('is-services-grid-visible');
          section?.style.removeProperty('--services-sticky-scroll-distance');
        }
      },
      {
        threshold: [0.05, 0.72],
        rootMargin: '0px 0px -20% 0px',
      }
    );

    this.servicesGridRevealObserver.observe(grid);
  }

  openProjectChatForService(service: { projectType: string }): void {
    this.resetProjectChat();
    this.openProjectChat();
    this.chooseProjectType(service.projectType);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.querySelector<HTMLTextAreaElement>('.project-chat__composer textarea')?.focus();
        this.scrollProjectChatToEnd();
      });
    });
  }

  private initServicesScene(): void {
    this.cleanupServicesScene();

    this.servicesSceneElement = document.querySelector<HTMLElement>('.services-scene') ?? undefined;

    if (!this.servicesSceneElement) return;
    if (window.innerWidth <= 768 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    try {
      this.servicesPhase = -1;
      this.servicesSceneElement.classList.remove(
        'services-phase-eyebrow',
        'services-phase-title',
        'services-phase-first-row',
        'services-phase-second-row'
      );
      this.servicesSceneElement.classList.add('services-scene-enabled');
      window.addEventListener('scroll', this.servicesSceneScrollHandler, { passive: true });
      window.addEventListener('resize', this.servicesSceneResizeHandler, { passive: true });
      this.servicesSceneListening = true;
      requestAnimationFrame(() => this.scheduleServicesSceneUpdate());
    } catch {
      this.servicesSceneElement.classList.remove('services-scene-enabled');
    }
  }

  private scheduleServicesSceneUpdate(): void {
    const currentSection = document.querySelector<HTMLElement>('.services-scene') ?? undefined;
    if (currentSection !== this.servicesSceneElement) {
      this.initServicesScene();
      return;
    }

    if (!this.servicesSceneElement || this.servicesSceneRafId !== undefined) return;

    this.servicesSceneRafId = requestAnimationFrame(() => {
      this.servicesSceneRafId = undefined;
      this.updateServicesScene();
    });
  }

  private updateServicesScene(): void {
    const section = this.servicesSceneElement;
    if (!section) return;

    const rect = section.getBoundingClientRect();
    const navActivationLine = window.innerHeight * 0.32;
    document.body.classList.toggle(
      'services-nav-active',
      rect.top <= navActivationLine && rect.bottom >= navActivationLine
    );

    const exitedAbove = this.hasSectionExitedAbove(section);
    if (exitedAbove) {
      if (!this.servicesWasResetAbove) {
        this.resetServicesSequence();
        this.servicesWasResetAbove = true;
      }
      return;
    }

    this.servicesWasResetAbove = false;

    const scrollableDistance = section.offsetHeight - window.innerHeight;
    if (scrollableDistance <= 0) return;

    const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));
    const easeOutCubic = (value: number): number => 1 - Math.pow(1 - value, 3);
    const currentProgress = clamp01(-rect.top / scrollableDistance);
    this.servicesProgress = currentProgress;
    const progress = currentProgress;

    const headerEntryLine = window.innerHeight * 0.78;
    let currentPhase = rect.top <= headerEntryLine ? 1 : -1;
    if (currentProgress >= 0.38) currentPhase = 2;
    if (currentProgress >= 0.64) currentPhase = 3;

    this.servicesPhase = currentPhase;

    section.classList.toggle(
      'services-phase-eyebrow',
      this.servicesPhase >= 0
    );
    section.classList.toggle(
      'services-phase-title',
      this.servicesPhase >= 1
    );
    section.classList.toggle(
      'services-phase-first-row',
      this.servicesPhase >= 2
    );
    section.classList.toggle(
      'services-phase-second-row',
      this.servicesPhase >= 3
    );
    const eyebrowProgress = easeOutCubic(clamp01((progress - 0.04) / 0.12));
    const titleProgress = easeOutCubic(clamp01((progress - 0.1) / 0.16));
    const firstRowRaw = clamp01((progress - 0.28) / 0.26);
    const secondRowRaw = clamp01((progress - 0.54) / 0.28);
    const firstRowProgress = easeOutCubic(firstRowRaw);
    const secondRowProgress = easeOutCubic(secondRowRaw);
    const staggerDelays = [0, 0.045, 0.09];
    const staggerProgress = (rowProgress: number, delay: number): number =>
      easeOutCubic(clamp01((rowProgress - delay) / (1 - delay)));

    section.style.setProperty('--services-progress', progress.toString());
    section.style.setProperty('--services-eyebrow-progress', eyebrowProgress.toString());
    section.style.setProperty('--services-eyebrow-y', `${(1 - eyebrowProgress) * 24}px`);
    section.style.setProperty('--services-title-progress', titleProgress.toString());
    section.style.setProperty('--services-title-y', `${(1 - titleProgress) * 48}px`);
    section.style.setProperty('--services-first-row-opacity', firstRowProgress.toString());
    section.style.setProperty('--services-first-row-y', `${(1 - firstRowProgress) * 85}px`);
    section.style.setProperty('--services-second-row-opacity', secondRowProgress.toString());
    section.style.setProperty('--services-second-row-y', `${(1 - secondRowProgress) * 105}px`);

    staggerDelays.forEach((delay, index) => {
      const firstItemProgress = staggerProgress(firstRowRaw, delay);
      const secondItemProgress = staggerProgress(secondRowRaw, delay);
      section.style.setProperty(`--services-item-${index + 1}`, firstItemProgress.toString());
      section.style.setProperty(`--services-item-${index + 1}-y`, `${(1 - firstItemProgress) * 20}px`);
      section.style.setProperty(`--services-item-${index + 4}`, secondItemProgress.toString());
      section.style.setProperty(`--services-item-${index + 4}-y`, `${(1 - secondItemProgress) * 20}px`);
    });

  }

  private resetServicesSequence(): void {
    this.servicesProgress = 0;
    this.servicesPhase = -1;

    const section = this.servicesSceneElement;
    if (!section) return;

    section.classList.remove(
      'services-phase-eyebrow',
      'services-phase-title',
      'services-phase-first-row',
      'services-phase-second-row'
    );
    section.style.setProperty('--services-progress', '0');
    section.style.setProperty('--services-eyebrow-progress', '0');
    section.style.setProperty('--services-eyebrow-y', '24px');
    section.style.setProperty('--services-title-progress', '0');
    section.style.setProperty('--services-title-y', '48px');
    section.style.setProperty('--services-first-row-opacity', '0');
    section.style.setProperty('--services-first-row-y', '85px');
    section.style.setProperty('--services-second-row-opacity', '0');
    section.style.setProperty('--services-second-row-y', '105px');

    for (let index = 1; index <= 6; index += 1) {
      section.style.setProperty(`--services-item-${index}`, '0');
      section.style.setProperty(`--services-item-${index}-y`, '20px');
    }

  }

  private cleanupServicesScene(): void {
    if (this.servicesSceneListening) {
      window.removeEventListener('scroll', this.servicesSceneScrollHandler);
      window.removeEventListener('resize', this.servicesSceneResizeHandler);
      this.servicesSceneListening = false;
    }

    if (this.servicesSceneRafId !== undefined) {
      cancelAnimationFrame(this.servicesSceneRafId);
      this.servicesSceneRafId = undefined;
    }

    this.servicesSceneElement?.classList.remove('services-scene-enabled');
    this.servicesSceneElement?.classList.remove(
      'services-phase-eyebrow',
      'services-phase-title',
      'services-phase-first-row',
      'services-phase-second-row'
    );
    document.body.classList.remove('services-nav-active');
    document.body.classList.remove('hero-nav-active');
    this.servicesProgress = 0;
    this.servicesPhase = -1;
    this.servicesWasResetAbove = false;
    [
      '--services-progress',
      '--services-eyebrow-progress',
      '--services-eyebrow-y',
      '--services-title-progress',
      '--services-title-y',
      '--services-first-row-opacity',
      '--services-first-row-y',
      '--services-second-row-opacity',
      '--services-second-row-y',
      ...Array.from({ length: 6 }, (_, index) => `--services-item-${index + 1}`),
      ...Array.from({ length: 6 }, (_, index) => `--services-item-${index + 1}-y`),
    ].forEach((property) => this.servicesSceneElement?.style.removeProperty(property));
    this.servicesSceneElement = undefined;
  }

  openProject(project: any) {
    this.closeMenu();
    this.closeProjectChat();
    this.selectedProject = project;

    if (project === this.projects[0] && window.location.pathname !== '/case-studies/civitas') {
      window.history.pushState({}, '', '/case-studies/civitas');
    }

    if (project.route && window.location.pathname !== project.route) {
      window.history.pushState({}, '', project.route);
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'auto',
        });
      });
    });
  }

  private initProcessReveal(): void {
    this.cleanupProcessReveal();

    const elements = Array.from(document.querySelectorAll<HTMLElement>('#processo .process-reveal'));
    if (!elements.length) return;

    elements.forEach((element) => element.classList.remove('is-visible'));
    document.documentElement.classList.add('process-reveal-enabled');

    this.processRevealRafId = requestAnimationFrame(() => {
      this.processRevealSecondRafId = requestAnimationFrame(() => {
        try {
          this.processRevealObserver = new IntersectionObserver(
            (entries, observer) => {
              entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
              });
            },
            {
              threshold: 0.18,
              rootMargin: '0px 0px -12% 0px',
            }
          );

          elements.forEach((element) => this.processRevealObserver?.observe(element));
        } catch {
          this.cleanupProcessReveal();
        }
      });
    });
  }

  private cleanupProcessReveal(): void {
    this.processRevealObserver?.disconnect();
    this.processRevealObserver = undefined;

    if (this.processRevealRafId !== undefined) {
      cancelAnimationFrame(this.processRevealRafId);
      this.processRevealRafId = undefined;
    }

    if (this.processRevealSecondRafId !== undefined) {
      cancelAnimationFrame(this.processRevealSecondRafId);
      this.processRevealSecondRafId = undefined;
    }

    document.documentElement.classList.remove('process-reveal-enabled');
  }

  openActiveHeroProject() {
    const existingProject = this.projects.find(
      (project) =>
        project.name.toLowerCase() === this.activeHeroProject.name.toLowerCase() ||
        project.category.toLowerCase() === this.activeHeroProject.category.toLowerCase()
    );

    this.openProject(existingProject || {
      name: this.activeHeroProject.name,
      category: this.activeHeroProject.category,
      description: this.activeHeroProject.description,
      desktop: this.activeHeroProject.image,
      mobile: this.activeHeroProject.image,
      study: this.activeHeroProject.image,
      background: this.activeHeroProject.image,
      caseTitle: this.activeHeroProject.name,
      caseText: this.activeHeroProject.description,
      caseText2: 'Case study completo a preparar.',
      primaryFont: 'Inter',
      secondaryFont: 'Inter',
      accent: this.activeHeroProject.accent,
      bg: '#F7F5F2',
      surface: '#ffffff',
      colors: [
        { name: 'Atlyon Blue', hex: this.activeHeroProject.accent, role: 'Accent' },
        { name: 'Warm Off White', hex: '#F7F5F2', role: 'Background' },
        { name: 'Ink', hex: '#111111', role: 'Text' },
      ],
    });
  }

  scrollToPortfolio(): void {
    document.getElementById('portfolio')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  closeProject() {
    this.closeProjectChat();
    this.selectedProject = null;

    if (window.location.pathname.replace(/\/$/, '').startsWith('/case-studies/')) {
      window.history.pushState({}, '', '/');
    }

    setTimeout(() => {
      document
        .getElementById('portfolio')
        ?.scrollIntoView({ behavior: 'smooth' });

      this.preloadProjectImages();
      this.initRevealAnimations();
      this.initPortfolioTextReveal();
      this.initServicesGridReveal();
      this.initProcessReveal();
      this.initServicesScene();
      this.onWindowScroll();
    }, 100);
  }

  navigateFromProject(event: Event, sectionId: string): void {
    if (!this.selectedProject) return;
    event.preventDefault();
    this.closeMenu();
    this.closeProject();

    setTimeout(() => {
      if (sectionId === 'top') {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        return;
      }
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  }

  scrollTop() {
    this.closeMenu();

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

}
