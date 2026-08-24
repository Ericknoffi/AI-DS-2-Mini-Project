---
name: SentinelLog AI
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#bcc9cd'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#869397'
  outline-variant: '#3d494c'
  surface-tint: '#4cd7f6'
  primary: '#4cd7f6'
  on-primary: '#003640'
  primary-container: '#06b6d4'
  on-primary-container: '#00424f'
  inverse-primary: '#00687a'
  secondary: '#d0bcff'
  on-secondary: '#3c0091'
  secondary-container: '#571bc1'
  on-secondary-container: '#c4abff'
  tertiary: '#4edea3'
  on-tertiary: '#003824'
  tertiary-container: '#1bbd85'
  on-tertiary-container: '#00452e'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#acedff'
  primary-fixed-dim: '#4cd7f6'
  on-primary-fixed: '#001f26'
  on-primary-fixed-variant: '#004e5c'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#d0bcff'
  on-secondary-fixed: '#23005c'
  on-secondary-fixed-variant: '#5516be'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '450'
    lineHeight: 18px
  data-label:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  container-margin: 24px
  gutter: 16px
  stack-xs: 4px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style
The design system is engineered for high-stakes cybersecurity and Site Reliability Engineering (SRE) environments. The brand personality is authoritative, precise, and vigilantly proactive. It targets technical professionals who require rapid data synthesis and absolute clarity during critical incidents.

The aesthetic follows a **Refined Cyber-Glassmorphism** style. It utilizes deep obsidian surfaces to reduce eye strain during long shifts, layered with translucent panes that provide a sense of spatial hierarchy. The emotional response is one of controlled power—a sophisticated digital command center where AI-driven insights are visually distinguished from raw system telemetry through vibrant, neon-tinted accents.

## Colors
The palette is rooted in a deep-space obsidian base to maximize the contrast of functional status colors. 

- **Primary (Cyber Cyan):** Reserved for AI-driven insights, primary actions, and active selection states.
- **Secondary (Violet):** Used for advanced intelligence features, machine learning classifications, and deep-link discovery.
- **Functional Spectrum:** Emerald Green, Amber Gold, and Crimson are strictly functional, representing system health (Success, Warning, Danger). Use Crimson sparingly for high-severity alerts.
- **Neutrals:** Slate and Carbon tones form the structural skeleton, using varying levels of transparency to create depth without introducing new hues.

## Typography
The system employs a dual-font strategy to separate UI intent from technical data.

- **Inter** handles all interface copy, navigation, and headers. It is chosen for its exceptional legibility and neutral, professional tone.
- **JetBrains Mono** is mandatory for all technical outputs, including IP addresses, JSON logs, terminal outputs, and status codes. Its increased x-height and clear character distinction prevent errors in high-pressure debugging scenarios.
- **Scale:** Large display sizes should use tighter letter-spacing. Technical labels should use all-caps with slight tracking for maximum scanability at small sizes.

## Layout & Spacing
This design system utilizes a **strictly 4px-base grid** to ensure surgical precision in data-dense dashboards.

- **Grid:** A 12-column fluid grid is used for main dashboard layouts. For sidebars and telemetry panels, use fixed widths (280px - 320px) to maintain legibility of technical lists.
- **Density:** High-density layouts are preferred. SREs need to see more data at once; therefore, vertical spacing between list items should default to 8px.
- **Responsive:** On mobile devices, the 12-column grid collapses to a single column, and the horizontal container margin reduces from 24px to 16px.

## Elevation & Depth
Depth is expressed through **Backdrop Blurs** and **Tonal Layering** rather than traditional drop shadows.

- **Level 0 (Base):** The #090D16 background.
- **Level 1 (Panes):** Translucent cards using `backdrop-filter: blur(12px)` and a subtle 1px border (`#1E293B/80`). 
- **Level 2 (Popovers/Modals):** Increased blur (20px) and a subtle inner "rim light" glow—a 1px top border of `rgba(255,255,255,0.1)` to simulate light hitting the edge of a glass pane.
- **Status Glow:** High-priority alerts and AI insights may use a very soft `box-shadow` (20px-40px spread) using the status color at 15% opacity to create a "neon hum" effect.

## Shapes
The shape language is "Soft-Technical." Elements use a 4px (0.25rem) radius as the standard to maintain a crisp, engineered feel without the aggression of sharp corners.

- **Standard:** 4px (Buttons, Input fields, Chips).
- **Containers:** 8px (Cards, Modals, Sidebars).
- **Special:** AI-specific components may use slightly more rounded corners (12px) to differentiate "intelligent" suggestions from "standard" system data.

## Components
- **Buttons:** Primary buttons use a solid Cyber Cyan to Violet gradient. Secondary buttons are ghost-style with a subtle border that brightens on hover.
- **Status Indicators:** Use small circular "pips" with a CSS pulse animation for "Critical" or "Active" states.
- **Cards:** Must feature the translucent background and 1px subtle border. Title areas should have a subtle bottom divider.
- **Input Fields:** Use the #0F172A base with a subtle border. On focus, the border transitions to Primary Cyan with a 2px outer glow.
- **Technical Lists:** Use JetBrains Mono. Alternate row striping is achieved via subtle opacity changes (2% white overlay) rather than solid color shifts.
- **Chips:** Highly compact, utilizing the status colors for background tints (e.g., Warning chips have 10% Amber background with solid Amber text).
- **Log Viewer:** A specialized component using a blacker-than-base background, no borders between entries, and syntax highlighting for log levels (INFO, WARN, ERROR).