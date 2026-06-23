import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  QueryList,
  ViewChildren,
} from '@angular/core';

@Component({
  selector: 'app-project-case',
  standalone: true,
  templateUrl: './project-case.html',
  styleUrl: './project-case.scss',
})
export class ProjectCaseComponent implements AfterViewInit, OnDestroy {
  @Input() project: any;
  @Output() back = new EventEmitter<void>();

  @ViewChildren('showcaseStage')
  private showcaseStages?: QueryList<ElementRef<HTMLElement>>;

  private showcaseObservers: IntersectionObserver[] = [];

  ngAfterViewInit(): void {
    const stages =
      this.showcaseStages?.toArray().map((stage) => stage.nativeElement) ?? [];

    if (
      !stages.length ||
      typeof window === 'undefined' ||
      typeof IntersectionObserver === 'undefined' ||
      !window.matchMedia('(max-width: 820px)').matches
    ) {
      return;
    }

    stages.forEach((stage) => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry?.isIntersecting) {
            return;
          }

          stage.classList.add('is-active');
          observer.disconnect();
        },
        { threshold: 0.15 },
      );

      observer.observe(stage);
      this.showcaseObservers.push(observer);
    });
  }

  ngOnDestroy(): void {
    this.showcaseObservers.forEach((observer) => observer.disconnect());
    this.showcaseObservers = [];
  }

  goBack(): void {
    this.back.emit();
  }

  goToServices(): void {
    this.back.emit();

    setTimeout(() => {
      document.getElementById('servicos')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 250);
  }

  goToContact(): void {
    this.back.emit();

    setTimeout(() => {
      document.getElementById('contacto')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 250);
  }
}
