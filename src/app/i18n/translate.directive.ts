import { AfterViewInit, Directive, ElementRef, OnDestroy, effect } from '@angular/core';
import { LanguageService } from './language.service';

@Directive({ selector: '[appTranslate]', standalone: true })
export class TranslateDirective implements AfterViewInit, OnDestroy {
  private readonly originalText = new WeakMap<Text, string>();
  private readonly originalAttributes = new WeakMap<Element, Map<string, string>>();
  private observer?: MutationObserver;
  private ready = false;
  private readonly languageEffect = effect(() => {
    this.language.currentLanguage();
    if (this.ready) queueMicrotask(() => this.applyTranslations());
  });

  constructor(private readonly host: ElementRef<HTMLElement>, private readonly language: LanguageService) {}

  ngAfterViewInit(): void {
    this.ready = true;
    this.capture(this.host.nativeElement);
    this.applyTranslations();
    this.observer = new MutationObserver(records => {
      for (const record of records) {
        for (const node of Array.from(record.addedNodes)) this.capture(node);
      }
      this.applyTranslations();
    });
    this.observer.observe(this.host.nativeElement, { childList: true, subtree: true });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.languageEffect.destroy();
  }

  private capture(root: Node): void {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let node: Node | null = root;
    while (node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node as Text;
        if (!this.originalText.has(text) && text.data.trim()) this.originalText.set(text, text.data);
      } else if (node instanceof Element) {
        const values = new Map<string, string>();
        for (const name of ['aria-label', 'title', 'placeholder', 'alt']) {
          const value = node.getAttribute(name);
          if (value) values.set(name, value);
        }
        if (values.size && !this.originalAttributes.has(node)) this.originalAttributes.set(node, values);
      }
      node = walker.nextNode();
    }
  }

  private applyTranslations(): void {
    const walker = document.createTreeWalker(this.host.nativeElement, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let node: Node | null = this.host.nativeElement;
    while (node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node as Text;
        const original = this.originalText.get(text);
        if (original) {
          const leading = original.match(/^\s*/)?.[0] ?? '';
          const trailing = original.match(/\s*$/)?.[0] ?? '';
          text.data = `${leading}${this.language.translate(original)}${trailing}`;
        }
      } else if (node instanceof Element) {
        const element = node;
        const values = this.originalAttributes.get(element);
        values?.forEach((value, name) => element.setAttribute(name, this.language.translate(value)));
      }
      node = walker.nextNode();
    }
  }
}
