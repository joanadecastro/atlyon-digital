import { Component } from '@angular/core';

@Component({
  selector: 'app-case-hero-scroll-indicator',
  standalone: true,
  template: `
    <span class="case-hero-scroll-indicator" aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">
        <path d="m9 5 7 7-7 7" />
      </svg>
    </span>
  `,
  styles: `
    :host { display: none; }

    @media (max-width: 768px) {
      :host {
        position: relative;
        z-index: 2;
        display: grid;
        place-items: center;
        width: 100%;
        height: var(--case-hero-white-band-height, 50px);
        min-height: var(--case-hero-white-band-height, 50px);
        max-height: var(--case-hero-white-band-height, 50px);
        box-sizing: border-box;
        flex: 0 0 var(--case-hero-white-band-height, 50px);
        border: 0;
        background: #fff;
        box-shadow: none;
        filter: none;
        pointer-events: none;
      }

      .case-hero-scroll-indicator {
        position: static;
        display: grid;
        place-items: center;
        width: 48px;
        height: 26px;
        color: #34383d;
        box-shadow: none;
        filter: none;
      }

      svg {
        width: 26px;
        height: 26px;
        rotate: 90deg;
        fill: none;
        stroke: currentColor;
        stroke-width: 1.7;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
    }
  `,
})
export class CaseHeroScrollIndicatorComponent {}
