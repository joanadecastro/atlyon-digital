export type CaseCodePreviewOpener = (label: string, code: string) => void;

const CODE_BLOCK_SELECTOR = '.juh-code, .licita-implementation__code';

export function bindCaseExpandableCode(root: HTMLElement, open: CaseCodePreviewOpener): () => void {
  const mobile = matchMedia('(max-width: 768px)');
  const blocks = Array.from(root.querySelectorAll<HTMLElement>(CODE_BLOCK_SELECTOR));
  const buttons = new Map<HTMLElement, HTMLButtonElement>();
  const tapCleanups = new Map<HTMLElement, () => void>();

  const addButton = (block: HTMLElement): void => {
    if (buttons.has(block)) return;
    const code = block.querySelector<HTMLElement>('pre code');
    const label = block.querySelector<HTMLElement>('figcaption, .licita-implementation__source');
    if (!code || !label) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'case-code-expand case-expand-affordance';
    button.setAttribute('aria-label', `Ampliar snippet ${label.textContent?.trim() ?? 'de código'}`);
    button.style.cssText = 'position:absolute;top:10px;right:10px;z-index:20;width:34px;height:34px;padding:0;border:1px solid rgba(32,36,43,.10);border-radius:50%;background:rgba(255,255,255,.9);box-shadow:0 2px 6px rgba(0,0,0,.08);display:grid;place-items:center;box-sizing:border-box;cursor:pointer';
    button.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M6 2H2v4M10 2h4v4M14 10v4h-4M6 14H2v-4" stroke="#2c3035" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const handleClick = (event: MouseEvent): void => {
      event.preventDefault();
      event.stopPropagation();
      open(label.textContent?.trim() ?? '', code.textContent ?? '');
    };
    button.addEventListener('click', handleClick);
    block.appendChild(button);
    buttons.set(block, button);
    if (block.matches('.licita-implementation__code')) {
      let gesture: { x: number; y: number; moved: boolean } | undefined;
      const start = (event: PointerEvent): void => { gesture = { x: event.clientX, y: event.clientY, moved: false }; };
      const move = (event: PointerEvent): void => {
        if (gesture && Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 10) gesture.moved = true;
      };
      const cancel = (): void => { if (gesture) gesture.moved = true; };
      const tap = (event: MouseEvent): void => {
        if (!mobile.matches) return;
        const moved = gesture?.moved;
        gesture = undefined;
        if (moved && event.detail !== 0) {
          event.preventDefault();
          event.stopImmediatePropagation();
          return;
        }
        if (event.target instanceof Element && event.target.closest('button,a')) return;
        handleClick(event);
      };
      block.addEventListener('pointerdown', start, true);
      block.addEventListener('pointermove', move, true);
      block.addEventListener('pointerup', move, true);
      block.addEventListener('pointercancel', cancel, true);
      block.addEventListener('click', tap, true);
      tapCleanups.set(block, () => {
        block.removeEventListener('pointerdown', start, true);
        block.removeEventListener('pointermove', move, true);
        block.removeEventListener('pointerup', move, true);
        block.removeEventListener('pointercancel', cancel, true);
        block.removeEventListener('click', tap, true);
      });
    }
  };

  const sync = (): void => {
    if (mobile.matches) blocks.forEach(addButton);
    else {
      tapCleanups.forEach((cleanup) => cleanup());
      tapCleanups.clear();
      buttons.forEach((button) => button.remove());
      buttons.clear();
    }
  };

  sync();
  mobile.addEventListener('change', sync);

  return () => {
    tapCleanups.forEach((cleanup) => cleanup());
    tapCleanups.clear();
    mobile.removeEventListener('change', sync);
    buttons.forEach((button) => button.remove());
    buttons.clear();
  };
}
