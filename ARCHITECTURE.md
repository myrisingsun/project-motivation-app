# Architecture

## Directory Structure

```
src/
├── App.jsx              # Shell: ToastProvider wrap, Tabs nav, state, auto-save (500ms debounce)
├── main.jsx             # React entry point
├── index.css            # Tailwind v4 directives + @media print styles
│
├── components/
│   └── ui/              # coss ui component files (do not edit manually)
│       ├── accordion.jsx
│       ├── alert.jsx
│       ├── alert-dialog.jsx
│       ├── badge.jsx
│       ├── button.jsx
│       ├── card.jsx
│       ├── checkbox.jsx
│       ├── dialog.jsx
│       ├── fieldset.jsx
│       ├── input.jsx
│       ├── label.jsx
│       ├── number-field.jsx
│       ├── radio-group.jsx
│       ├── select.jsx
│       ├── separator.jsx
│       ├── switch.jsx
│       ├── table.jsx
│       ├── tabs.jsx
│       ├── toast.jsx
│       └── tooltip.jsx
│
├── data/
│   ├── constants.js     # ROLES, ABC_GRADES, STD_MILESTONES, SCALE, getProjectColor()
│   └── defaults.js      # Default data: employees, projects, participation, settings
│
├── hooks/
│   └── use-media-query.js
│
├── lib/
│   └── utils.js         # cn() helper (clsx + tailwind-merge)
│
├── pages/               # One file per tab — all receive full ctx from App.jsx
│   ├── DashboardPage.jsx    # Recharts: PieChart (fund), BarChart (quarters + ceiling)
│   ├── EmployeesPage.jsx    # Employee table, Excel import, ABC badges
│   ├── ProjectsPage.jsx     # Project cards with checkpoint tables
│   ├── ParticipationPage.jsx# Grouped by project, checkpoint filter pills
│   ├── ResultsPage.jsx      # Calc results, payout schedule, employee summary, export
│   └── SettingsPage.jsx     # Accordion sections, RadioGroup formula, Switch toggles, NumberField coeffs
│
└── utils/
    ├── calculations.js  # calculateAll(), getEmpProjectCounts(), getProjectCeiling(), isNewcomer()
    ├── excelIO.js       # importEmployeesFromExcel(), exportToExcel() via SheetJS
    └── helpers.js       # generateId(), number formatting
```

## State Management

All application state lives in `App.jsx` via `useState`. No external state library.

```
employees[]  projects[]  participation[]  settings{}
      └─────────────────────────┴──────── calcData (useMemo → calculateAll)
                                           empProjCount (useMemo)
```

State is passed down as props to every page. CRUD helpers are memoized in a `crud` object and
spread onto each page via `{...ctx}`.

**Auto-save**: a `useEffect` with 500ms debounce writes to `localStorage` on every state change.

## components/ui/ — coss ui Layer

All UI primitives come from **coss ui**, built on **@base-ui/react**. Key patterns:

### Naming conventions
- `*Popup` — the floating/overlay content (Dialog, Select, Tooltip, etc.)
- `*Panel` — the scrollable body section inside a popup or card
- `*Trigger` — the element that opens an overlay; uses `render={<Button />}` composition
- `*Close` — closes the parent overlay; also uses `render` prop for custom buttons

### Controlled vs uncontrolled
- Overlays (Dialog, AlertDialog): use `open` + `onOpenChange` when the trigger is detached
  (e.g., triggered by an async operation like file import)
- Tabs: `value` + `onValueChange` — always controlled (state in App.jsx)
- NumberField: `value` + `onValueChange`
- Switch: `checked` + `onCheckedChange`
- RadioGroup: `value` + `onValueChange`

### Toast setup
`ToastProvider` + `AnchoredToastProvider` wrap the entire app in `App.jsx`.
Toasts are fired imperatively: `toastManager.add({ title, description, variant })`.

### Inline style policy
Keep `style={{}}` only for **dynamic data-driven values** that cannot be expressed as static
Tailwind classes — project colors from `getProjectColor()`, coefficient colors, chart colors.
All layout, spacing, typography, and static colors → Tailwind className.

## Two Formula Modes

Controlled by `settings.formulaMode` ('multiplier' | 'component').

**Multiplier**: `Bonus = Ceiling × CPWeight × ParticipationCoeff × AbcCoeff`

**Component**: `Bonus = Ceiling × (Milestones×W1 + Budget×W2 + ABC×W3) / 100`
(W1+W2+W3 must equal 100; Budget goes through `SCALE` lookup table)

## Data Flow: Calculations

```
employees + projects + participation + settings
        ↓
   calculateAll()  →  { results[], empTotals{}, projTotals{}, grandTotal, resultsByProj{} }
        ↓
   ResultsPage (tables) + DashboardPage (charts)
```
