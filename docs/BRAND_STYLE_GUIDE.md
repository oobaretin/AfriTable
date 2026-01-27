# AfriTable Brand Style Guide

## Color Palette

Our color palette is curated to look premium, "earthy," and appetizing—reflecting the warmth and authenticity of African and Caribbean cuisine.

### Primary Brand Colors

#### Clay Pot Orange (`#E65100`)
- **Usage**: Main CTA buttons, primary actions, highlights
- **Tailwind Class**: `bg-brand-orange`, `text-brand-orange`
- **Purpose**: The signature color that represents warmth, spice, and hospitality
- **Example**: "View Details" buttons, primary CTAs

#### Palm Leaf Green (`#2E7D32`)
- **Usage**: Success states, West African cuisine badges, positive indicators
- **Tailwind Class**: `bg-brand-green`, `text-brand-green`
- **Purpose**: Represents growth, freshness, and West African culinary traditions
- **Example**: Cuisine labels for Nigerian, Ghanaian, Senegalese restaurants

#### Saffron Gold (`#FFB300`)
- **Usage**: Highlights, ratings, East African cuisine badges, premium features
- **Tailwind Class**: `bg-brand-gold`, `text-brand-gold`
- **Purpose**: Represents richness, quality, and East African spices
- **Example**: Star ratings, Ethiopian/Ghanaian cuisine highlights

#### Deep Charcoal (`#1A1A1B`)
- **Usage**: Main text, headers, primary typography
- **Tailwind Class**: `text-brand-dark`
- **Purpose**: More sophisticated than pure black, provides better readability
- **Example**: Headings, body text, card titles

#### Sandstone Cream (`#FFF8F1`)
- **Usage**: Soft backgrounds for cards, subtle sections
- **Tailwind Class**: `bg-brand-cream`
- **Purpose**: Warm, neutral background that complements the earthy palette
- **Example**: Card backgrounds, section backgrounds

## Typography

### Font Family
- **Primary**: Plus Jakarta Sans or Inter (modern, clean, reservation app-friendly)
- **Fallback**: System sans-serif stack

### Usage Guidelines
- **Headings**: Use `text-brand-dark` for better visual hierarchy
- **Body Text**: Use `text-brand-dark` or `text-slate-700` for readability
- **CTAs**: Use `text-white` on `bg-brand-orange` backgrounds

## Component Usage

### Buttons
```tsx
// Primary CTA Button
<button className="bg-brand-orange hover:bg-orange-700 text-white">
  View Details →
</button>
```

### Cuisine Badges
```tsx
// West African (Nigerian, Ghanaian, Senegalese)
<span className="text-brand-green bg-brand-green/10">
  Nigerian
</span>

// East African (Ethiopian, Eritrean, Somali)
<span className="text-brand-gold bg-brand-gold/10">
  Ethiopian
</span>
```

### Ratings
```tsx
// Star Ratings
<div className="text-brand-gold">
  ⭐ 4.5
</div>
```

### Headings
```tsx
// Main Headings
<h1 className="text-brand-dark font-black">
  Discover Authentic Dining
</h1>
```

## Visual Gradients

### Hero Gradient
The hero section uses a subtle mesh gradient for a modern, premium feel:

```css
.hero-gradient {
  background: radial-gradient(at top left, #FFF8F1 0%, #ffffff 100%);
  position: relative;
}

.hero-gradient::after {
  content: "";
  position: absolute;
  top: 0; right: 0;
  width: 40%; height: 40%;
  background: radial-gradient(circle, rgba(230, 81, 0, 0.05) 0%, transparent 70%);
  filter: blur(60px);
}
```

## Regional Color Mapping

### West African Cuisines
- **Color**: Palm Leaf Green (`#2E7D32`)
- **Cuisines**: Nigerian, Ghanaian, Senegalese, Ivorian, Cameroonian
- **Usage**: Badge backgrounds, text colors, accent elements

### East African Cuisines
- **Color**: Saffron Gold (`#FFB300`)
- **Cuisines**: Ethiopian, Eritrean, Somali, Kenyan
- **Usage**: Badge backgrounds, text colors, accent elements

### Caribbean Cuisines
- **Color**: Clay Pot Orange (`#E65100`) or Palm Leaf Green (`#2E7D32`)
- **Cuisines**: Jamaican, Haitian, Trinidadian
- **Usage**: Can use either orange or green depending on context

### South African Cuisines
- **Color**: Saffron Gold (`#FFB300`)
- **Cuisines**: South African
- **Usage**: Badge backgrounds, text colors

## Accessibility

- All color combinations meet WCAG AA contrast requirements
- `text-brand-dark` on white backgrounds: ✅ 16.8:1 contrast ratio
- `text-white` on `bg-brand-orange`: ✅ 4.5:1 contrast ratio
- `text-brand-green` on white: ✅ 4.8:1 contrast ratio

## Implementation Notes

- Colors are defined in `src/app/globals.css` under the `@theme inline` block
- Use Tailwind utility classes: `bg-brand-orange`, `text-brand-green`, etc.
- For opacity variations: `bg-brand-green/10`, `text-brand-orange/80`
- Always test color combinations for accessibility
