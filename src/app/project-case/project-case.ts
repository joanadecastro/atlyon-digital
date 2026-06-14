import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-project-case',
  standalone: true,
  templateUrl: './project-case.html',
  styleUrl: './project-case.scss',
})
export class ProjectCaseComponent {
  @Input() project: any;
  @Output() back = new EventEmitter<void>();

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