# Tech Stack

## Core

| Layer | Library | Notes |
|-------|---------|-------|
| UI framework | React 18 | Hooks, functional components only |
| Build tool | Vite 6 | Dev server + production build (`dist/`) |
| Styling | Tailwind CSS v4 | Utility-first; config via CSS, no `tailwind.config.js` |

## Component Library

| Package | Role |
|---------|------|
| **coss ui** | Styled component library with shadcn-like DX. Installed per-component via `npx shadcn@latest add @coss/<name>`. |
| **@base-ui/react** | Headless primitives powering coss ui — handles accessibility, keyboard nav, focus management, ARIA. |

### coss ui components in use

`Accordion` · `Alert` · `AlertDialog` · `Badge` · `Button` · `Card` · `Checkbox` · `Dialog` ·
`Fieldset` · `Input` · `Label` · `NumberField` · `RadioGroup` · `Select` · `Separator` ·
`Switch` · `Table` · `Tabs` · `Toast` · `Tooltip`

Component source files live in `src/components/ui/`. Each is a thin styled wrapper around a
Base UI primitive. **Do not edit these files directly** — re-add via CLI to pick up updates.

## Data & Visualization

| Package | Role |
|---------|------|
| **recharts** | `BarChart`, `PieChart`, `ResponsiveContainer` — used in DashboardPage |
| **xlsx (SheetJS)** | Excel import (employees) and full report export — see `src/utils/excelIO.js` |
| **lucide-react** | Icon set — used inside coss triggers, page headers, alert icons |
