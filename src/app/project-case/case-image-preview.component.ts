import { ChangeDetectorRef, Component, ElementRef, HostListener, Input, OnDestroy } from '@angular/core';

export type CaseImagePreviewLegendItem = { number: string; title: string };

@Component({
  selector: 'app-case-image-preview',
  standalone: true,
  template: `
    <div class="case-image-preview" [class.is-open]="isOpen" [class.is-closing]="isClosing" [class.is-image-entered]="isImageEntered" [class.is-vertical-landing]="isVerticalLanding" [class.is-landscape]="isLandscape" [class.attach-close-to-media]="attachCloseToMedia"
      [attr.aria-hidden]="!isOpen" role="dialog" aria-modal="true" aria-label="Preview ampliado da mockup"
      (pointerdown)="closeFromBackdrop($event)">
      @if (src) {
        <div class="case-image-preview__panel" [class.has-legend]="legend.length > 0" (pointerdown)="handlePanelPointerDown($event)">
          <button type="button" class="case-image-preview__close" aria-label="Fechar preview" (click)="close()">×</button>
          <div class="case-image-preview__composition" [class.trim-top-edge]="trimTopEdge">
            <img [src]="src" [alt]="alt" (load)="onImageLoad($event)">
            @if (trimTopEdge) {
              <span class="case-image-preview__top-edge" [style.background-image]="'url(&quot;' + src + '&quot;)'" aria-hidden="true"></span>
            }
            @if (legend.length) {
              <ol class="case-image-preview__legend" aria-label="Legenda da imagem ampliada">
                @for (item of legend; track item.number) {
                  <li><span>{{ item.number }}</span><strong>{{ item.title }}</strong></li>
                }
              </ol>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .case-image-preview { position:fixed; inset:0; z-index:20000; display:grid; place-items:center; padding:4vh 4vw; background:rgba(15,18,22,.72); -webkit-backdrop-filter:blur(10px); backdrop-filter:blur(10px); visibility:hidden; opacity:0; pointer-events:none; transition:opacity 280ms ease,visibility 0s linear 720ms; }
    .case-image-preview.is-open { visibility:visible; opacity:1; pointer-events:auto; transition:opacity 280ms ease; }
    .case-image-preview__panel { position:relative; z-index:1; display:grid; place-items:center; max-width:82vw; max-height:86vh; overflow:visible; }
    .case-image-preview__composition { position:relative; display:grid; place-items:center; max-width:100%; max-height:100%; }
    img { display:block; width:min(82vw,1500px); max-width:100%; height:auto; max-height:86vh; object-fit:contain; border:0; border-radius:6px; box-shadow:0 24px 70px rgba(0,0,0,.18); opacity:0; transform:scale(.96); transition:transform 700ms cubic-bezier(.22,1,.36,1),opacity 350ms ease; }
    .is-image-entered img { opacity:1; transform:scale(1); }
    .case-image-preview__legend { display:none; }
    .case-image-preview__top-edge { display:none; }
    @media (min-width:769px) {
      .case-image-preview__composition.trim-top-edge .case-image-preview__top-edge { position:absolute; top:0; right:0; left:0; z-index:1; display:block; height:2px; border-radius:6px 6px 0 0; background-repeat:no-repeat; background-position:center -2px; background-size:100% auto; pointer-events:none; }
    }
    .case-image-preview__close { position:absolute; top:-14px; right:-14px; z-index:2; display:grid; place-items:center; width:36px; height:36px; padding:0; border:1px solid rgba(0,0,0,.10); border-radius:50%; background:rgba(255,255,255,.94); color:#25282b; box-shadow:0 3px 12px rgba(0,0,0,.10); font:400 24px/1 Arial,sans-serif; cursor:pointer; }
    .attach-close-to-media:not(.is-vertical-landing) .case-image-preview__panel { width:max-content; height:max-content; }
    .attach-close-to-media:not(.is-vertical-landing) .case-image-preview__close { top:0; right:0; transform:translate(50%,-50%); }
    .is-vertical-landing { display:block; padding:0; overflow:hidden; -webkit-backdrop-filter:blur(5px); backdrop-filter:blur(5px); }
    .is-vertical-landing .case-image-preview__panel { position:fixed; top:6vh; left:50%; display:block; width:min(88vw,1400px); max-width:none; height:88vh; max-height:none; overflow:auto; transform:translateX(-50%); overscroll-behavior:contain; }
    .is-vertical-landing .case-image-preview__composition { display:block; max-width:none; max-height:none; }
    .is-vertical-landing img { width:100%; max-width:none; height:auto; max-height:none; object-fit:initial; border-radius:0; box-shadow:none; transform:none; }
    .is-vertical-landing .case-image-preview__close { position:sticky; top:16px; right:16px; margin:16px 16px -52px auto; }
    @media (max-width:768px) {
      .case-image-preview { padding:16px; transition:opacity 550ms ease,visibility 0s linear 900ms; }
      .case-image-preview.is-open { transition:opacity 380ms ease; }
      .case-image-preview.is-closing { visibility:visible; pointer-events:auto; }
      .case-image-preview__close { display:none; }
      .case-image-preview__panel { width:calc(100vw - 32px); max-width:calc(100vw - 32px); height:calc(100dvh - 32px); max-height:calc(100dvh - 32px); }
      img { width:auto; max-width:calc(100vw - 32px); max-height:calc(100dvh - 32px); object-fit:contain; transition:transform 850ms cubic-bezier(.22,1,.36,1),opacity 600ms ease; }
      .is-image-entered img { transition:transform 800ms cubic-bezier(.22,1,.36,1),opacity 450ms ease; }
      .is-landscape:not(.is-vertical-landing) .case-image-preview__panel { width:100%; max-width:none; height:100%; max-height:none; }
      .is-landscape:not(.is-vertical-landing) .case-image-preview__composition { position:fixed; top:50%; left:50%; display:flex; flex-direction:column; align-items:stretch; gap:10px; width:min(calc(100dvh - 40px),680px); max-width:calc(100dvh - 40px); max-height:calc(100vw - 32px); opacity:0; transform:translate(-50%,-50%) rotate(0deg) scale(.96); transition:transform 850ms cubic-bezier(.22,1,.36,1),opacity 600ms ease; }
      .is-landscape.is-image-entered:not(.is-vertical-landing) .case-image-preview__composition { opacity:1; transform:translate(-50%,-50%) rotate(90deg) scale(1); transition:transform 800ms cubic-bezier(.22,1,.36,1),opacity 450ms ease; }
      .is-landscape:not(.is-vertical-landing) img { position:static; width:100%; max-width:100%; max-height:calc(100vw - 32px); opacity:1; transform:none; transition:none; }
      .is-landscape:not(.is-vertical-landing) .has-legend img { max-height:calc(100vw - 96px); }
      .case-image-preview__legend { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:10px; margin:0; padding:8px 0 0; border-top:1px solid rgba(255,255,255,.22); color:#fff; list-style:none; }
      .case-image-preview__legend li { display:grid; grid-template-columns:22px minmax(0,1fr); align-items:start; gap:5px; margin:0; padding:0; }
      .case-image-preview__legend span { color:#b9d4e7; font:700 10px/1.25 Inter,Arial,sans-serif; letter-spacing:.05em; }
      .case-image-preview__legend strong { color:rgba(255,255,255,.9); font:650 10px/1.25 Inter,Arial,sans-serif; letter-spacing:.08em; }
      .case-image-preview__close { position:fixed; top:max(16px,env(safe-area-inset-top)); right:max(16px,env(safe-area-inset-right)); }
      .attach-close-to-media:not(.is-landscape):not(.is-vertical-landing) .case-image-preview__panel { width:max-content; max-width:calc(100vw - 32px); height:max-content; max-height:calc(100dvh - 32px); }
      .attach-close-to-media:not(.is-landscape):not(.is-vertical-landing) .case-image-preview__close { position:absolute; top:0; right:0; transform:translate(50%,-50%); }
      .is-vertical-landing .case-image-preview__panel { width:calc(100vw - 28px); max-width:calc(100vw - 28px); }
    }
    @media (prefers-reduced-motion:reduce) { .case-image-preview,img,.case-image-preview__composition { transition-duration:120ms; transition-property:opacity,visibility; } }
    @media (max-width:768px) and (prefers-reduced-motion:reduce) { .is-landscape:not(.is-vertical-landing) .case-image-preview__composition,.is-landscape.is-image-entered:not(.is-vertical-landing) .case-image-preview__composition { transform:translate(-50%,-50%) rotate(90deg); } }
  `,
})
export class CaseImagePreviewComponent implements OnDestroy {
  @Input() trimTopEdge = false;
  @Input() attachCloseToMedia = false;
  src: string | null = null;
  alt = '';
  isOpen = false;
  isClosing = false;
  isImageEntered = false;
  isVerticalLanding = false;
  isLandscape = false;
  legend: readonly CaseImagePreviewLegendItem[] = [];
  private bodyOverflow = '';
  private cleanupTimer?: number;
  private returnFocus?: HTMLElement;
  private previewCycle = 0;

  constructor(private readonly host: ElementRef<HTMLElement>, private readonly cdr: ChangeDetectorRef) {}

  open(src: string, alt: string, verticalLanding = false, legend: readonly CaseImagePreviewLegendItem[] = []): void {
    const cycle = ++this.previewCycle;
    if (this.cleanupTimer !== undefined) window.clearTimeout(this.cleanupTimer);
    this.isClosing = false;
    this.src = src;
    this.alt = alt;
    this.isVerticalLanding = verticalLanding;
    this.isLandscape = false;
    this.legend = legend;
    this.isImageEntered = false;
    this.returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
    this.bodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    this.cdr.detectChanges();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (cycle !== this.previewCycle) return;
      this.isOpen = true;
      this.cdr.detectChanges();
      this.host.nativeElement.querySelector<HTMLButtonElement>('.case-image-preview__close')?.focus();
    }));
  }

  onImageLoad(event: Event): void {
    const cycle = this.previewCycle;
    const image = event.currentTarget as HTMLImageElement;
    this.isLandscape = !this.isVerticalLanding && image.naturalWidth > image.naturalHeight;
    this.isImageEntered = false;
    this.cdr.detectChanges();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (cycle === this.previewCycle && this.isOpen) {
        this.isImageEntered = true;
        this.cdr.detectChanges();
      }
    }));
  }

  close(): void {
    if (this.isClosing) return;
    const cycle = ++this.previewCycle;
    this.isClosing = true;
    this.isOpen = false;
    this.isImageEntered = false;
    this.cdr.detectChanges();
    if (this.cleanupTimer !== undefined) window.clearTimeout(this.cleanupTimer);
    this.cleanupTimer = window.setTimeout(() => {
      if (cycle === this.previewCycle && !this.isOpen) {
        this.src = null; this.alt = ''; this.isVerticalLanding = false; this.isLandscape = false; this.legend = [];
        this.isClosing = false;
        document.body.style.overflow = this.bodyOverflow;
        this.returnFocus?.focus();
        this.cdr.detectChanges();
      }
    }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 140 : matchMedia('(max-width: 768px)').matches ? 900 : 720);
  }

  handlePanelPointerDown(event: Event): void {
    if (this.isClosing) {
      event.stopPropagation();
      return;
    }
    if (matchMedia('(max-width: 768px)').matches) {
      this.close();
      event.stopPropagation();
      return;
    }
    event.stopPropagation();
  }

  closeFromBackdrop(event: Event): void {
    if (this.isClosing) {
      event.stopPropagation();
      return;
    }
    if (matchMedia('(max-width: 768px)').matches || event.target === event.currentTarget) this.close();
  }
  @HostListener('document:keydown', ['$event']) onKeydown(event: KeyboardEvent): void {
    if (!this.isOpen) return;
    if (event.key === 'Escape') this.close();
    if (event.key === 'Tab') {
      event.preventDefault();
      this.host.nativeElement.querySelector<HTMLButtonElement>('.case-image-preview__close')?.focus();
    }
  }
  ngOnDestroy(): void { if (this.cleanupTimer !== undefined) window.clearTimeout(this.cleanupTimer); if (this.isOpen) document.body.style.overflow = this.bodyOverflow; }
}
