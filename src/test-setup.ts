type MediaQueryListener = (event: MediaQueryListEvent) => void;

if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string): MediaQueryList => {
      const legacyListeners = new Set<MediaQueryListener>();
      const eventListeners = new Set<EventListenerOrEventListenerObject>();

      const mediaQueryList = {
        matches: false,
        media: query,
        onchange: null,
        addListener: (listener: MediaQueryListener) => legacyListeners.add(listener),
        removeListener: (listener: MediaQueryListener) => legacyListeners.delete(listener),
        addEventListener: (_type: 'change', listener: EventListenerOrEventListenerObject) => {
          eventListeners.add(listener);
        },
        removeEventListener: (_type: 'change', listener: EventListenerOrEventListenerObject) => {
          eventListeners.delete(listener);
        },
        dispatchEvent: (event: Event) => {
          const mediaEvent = event as MediaQueryListEvent;
          legacyListeners.forEach((listener) => listener.call(mediaQueryList, mediaEvent));
          eventListeners.forEach((listener) => {
            if (typeof listener === 'function') listener.call(mediaQueryList, event);
            else listener.handleEvent(event);
          });
          mediaQueryList.onchange?.call(mediaQueryList, mediaEvent);
          return !event.defaultPrevented;
        },
      } as MediaQueryList;

      return mediaQueryList;
    },
  });
}

if (typeof globalThis.IntersectionObserver === 'undefined') {
  class TestIntersectionObserver implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin = '0px';
    readonly thresholds = [0];

    constructor(
      _callback: IntersectionObserverCallback,
      _options?: IntersectionObserverInit,
    ) {}

    disconnect(): void {}
    observe(_target: Element): void {}
    unobserve(_target: Element): void {}
    takeRecords(): IntersectionObserverEntry[] { return []; }
  }

  Object.defineProperty(globalThis, 'IntersectionObserver', {
    configurable: true,
    writable: true,
    value: TestIntersectionObserver,
  });
}
