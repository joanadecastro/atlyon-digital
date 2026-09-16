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
  const figureVideo = trigger.closest('figure')?.querySelector<HTMLVideoElement>('video');
  if (matchMedia('(max-width: 768px)').matches && figureVideo) return figureVideo;
  if (trigger.classList.contains('challenge-screen-expand--main')) return trigger.parentElement?.querySelector<HTMLElement>('.challenge-screen-main') ?? null;
  if (trigger.classList.contains('challenge-screen-expand--detail')) return trigger.parentElement?.querySelector<HTMLElement>('.challenge-screen-detail') ?? null;
  return null;
}

function wrapperFor(media: HTMLElement): HTMLElement | null {
  const wrapper = media.closest<HTMLElement>(ESTABLISHED_WRAPPER_SELECTOR) ?? (media.matches('.challenge-screen') ? media : media.parentElement);
  return matchMedia('(max-width: 768px)').matches && wrapper && wrapper.querySelectorAll('img,video').length > 1 ? media : wrapper;
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
  const videoTapAreas = new Map<HTMLVideoElement, { button: HTMLButtonElement; parent: HTMLElement; position: string }>();
  const videoTapActions = new Map<HTMLElement, () => void>();
  let handledVideoTap: HTMLElement | undefined;
  let gesture: { x: number; y: number; moved: boolean } | undefined;
  const startGesture = (event: PointerEvent): void => {
    handledVideoTap = undefined;
    gesture = mobile.matches && event.target instanceof Element &&
      (!!event.target.closest('.case-expandable-media') ||
        videoTapActions.has(event.target.closest<HTMLElement>('button')!))
      ? { x: event.clientX, y: event.clientY, moved: false } : undefined;
  };
  const trackGesture = (event: PointerEvent): void => {
    if (gesture && Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 10) gesture.moved = true;
  };
  const filterSwipeClick = (event: MouseEvent): void => {
    if (mobile.matches && event.detail !== 0 && (gesture?.moved ||
      (event.target instanceof Node && handledVideoTap?.contains(event.target)))) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
    gesture = undefined;
  };

  for (const trigger of host.querySelectorAll<HTMLButtonElement>('.licita-applied-comparison__expand')) {
    const media = mediaForTrigger(trigger);
    if (!media) continue;
    triggerByMedia.set(media, trigger);
    actions.set(media, () => trigger.click());
  }

  if (mobile.matches && host.matches('app-licitanow-case,app-juh-case')) {
    for (const trigger of host.querySelectorAll<HTMLButtonElement>('.licita-challenge__mobile-expand,.juh-challenge-video__mobile-expand')) {
      const media = trigger.parentElement?.querySelector<HTMLVideoElement>('video');
      if (!media) continue;
      const wrapper = wrapperFor(media);
      if (!wrapper) continue;
      triggerByMedia.set(wrapper, trigger);
      actions.set(wrapper, () => trigger.click());
    }
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
    if (!mobile.matches) {
      videoTapAreas.forEach(({ button, parent, position }) => {
        button.remove();
        parent.style.position = position;
      });
      videoTapAreas.clear();
      videoTapActions.clear();
    }
    for (const [wrapper] of actions) {
      const trigger = triggerByMedia.get(wrapper);
      const mobileExpansionDisabled = mobile.matches && wrapper.hasAttribute('data-case-no-mobile-expand') && !trigger;
      const expandable = !mobileExpansionDisabled && (mobile.matches || wrapper.hasAttribute('data-case-expand-desktop'));
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
    if (mobile.matches && host.matches('app-licitanow-case,app-juh-case')) {
      for (const [wrapper, action] of actions) {
        const video = wrapper instanceof HTMLVideoElement ? wrapper : wrapper.querySelector<HTMLVideoElement>('video');
        const trigger = triggerByMedia.get(wrapper);
        if (video && trigger) videoTapActions.set(trigger, action);
        if (!video || video.closest('[hidden]') || videoTapAreas.has(video) || !wrapper.classList.contains('case-expandable-media')) continue;
        const parent = video.parentElement;
        if (!parent) continue;
        const position = parent.style.position;
        if (getComputedStyle(parent).position === 'static') parent.style.position = 'relative';
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'case-expandable-media case-video-tap-area';
        button.setAttribute('aria-label', wrapper.getAttribute('aria-label') || 'Ampliar vídeo');
        button.style.cssText = 'position:absolute;inset:0;z-index:19;display:block;width:100%;height:100%;padding:0;margin:0;border:0;background:transparent;touch-action:pan-x pan-y';
        button.addEventListener('click', action);
        videoTapActions.set(button, action);
        parent.append(button);
        videoTapAreas.set(video, { button, parent, position });
      }
    }
  };

  const endVideoTap = (event: PointerEvent): void => {
    trackGesture(event);
    if (!mobile.matches || event.pointerType === 'mouse' || !event.isPrimary ||
      !gesture || gesture.moved || !(event.target instanceof Element)) return;
    const target = event.target.closest<HTMLElement>('.case-video-tap-area,.licita-applied-comparison__expand,.licita-challenge__mobile-expand,.juh-challenge-video__mobile-expand');
    const action = target ? videoTapActions.get(target) : undefined;
    if (!target || !action) return;
    handledVideoTap = target;
    action();
  };

  const activate = (event: Event): void => {
    if (!(event.target instanceof Element)) return;
    const wrapper = event.target.closest<HTMLElement>('.case-expandable-media');
    const action = wrapper ? actions.get(wrapper) : undefined;
    if (!wrapper || !action || (mobile.matches && wrapper.hasAttribute('data-case-no-mobile-expand') && !triggerByMedia.has(wrapper)) || (!mobile.matches && !wrapper.hasAttribute('data-case-expand-desktop')) || event.target.closest('a,button') || (event.target.closest('video[controls]') && (!mobile.matches || !triggerByMedia.has(wrapper)))) return;
    if (event.type === 'click' && event.target.matches('[data-case-expand-desktop] img')) return;
    if (event instanceof KeyboardEvent) {
      if (event.target !== wrapper || !['Enter', ' '].includes(event.key)) return;
      event.preventDefault();
    }
    action();
  };

  sync();
  host.addEventListener('pointerdown', startGesture, true);
  host.addEventListener('pointermove', trackGesture, true);
  host.addEventListener('pointerup', endVideoTap, true);
  host.addEventListener('pointercancel', trackGesture, true);
  host.addEventListener('click', filterSwipeClick, true);
  host.addEventListener('click', activate);
  host.addEventListener('keydown', activate);
  mobile.addEventListener('change', sync);
  return () => {
    videoTapAreas.forEach(({ button, parent, position }) => {
      button.remove();
      parent.style.position = position;
    });
    videoTapAreas.clear();
    host.removeEventListener('pointerdown', startGesture, true);
    host.removeEventListener('pointermove', trackGesture, true);
    host.removeEventListener('pointerup', endVideoTap, true);
    host.removeEventListener('pointercancel', trackGesture, true);
    host.removeEventListener('click', filterSwipeClick, true);
    host.removeEventListener('click', activate);
    host.removeEventListener('keydown', activate);
    mobile.removeEventListener('change', sync);
  };
}
