# AfriTable Brand Style Guide

## Color Palette

Our color palette is derived from the Sankofa logo—a symbol of learning from the past to build the future. These "Legacy" tones reflect the rich heritage and warmth of African and Caribbean cuisine.

### Primary Brand Colors (Sankofa Logo Palette)

#### Bronze (`#8C6239`)
- **Source**: Metallic brown/gold from the Sankofa text
- **Usage**: Primary text, headers, logo elements
- **Tailwind Class**: `bg-brand-bronze`, `text-brand-bronze`
- **Purpose**: Represents heritage, tradition, and the wisdom of ancestors
- **Example**: Main headings, logo text, premium accents

#### Muted Red (`#A33B32`)
- **Source**: Deep red from the bird's head in the Sankofa symbol
- **Usage**: Main CTA buttons, primary actions, highlights
- **Tailwind Class**: `bg-brand-mutedRed`, `text-brand-mutedRed`
- **Purpose**: Represents passion, warmth, and the heart of the community
- **Example**: "View Details" buttons, primary CTAs, important actions

#### Forest (`#2D5A27`)
- **Source**: Dark green from the wings of the Sankofa bird
- **Usage**: Success states, West African cuisine badges, positive indicators
- **Tailwind Class**: `bg-brand-forest`, `text-brand-forest`
- **Purpose**: Represents growth, nature, and West African culinary traditions
- **Example**: Cuisine labels for Nigerian, Ghanaian, Senegalese restaurants

#### Ochre (`#C69C2B`)
- **Source**: Gold/yellow from the tail of the Sankofa bird
- **Usage**: Highlights, ratings, East African cuisine badges, premium features
- **Tailwind Class**: `bg-brand-ochre`, `text-brand-ochre`
- **Purpose**: Represents richness, prosperity, and East African spices
- **Example**: Star ratings, Ethiopian/Eritrean cuisine highlights

#### Paper (`#F9F7F2`)
- **Source**: Textured off-white background inspired by traditional paper
- **Usage**: Soft backgrounds for cards, subtle sections
- **Tailwind Class**: `bg-brand-paper`
- **Purpose**: Warm, neutral background that complements the earthy palette
- **Example**: Card backgrounds, section backgrounds, subtle highlights

### Legacy Color Aliases

For backward compatibility, the following aliases map to the new Sankofa colors:
- `brand-orange` → `brand-mutedRed` (#A33B32)
- `brand-green` → `brand-forest` (#2D5A27)
- `brand-gold` → `brand-ochre` (#C69C2B)
- `brand-cream` → `brand-paper` (#F9F7F2)
- `brand-dark` → Deep Charcoal (#1A1A1B) - kept for text contrast

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
// Primary CTA Button (using mutedRed from Sankofa logo)
<button className="bg-brand-mutedRed hover:bg-brand-mutedRed/90 text-white">
  View Details →
</button>

// Alternative using legacy alias
<button className="bg-brand-orange hover:bg-brand-orange/90 text-white">
  View Details →
</button>
```

### Cuisine Badges
```tsx
// West African (Nigerian, Ghanaian, Senegalese) - using Forest green
<span className="text-brand-forest bg-brand-forest/10">
  Nigerian
</span>

// East African (Ethiopian, Eritrean, Somali) - using Ochre gold
<span className="text-brand-ochre bg-brand-ochre/10">
  Ethiopian
</span>
```

### Ratings
```tsx
// Star Ratings (using Ochre from Sankofa tail)
<div className="text-brand-ochre">
  ⭐ 4.5
</div>
```

### Headings
```tsx
// Main Headings (using Bronze from Sankofa text)
<h1 className="text-brand-bronze font-black">
  Discover Authentic Dining
</h1>

// Or use dark for high contrast
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
