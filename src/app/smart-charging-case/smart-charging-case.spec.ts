import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SmartChargingCaseComponent } from './smart-charging-case';
import { CaseImagePreviewComponent } from '../project-case/case-image-preview.component';
import { SMART_CHARGING_CHAPTERS } from './smart-charging-content';

describe('Smart Charging project preview', () => {
  afterEach(() => { TestBed.resetTestingModule(); vi.restoreAllMocks(); });

  function setup() {
    vi.spyOn(window, 'matchMedia').mockImplementation(query => ({
      matches: query.includes('prefers-reduced-motion'),
      addEventListener: vi.fn(), removeEventListener: vi.fn(),
    } as unknown as MediaQueryList));
    const fixture = TestBed.createComponent(SmartChargingCaseComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('uses one hero area, an unnumbered note before 01 and seven real content chapters', () => {
    const fixture = setup();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelectorAll('.case-hero__screen')).toHaveLength(2);
    expect(host.querySelector('app-case-hero-scroll-indicator')).not.toBeNull();
    expect(Array.from(host.querySelectorAll('.case-study-section-number'), number => number.textContent?.trim()))
      .toEqual(['01.', '02.', '03.', '04.', '05.', '06.', '07.']);
    expect(Array.from(host.querySelectorAll('.story-chapter[aria-labelledby]'), chapter => chapter.getAttribute('aria-labelledby')))
      .toEqual(['smart-introduction', 'smart-overview', 'smart-parking', 'smart-reservations', 'smart-chargers', 'smart-permissions', 'smart-statistics']);
    const panel = host.querySelector('.civitas-story-panel')!;
    expect(panel.firstElementChild?.classList.contains('smart-preview-note')).toBe(true);
    expect(panel.firstElementChild?.querySelector('.case-study-section-number')).toBeNull();
    expect(panel.firstElementChild?.textContent).toContain('24–48 horas');
    expect(panel.firstElementChild?.querySelector('header')?.classList.contains('editorial-section-header')).toBe(false);
    const introduction = host.querySelector('[aria-labelledby="smart-introduction"]')!;
    expect(introduction.querySelectorAll('header > p')).toHaveLength(2);
    expect(introduction.textContent).toContain('O projeto partiu de um conjunto extenso');
    expect(introduction.textContent).toContain('O meu trabalho passou pela definição da experiência');
    expect(introduction.textContent).not.toContain('Joana');
    expect(host.querySelector('#smart-coming-soon')).toBeNull();
    expect(host.querySelector('#smart-statistics')?.closest('.story-chapter')?.nextElementSibling?.hasAttribute('data-case-study-final')).toBe(true);
    expect(host.querySelectorAll('.case-hero__screen--front')).toHaveLength(1);
    expect(host.querySelectorAll('.overview-hotspot-visual > .overview-hotspot-visual__screen')).toHaveLength(4);
    expect(host.querySelector('.juh-result-layout')).toBeNull();
    expect(host.querySelector('[aria-labelledby="smart-overview"] > .story-chapter-header > p')?.textContent).toContain(SMART_CHARGING_CHAPTERS[0].copy);
    expect(host.querySelector('.juh-challenge-video-frame')).toBeNull();
    expect(host.querySelector('.case-hero__category')?.textContent).toContain('UI/UX Design · Product Design');
    expect(host.querySelector('.juh-story,.juh-screen-pair,.smart-hero-state')).toBeNull();
    expect(panel.querySelectorAll('img')).toHaveLength(25);
    const productPreview = panel.querySelector('.smart-product-preview')!;
    expect(productPreview.querySelectorAll('img')).toHaveLength(15);
    expect(Array.from(productPreview.querySelectorAll('img'), image => image.getAttribute('src')?.split('/').pop()).sort())
      .toEqual(['Frame 845.png', 'Group 3190.png', 'Group 3191.png', 'Group 3192.png', 'Group 3192 (1).png', 'Group 3193.png', 'Group 3194.png', 'Group 3196.png', 'Group 3197.png', 'Group 3198.png', 'Group 3199.png', 'Group 3200.png', 'Group 3201.png', 'Group 3202.png', 'Group 3203.png'].sort());
    expect(productPreview.querySelector('button')).toBeNull();
    expect(productPreview.nextElementSibling).toBe(introduction);
    expect(panel.querySelectorAll('.licita-applied-comparison__meta')).toHaveLength(10);
    expect(panel.querySelectorAll('.licita-applied-comparison__meta .licita-applied-comparison__expand')).toHaveLength(10);
    expect(panel.querySelectorAll('.licita-applied-comparison__visual')).toHaveLength(3);
    expect(panel.querySelector('.component-crops')).toBeNull();
    expect(panel.querySelector('.licita-applied-comparison__visual > span')).toBeNull();
  });

  it('keeps distinct physical parking facilities and the supplied statistics aspect ratio', () => {
    const parking = SMART_CHARGING_CHAPTERS.find(chapter => chapter.id === 'parking')!;
    expect(parking.screens.map(screen => screen.file)).toEqual(['Group 3193.png', 'Group 3192.png']);
    expect(parking.copy).toContain('edifícios distintos');
    expect(parking.copy).toContain('50');
    const statistics = SMART_CHARGING_CHAPTERS.find(chapter => chapter.id === 'statistics')!;
    expect(statistics.screens[0]).toMatchObject({ width: 1900, height: 1285 });
  });

  it('opens the corresponding supplied asset through the existing image lightbox', () => {
    const fixture = setup();
    const preview = fixture.debugElement.children.find(child => child.componentInstance instanceof CaseImagePreviewComponent)!.componentInstance as CaseImagePreviewComponent;
    const open = vi.spyOn(preview, 'open').mockImplementation(() => undefined);
    const button = fixture.nativeElement.querySelector('.licita-applied-comparison__expand') as HTMLButtonElement;
    button.click();
    expect(open).toHaveBeenCalledOnce();
    expect(open).toHaveBeenCalledWith('/projects/carregadoresEletricos/Group 3190.png', 'Visão geográfica das localizações e estados dos carregadores');
    open.mockClear();
    const image = fixture.nativeElement.querySelector('.panel-hotspot-visual__screen img') as HTMLImageElement;
    image.click();
    expect(open).toHaveBeenCalledOnce();
    expect(open).toHaveBeenCalledWith('/projects/carregadoresEletricos/Group 3190.png', 'Visão geográfica das localizações e estados dos carregadores');
  });
});
