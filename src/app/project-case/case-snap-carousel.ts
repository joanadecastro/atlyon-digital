// Shared from LicitaNow's responsive implementation screenshot carousel.
export function nearestCaseSlide(rail: HTMLElement, slides: HTMLElement[]): number {
  const left = rail.getBoundingClientRect().left;
  return slides.reduce((nearest, slide, index) => {
    const distance = Math.abs(slide.getBoundingClientRect().left - left);
    return distance < nearest.distance ? { index, distance } : nearest;
  }, { index: 0, distance: Number.POSITIVE_INFINITY }).index;
}

export function scrollToCaseSlide(rail: HTMLElement, target: HTMLElement): void {
  const left = target.getBoundingClientRect().left - rail.getBoundingClientRect().left + rail.scrollLeft;
  rail.scrollTo({ left, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}
