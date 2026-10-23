---
name: Algorithmic Agronomy & Risk Report
colors:
  surface: '#fbf9f0'
  surface-dim: '#dcdad1'
  surface-bright: '#fbf9f0'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f4eb'
  surface-container: '#f0eee5'
  surface-container-high: '#eae8df'
  surface-container-highest: '#e4e3da'
  on-surface: '#1b1c17'
  on-surface-variant: '#434845'
  inverse-surface: '#30312b'
  inverse-on-surface: '#f3f1e8'
  outline: '#737875'
  outline-variant: '#c3c8c3'
  surface-tint: '#54615a'
  primary: '#13201a'
  on-primary: '#ffffff'
  primary-container: '#28352f'
  on-primary-container: '#8f9e96'
  inverse-primary: '#bbcac1'
  secondary: '#416659'
  on-secondary: '#ffffff'
  secondary-container: '#c0e8d8'
  on-secondary-container: '#456a5d'
  tertiary: '#152000'
  on-tertiary: '#ffffff'
  tertiary-container: '#273700'
  on-tertiary-container: '#8da25f'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d7e6dd'
  primary-fixed-dim: '#bbcac1'
  on-primary-fixed: '#111e19'
  on-primary-fixed-variant: '#3c4a43'
  secondary-fixed: '#c3ebdb'
  secondary-fixed-dim: '#a8cfc0'
  on-secondary-fixed: '#002118'
  on-secondary-fixed-variant: '#294d42'
  tertiary-fixed: '#d4eba1'
  tertiary-fixed-dim: '#b9cf87'
  on-tertiary-fixed: '#141f00'
  on-tertiary-fixed-variant: '#3b4d13'
  background: '#fbf9f0'
  on-background: '#1b1c17'
  surface-variant: '#e4e3da'
typography:
  display-lg:
    fontFamily: Space Grotesk
    fontSize: 3.5rem
    fontWeight: '600'
    lineHeight: 3.75rem
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 2.25rem
    fontWeight: '500'
    lineHeight: 2.5rem
    letterSpacing: -0.03em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 1.75rem
    fontWeight: '500'
    lineHeight: 2rem
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 1.5rem
    fontWeight: '500'
    lineHeight: 1.75rem
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 1.125rem
    fontWeight: '500'
    lineHeight: 1.375rem
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Source Serif 4
    fontSize: 1.125rem
    fontWeight: '400'
    lineHeight: 1.75rem
  body-md:
    fontFamily: Source Serif 4
    fontSize: 0.9375rem
    fontWeight: '400'
    lineHeight: 1.5rem
  body-sm:
    fontFamily: Source Serif 4
    fontSize: 0.8125rem
    fontWeight: '400'
    lineHeight: 1.25rem
  label-lg:
    fontFamily: Space Grotesk
    fontSize: 0.875rem
    fontWeight: '600'
    lineHeight: 1rem
    letterSpacing: 0.04em
  label-md:
    fontFamily: Space Grotesk
    fontSize: 0.75rem
    fontWeight: '500'
    lineHeight: 0.875rem
    letterSpacing: 0.06em
  label-sm:
    fontFamily: Space Grotesk
    fontSize: 0.6875rem
    fontWeight: '500'
    lineHeight: 0.75rem
    letterSpacing: 0.08em
  data-tabular-lg:
    fontFamily: Space Grotesk
    fontSize: 1.75rem
    fontWeight: '600'
    lineHeight: 2rem
    letterSpacing: -0.02em
  data-tabular-md:
    fontFamily: Space Grotesk
    fontSize: 0.9375rem
    fontWeight: '500'
    lineHeight: 1.125rem
    letterSpacing: 0.01em
spacing:
  gutter: 1rem
  gutter-md: 1.5rem
  gutter-lg: 2rem
  margin: 1rem
  margin-md: 2rem
  margin-lg: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
  space-2xl: 4rem
---

## Brand & Style

This design system establishes an intentional typographic and visual tension: the algorithmic, technical geometry of supply-chain forecasting colliding with the tactile, bookish gravitas of long-form investigative risk reporting. It is engineered for retail risk directors, inventory strategists, and supply chain analysts who manage volatile, perishable assets where timing dictates survival.

The design movement combines **Structural Brutalism** with **Analytical Editorial Journalism**. The aesthetic rejects standard software tropes—strictly prohibiting ambient blur, drop shadows, gradient buttons, and rounded forms. Every container is sharply delineated by raw physical hairline dividers. Surfaces behave like heavy archival ledger sheets and technical dispatch logs. Headlines employ an angular, monoline geometric grotesque to represent mathematical rigor, while narrative body copy and granular risk narratives rely on an authoritative, warm academic serif. The resulting interface feels calm, definitive, and indisputable.

## Colors

The palette references botanical shelf-life, paper stocks, and agricultural yields. 

- **Primary (`#28352F`)**: Used for primary text anchors, heavy data rules, and foreground authority.
- **Secondary (`#183D32`)**: A dense forest tone applied to primary command surfaces, active navigation anchors, and key operational toggles.
- **Tertiary / Positive (`#A8BE78`)**: Leaf green reserved exclusively for positive baseline projections, healthy buffer stock, and non-decay trajectories.
- **Neutral Canvas (`#F5F3EA`) & Card Surface (`#FAF9F5`)**: High-comfort, low-strain warm ivory background layers that reflect ink-on-stock legibility rather than digital screens.
- **Dividers (`#D8D3C5` and `#E2DED4`)**: 1px structural rules establishing tabular clarity without introducing visual noise.
- **Operational Signals**: Harvest Amber (`#D99A38`) denotes moderate surplus or velocity deceleration; Risk Red (`#B94F42`) indicates critical shelf-life degradation and margin-destruction thresholds.

Never wash entire containers in saturated background colors. Color must be applied with surgical restraint: thin vertical rules, exact data glyphs, status markers, and text emphasis.

## Typography

The type system implements an intentional split:
1. **Mathematical / Machine Structural Headers (`Space Grotesk`)**: All operational markers, section indicators, column keys, system statistics, and tabular numbers leverage the technical precision of Space Grotesk. Numeric data must enforce `font-variant-numeric: tabular-nums` to guarantee vertical column alignment across forecasting tables.
2. **Authoritative Editorial Content (`Source Serif 4`)**: All narrative intelligence reports, situational risk summaries, inventory audit notes, and contextual recommendations are rendered in Source Serif 4. This roots analytical interpretations in the cadence of formal research publications.

All labels (`label-lg`, `label-md`, `label-sm`) use uppercase text transformation with deliberate positive tracking to maximize glanceability across large display dashboards.

## Layout & Spacing

The layout is built upon an architectural grid with structural lines explicitly manifested via borders.

- **Desktop (1200px+)**: 12-column grid system with 2rem gutters and 3rem page margins. Multi-column inventory panes tile flush across hairline dividers rather than floating as separated modules.
- **Tablet (768px - 1199px)**: 8-column layout with 1.5rem gutters and 2rem outer boundaries. Primary metrics fold into balanced split pairs.
- **Mobile (< 768px)**: 4-column layout with 1rem gutters and 1rem canvas margin. Multi-point metrics collapse into vertically stacked ledgers.

Density is calibrated for high information velocity. Component interiors use strict multiples of 0.25rem (`space-xs` through `space-2xl`). Negative space is purposeful: dense around tabular data to maximize viewport yield, and expansive around executive intelligence briefs to facilitate focus.

## Elevation & Depth

This design system uses zero blur elevation. Box shadows, dropshadow filters, and simulated three-dimensional light sources are entirely prohibited.

Depth and spatial hierarchy are constructed through **crisp borders and planar surface layering**:
- **Layer 0 (Canvas Base)**: `#F5F3EA` serves as the bedrock environment.
- **Layer 1 (Card & Section Containers)**: `#FAF9F5` sits flush on Layer 0, separated purely by a `1px solid #D8D3C5` border.
- **Layer 2 (Overlays & Drawer Modals)**: Floats directly above with a high-contrast boundary: `2px solid #28352F`, accompanied by a solid, non-blurred offset projection (`box-shadow: 4px 4px 0px 0px #28352F`) when spatial segregation is mandatory.
- **Visual Weighting**: Rather than elevating components toward the viewer, emphasis is communicated through stroke weight variation (e.g., transitioning from a `1px solid #E2DED4` secondary divider to a `2px solid #183D32` focus boundary).

## Shapes

The geometric rule is absolute: **`0px` corner radius throughout the entire interface**. 

Every button, input field, chip, dropdown container, card boundary, and indicator glyph terminates in right angles (90 degrees). This reinforces the uncompromising, machine-readable nature of algorithmic distribution systems and preserves alignment with tabular cell boundaries. Curved lines belong exclusively to continuous data visualization paths (such as projected decay curves and demand trend lines).

## Components

### Buttons
- **Primary**: Background `#183D32`, text `#FAF9F5`, border `1px solid #183D32`, `0px` radius. Padding: `0.625rem 1.25rem`. Typography: `Space Grotesk`, uppercase, `label-md`. Hover: Background `#28352F`. Active: Offset inset outline.
- **Secondary / Operational**: Background `#FAF9F5`, text `#28352F`, border `1px solid #D8D3C5`. Hover: Background `#F5F3EA`, border `#28352F`.
- **Destructive**: Background transparent, text `#B94F42`, border `1px solid #B94F42`. Hover: Background `#B94F42`, text `#FAF9F5`.

### Chips & Stock Status Badges
- Displayed as rectangular metadata tags (`0px` radius, padding: `0.125rem 0.5rem`).
- **Optimal Status**: Border `1px solid #A8BE78`, background transparent, text `#183D32`.
- **Warning Surplus**: Border `1px solid #D99A38`, background transparent, text `#28352F`, flanked by a square glyph indicator.
- **Critical Spoilage**: Border `1px solid #B94F42`, background `#B94F42`, text `#FAF9F5`.

### Input Fields & Select Controls
- Background `#FAF9F5`, border `1px solid #D8D3C5`, text `#28352F`, `0px` radius. Font: `Space Grotesk`.
- Focus state: Border `1px solid #183D32`, no ambient glow.
- Helper & Validation text: Set in `Source Serif 4` at `body-sm`. Error states swap border to `1px solid #B94F42`.

### Checkboxes & Radio Selectors
- Rigid squares for checkboxes (`14px x 14px`, `0px` radius, `1px solid #28352F`). Checked state fills completely with `#183D32` with an inverted white check.
- Radios retain strict square-in-square geometry (`14px x 14px` outer square with a solid `6px` centered interior square when selected).

### Cards & Ledger Tables
- Cards use `#FAF9F5` background encased by `1px solid #D8D3C5`. Headers within cards terminate in a full-width bottom divider of `#E2DED4`.
- **Tables**: Built as continuous borders. Alternating rows remain unshaded; row divisions use `1px solid #E2DED4`. Hover on row highlights with `#F5F3EA`. Numeric cells align right using `Space Grotesk` tabular figures; categorical narrative descriptions align left in `Source Serif 4`.

### Intelligence Briefing Panels (Executive Narrative Block)
- A specialized component pairing a thick vertical lead border (`4px solid #183D32`) on an ivory block (`#FAF9F5`). Features a technical micro-header in `label-sm` (`Space Grotesk`) followed by narrative diagnostic text in `body-lg` (`Source Serif 4`) for algorithmic risk synthesis.