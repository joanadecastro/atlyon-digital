type ImageOpener = (src: string, alt: string) => void;
type VideoOpener = (src: string, label: string) => void;

const EDITORIAL_MEDIA_SELECTOR = '.civitas-story-panel img,.civitas-story-panel video,.licitanow-story-panel img,.licitanow-story-panel video,.juh-story img,.juh-story video';
const EXCLUDED_MEDIA_SELECTOR = '.user-profile-map__person,.licita-image-preview,.licita-video-preview,.case-hero,[aria-hidden="true"],[data-case-native-controls]';
const ESTABLISHED_WRAPPER_SELECTOR = [
  '.licita-applied-comparison__media', '.licita-final-comparison__media', '.juh-comparison__media',
  '.overview-hotspot-visual__screen', '.overview-variant__screen', '.licita-challenge__video-frame',
  '.visual-process-media', '.licita-responsive-media', '.responsive-panel-desktop-screen',
  '.responsive-mobile-crop', '.responsive-desktop-variants', '.responsive-overview-mobile-screen',
].join(',');

function mediaForTrigger(trigger: HTMLButtonElement): HTMLElement | null {
  const figureMedia = trigger.closest('figure')?.querySelector<HTMLElement>(ESTABLISHED_WRAPPER_SELECTOR);
  if (figureMedia) return figureMedia;
  if (trigger.classList.contains('challenge-screen-expand--main')) return trigger.parentElement?.querySelector<HTMLElement>('.challenge-screen-main') ?? null;
  if (trigger.classList.contains('challenge-screen-expand--detail')) return trigger.parentElement?.querySelector<HTMLElement>('.challenge-screen-detail') ?? null;
  return null;
}

function wrapperFor(media: HTMLElement): HTMLElement | null {
  return media.closest<HTMLElement>(ESTABLISHED_WRAPPER_SELECTOR) ?? (media.matches('.challenge-screen') ? media : media.parentElement);
}

function sourceFor(media: HTMLImageElement | HTMLVideoElement): string {
  return media instanceof HTMLImageElement
    ? media.currentSrc || media.src
    : media.currentSrc || media.querySelector<HTMLSourceElement>('source')?.src || '';
}

function addAffordance(wrapper: HTMLElement, trigger?: HTMLButtonElement): void {
  if (wrapper.matches('img,video')) {
    if (trigger) {
      trigger.classList.add('case-expand-affordance', 'case-expand-affordance--challenge');
      trigger.style.setProperty('font-size', '0', 'important');
    }
    return;
  }
  if (wrapper.querySelector(':scope > .case-expand-affordance')) return;
  const icon = document.createElement('span');
  icon.className = 'case-expand-affordance';
  icon.setAttribute('aria-hidden', 'true');
  const isCivitasComponentCrop = !!wrapper.closest('.civitas-page:not(.licitanow-page) .story-components figure.component-crop');
  icon.style.cssText = `position:absolute;top:${isCivitasComponentCrop ? '-8px' : '10px'};right:10px;z-index:20;pointer-events:none;width:34px;height:34px;border:1px solid rgba(32,36,43,.10);border-radius:50%;background:rgba(255,255,255,.9);box-shadow:0 2px 6px rgba(0,0,0,.08);display:grid;place-items:center;box-sizing:border-box`;
  icon.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M6 2H2v4M10 2h4v4M14 10v4h-4M6 14H2v-4" stroke="#2c3035" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  wrapper.append(icon);
}

export function bindCaseExpandableMedia(host: HTMLElement, openImage: ImageOpener, openVideo?: VideoOpener): () => void {
  const mobile = matchMedia('(max-width: 768px)');
  const actions = new Map<HTMLElement, () => void>();
  const triggerByMedia = new Map<HTMLElement, HTMLButtonElement>();

  for (const trigger of host.querySelectorAll<HTMLButtonElement>('.licita-applied-comparison__expand')) {
    const media = mediaForTrigger(trigger);
    if (!media) continue;
    triggerByMedia.set(media, trigger);
    actions.set(media, () => trigger.click());
  }

  for (const media of host.querySelectorAll<HTMLImageElement | HTMLVideoElement>(EDITORIAL_MEDIA_SELECTOR)) {
    if (media.closest(EXCLUDED_MEDIA_SELECTOR)) continue;
    if (media instanceof HTMLVideoElement && media.controls) continue;
    const wrapper = wrapperFor(media);
    if (!wrapper || actions.has(wrapper) || actions.has(media)) continue;
    const src = sourceFor(media);
    if (!src) continue;
    const label = media instanceof HTMLImageElement ? media.alt : media.getAttribute('aria-label') || 'Vídeo do case study';
    actions.set(wrapper, media instanceof HTMLVideoElement && openVideo ? () => openVideo(src, label) : () => openImage(src, label));
  }

  const sync = (): void => {
    for (const [wrapper] of actions) {
      const trigger = triggerByMedia.get(wrapper);
      const expandable = mobile.matches || wrapper.hasAttribute('data-case-expand-desktop');
      wrapper.classList.toggle('case-expandable-media', expandable);
      if (expandable) {
        if (mobile.matches) addAffordance(wrapper, trigger);
        else wrapper.querySelector(':scope > .case-expand-affordance')?.remove();
        wrapper.setAttribute('role', 'button');
        wrapper.setAttribute('tabindex', '0');
        const media = wrapper.matches('img,video') ? wrapper : wrapper.querySelector<HTMLImageElement | HTMLVideoElement>('img,video');
        const label = media instanceof HTMLImageElement ? media.alt : 'vídeo do case study';
        wrapper.setAttribute('aria-label', trigger?.getAttribute('aria-label') ?? `Ampliar ${label}`);
      } else {
        wrapper.removeAttribute('role');
        wrapper.removeAttribute('tabindex');
        wrapper.removeAttribute('aria-label');
      }
    }
  };

  const activate = (event: Event): void => {
    if (!(event.target instanceof Element)) return;
    const wrapper = event.target.closest<HTMLElement>('.case-expandable-media');
    const action = wrapper ? actions.get(wrapper) : undefined;
    if (!wrapper || !action || (!mobile.matches && !wrapper.hasAttribute('data-case-expand-desktop')) || event.target.closest('a,button,video[controls]')) return;
    if (event.type === 'click' && event.target.matches('[data-case-expand-desktop] img')) return;
    if (event instanceof KeyboardEvent) {
      if (event.target !== wrapper || !['Enter', ' '].includes(event.key)) return;
      event.preventDefault();
    }
    action();
  };

  sync();
  host.addEventListener('click', activate);
  host.addEventListener('keydown', activate);
  mobile.addEventListener('change', sync);
  return () => {
    host.removeEventListener('click', activate);
    host.removeEventListener('keydown', activate);
    mobile.removeEventListener('change', sync);
  };
}
