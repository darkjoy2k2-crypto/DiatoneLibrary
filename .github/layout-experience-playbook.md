# Responsive Layout Experience Playbook

This document captures the validated layout concept from Diatone Library and is intended as a reusable blueprint for future web projects.

## 1. Core Strategy

- Do not rely on viewport width alone for device behavior.
- Use runtime device classification plus orientation classes on `body`.
- Keep phone-specific behavior isolated from tablet/desktop behavior.
- Drive critical header behavior with explicit layout scenarios, not implicit wrapping.

## 2. Device Classification Model

### Runtime classes

Set and update these classes on each resize/orientation change:

- `device-phone`
- `device-tablet`
- `device-desktop`
- `orientation-portrait`
- `orientation-landscape`

### Important rule

Detect phone by shortest side, not only by current width.

Reason:

- Prevents phones in landscape from being misclassified as tablet.
- Stabilizes layout behavior when rotating portrait <-> landscape.

## 3. Header Layout Concept

### Phone portrait

Preferred default:

- Row 1: `logo + playback + zoom + fullscreen + menu`
- Row 2: `category + song`

Fallback split mode (only if row 1 does not fit):

- Row 1: `logo + menu`
- Row 2: `playback + zoom + fullscreen`
- Row 3: `category + song`

### Phone landscape

Always enforce:

- Row 1: `logo + function buttons (left) + menu (right)`
- Row 2: `category + song`

### Tablet/Desktop

- Keep standard responsive flow with dedicated breakpoints.
- Do not let phone-specific overrides leak into tablet/desktop selectors.

## 4. Split Decision Logic (Phone Portrait)

Do not detect split by visual row offsets only.

Use measured width fit:

- `availableWidth = header.clientWidth - paddings`
- `requiredWidth = logo + playback + zoom + fullscreen + menu + gaps`
- Enable split only when `requiredWidth > availableWidth`

Benefit:

- Deterministic, rotation-safe behavior.
- Avoids false wraps due to transient rendering or tolerance heuristics.

## 5. Header Hide/Show + Main Window Centering

### Hide behavior

Header hide class:

- `#header.is-hidden { max-height: 0; padding: 0; border-bottom: 0; opacity: 0; pointer-events: none; }`

### Critical specificity lesson

If orientation/device-specific selectors set `#header` max-height/padding, ensure hide rule is stronger for phone too, e.g.:

- `body.device-phone #header.is-hidden { ... }`

Reason:

- Otherwise header may be visually hidden but still consume vertical space.
- Main content then fails to expand/center correctly.

## 6. Scroll Model and Re-Show Logic

### Scroll source selection

When computing current scroll position for header auto-hide:

- Include only visible views (`display != none`).
- Exclude hidden views from scroll aggregation.

Reason:

- Hidden views can retain stale large scrollTop values.
- This can keep header permanently hidden after view switches.

### View switch reset

On each view change:

- Reset header scroll state (`prevY`, lock state, timer).
- Force remove `is-hidden` from header.
- Then continue normal scroll-driven hide/show.

## 7. Validated View Set Integration

Header scroll/hide listeners and visible-scroll calculations must include all app views:

- welcome
- tablature
- inventory
- generator
- help

Any new future view must be added to both:

- listener attachment list
- visible-scroll calculation list

## 8. Reusable Implementation Checklist

1. Add runtime device/orientation classes to `body`.
2. Use shortest-side logic for phone detection.
3. Implement explicit phone portrait and phone landscape header grids.
4. Keep song/category controls explicitly assigned to lower row where required.
5. Implement measured split decision for phone portrait.
6. Enforce high-specificity `is-hidden` rule when device-specific header rules exist.
7. Aggregate scrollTop only from visible views.
8. Reset header state on each view switch.
9. Include every app view in hide/show listener wiring.
10. Re-test all combinations:
   - phone portrait
   - phone landscape
   - tablet portrait
   - tablet landscape
   - desktop/browser

## 9. Known Anti-Patterns to Avoid

- Width-only device logic.
- Implicit flex-wrap assumptions for critical header order.
- Mixed selector specificity where hidden state loses against device rules.
- Scroll aggregation over hidden containers.
- Adding a new view without updating header-scroll integration.

## 10. Practical Outcome

This concept was validated as stable on:

- smartphone portrait + landscape
- tablet portrait + landscape
- desktop/browser

It provides predictable header ordering, reliable hide/show behavior, and correct main-window centering when header space is released.
