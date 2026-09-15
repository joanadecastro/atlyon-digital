interface ScrollLockSnapshot {
  scrollX: number;
  scrollY: number;
  rootOverflow: string;
  rootOverscrollBehavior: string;
  bodyPosition: string;
  bodyTop: string;
  bodyRight: string;
  bodyLeft: string;
  bodyWidth: string;
  bodyOverflow: string;
  bodyOverscrollBehavior: string;
  bodyPaddingRight: string;
}

const owners = new Set<object>();
let snapshot: ScrollLockSnapshot | null = null;

export function lockCaseLightboxScroll(owner: object): void {
  if (owners.has(owner)) return;
  owners.add(owner);
  if (snapshot || typeof document === 'undefined') return;

  const root = document.documentElement;
  const body = document.body;
  const scrollbarWidth = Math.max(0, window.innerWidth - root.clientWidth);
  const computedPaddingRight = Number.parseFloat(getComputedStyle(body).paddingRight) || 0;
  snapshot = {
    scrollX: window.scrollX,
    scrollY: window.scrollY,
    rootOverflow: root.style.overflow,
    rootOverscrollBehavior: root.style.overscrollBehavior,
    bodyPosition: body.style.position,
    bodyTop: body.style.top,
    bodyRight: body.style.right,
    bodyLeft: body.style.left,
    bodyWidth: body.style.width,
    bodyOverflow: body.style.overflow,
    bodyOverscrollBehavior: body.style.overscrollBehavior,
    bodyPaddingRight: body.style.paddingRight,
  };

  root.style.overflow = 'hidden';
  root.style.overscrollBehavior = 'none';
  body.style.position = 'fixed';
  body.style.top = `${-snapshot.scrollY}px`;
  body.style.right = '0';
  body.style.left = `${-snapshot.scrollX}px`;
  body.style.width = 'auto';
  body.style.overflow = 'hidden';
  body.style.overscrollBehavior = 'none';
  if (scrollbarWidth > 0) body.style.paddingRight = `${computedPaddingRight + scrollbarWidth}px`;
}

export function unlockCaseLightboxScroll(owner: object, restorePosition = true): void {
  if (!owners.delete(owner) || owners.size || !snapshot || typeof document === 'undefined') return;

  const saved = snapshot;
  snapshot = null;
  const root = document.documentElement;
  const body = document.body;
  root.style.overflow = saved.rootOverflow;
  root.style.overscrollBehavior = saved.rootOverscrollBehavior;
  body.style.position = saved.bodyPosition;
  body.style.top = saved.bodyTop;
  body.style.right = saved.bodyRight;
  body.style.left = saved.bodyLeft;
  body.style.width = saved.bodyWidth;
  body.style.overflow = saved.bodyOverflow;
  body.style.overscrollBehavior = saved.bodyOverscrollBehavior;
  body.style.paddingRight = saved.bodyPaddingRight;
  if (restorePosition) window.scrollTo(saved.scrollX, saved.scrollY);
}
