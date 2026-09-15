import { Directive, ElementRef, EventEmitter, HostListener, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { lockCaseLightboxScroll, unlockCaseLightboxScroll } from './case-lightbox-scroll-lock';

@Directive({
  selector: '[caseLightboxClose]',
  standalone: true,
})
export class CaseLightboxCloseDirective implements OnChanges, OnDestroy {
  @Input() caseLightboxOpen = false;
  @Input() caseLightboxClosing = false;
  @Output() readonly caseLightboxClose = new EventEmitter<void>();
  private returnFocus?: HTMLElement;
  private readonly scrollLockOwner = {};

  constructor(private readonly host: ElementRef<HTMLElement>) {}

  ngOnChanges(changes: SimpleChanges): void {
    const openChange = changes['caseLightboxOpen'];
    if (!openChange) return;
    if (openChange.currentValue && !openChange.previousValue) {
      lockCaseLightboxScroll(this.scrollLockOwner);
      this.returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
      requestAnimationFrame(() => this.host.nativeElement.querySelector<HTMLButtonElement>('button[class$="__close"]')?.focus());
    } else if (!openChange.currentValue && openChange.previousValue) {
      unlockCaseLightboxScroll(this.scrollLockOwner);
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

  ngOnDestroy(): void {
    unlockCaseLightboxScroll(this.scrollLockOwner, false);
  }
}
