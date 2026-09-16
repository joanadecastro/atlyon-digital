import { Directive, ElementRef, EventEmitter, HostListener, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { isMobileCasePreview } from './case-preview-mobile';
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
  private readonly clearClosingTapClick = (): void => {
    document.removeEventListener('click', this.consumeClosingTapClick, true);
    document.removeEventListener('pointerdown', this.clearClosingTapClick, true);
  };
  private readonly consumeClosingTapClick = (event: MouseEvent): void => {
    if (event.detail === 0) return;
    this.clearClosingTapClick();
    event.preventDefault();
    event.stopImmediatePropagation();
  };
  private readonly closeFromAnyMobilePointer = (event: PointerEvent): void => {
    if (!isMobileCasePreview() || !this.caseLightboxOpen || this.caseLightboxClosing) return;
    event.preventDefault();
    // Closing removes the dialog from hit testing. Consume this gesture's
    // compatibility click so it cannot activate the preview underneath.
    this.clearClosingTapClick();
    document.addEventListener('click', this.consumeClosingTapClick, true);
    document.addEventListener('pointerdown', this.clearClosingTapClick, { capture: true, once: true });
    this.caseLightboxClose.emit();
  };

  constructor(private readonly host: ElementRef<HTMLElement>) {
    this.host.nativeElement.addEventListener('pointerdown', this.closeFromAnyMobilePointer, { capture: true });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // A closed mobile dialog must leave hit testing immediately, even while
    // its existing visual teardown animation is still running.
    this.host.nativeElement.inert = isMobileCasePreview() && !this.caseLightboxOpen;
    const openChange = changes['caseLightboxOpen'];
    if (!openChange) return;
    if (openChange.currentValue && !openChange.previousValue) {
      lockCaseLightboxScroll(this.scrollLockOwner);
      this.returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
      if (!isMobileCasePreview()) {
        requestAnimationFrame(() => this.host.nativeElement.querySelector<HTMLButtonElement>('button[class$="__close"]')?.focus());
      }
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
    this.clearClosingTapClick();
    this.host.nativeElement.removeEventListener('pointerdown', this.closeFromAnyMobilePointer, { capture: true });
    unlockCaseLightboxScroll(this.scrollLockOwner, false);
  }
}
