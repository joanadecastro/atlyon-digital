import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, HostListener, Input, OnDestroy, TemplateRef, inject } from '@angular/core';
import { isMobileCasePreview } from './case-preview-mobile';
import { LanguageService } from '../i18n/language.service';
import { CaseLightboxCloseDirective } from './case-lightbox-close.directive';

export type CaseImagePreviewLegendItem = { number: string; title: string };
export type CaseImagePreviewItem = { src: string; alt: string };

@Component({
  selector: 'app-case-image-preview',
  standalone: true,
  imports: [NgTemplateOutlet, CaseLightboxCloseDirective],
  template: `
    <div class="case-image-preview" caseLightboxClose [caseLightboxOpen]="isOpen" [caseLightboxClosing]="isClosing" [caseLightboxTapClose]="mobileTapClose" (caseLightboxClose)="close()" [class.is-open]="isOpen" [class.is-closing]="isClosing" [class.is-image-entered]="isImageEntered" [class.is-vertical-landing]="isVerticalLanding" [class.is-landscape]="isLandscape" [class.is-code-preview]="isCodePreview" [class.trim-mobile-right-edge]="trimMobileRightEdge"
      [attr.aria-hidden]="!isOpen" role="dialog" tabindex="-1" aria-modal="true" [attr.aria-label]="language.translate(isCodePreview ? 'Snippet de código ampliado' : 'Preview ampliado da mockup')"
      [class.has-light-backdrop]="hasLightBackdrop" [class.has-expanded-viewport]="hasExpandedViewport" [class.has-image-group]="activeImageGroup.length > 1" [class.is-single-image]="isSingleImage" [class.mobile-tap-close]="mobileTapClose">
      @if (activeImageGroup.length > 1) {
        <button type="button" class="case-image-preview__nav case-image-preview__nav--previous" data-case-lightbox-control [attr.aria-label]="language.translate('Imagem anterior')" (click)="navigateImage(-1)"><span class="cta-arrow" aria-hidden="true"></span></button>
        <button type="button" class="case-image-preview__nav case-image-preview__nav--next" data-case-lightbox-control [attr.aria-label]="language.translate('Imagem seguinte')" (click)="navigateImage(1)"><span class="cta-arrow cta-arrow--right" aria-hidden="true"></span></button>
      }
      @if (src || isCodePreview) {
        <div class="case-image-preview__panel" [class.has-legend]="legend.length > 0" (pointerdown)="handlePanelPointerDown($event)">
          <div class="case-image-preview__composition" [class.trim-top-edge]="trimTopEdge">
            <button type="button" class="case-image-preview__close" [attr.aria-label]="language.translate('Fechar preview')" (click)="close()">×</button>
            @if (isCodePreview) {
              <figure class="case-image-preview__code">
                <figcaption>{{ codeLabel }}</figcaption>
                <pre class="case-image-preview__code-scroll"><code>{{ codeContent }}</code></pre>
              </figure>
            } @else if (compositionTemplate) {
              <div [attr.class]="'case-image-preview__template ' + compositionClass">
                <ng-container [ngTemplateOutlet]="compositionTemplate" [ngTemplateOutletContext]="{ preview: true }" />
              </div>
            } @else {
              <img [src]="displaySrc || src" [alt]="alt" (load)="onImageLoad($event)">
            }
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
    .case-image-preview__nav { position:fixed; top:50%; transform:translateY(-50%); z-index:3; display:grid; place-items:center; width:44px; height:44px; padding:0; border:0; border-radius:50%; background:transparent; color:#fff; cursor:pointer; transition:background 200ms ease; }
    .case-image-preview__nav--previous { left:2vw; }
    .case-image-preview__nav--next { right:2vw; }
    .case-image-preview__nav .cta-arrow { width:20px!important; height:20px!important; margin:0!important; }
    .case-image-preview__nav--previous .cta-arrow { transform:rotate(225deg); }
    .case-image-preview__nav:hover { background:rgba(255,255,255,.12); }
    .case-image-preview__nav:focus-visible { outline:2px solid #fff; outline-offset:3px; }
    .case-image-preview { position:fixed; inset:0; z-index:20000; display:grid; place-items:center; padding:4vh 4vw; background:rgba(15,18,22,.72); -webkit-backdrop-filter:blur(10px); backdrop-filter:blur(10px); visibility:hidden; opacity:0; pointer-events:none; transition:opacity 280ms ease,visibility 0s linear 720ms; }
    .case-image-preview.is-open { visibility:visible; opacity:1; pointer-events:auto; transition:opacity 280ms ease; }
    .case-image-preview__panel { position:relative; z-index:1; display:grid; place-items:center; max-width:82vw; max-height:86vh; overflow:visible; }
    .case-image-preview__composition { position:relative; display:grid; place-items:center; max-width:100%; max-height:100%; }
    .case-image-preview__template { position:relative; width:100%; max-width:100%; }
    img { display:block; width:auto; max-width:min(82vw,1500px); height:auto; max-height:86vh; object-fit:contain; border:0; border-radius:6px; box-shadow:0 24px 70px rgba(0,0,0,.18); opacity:0; transform:scale(.96); transition:transform 700ms cubic-bezier(.22,1,.36,1),opacity 350ms ease; }
    .is-image-entered img { opacity:1; transform:scale(1); }
    .case-image-preview.has-light-backdrop { background:rgba(45,48,52,.72); }
    .case-image-preview__legend { display:none; }
    .case-image-preview__top-edge { display:none; }
    .case-image-preview__code { box-sizing:border-box; width:100%; height:100%; margin:0; padding:22px; overflow:hidden; border-radius:4px; background:#1e1e1e; color:#ededed; box-shadow:0 24px 70px rgba(0,0,0,.18); }
    .case-image-preview__code figcaption { margin:0 0 16px; padding:0 0 12px; border-bottom:1px solid rgba(255,255,255,.12); color:#aeb2b7; font:500 11px/1.5 Inter,Arial,sans-serif; letter-spacing:.07em; text-transform:uppercase; }
    .case-image-preview__code-scroll { box-sizing:border-box; width:100%; height:calc(100% - 45px); margin:0; padding:0 0 12px; overflow:auto; overscroll-behavior:contain; color:#ededed; white-space:pre; scrollbar-color:#f2f2f2 #363636; scrollbar-width:thin; scrollbar-gutter:stable; }
    .case-image-preview__code-scroll code { font:13px/1.7 ui-monospace,SFMono-Regular,Consolas,monospace; }
    .case-image-preview__code-scroll::-webkit-scrollbar { width:6px; height:6px; }
    .case-image-preview__code-scroll::-webkit-scrollbar-track { border-radius:999px; background:#363636; }
    .case-image-preview__code-scroll::-webkit-scrollbar-thumb { border-radius:999px; background:#f2f2f2; }
    @media (min-width:769px) {
      .case-image-preview.has-expanded-viewport { padding:2dvh 2vw; box-sizing:border-box; }
      .case-image-preview__composition.trim-top-edge .case-image-preview__top-edge { position:absolute; top:0; right:0; left:0; z-index:1; display:block; height:2px; border-radius:6px 6px 0 0; background-repeat:no-repeat; background-position:center -2px; background-size:100% auto; pointer-events:none; }
    }
    .case-image-preview__close { position:absolute; top:-14px; right:-14px; z-index:2; display:grid; place-items:center; width:36px; height:36px; padding:0; border:1px solid rgba(0,0,0,.10); border-radius:50%; background:rgba(255,255,255,.94); color:#25282b; box-shadow:0 3px 12px rgba(0,0,0,.10); font:400 24px/1 Arial,sans-serif; cursor:pointer; }
    .case-image-preview:not(.is-vertical-landing) .case-image-preview__panel { width:max-content; height:max-content; }
    .case-image-preview:not(.is-vertical-landing) .case-image-preview__close { top:8px; right:8px; transform:none; }
    .is-vertical-landing { display:block; padding:0; overflow:hidden; -webkit-backdrop-filter:blur(5px); backdrop-filter:blur(5px); }
    .is-vertical-landing .case-image-preview__panel { position:fixed; top:6vh; left:50%; display:block; width:min(88vw,1400px); max-width:none; height:88vh; max-height:none; overflow:auto; transform:translateX(-50%); overscroll-behavior:contain; }
    .is-vertical-landing .case-image-preview__composition { display:block; max-width:none; max-height:none; }
    .is-vertical-landing img { width:100%; max-width:none; height:auto; max-height:none; object-fit:initial; border-radius:0; box-shadow:none; transform:none; }
    .is-vertical-landing .case-image-preview__close { position:sticky; top:16px; right:16px; margin:16px 16px -52px auto; }
    @media (max-width:768px) {
      .case-image-preview { padding:16px; transition:opacity 550ms ease,visibility 0s linear 900ms; }
      .case-image-preview.is-open { transition:opacity 380ms ease; }
      .case-image-preview.is-closing { visibility:visible; pointer-events:auto; }
      .case-image-preview__close { display:none; pointer-events:none; }
      .case-image-preview__panel { width:calc(100vw - 32px); max-width:calc(100vw - 32px); height:calc(100dvh - 32px); max-height:calc(100dvh - 32px); }
      img { width:auto; max-width:calc(100vw - 32px); max-height:calc(100dvh - 32px); object-fit:contain; transition:transform 850ms cubic-bezier(.22,1,.36,1),opacity 600ms ease; }
      .is-image-entered img { transition:transform 800ms cubic-bezier(.22,1,.36,1),opacity 450ms ease; }
      .is-landscape:not(.is-vertical-landing) .case-image-preview__panel { width:100%; max-width:none; height:100%; max-height:none; }
      .is-landscape:not(.is-vertical-landing) .case-image-preview__composition { position:fixed; top:50%; left:50%; display:flex; flex-direction:column; align-items:stretch; gap:10px; width:max-content; max-width:min(calc(100dvh - 40px),680px); max-height:calc(100vw - 32px); opacity:0; transform:translate(-50%,-50%) rotate(0deg) scale(.96); transform-origin:center center; transition:transform 850ms cubic-bezier(.22,1,.36,1),opacity 600ms ease; }
      .is-landscape:not(.is-vertical-landing) .case-image-preview__close { top:8px; right:auto; left:8px; transform:rotate(-90deg); }
      .is-landscape.is-image-entered:not(.is-vertical-landing) .case-image-preview__composition { opacity:1; transform:translate(-50%,-50%) rotate(90deg) scale(1); transition:transform 800ms cubic-bezier(.22,1,.36,1),opacity 450ms ease; }
      .is-landscape:not(.is-vertical-landing) img { position:static; width:auto; max-width:min(calc(100dvh - 40px),680px); max-height:calc(100vw - 32px); opacity:1; transform:none; transition:none; }
      .is-landscape:not(.is-vertical-landing) .case-image-preview__template { width:100%; max-height:calc(100vw - 32px); }
      .is-landscape:not(.is-vertical-landing) .case-image-preview__composition:has(> .case-image-preview__template) { width:min(calc(100dvh - 40px),680px); }
      .is-code-preview.is-landscape:not(.is-vertical-landing) .case-image-preview__composition { height:calc(100vw - 32px); }
      .is-code-preview.is-landscape:not(.is-vertical-landing) .case-image-preview__composition { width:min(calc(100dvh - 40px),680px); }
      .is-code-preview .case-image-preview__code { padding:18px; }
      .is-code-preview .case-image-preview__code-scroll code { font-size:14px; line-height:1.65; }
      .is-landscape:not(.is-vertical-landing) .case-image-preview__composition:has(> .case-image-preview__template.civitas-component-preview.component-crop--indicators) > .case-image-preview__template { position:relative; inset:auto; margin:0; transform:none; transform-origin:center center; }
      .is-landscape:not(.is-vertical-landing) .has-legend img { max-height:calc(100vw - 96px); }
      .trim-mobile-right-edge:not(.is-vertical-landing) img { clip-path:inset(0 1px 0 0); }
      .case-image-preview__legend { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:10px; margin:0; padding:8px 0 0; border-top:1px solid rgba(255,255,255,.22); color:#fff; list-style:none; }
      .case-image-preview__legend li { display:grid; grid-template-columns:22px minmax(0,1fr); align-items:start; gap:5px; margin:0; padding:0; }
      .case-image-preview__legend span { color:#b9d4e7; font:700 10px/1.25 Inter,Arial,sans-serif; letter-spacing:.05em; }
      .case-image-preview__legend strong { color:rgba(255,255,255,.9); font:650 10px/1.25 Inter,Arial,sans-serif; letter-spacing:.08em; }
      .case-image-preview:not(.is-landscape):not(.is-vertical-landing) .case-image-preview__panel { width:max-content; max-width:calc(100vw - 32px); height:max-content; max-height:calc(100dvh - 32px); }
      .case-image-preview:not(.is-vertical-landing) .case-image-preview__close { position:absolute; top:8px; right:8px; transform:none; }
      .is-landscape:not(.is-vertical-landing) .case-image-preview__close { right:auto; left:8px; transform:rotate(-90deg); }
      .is-vertical-landing { display:grid; place-items:center; padding:16px; }
      .is-vertical-landing .case-image-preview__panel { position:relative; inset:auto; width:max-content; max-width:calc(100vw - 32px); height:max-content; max-height:calc(100dvh - 32px); overflow:visible; transform:none; }
      .is-vertical-landing img { width:auto; max-width:calc(100vw - 32px); max-height:calc(100dvh - 32px); object-fit:contain; }
      .case-image-preview.is-code-preview.is-landscape .case-image-preview__composition {
        width:max-content; max-width:none; height:max-content; max-height:none; gap:0;
        transform:translate(-50%,-50%) rotate(90deg) scale(var(--case-code-fit-scale,1));
      }
      .case-image-preview.is-code-preview .case-image-preview__code {
        width:max-content; height:max-content; max-width:none; max-height:none; overflow:visible;
      }
      .case-image-preview.is-code-preview .case-image-preview__code-scroll {
        width:max-content; height:auto; max-width:none; max-height:none;
        overflow:visible; white-space:pre; scrollbar-width:none; scrollbar-gutter:auto;
      }
      .case-image-preview.is-code-preview .case-image-preview__code-scroll::-webkit-scrollbar { display:none; }
    }
    /* Opt-in for very wide evidence; all other previews keep their existing fit. */
    @media (min-width:769px) {
      .has-expanded-viewport .case-image-preview__panel { max-width:96vw; max-height:92dvh; }
      .has-expanded-viewport img { max-width:96vw; max-height:92dvh; }
    }
    @media (max-width:768px) {
      .has-expanded-viewport.is-landscape:not(.is-vertical-landing) .case-image-preview__composition,
      .has-expanded-viewport.is-landscape:not(.is-vertical-landing) img { max-width:calc(100dvh - 40px); }
      .has-expanded-viewport .case-image-preview__close { display:grid; pointer-events:auto; }
    }
    @media (max-width:768px) {
      .case-image-preview__nav { top:auto; bottom:max(10px,env(safe-area-inset-bottom)); transform:none; }
      .case-image-preview__nav--previous { left:calc(50% - 60px); }
      .case-image-preview__nav--next { right:calc(50% - 60px); }
      :is(.has-image-group,.is-single-image).is-landscape:not(.is-vertical-landing) :is(.case-image-preview__composition,img) { max-width:min(calc(100dvh - 128px),680px); }
      :is(.has-image-group,.is-single-image) .case-image-preview__close { display:grid; pointer-events:auto; }
    }
    @media (max-width:768px) {
      .case-image-preview.mobile-tap-close .case-image-preview__close { display:none!important; pointer-events:none; }
      .case-image-preview.mobile-tap-close:not(.is-open) { visibility:hidden; pointer-events:none; transition:none; }
    }
    @media (prefers-reduced-motion:reduce) { .case-image-preview,img,.case-image-preview__composition { transition-duration:120ms; transition-property:opacity,visibility; } }
    @media (max-width:768px) and (prefers-reduced-motion:reduce) { .is-landscape:not(.is-vertical-landing) .case-image-preview__composition,.is-landscape.is-image-entered:not(.is-vertical-landing) .case-image-preview__composition { transform:translate(-50%,-50%) rotate(90deg); } }
  `,
})
export class CaseImagePreviewComponent implements OnDestroy {
  readonly language = inject(LanguageService);
  @Input() trimTopEdge = false;
  @Input() mobileTapClose = false;
  @Input() lightBackdropSources: readonly string[] = [];
  @Input() expandedViewportSources: readonly string[] = [];
  @Input() imageGroups: readonly (readonly CaseImagePreviewItem[])[] = [];
  @Input() singleImageSources: readonly string[] = [];
  /** Explicit opt-in: a page preview for an unusually large original. */
  @Input() loadingPreviews: Readonly<Record<string, string>> = {};
  displaySrc: string | null = null;
  private readonly preparedOriginals = new Map<string, { image: HTMLImageElement; ready: boolean; promise: Promise<boolean>; renderSrc?: string }>();
  private readonly decodeWorkers = new Set<Worker>();

  preloadOriginal(src: string): Promise<boolean> {
    const path = decodeURI(new URL(src, document.baseURI).pathname);
    if (!this.loadingPreviews[path]) return Promise.resolve(false);
    const existing = this.preparedOriginals.get(path);
    if (existing) return existing.promise;
    const image = new Image();
    const entry: { image: HTMLImageElement; ready: boolean; promise: Promise<boolean>; renderSrc?: string } = { image, ready: false, promise: Promise.resolve(false) };
    this.preparedOriginals.set(path, entry);
    if (this.mobileTapClose && isMobileCasePreview()) {
      image.decoding = 'async';
      // Never pass the enormous original to the mobile renderer's image pipeline.
      // If workers are unavailable, keep the already visible page preview.
      entry.promise = new Promise<boolean>(resolve => {
        let worker: Worker;
        const failed = (): void => {
          if (worker) { worker.terminate(); this.decodeWorkers.delete(worker); }
          if (entry.renderSrc) URL.revokeObjectURL(entry.renderSrc);
          this.preparedOriginals.delete(path);
          resolve(false);
        };
        try {
          worker = new Worker(new URL('./case-image-decode.worker', import.meta.url), { type: 'module' });
          this.decodeWorkers.add(worker);
          worker.onerror = failed;
          worker.onmessage = ({ data }: MessageEvent<{ blob?: Blob }>) => {
            if (!data.blob) { failed(); return; }
            entry.renderSrc = URL.createObjectURL(data.blob);
            image.src = entry.renderSrc;
            void image.decode().then(() => {
              entry.ready = true;
              worker.terminate(); this.decodeWorkers.delete(worker);
              resolve(true);
            }).catch(failed);
          };
          worker.postMessage({ src: new URL(src, document.baseURI).href,
            width: Math.max(3200, Math.ceil(Math.max(innerWidth, innerHeight) * devicePixelRatio)) });
        } catch { failed(); }
      });
      return entry.promise;
    }
    image.src = src;
    entry.promise = image.decode().then(() => {
      entry.ready = true;
      return true;
    }).catch(() => {
      // Keep the page preview visible and permit a later retry.
      this.preparedOriginals.delete(path);
      return false;
    });
    return entry.promise;
  }
  get isSingleImage(): boolean {
    return !!this.src && this.singleImageSources.includes(decodeURI(new URL(this.src, document.baseURI).pathname));
  }
  get activeImageGroup(): readonly CaseImagePreviewItem[] {
    if (!this.src || this.isCodePreview || this.compositionTemplate || this.isSingleImage) return [];
    const path = decodeURI(new URL(this.src, document.baseURI).pathname);
    return this.imageGroups.find(group => group.some(item => decodeURI(new URL(item.src, document.baseURI).pathname) === path)) ?? [];
  }
  private switchingGroupImage = false;
  navigateImage(direction: number): void {
    const group = this.activeImageGroup;
    if (!this.isOpen || this.isClosing || group.length < 2 || !this.src) return;
    const path = decodeURI(new URL(this.src, document.baseURI).pathname);
    const index = group.findIndex(item => decodeURI(new URL(item.src, document.baseURI).pathname) === path);
    const next = group[(index + direction + group.length) % group.length];
    this.switchingGroupImage = true;
    this.src = next.src;
    this.displaySrc = null;
    this.alt = this.language.translate(next.alt);
    this.cdr.detectChanges();
  }
  get hasExpandedViewport(): boolean {
    if (!this.src || !this.expandedViewportSources.length) return false;
    return this.expandedViewportSources.includes(decodeURI(new URL(this.src, document.baseURI).pathname));
  }
  get hasLightBackdrop(): boolean {
    if (!this.src || !this.lightBackdropSources.length) return false;
    const pathname = decodeURI(new URL(this.src, document.baseURI).pathname);
    return this.lightBackdropSources.includes(pathname);
  }
  src: string | null = null;
  alt = '';
  isOpen = false;
  isClosing = false;
  isImageEntered = false;
  isVerticalLanding = false;
  isLandscape = false;
  isCodePreview = false;
  codeLabel = '';
  codeContent = '';
  trimMobileRightEdge = false;
  legend: readonly CaseImagePreviewLegendItem[] = [];
  compositionTemplate: TemplateRef<unknown> | null = null;
  compositionClass = '';
  private cleanupTimer?: number;
  private returnFocus?: HTMLElement;
  private previewCycle = 0;
  private preparedMobileImage = false;
  constructor(private readonly host: ElementRef<HTMLElement>, private readonly cdr: ChangeDetectorRef) {}

  openPreparedImage(image: HTMLImageElement, verticalLanding: boolean): void {
    this.open(image.currentSrc || image.src, image.alt, verticalLanding, [], null, '', false, image);
  }

  open(
    src: string,
    alt: string,
    verticalLanding = false,
    legend: readonly CaseImagePreviewLegendItem[] = [],
    compositionTemplate: TemplateRef<unknown> | null = null,
    compositionClass = '',
    trimMobileRightEdge = false,
    preparedImage?: HTMLImageElement,
  ): void {
    this.switchingGroupImage = false;
    const cycle = ++this.previewCycle;
    if (this.cleanupTimer !== undefined) window.clearTimeout(this.cleanupTimer);
    this.isClosing = false;
    this.isCodePreview = false;
    this.src = src;
    const path = decodeURI(new URL(src, document.baseURI).pathname);
    const loadingPreview = !compositionTemplate && this.loadingPreviews[path];
    this.displaySrc = loadingPreview ? (this.preparedOriginals.get(path)?.ready
      ? (isMobileCasePreview() ? this.preparedOriginals.get(path)?.renderSrc ?? null : null) : loadingPreview) : null;
    this.alt = alt;
    this.isVerticalLanding = verticalLanding;
    this.isLandscape = false;
    this.legend = legend;
    this.compositionTemplate = compositionTemplate;
    this.compositionClass = compositionClass;
    this.trimMobileRightEdge = trimMobileRightEdge;
    this.isImageEntered = false;
    this.preparedMobileImage = isMobileCasePreview() && !!preparedImage?.complete &&
      preparedImage.naturalWidth > 0 && preparedImage.naturalHeight > 0;
    this.returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
    this.cdr.detectChanges();
    // The visible preview already owns the asset and dimensions. Reveal on the
    // mounted image's load, without racing two independent opening RAF chains.
    const mountedImage = this.host.nativeElement.querySelector<HTMLImageElement>('.case-image-preview__composition img');
    const loadedImage = mountedImage?.complete && mountedImage.naturalWidth > 0 && mountedImage.naturalHeight > 0 &&
      mountedImage.src === new URL(this.displaySrc || src, document.baseURI).href ? mountedImage : undefined;
    if (this.displaySrc) {
      void this.preloadOriginal(src).then(ready => {
        if (!ready || cycle !== this.previewCycle || this.isClosing) return;
        this.displaySrc = isMobileCasePreview() ? this.preparedOriginals.get(path)?.renderSrc ?? null : null;
        this.cdr.detectChanges();
      });
    }
    if (this.preparedMobileImage) {
      if (loadedImage) this.enterLoadedImage(loadedImage);
      return;
    }
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (cycle !== this.previewCycle) return;
      this.isOpen = true;
      this.cdr.detectChanges();
      if (!isMobileCasePreview()) {
        this.host.nativeElement.querySelector<HTMLButtonElement>('.case-image-preview__close')?.focus();
      } else if (this.mobileTapClose) {
        this.host.nativeElement.querySelector<HTMLElement>('.case-image-preview')?.focus({ preventScroll: true });
      }
    }));
    // Reopening during the closing fade retains the same loaded <img>.
    // Its src does not change, so no new load event will restart the reveal.
    if (loadedImage) this.enterLoadedImage(loadedImage);
  }

  openCode(label: string, code: string): void {
    this.displaySrc = null;
    this.preparedMobileImage = false;
    const cycle = ++this.previewCycle;
    if (this.cleanupTimer !== undefined) window.clearTimeout(this.cleanupTimer);
    this.isClosing = false;
    this.src = null;
    this.alt = '';
    this.isVerticalLanding = false;
    this.isLandscape = true;
    this.isCodePreview = true;
    this.codeLabel = label;
    this.codeContent = code;
    this.legend = [];
    this.compositionTemplate = null;
    this.compositionClass = '';
    this.trimMobileRightEdge = false;
    this.isImageEntered = false;
    this.returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
    this.cdr.detectChanges();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (cycle !== this.previewCycle) return;
      this.isOpen = true;
      this.fitMobileCodePreview();
      this.isImageEntered = true;
      this.cdr.detectChanges();
    }));
  }

  @HostListener('window:resize')
  protected fitMobileCodePreview(): void {
    if (!this.isCodePreview || !isMobileCasePreview()) return;
    const overlay = this.host.nativeElement.querySelector<HTMLElement>('.case-image-preview');
    const composition = overlay?.querySelector<HTMLElement>('.case-image-preview__composition');
    const code = composition?.querySelector<HTMLElement>('.case-image-preview__code');
    if (!overlay || !composition || !code) return;
    const viewport = overlay.getBoundingClientRect();
    // After the 90-degree rotation, natural width consumes viewport height.
    const scale = Math.min(1, Math.max(0, viewport.height - 40) / code.offsetWidth,
      Math.max(0, viewport.width - 32) / code.offsetHeight);
    composition.style.setProperty('--case-code-fit-scale', String(scale));
  }

  onImageLoad(event: Event): void {
    if (this.isClosing || !this.src) return;
    // Replacing a visible preview with its decoded original must not replay the reveal.
    const path = decodeURI(new URL(this.src, document.baseURI).pathname);
    if (this.loadingPreviews[path] && this.isImageEntered) return;
    if (this.switchingGroupImage) {
      this.switchingGroupImage = false;
      const image = event.currentTarget as HTMLImageElement;
      this.isLandscape = !this.isVerticalLanding && image.naturalWidth > image.naturalHeight;
      this.cdr.detectChanges();
      return;
    }
    this.enterLoadedImage(event.currentTarget as HTMLImageElement);
  }

  private enterLoadedImage(image: HTMLImageElement): void {
    const cycle = this.previewCycle;
    this.isLandscape = !this.isVerticalLanding && image.naturalWidth > image.naturalHeight;
    if (this.preparedMobileImage) {
      this.isOpen = true;
      this.isImageEntered = true;
      this.cdr.detectChanges();
      return;
    }
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
    const cleanup = (): void => {
      if (cycle === this.previewCycle && !this.isOpen) {
        this.src = null; this.alt = ''; this.isVerticalLanding = false; this.isLandscape = false; this.isCodePreview = false; this.codeLabel = ''; this.codeContent = ''; this.legend = [];
        this.compositionTemplate = null; this.compositionClass = '';
        this.isClosing = false;
        this.returnFocus?.focus({ preventScroll: true });
        this.cdr.detectChanges();
      }
    };
    if (this.mobileTapClose && isMobileCasePreview()) cleanup();
    else this.cleanupTimer = window.setTimeout(cleanup, matchMedia('(prefers-reduced-motion: reduce)').matches ? 140 : matchMedia('(max-width: 768px)').matches ? 900 : 720);
  }

  handlePanelPointerDown(event: Event): void {
    if (this.isClosing) {
      event.stopPropagation();
      return;
    }
    event.stopPropagation();
  }

  @HostListener('document:keydown', ['$event']) onKeydown(event: KeyboardEvent): void {
    if (!this.isOpen) return;
    if (this.activeImageGroup.length > 1 && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
      event.preventDefault();
      this.navigateImage(event.key === 'ArrowLeft' ? -1 : 1);
    }
    if (event.key === 'Tab') {
      event.preventDefault();
      if (this.activeImageGroup.length < 2) {
        this.host.nativeElement.querySelector<HTMLElement>(this.mobileTapClose && isMobileCasePreview() ? '.case-image-preview' : '.case-image-preview__close')?.focus();
        return;
      }
      const controls = Array.from(this.host.nativeElement.querySelectorAll<HTMLButtonElement>('button')).filter(button => getComputedStyle(button).display !== 'none');
      const index = controls.indexOf(document.activeElement as HTMLButtonElement);
      controls[(index + (event.shiftKey ? -1 : 1) + controls.length) % controls.length]?.focus();
    }
  }
  ngOnDestroy(): void {
    ++this.previewCycle;
    this.decodeWorkers.forEach(worker => worker.terminate());
    this.decodeWorkers.clear();
    this.preparedOriginals.forEach(entry => { if (entry.renderSrc) URL.revokeObjectURL(entry.renderSrc); });
    this.preparedOriginals.clear();
    if (this.cleanupTimer !== undefined) window.clearTimeout(this.cleanupTimer);
  }
}
