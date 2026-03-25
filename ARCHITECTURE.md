# Архитектура приложения «Проектная мотивация»

## Стек

| Слой | Технология |
|------|-----------|
| UI | React 18 + Vite 6 |
| Стили | Tailwind CSS |
| Иконки | lucide-react |
| Графики | Recharts |
| Excel | SheetJS (xlsx) |
| Хранилище | localStorage (браузер) |

---

## Где хранятся данные

**Все данные хранятся в `localStorage` браузера.** Серверной части нет — приложение полностью клиентское (SPA).

### Ключи localStorage

| Ключ | Что хранит |
|------|-----------|
| `pm-calc-data` | Основное состояние: сотрудники, проекты, участие, настройки |
| `project-motivation-snapshots` | Снимки состояния (версионирование) |
| `project-motivation-log` | Журнал изменений (последние 200 записей) |

> **Важно:** данные привязаны к конкретному браузеру и домену. При очистке localStorage или другом браузере данные не сохранятся. Для переноса — экспорт в Excel.

### Структура `pm-calc-data`

```json
{
  "employees": [...],
  "projects": [...],
  "participation": [...],
  "settings": {...}
}
```

### Авто-сохранение

В `App.jsx` стоит debounce 500 мс: при любом изменении состояния данные сериализуются в JSON и записываются в `localStorage`.

```
Изменение состояния → useEffect → setTimeout 500ms → localStorage.setItem()
```

---

## Структура файлов

```
src/
├── App.jsx                # Оболочка: шапка, навигация, всё состояние, авто-сохранение
├── main.jsx               # Точка входа React
├── index.css              # Tailwind-директивы + стили для печати
│
├── data/
│   ├── constants.js       # Роли, вехи (STD_MILESTONES), оценки ABC,
│   │                      # таблица шкалы (SCALE), цвета проектов
│   └── defaults.js        # Начальные данные: 7 сотрудников, 3 проекта,
│                          # записи участия, настройки по умолчанию
│
├── hooks/
│   └── useStorage.js      # Утилиты localStorage: снимки, журнал изменений
│                          # (в App.jsx используется напрямую, не через этот хук)
│
├── utils/
│   ├── calculations.js    # Движок расчёта бонусов (оба режима формулы),
│   │                      # логика ABC, определение новичков
│   ├── excelIO.js         # Импорт сотрудников из Excel, экспорт отчёта
│   └── helpers.js         # generateId(), форматирование чисел
│
└── pages/                 # По одной странице на каждую вкладку
    ├── DashboardPage.jsx  # Графики: распределение фонда, загрузка, потолки
    ├── EmployeesPage.jsx  # Таблица сотрудников, импорт Excel
    ├── ProjectsPage.jsx   # Проекты, контрольные точки, веса
    ├── ParticipationPage.jsx # Участие по проектам и вехам
    ├── ResultsPage.jsx    # Результаты расчёта, график выплат, экспорт
    └── SettingsPage.jsx   # Режим формулы, лимиты, коэффициенты ABC
```

---

## Управление состоянием

Всё состояние живёт в `App.jsx` в четырёх `useState`:

```
employees[]       — сотрудники
projects[]        — проекты (вложены checkpoints[])
participation[]   — записи участия (связь сотрудник × проект × веха)
settings{}        — настройки приложения
```

Производные данные вычисляются через `useMemo` и **не хранятся**:

```
calcData       = calculateAll(employees, projects, participation, settings)
empProjCount   = getEmpProjectCounts(participation)
```

Все CRUD-функции собраны в объект `crud` и передаются страницам через props.

---

## Модели данных

### Сотрудник (Employee)
```js
{
  id: number,
  name: string,
  role: 'A' | 'BA' | 'S',        // PM | Бизнес-аналитик | Функц. исполнитель
  salary: number,                 // месячный оклад, ₽
  ceilingMultiplier: number,      // множитель для расчёта потолка (обычно 2)
  abcGrade: 'A'|'B+'|'B'|'B-'|'C',
  hireDate: string,               // YYYY-MM-DD, для определения новичка
}
```

### Проект (Project)
```js
{
  id: number,
  name: string,
  budget: number,        // плановый бюджет (для компонентного режима)
  budgetFact: number,    // факт/план, доля (напр. 0.97 = 97%)
  checkpoints: [
    { id, name, weight: number, plannedDays: number }
  ]
}
```

### Участие (Participation)
```js
{
  id: number,
  empId: number,         // → Employee.id
  projectId: number,     // → Project.id
  checkpointId: number,  // → Checkpoint.id
  actualDays: number,    // фактически отработанные дни
  period: 'Q1'|'Q2'|'Q3'|'Q4'|'H1'|'H2',
  note: string,
}
```

### Настройки (Settings)
```js
{
  formulaMode: 'multiplier' | 'component',
  componentWeights: { milestones: 40, budget: 40, abc: 20 },
  useRoleWeights: boolean,
  projectLimitEnabled: boolean,
  projectLimitMax: 3,
  projectLimitExceptions: { [empId]: boolean },
  abcCoeffs: { 'A': 1.2, 'B+': 1.1, 'B': 1.0, 'B-': 0, 'C': 0 },
  newcomerEnabled: boolean,
  newcomerMonths: 6,
  newcomerAbcCoeffs: { 'A': 1.0, 'B+': 1.0, 'B': 0, 'B-': 0, 'C': 0 },
}
```

---

## Расчёт бонусов

### Режим «Мультипликатор»
```
Потолок = Оклад × Мультипликатор
  (для роли S: Потолок / 3)

Бонус = Потолок × (Вес_вехи / 100) × (Факт_дни / План_дни) × Коэфф_ABC
```

### Режим «Компонентный»
```
КоэффБюджет = по таблице SCALE(budgetFact):
  < 80%      → 0
  80–95%     → 0.8
  95–105%    → 1.0
  105–120%   → 1.2
  > 120%     → 1.5

Бонус = Потолок × (
  (Вехи × W_вехи + КоэффБюджет × W_бюджет + КоэффABC × W_abc)
  / (W_вехи + W_бюджет + W_abc)
)
```

### Логика новичка
Если `(сегодня − hireDate) < newcomerMonths` — применяются `newcomerAbcCoeffs` вместо стандартных `abcCoeffs`.

---

## Поток данных

```
localStorage
    ↓ (при загрузке)
App.jsx [useState]
    ↓ (props)
Pages ──→ calculations.js (useMemo, без сохранения)
    ↓ (события пользователя)
CRUD-функции → setEmployees / setProjects / ...
    ↓ (useEffect, debounce 500ms)
localStorage
```

---

## Excel

| Операция | Функция | Страница |
|----------|---------|---------|
| Импорт сотрудников | `importEmployeesFromExcel()` | EmployeesPage |
| Экспорт полного отчёта | `exportToExcel()` | ResultsPage |

Используется библиотека SheetJS (`xlsx`). Файлы читаются/пишутся на клиенте, без загрузки на сервер.

---

## Печать / PDF

- Стили `@media print` в `index.css`
- Элементы с классом `.no-print` скрываются при печати
- Кнопка «Печать» вызывает `window.print()`

---

## Деплой

Приложение — статический SPA. Сборка:
```bash
npm run build   # → dist/
```
Папку `dist/` можно разместить на Vercel, Netlify или любом статическом хостинге.
