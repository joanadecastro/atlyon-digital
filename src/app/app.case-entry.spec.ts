import { ChangeDetectorRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { App } from './app';
import { LanguageService } from './i18n/language.service';

describe('Case entry scroll restoration', () => {
  it.each(['civitas', 'licitanow', 'juh'])(
    'disables browser restoration before the first desktop render of %s', slug => {
      const previousUrl = window.location.href;
      const previousState = window.history.state;
      const previousWidth = window.innerWidth;
      const previousRestoration = window.history.scrollRestoration;
      const detectChanges = vi.fn();
      try {
        Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1440 });
        window.history.replaceState({}, '', `/case-studies/${slug}`);
        window.history.scrollRestoration = 'auto';

        TestBed.runInInjectionContext(() => new App(
          { detectChanges, markForCheck: vi.fn() } as unknown as ChangeDetectorRef,
          {} as LanguageService,
        ));

        expect(window.history.scrollRestoration).toBe('manual');
        expect(detectChanges).not.toHaveBeenCalled();
      } finally {
        window.history.replaceState(previousState, '', previousUrl);
        window.history.scrollRestoration = previousRestoration;
        Object.defineProperty(window, 'innerWidth', { configurable: true, value: previousWidth });
      }
    },
  );
});
