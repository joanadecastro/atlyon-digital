export function configureCaseVideo(video: HTMLVideoElement, autoplay: boolean): void {
  video.defaultMuted = true;
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.autoplay = autoplay;
  if (autoplay) video.setAttribute('autoplay', '');
  else video.removeAttribute('autoplay');
}

export function bindCaseViewportVideos(root: HTMLElement): () => void {
  const videos = Array.from(root.querySelectorAll<HTMLVideoElement>('video[data-case-viewport-video]'));
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let observer: IntersectionObserver | undefined;

  videos.forEach((video) => {
    configureCaseVideo(video, !reducedMotion);
    video.pause();
  });

  if (!reducedMotion && videos.length) {
    if (typeof IntersectionObserver === 'undefined') {
      videos.forEach((video) => void video.play().catch(() => undefined));
    } else {
      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const video = entry.target as HTMLVideoElement;
          if (entry.isIntersecting && entry.intersectionRatio >= .2) void video.play().catch(() => undefined);
          else video.pause();
        });
      }, { threshold: [0, .2, .5] });
      videos.forEach((video) => observer?.observe(video));
    }
  }

  return () => {
    observer?.disconnect();
    videos.forEach((video) => video.pause());
  };
}
