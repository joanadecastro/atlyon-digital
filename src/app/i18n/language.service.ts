import { Injectable, signal } from '@angular/core';
import { EN } from './en';
import { PT } from './pt';

export type Language = 'pt' | 'en';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly storageKey = 'atlyon-language';
  readonly currentLanguage = signal<Language>(this.readInitialLanguage());

  constructor() {
    if (typeof document !== 'undefined') document.documentElement.lang = this.currentLanguage();
  }

  setLanguage(language: Language): void {
    this.currentLanguage.set(language);
    if (typeof localStorage !== 'undefined') localStorage.setItem(this.storageKey, language);
    if (typeof document !== 'undefined') document.documentElement.lang = language;
  }

  getLanguage(): Language {
    return this.currentLanguage();
  }

  translate(value: string): string {
    const normalized = value.trim();
    if (!normalized || this.currentLanguage() === 'pt') return PT[normalized] ?? normalized;
    return EN[normalized] ?? normalized;
  }

  private readInitialLanguage(): Language {
    if (typeof localStorage === 'undefined') return 'pt';
    return localStorage.getItem(this.storageKey) === 'en' ? 'en' : 'pt';
  }
}
