---
name: Kinetic Emerald
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#bbcabe'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#869489'
  outline-variant: '#3d4a41'
  surface-tint: '#4fdf9b'
  primary: '#4fdf9b'
  on-primary: '#003821'
  primary-container: '#26c281'
  on-primary-container: '#00492d'
  inverse-primary: '#006c44'
  secondary: '#c8c6c5'
  on-secondary: '#313030'
  secondary-container: '#4a4949'
  on-secondary-container: '#bab8b7'
  tertiary: '#c6c6c6'
  on-tertiary: '#2f3131'
  tertiary-container: '#aaabab'
  on-tertiary-container: '#3e3f40'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#6ffcb5'
  primary-fixed-dim: '#4fdf9b'
  on-primary-fixed: '#002112'
  on-primary-fixed-variant: '#005233'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474646'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c6'
  on-tertiary-fixed: '#1a1c1c'
  on-tertiary-fixed-variant: '#454747'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
  emerald-glow: rgba(38, 194, 129, 0.1)
  surface-glass: rgba(28, 28, 28, 0.4)
  border-white-low: rgba(255, 255, 255, 0.05)
  status-error: '#FF4B4B'
  status-warning: '#FFB800'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 12px
    letterSpacing: 0.1em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base-unit: 4px
  gutter: 20px
  container-padding-sm: 16px
  container-padding-md: 24px
  max-content-width: 1440px
  section-gap: 96px
---

## Brand & Style

**Kinetic Emerald** is a design system that bridges industrial precision with high-tech performance. It is designed for marketing and sales consultancies that operate with mathematical accuracy.

The visual style is a hybrid of **Modern Corporate** and **Glassmorphism**, set against a deep "Chiaroscuro" backdrop. It utilizes high-contrast emerald accents to symbolize growth and energy, while the structural elements rely on tactile textures like brushed metal, glass, and dark graphite to evoke a sense of authority and "industrial-grade" intelligence. The emotional response should be one of sophisticated reliability—a tool for professionals who value data-driven results over decorative fluff.

## Colors

The palette is anchored by **Deep Graphite (#131313)** and an abyssal background **(#0A0A0A)**. The primary brand color, **Emerald Green (#26C281)**, is used strategically for emphasis, call-to-actions, and "kinetic" highlights. 

**High Contrast Gray (#E0E0E0)** is reserved for primary typography to ensure maximum legibility against dark surfaces. Secondary information uses a muted variant to create a clear hierarchy. A specialized "surface-glass" utility is used for card backgrounds to maintain depth without sacrificing the dark aesthetic.

## Typography

The typography system uses **Plus Jakarta Sans** for both headlines and body text to maintain a modern, geometric feel. It provides a clean, technical appearance that works well for dashboards and reports.

**Inter** is utilized as a secondary functional font for labels and small UI metadata, where its high x-height and utilitarian nature improve readability at small scales. Tracking is increased on uppercase labels (Label MD/SM) to enhance the "industrial tag" aesthetic.

## Layout & Spacing

The system follows a **Fixed Grid** philosophy for desktop layouts, centering content within a 1440px container. A **12-column bento-grid** system is used for dashboard and content modules, with a standard 20px gutter.

Vertical rhythm is expansive (96px/24rem between major sections) to allow the high-contrast elements room to breathe. On mobile, the layout reflows to a single column with 16px side margins, while the header remains sticky to provide constant navigation access.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** combined with **Glassmorphism**. 

1.  **Level 0 (Background):** Deep black (#0A0A0A) with subtle radial emerald gradients (5% opacity) to create atmospheric depth.
2.  **Level 1 (Cards):** Glass-morphic surfaces using 40% opacity graphite with a 12px backdrop blur.
3.  **Level 2 (Active/Hover):** Increased surface lightness or the addition of an "Emerald Glow" (box-shadow: 0 0 30px rgba(38, 194, 129, 0.1)).

Borders are critical for structure; use ultra-thin (1px) white borders at 5% opacity to define card boundaries without visual clutter.

## Shapes

The shape language is **Refined and Rounded**. Standard containers and glass cards use a 1rem (16px) radius to soften the industrial aesthetic. 

Interactive elements like buttons and "Manual Version" tags use a **Pill-shaped (Full)** radius, creating a distinct visual contrast between structural containers and actionable items. The "Accent Border" (3px solid emerald top-border) is used on primary content blocks to ground the floating glass cards.

## Components

### Buttons
- **Primary:** Pill-shaped, Emerald Green background, Deep Graphite text. Bold weight. Hover state: 80% opacity.
- **Secondary/Ghost:** Transparent with 1px border at 10% white opacity. Pill-shaped.

### Glass Cards (Bento Boxes)
The primary layout component. Features a subtle `backdrop-filter: blur(12px)`, a 1px `border-white-low`, and an optional `accent-border` on the top edge for high-priority items.

### Icons
Use **Material Symbols Outlined**. Icons should be placed in circular containers with 10% emerald opacity backgrounds to make them appear as "technical components."

### Input Fields & Chips
Inputs should mirror the glass-card style: dark, semi-transparent backgrounds with thin borders. Chips/Tags use the `label-sm` typography, all-caps, with high letter spacing to resemble industrial serial numbers.