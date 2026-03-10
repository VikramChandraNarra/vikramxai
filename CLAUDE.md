# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server at localhost:3000
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

There are no tests configured yet.

## Architecture

This is a **Next.js 16 App Router** project with **React 19**, **TypeScript**, and **Tailwind CSS v4**.

- `src/app/layout.tsx` — Root layout; loads Geist Sans and Geist Mono via `next/font/google`, applies them as CSS variables
- `src/app/page.tsx` — Home page (the entry point to build from)
- `src/app/globals.css` — Global styles with Tailwind v4 directives

### Key conventions
- Tailwind v4 (PostCSS plugin via `@tailwindcss/postcss`) — no `tailwind.config.js`; configuration lives in CSS
- ESLint 9 flat config (`eslint.config.mjs`) using `eslint-config-next` core-web-vitals + TypeScript rules
- `react-icons` is available as the icon library dependency
