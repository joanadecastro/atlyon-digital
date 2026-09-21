import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SmartChargingCaseComponent } from './smart-charging-case';
import { CaseImagePreviewComponent } from '../project-case/case-image-preview.component';
import { SMART_CHARGING_CHAPTERS } from './smart-charging-content';
import { LanguageService } from '../i18n/language.service';

describe('Smart Charging case study', () => {
  afterEach(() => { TestBed.resetTestingModule(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  function setup() {
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
    vi.spyOn(window, 'matchMedia').mockImplementation(query => ({
      matches: query.includes('prefers-reduced-motion'),
      addEventListener: vi.fn(), removeEventListener: vi.fn(),
    } as unknown as MediaQueryList));
    const fixture = TestBed.createComponent(SmartChargingCaseComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('starts with the project introduction after the hero and preserves product chapters', () => {
    const fixture = setup();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelectorAll('.case-hero__screen')).toHaveLength(2);
    expect(host.querySelector('app-case-hero-scroll-indicator')).not.toBeNull();
    expect(Array.from(host.querySelectorAll('.case-study-section-number'), number => number.textContent?.trim()))
      .toEqual(['01.', '02.', '03.', '04.', '02.', '03.', '04.', '05.', '06.', '07.']);
    expect(Array.from(host.querySelectorAll('.story-chapter[aria-labelledby]'), chapter => chapter.getAttribute('aria-labelledby')))
      .toEqual(['smart-introduction', 'smart-challenge', 'smart-users', 'smart-architecture', 'smart-overview', 'smart-parking', 'smart-reservations', 'smart-chargers', 'smart-permissions', 'smart-statistics']);
    expect(host.querySelector('#smart-pilot-insights')?.tagName).toBe('H3');
    expect(host.querySelector('#smart-pilot-insights')?.closest('.story-chapter')?.getAttribute('aria-labelledby')).toBe('smart-challenge');
    const panel = host.querySelector('.civitas-story-panel')!;
    const introduction = host.querySelector('[aria-labelledby="smart-introduction"]')!;
    expect(panel.firstElementChild).toBe(introduction);
    expect(host.querySelector('.smart-preview-note,.smart-product-preview')).toBeNull();
    expect(panel.textContent).not.toMatch(/preview|prepara[çc][ãa]o|24[–-]48|coming soon/i);
    expect(introduction.querySelectorAll('.smart-introduction-copy p')).toHaveLength(2);
    expect(introduction.textContent).toContain('documentação de um projeto-piloto');
    expect(introduction.textContent).toContain('O meu trabalho de Product/UI-UX');
    expect(introduction.textContent).not.toContain('Joana');
    expect(host.querySelector('#smart-coming-soon')).toBeNull();
    expect(host.querySelector('#smart-statistics')?.closest('.story-chapter')?.nextElementSibling?.hasAttribute('data-case-study-final')).toBe(true);
    expect(host.querySelectorAll('.case-hero__screen--front')).toHaveLength(1);
    expect(host.querySelectorAll('.overview-hotspot-visual > .overview-hotspot-visual__screen')).toHaveLength(1);
    expect(host.querySelector('.juh-result-layout')).toBeNull();
    expect(host.querySelector('[aria-labelledby="smart-overview"] > .story-chapter-header > p')?.textContent).toContain(SMART_CHARGING_CHAPTERS[0].copy);
    expect(host.querySelector('.juh-challenge-video-frame')).toBeNull();
    expect(host.querySelector('.case-hero__category')?.textContent).toContain('UI/UX Design · Product Design');
    expect(host.querySelector('.juh-story,.juh-screen-pair,.smart-hero-state')).toBeNull();
    expect(panel.querySelectorAll('img')).toHaveLength(19);
    expect(panel.querySelectorAll('.smart-product-scope__landscape img')).toHaveLength(1);
    expect(panel.querySelector('.smart-product-scope__landscape img')?.getAttribute('src')).toBe('/projects/carregadoresEletricos/product-landscape-preview.webp');
    expect(panel.querySelectorAll('.licita-applied-comparison__meta')).toHaveLength(14);
    expect(panel.querySelectorAll('.licita-applied-comparison__meta .licita-applied-comparison__expand')).toHaveLength(14);
    expect(panel.querySelectorAll('.licita-applied-comparison__visual')).toHaveLength(2);
    expect(panel.querySelector('.component-crops')).toBeNull();
    expect(panel.querySelector('.licita-applied-comparison__visual > span')).toBeNull();
  });

  it('opens one technical area at a time and keeps logs non-interactive', () => {
    const fixture = setup();
    const host = fixture.nativeElement as HTMLElement;
    const rows = host.querySelectorAll('.smart-technical-accordion__row');
    expect(rows).toHaveLength(4);
    expect(rows[0].classList.contains('is-open')).toBe(true);
    expect(rows[2].querySelector('button, [role="region"]')).toBeNull();
    for (const index of [1, 3, 0]) {
      (rows[index].querySelector('button') as HTMLButtonElement).click();
      fixture.detectChanges();
      expect(host.querySelectorAll('.smart-technical-accordion .is-open')).toHaveLength(1);
      expect(rows[index].querySelector('[role="region"]')?.hasAttribute('inert')).toBe(false);
      expect(rows[index].querySelector('button')?.getAttribute('aria-expanded')).toBe('true');
    }
    expect(host.querySelectorAll('img[src$="Group 3196.png"]')).toHaveLength(1);
    expect(rows[1].querySelector('img')?.getAttribute('src')).toContain('Group 3211 (1).png');
    expect(rows[3].querySelector('img')?.getAttribute('src')).toContain('Group 3210 (1).png');
  });

  it('keeps distinct physical parking facilities and the supplied statistics aspect ratio', () => {
    const parking = SMART_CHARGING_CHAPTERS.find(chapter => chapter.id === 'parking')!;
    expect(parking.screens.map(screen => screen.file)).toEqual(['Group 3193.png', 'Group 3192.png']);
    expect(parking.copy).toContain('edifícios distintos');
    expect(parking.copy).toContain('Múltiplas plantas de parques');
    const statistics = SMART_CHARGING_CHAPTERS.find(chapter => chapter.id === 'statistics')!;
    expect(statistics.screens[0]).toMatchObject({ width: 1900, height: 1285 });
  });

  it('keeps architecture modules initially closed and opens only the selected module', () => {
    const fixture = setup();
    const host = fixture.nativeElement as HTMLElement;
    const triggers = Array.from(host.querySelectorAll<HTMLButtonElement>('.smart-area-toggle'));
    const expanded = () => triggers.filter(button => button.getAttribute('aria-expanded') === 'true');
    expect(triggers).toHaveLength(3);
    expect(expanded()).toHaveLength(0);
    for (const trigger of triggers) {
      trigger.click();
      fixture.detectChanges();
      expect(expanded()).toEqual([trigger]);
    }
    triggers[2].click();
    fixture.detectChanges();
    expect(expanded()).toHaveLength(0);
  });

  it('opens each operational role and restores a closed dialog with Escape', () => {
    const fixture = setup();
    const host = fixture.nativeElement as HTMLElement;
    const triggers = Array.from(host.querySelectorAll<HTMLButtonElement>('.smart-operational-roles .user-need__toggle'));
    expect(triggers).toHaveLength(3);
    expect(host.querySelector('.smart-operational-roles img')).toBeNull();
    for (const trigger of triggers) {
      trigger.click();
      fixture.detectChanges();
      const dialog = host.querySelector('#smart-role-panel')!;
      expect(dialog.getAttribute('aria-hidden')).toBe('false');
      expect(dialog.querySelector('h4')?.textContent?.trim()).toBe(trigger.closest('.user-need')?.querySelector('h4')?.textContent?.trim());
      expect(dialog.querySelectorAll('li')).toHaveLength(3);
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      fixture.detectChanges();
      expect(dialog.getAttribute('aria-hidden')).toBe('true');
    }
  });

  it('translates the opening and exposes architecture groups without changing the reservation flow', async () => {
    const fixture = setup();
    const host = fixture.nativeElement as HTMLElement;
    TestBed.inject(LanguageService).setLanguage('en');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(host.querySelector('#smart-challenge')?.textContent).toBe('The Challenge');
    expect(host.querySelector('[aria-labelledby="smart-introduction"]')?.textContent).toContain('approximately one year');
    const architecture = host.querySelector('[aria-labelledby="smart-architecture"]')!;
    expect(host.querySelector('#smart-architecture')?.textContent).toBe('Platform Architecture');
    expect(architecture.querySelectorAll('.architecture-area')).toHaveLength(3);
    expect(Array.from(architecture.querySelectorAll('.architecture-items'), area => area.children.length)).toEqual([5, 7, 4]);
    expect(architecture.textContent).not.toMatch(/CITY|PHYSICAL JOURNEY|EV SPACE/);
    expect(architecture.textContent).toContain('Permissions / access');
    TestBed.inject(LanguageService).setLanguage('pt');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(host.querySelector('#smart-challenge')?.textContent).toBe('O Desafio');
  });

  it('keeps one park in front and wraps the Principles states in both directions', () => {
    const fixture = setup();
    const host = fixture.nativeElement as HTMLElement;
    const previous = host.querySelector<HTMLButtonElement>('.smart-parking-layouts__navigation button:first-child')!;
    const next = host.querySelector<HTMLButtonElement>('.smart-parking-layouts__navigation button:last-child')!;
    previous.click();
    fixture.detectChanges();
    expect(host.querySelector('.smart-parking-layouts__rail .center img')?.getAttribute('src')).toContain('Group 3192.png');
    expect(host.querySelector('.smart-parking-layouts__rail .right img')?.getAttribute('src')).toContain('Group 3207.png');
    next.click();
    fixture.detectChanges();
    expect(host.querySelector('.smart-parking-layouts__rail .center img')?.getAttribute('src')).toContain('Group 3207.png');
    expect(host.querySelectorAll('.smart-parking-layouts__rail figure[aria-hidden="false"]')).toHaveLength(1);
    expect(host.querySelectorAll('.smart-parking-layouts__rail .hidden')).toHaveLength(2);
  });

  it('opens the corresponding supplied asset through the existing image lightbox', () => {
    const fixture = setup();
    const preview = fixture.debugElement.children.find(child => child.componentInstance instanceof CaseImagePreviewComponent)!.componentInstance as CaseImagePreviewComponent;
    const open = vi.spyOn(preview, 'open').mockImplementation(() => undefined);
    const landscapeExpand = fixture.nativeElement.querySelector('.smart-product-scope__landscape .licita-applied-comparison__expand') as HTMLButtonElement;
    landscapeExpand.click();
    expect(open).toHaveBeenCalledWith('/projects/carregadoresEletricos/Group 3204 (1).png', expect.any(String));
    open.mockClear();
    const image = fixture.nativeElement.querySelector('.smart-geographic-sequence img') as HTMLImageElement;
    image.click();
    expect(open).toHaveBeenCalledOnce();
    expect(open).toHaveBeenCalledWith('/projects/carregadoresEletricos/Group 3191.png', '01 · VISÃO GEOGRÁFICA');
    const sequenceButtons = fixture.nativeElement.querySelectorAll('.smart-geographic-sequence .licita-applied-comparison__expand') as NodeListOf<HTMLButtonElement>;
    expect(sequenceButtons).toHaveLength(4);
    ['Group 3191.png', 'Group 3206.png', 'Group 3193.png', 'Group 3194.png'].forEach((file, index) => {
      open.mockClear();
      sequenceButtons[index].click();
      expect(open).toHaveBeenCalledOnce();
      expect(open).toHaveBeenCalledWith(`/projects/carregadoresEletricos/${file}`, expect.any(String));
    });
    const layouts = fixture.nativeElement.querySelectorAll('.smart-parking-layouts__rail figure:not([data-carousel-clone]) img') as NodeListOf<HTMLImageElement>;
    ['Group 3207.png', 'Group 3208.png', 'Group 3189.png', 'Group 3209.png', 'Group 3192.png'].forEach((file, index) => {
      expect(layouts[index].getAttribute('src')).toBe(`/projects/carregadoresEletricos/${file}`);
      fixture.componentInstance.parkingLayoutSlide = index;
      fixture.detectChanges();
      open.mockClear();
      (fixture.nativeElement.querySelector('.smart-parking-layouts__toolbar .licita-applied-comparison__expand') as HTMLButtonElement).click();
      expect(open).toHaveBeenCalledOnce();
      expect(open).toHaveBeenCalledWith(`/projects/carregadoresEletricos/${file}`, expect.any(String));
    });
  });
});
