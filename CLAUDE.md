# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm run dev      # Start development server at localhost:3000
npm run build    # Production build
npm run lint     # Run ESLint
npm start        # Start production server
```

## Architecture

This is a Next.js 16 application using the App Router with React 19 and TypeScript.

### Tech Stack
- **Framework**: Next.js 16 with App Router (React Server Components enabled)
- **Styling**: Tailwind CSS v4 with CSS variables for theming
- **UI Components**: shadcn/ui (new-york style) with Radix UI primitives
- **Icons**: Lucide React

### Project Structure
- `src/app/` - Next.js App Router pages and layouts
- `src/components/ui/` - shadcn/ui components
- `src/lib/utils.ts` - Utility functions including `cn()` for class merging

### Path Aliases
- `@/*` maps to `./src/*`

### Styling Conventions
- Uses CSS variables defined in `globals.css` for theming (light/dark mode)
- Colors use OKLCH color space
- Use `cn()` from `@/lib/utils` to merge Tailwind classes
- shadcn/ui components use class-variance-authority (cva) for variants

### Adding UI Components
Use shadcn CLI to add components (configured in `components.json`):
```bash
npx shadcn@latest add [component-name]
```
