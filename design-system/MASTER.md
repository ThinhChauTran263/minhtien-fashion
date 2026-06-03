# Minh Tien Fashion Design System

Product type: menswear e-commerce.
Style: minimalist luxury, quiet editorial, premium basics.
Stack: Next.js, React, Tailwind CSS.

## Principles

- Use a restrained neutral palette with a warm gold accent for premium moments.
- Prioritize product imagery, whitespace, clear hierarchy, and dense but calm commerce flows.
- Keep cards, controls, and panels at 8-12px radius; avoid oversized decorative blobs or one-note color washes.
- Motion should be subtle: fade, slide-up, small lift, and active press states under 300ms for controls.
- Text must stay readable on mobile; do not use viewport-scaled font sizing.
- Focus states must be visible; buttons and inputs must have hover, focus, disabled, and active states.

## Tokens

- Primary: neutral black scale from `#fafafa` to `#0a0a0a`.
- Accent: muted luxury gold from `#fefce8` to `#854d0e`.
- Surface: white, secondary `#fafafa`, tertiary `#f5f5f5`.
- Body font: Inter.
- Display font: Playfair Display for editorial headings.
- Container: max 1280px with responsive horizontal padding.
- Buttons: medium radius, active scale, visible focus ring.
- Cards: light border/shadow with hover lift.

## Anti-Patterns

- Avoid gradients as the main visual language.
- Avoid purple/blue-dominant SaaS styling.
- Avoid nested cards and decorative floating blobs.
- Avoid tiny low-contrast text or hover states that shift layout.
