import { ChangeDetectorRef, ElementRef, SimpleChange } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LanguageService } from '../i18n/language.service';
import { CaseImagePreviewComponent } from './case-image-preview.component';
import { CaseLightboxCloseDirective } from './case-lightbox-close.directive';

describe('Case lightbox close behavior', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('closes from backdrop and Escape but not from media content', () => {
    const host = document.createElement('div');
    const directive = new CaseLightboxCloseDirective(new ElementRef(host));
    const close = vi.fn();
    directive.caseLightboxClose.subscribe(close);
    directive.caseLightboxOpen = true;

    directive.closeFromBackdrop({ target: host, currentTarget: host } as unknown as PointerEvent);
    directive.closeFromBackdrop({ target: document.createElement('img'), currentTarget: host } as unknown as PointerEvent);
    directive.closeFromEscape();

    expect(close).toHaveBeenCalledTimes(2);
    directive.caseLightboxClosing = true;
    directive.closeFromBackdrop({ target: host, currentTarget: host } as unknown as PointerEvent);
    directive.closeFromEscape();
    expect(close).toHaveBeenCalledTimes(2);
  });

  it('cancels pending image-preview cleanup during teardown without a late scroll', () => {
    vi.useFakeTimers();
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const preview = TestBed.runInInjectionContext(() => new CaseImagePreviewComponent(
      new ElementRef(document.createElement('div')),
      { detectChanges: vi.fn() } as unknown as ChangeDetectorRef,
    ));
    TestBed.inject(LanguageService);

    preview.close();
    preview.ngOnDestroy();
    vi.runAllTimers();

    expect(scrollTo).not.toHaveBeenCalled();
  });
});
