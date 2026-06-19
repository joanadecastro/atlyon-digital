import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
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

  @ViewChild('showcaseStage')
  private showcaseStage?: ElementRef<HTMLElement>;

  private showcaseObserver?: IntersectionObserver;

  ngAfterViewInit(): void {
    const stage = this.showcaseStage?.nativeElement;

    if (
      !stage ||
      typeof window === 'undefined' ||
      typeof IntersectionObserver === 'undefined' ||
      !window.matchMedia('(max-width: 820px)').matches
    ) {
      return;
    }

    this.showcaseObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          return;
        }

        stage.classList.add('is-active');
        this.showcaseObserver?.disconnect();
      },
      { threshold: 0.15 },
    );

    this.showcaseObserver.observe(stage);
  }

  ngOnDestroy(): void {
    this.showcaseObserver?.disconnect();
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
