# AfriTable UI Style System (Checklist)

Use these conventions so the app stays consistent and “premium” over time.

## Layout
- **Container**: Wrap pages/sections with `Container` (`src/components/layout/Container.tsx`).
- **Sections**: Use `Section` (`src/components/layout/Section.tsx`) instead of ad-hoc `py-*` on each page.
- **Page headers**: Use `PageHeader` (`src/components/layout/PageHeader.tsx`) for title + subtitle + right-side controls.

## Spacing & rhythm
- **Default vertical rhythm**: `Section` uses `py-14 md:py-20`.
- Avoid mixing random paddings; prefer the presets/components above.

## Typography
- **Page titles**: `text-3xl md:text-4xl font-semibold tracking-tight`
- **Section titles**: `text-2xl md:text-3xl font-semibold tracking-tight`
- **Subtitles**: `text-muted-foreground`

## Components
- Use shadcn/ui primitives from `src/components/ui/*`.
- Create product-specific components in `src/components/*` (don’t modify primitives for product logic).
- Prefer variant-based styling (`cva`) over one-off Tailwind class sprawl.

## Accessibility
- Icon-only buttons must have `aria-label`.
- Keep `focus-visible` rings; don’t remove outlines.

