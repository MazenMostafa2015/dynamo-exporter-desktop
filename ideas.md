# Dynamo Exporter Documentation Website - Design Guide

## Design Philosophy: Technical Clarity with Modern Elegance

This documentation website combines **professional technical clarity** with **modern, approachable design**. The goal is to make complex technical concepts accessible while maintaining credibility through polished, intentional design.

## Core Design Principles

1. **Information Hierarchy**: Clear visual distinction between sections, subsections, and content types (code, text, tables)
2. **Progressive Disclosure**: Sidebar navigation reveals related topics without overwhelming the user
3. **Functional Whitespace**: Generous spacing creates breathing room and guides the eye
4. **Semantic Color**: Blue/indigo palette signals technical/professional content; accent colors highlight interactive elements
5. **Readable Typography**: Large, clear headings paired with comfortable body text for extended reading

## Color Philosophy

- **Primary Blue** (`oklch(0.623 0.214 259.815)`): Trust, professionalism, technical depth
- **Slate Grays** (50-900): Neutral hierarchy, text contrast, subtle backgrounds
- **Accent Colors**: Green for code, red for errors, amber for warnings (semantic meaning)
- **Background**: Soft gradient from slate-50 to blue-50 creates visual interest without distraction

## Layout Paradigm

### Home Page
- **Hero Section**: Large, bold headline with gradient accent + descriptive copy
- **Feature Cards**: Three equal-width cards highlighting core benefits
- **Quick Start**: Numbered steps with visual connectors showing progression
- **CTA Section**: Gradient background with contrasting white button

### Documentation Page
- **Sticky Header**: Branding + navigation, stays visible while scrolling
- **Three-Column Layout**: 
  - Left: Section navigation (sticky, always visible)
  - Center: Main content area with subsection tabs
  - Right: Empty space for future enhancements (mobile-hidden)
- **Subsection Navigation**: Horizontal tabs within main content
- **Footer**: Three-column resource links + copyright

## Signature Elements

1. **Gradient Logo Badge**: Blue-to-indigo gradient with lightning bolt icon in header
2. **Section Cards with Icons**: Each documentation section has a unique emoji icon + description
3. **Code Blocks with Language Tags**: Syntax-highlighted code with copy button and language label
4. **Interactive Subsection Tabs**: Smooth transitions between related content
5. **Numbered Quick Start Steps**: Visual progression with connecting lines (desktop only)

## Interaction Philosophy

- **Hover States**: Subtle color shifts and shadows on interactive elements
- **Active States**: Bold blue highlight for current section/subsection
- **Copy Button**: Icon changes to checkmark with success color on click
- **Navigation**: Smooth transitions between pages and sections
- **Responsive**: Mobile-friendly with stacked layout on small screens

## Animation Guidelines

- **Transitions**: 150-200ms ease-out for hover states
- **Page Changes**: Instant (no page load animations)
- **Button Press**: 100ms scale(0.97) for tactile feedback
- **No Entrance Animations**: Content loads immediately, no fade-ins or slides
- **Respect prefers-reduced-motion**: All animations gated behind media query

## Typography System

### Font Pairings
- **Headings**: System font stack (sans-serif) with bold weight (600-700)
- **Body**: System font stack (sans-serif) with regular weight (400)
- **Code**: Monospace font (Monaco, Courier New, monospace)

### Hierarchy
- **H1** (Hero/Page Title): 48px, bold, gradient accent
- **H2** (Section Title): 32px, bold, slate-900
- **H3** (Subsection Title): 24px, bold, slate-900
- **H4** (Card/Feature Title): 18px, semibold, slate-900
- **Body**: 16px, regular, slate-700
- **Small/Caption**: 14px, regular, slate-600
- **Code**: 14px, monospace, syntax-highlighted

## Brand Essence

**One-line positioning**: A professional technical reference guide that transforms complex Dynamo concepts into clear, actionable knowledge.

**Personality adjectives**: 
1. **Precise** - Every detail matters; no ambiguity
2. **Approachable** - Technical depth without gatekeeping
3. **Crafted** - Intentional design, not generic templates

## Brand Voice

**Headlines**: Direct, benefit-focused, no filler
- ✅ "Generate Valid Dynamo Graphs Instantly"
- ❌ "Welcome to our documentation"

**CTAs**: Action-oriented, specific
- ✅ "Explore Docs" / "View Full Documentation"
- ❌ "Get Started" / "Learn More"

**Microcopy**: Clear, technical, helpful
- ✅ "Copy to clipboard" / "Exports to valid `.dyn` file"
- ❌ "Click here" / "Success!"

## Logo & Branding

**Logo**: Lightning bolt icon in gradient blue-to-indigo, 32px on header, 48px on hero
- Symbolizes: Speed, power, technical capability
- Style: Bold, geometric, modern
- Usage: Always paired with "Dynamo Exporter" text on home page; standalone in header

**Favicon**: Lightning bolt icon, 16x16 SVG

**Signature Brand Color**: Blue (`oklch(0.623 0.214 259.815)`)

## Visual Assets

- **Hero Background**: Soft gradient from slate-50 to blue-50 (no imagery)
- **Feature Icons**: Lucide React icons (Code2, Zap, BookOpen, etc.)
- **Code Blocks**: Syntax highlighting with language-specific colors
- **Diagrams**: None currently; can add architecture diagrams in future

## Responsive Design

- **Desktop** (1024px+): Three-column layout, full navigation
- **Tablet** (768-1023px): Two-column layout, collapsible sidebar
- **Mobile** (<768px): Single column, hamburger nav (future enhancement)

## Accessibility

- **Color Contrast**: All text meets WCAG AA standards (4.5:1 minimum)
- **Focus Rings**: Visible outline on all interactive elements
- **Keyboard Navigation**: Full keyboard support for all interactions
- **Semantic HTML**: Proper heading hierarchy, alt text for icons
- **Motion**: All animations respect `prefers-reduced-motion`

## Style Decisions

- Rounded corners: 0.5rem (8px) for consistency
- Box shadows: Subtle (0 1px 3px rgba(0,0,0,0.1)) for depth
- Borders: 1-2px solid with slate-200 for definition
- Spacing: 4px base unit (4, 8, 12, 16, 24, 32, 48, 64px)
- Max-width: 1280px for content container
