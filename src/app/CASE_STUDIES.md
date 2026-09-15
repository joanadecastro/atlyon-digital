# Shared case-study layout

Common structural changes apply to every case study, unless the request explicitly
identifies a project-specific exception. Civitas, LicitaNow and JUH reuse these
rules; future case studies should use the same contract.

- Import `project-case/_case-mobile.scss` and include `case-mobile.layout` after
  project styles. It includes the shared mobile hero. Keep desktop rules separate.
- Use `case-study-page` on the page, `case-hero` on the hero, and its `__surface`,
  `__inner`, `__copy`, `__screens`, `__stage` and `__screen` elements.
- Copy uses `case-hero__subtitle`, `__category`, `__description`, `__metadata` and
  `__technologies`. Screens use `case-hero__screen--rear` and `--front`.
- The existing `is-entered` hero hook starts the shared upward reveal. Reduced
  motion shows the final composition immediately.
- Mobile uses 14px gutters, shared typography/spacing, and a content-safe hero
  with the next white surface visible early. Do not position it from the chat.
- Preserve screen proportions and overlap. For portrait captures, use
  `case-hero__stage--portrait` with `--case-hero-screen-ratio` set to the original
  image dimensions. This is an asset-format variant, not a separate page layout.
- Keep project colours, assets and content in their own templates/styles.
- Write editorial headings in normal capitalization in templates and data. Use
  `case-study-section-title` or `case-study-mobile-section-title` for section
  titles; the global capitalization rule applies at every viewport width.
  Preserve uppercase labels, eyebrows, metadata and diagram labels.
- The shared selected-project shell in `app.html` owns contact controls: at up to
  768px hide the floating chat launcher and show the existing contact CTA after
  the case-study component. It opens the same chat. Do not duplicate this CTA in
  individual case studies. Desktop and landing chat controls remain unchanged.
- Validate 320, 375, 390, 430 and 768px, reduced motion, keyboard visibility and
  horizontal overflow; compare desktop geometry and animations before/after.
