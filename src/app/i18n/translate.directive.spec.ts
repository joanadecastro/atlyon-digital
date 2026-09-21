import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LanguageService } from './language.service';
import { TranslateDirective } from './translate.directive';

@Component({ selector: 'test-translated-child', hostDirectives: [TranslateDirective], template: '<p aria-label="O Desafio">O Desafio</p>' })
class TranslatedChild {}

@Component({ imports: [TranslatedChild], hostDirectives: [TranslateDirective], template: '@if (showChild()) { <test-translated-child /> }' })
class TranslatedParent { showChild = signal(false); }

describe('nested translation observers', () => {
  afterEach(() => { TestBed.resetTestingModule(); vi.restoreAllMocks(); localStorage.removeItem('atlyon-language'); });

  it('settles after EN → PT → EN when a translated child is inserted after its parent', async () => {
    // Bound a regression so an observer feedback loop fails instead of hanging the test runner.
    const NativeObserver = window.MutationObserver;
    let callbacks = 0;
    let interrupted = false;
    vi.spyOn(window, 'MutationObserver').mockImplementation(function (callback) {
      return new NativeObserver((records, observer) => {
        if (++callbacks > 60) { interrupted = true; observer.disconnect(); return; }
        callback(records, observer);
      });
    });
    const language = TestBed.inject(LanguageService);
    language.setLanguage('en');
    const fixture = TestBed.createComponent(TranslatedParent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.componentInstance.showChild.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    const paragraph = fixture.nativeElement.querySelector('p') as HTMLParagraphElement;
    expect(paragraph.textContent).toBe('The Challenge');
    for (const [locale, expected] of [['pt', 'O Desafio'], ['en', 'The Challenge']] as const) {
      language.setLanguage(locale);
      fixture.detectChanges();
      await fixture.whenStable();
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(interrupted).toBe(false);
      expect(paragraph.textContent).toBe(expected);
      expect(paragraph.getAttribute('aria-label')).toBe(expected);
      const settled = callbacks;
      await new Promise(resolve => setTimeout(resolve, 25));
      expect(callbacks).toBe(settled);
    }
  });
});
