# Project Motivation Calculator

HR-инструмент для расчёта проектной мотивации (бонусов) сотрудников.

## Quick Start

```bash
npm install
npm run dev
```

## Architecture

```
src/
├── App.jsx              # Main shell: header, nav tabs, state management, auto-save
├── main.jsx             # React entry point
├── index.css            # Tailwind directives + print styles
├── data/
│   ├── constants.js     # Roles, milestones, ABC grades, scale tables, colors
│   └── defaults.js      # Default data for employees, projects, participation, settings
├── hooks/
│   └── useStorage.js    # localStorage persistence, snapshots (versioning), change log
├── utils/
│   ├── calculations.js  # Calculation engine (both formula modes), ABC logic, newcomer detection
│   ├── excelIO.js       # SheetJS import/export (employees from Excel, full report to Excel)
│   └── helpers.js       # ID generator, number formatting
├── pages/               # One page per tab — THESE NEED IMPLEMENTATION
│   ├── DashboardPage    # Charts: fund distribution, project load, ceiling usage
│   ├── EmployeesPage    # Employee table with ABC, hire date, project count, fund total
│   ├── ProjectsPage     # Projects with checkpoints, weights, budget (component mode)
│   ├── ParticipationPage# Participation grouped by project, checkpoint filters
│   ├── ResultsPage      # Calculation results, payout schedule, employee summary, export
│   └── SettingsPage     # Formula mode toggle, limits, ABC coefficients, newcomer rules
└── components/          # Reusable UI components (create as needed)
```

## Key Concepts

### Two Formula Modes (switchable in Settings)

**Multiplier mode:**
```
Bonus = ProjectCeiling × CheckpointWeight × ParticipationCoeff × AbcCoeff
```

**Component mode:**
```
Bonus = ProjectCeiling × (Milestones×W1% + Budget×W2% + ABC×W3%) / 100
```
Where W1+W2+W3 = 100 (default 40/40/20), budget goes through scale table.

### Project Ceiling
- PM (role "A") and BA: full annual ceiling (salary × multiplier)
- S (functional executor): 1/3 of annual ceiling (ratio 2:1, functional vs project)

### ABC Rating
- Per employee per period (not per project)
- Grades: A=1.2, B+=1.1, B=1.0, B-=0, C=0
- Newcomers (tenure < threshold): separate coefficients (default: A/B+=1.0, rest=0)
- Newcomer detection: automatic from hire date

### Project Limit
- Default max 3 projects per employee
- Can be disabled globally or per employee (exceptions)
- Over-limit highlighted in red

### Checkpoint Weight Reference
- 10 standard milestones from PMI methodology
- Different weights per role (PM has "Project charter" 5% etc, BA/S don't)
- Stored in constants.js STD_MILESTONES

### Payout Schedule
- Toggle: quarterly (Q1-Q4) or annual
- Shows per-employee per-period breakdown

## State Management
- All state in App.jsx via useState
- Auto-saved to localStorage with 500ms debounce
- Props passed down to pages: employees, projects, participation, settings, calcData, empProjCount, crud functions

## What Needs Implementation (Priority Order)

### 1. Pages Migration
Each page stub in `src/pages/` needs to be implemented. The COMPLETE working logic exists in the reference file (the current calculator JSX artifact). Each page receives all data and CRUD functions as props.

**SettingsPage**: Formula mode toggle (multiplier/component), component weights editor, role weights reference table, project limit toggle + max + exceptions, ABC coefficients editor, newcomer toggle + threshold + coefficients.

**EmployeesPage**: Table with columns: name, role, salary, ceiling multiplier, project ceiling (auto), ABC grade select, ABC coeff (auto with newcomer badge), hire date, project count (with over-limit warning). Bottom: total project fund summary. Button: import from Excel, add employee.

**ProjectsPage**: Cards per project with: name, checkpoint table (name, weight%, planned days), weight sum validation. In component mode: budget + budget fact fields. Buttons: add project, add checkpoint.

**ParticipationPage**: Grouped by project. Per project: checkpoint filter pills, table with employee select, role (auto), checkpoint select, planned days (auto), actual days, coeff (auto + color), period, note. Button: add participation record.

**ResultsPage**: Per project: detail table grouped by employee with subtotals. Grand total. Payout schedule (quarterly/annual toggle). Employee summary with per-project breakdown, ceiling, remainder, status. Export button (Excel). Footer: formula explanation + warnings.

**DashboardPage**: Charts using Recharts — fund distribution pie by project, employee ceiling usage bar chart, quarterly payout bar chart.

### 2. Excel Import/Export
Import: `src/utils/excelIO.js` has `importEmployeesFromExcel()` — wire it to a file input on EmployeesPage.
Export: `exportToExcel()` — wire to button on ResultsPage.

### 3. Dashboard Charts
Use Recharts (already in dependencies): BarChart, PieChart, ResponsiveContainer.

### 4. Print/PDF
Add `@media print` styles. Add "Print" button that calls `window.print()`.

## Styling
- Tailwind CSS for layout and spacing
- Custom colors defined in tailwind.config.js
- Project colors from constants.js for visual grouping
- Use semantic color classes: text-green-600 for success, text-red-600 for danger

## Deployment
```bash
npm run build    # Output in dist/
# Deploy dist/ to Vercel, Netlify, or any static host
```

## Reference File
The complete working calculator logic (single-file version) is in the conversation history as `project_motivation_calculator.jsx`. It contains ALL the UI rendering, calculations, and interactions that need to be split across the page components.
