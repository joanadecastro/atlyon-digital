import { Directive, ElementRef, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges } from '@angular/core';

@Directive({
  selector: '[caseLightboxClose]',
  standalone: true,
})
export class CaseLightboxCloseDirective implements OnChanges {
  @Input() caseLightboxOpen = false;
  @Input() caseLightboxClosing = false;
  @Output() readonly caseLightboxClose = new EventEmitter<void>();
  private returnFocus?: HTMLElement;

  constructor(private readonly host: ElementRef<HTMLElement>) {}

  ngOnChanges(changes: SimpleChanges): void {
    const openChange = changes['caseLightboxOpen'];
    if (!openChange) return;
    if (openChange.currentValue && !openChange.previousValue) {
      this.returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
      requestAnimationFrame(() => this.host.nativeElement.querySelector<HTMLButtonElement>('button[class$="__close"]')?.focus());
    } else if (!openChange.currentValue && openChange.previousValue) {
      this.returnFocus?.focus({ preventScroll: true });
      this.returnFocus = undefined;
    }
  }

  @HostListener('pointerdown', ['$event'])
  closeFromBackdrop(event: PointerEvent): void {
    if (this.caseLightboxOpen && !this.caseLightboxClosing && event.target === event.currentTarget) {
      this.caseLightboxClose.emit();
    }
  }

  @HostListener('document:keydown.escape')
  closeFromEscape(): void {
    if (this.caseLightboxOpen && !this.caseLightboxClosing) this.caseLightboxClose.emit();
  }
}
