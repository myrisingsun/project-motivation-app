# Структура базы данных — HR Калькулятор мотивации

## Обзор

База данных реализована на **PostgreSQL 15+**. Архитектура поддерживает:
- **Мультиарендность** (multi-tenant) — несколько организаций в одной БД
- **Расчётные периоды** — хранение данных за разные годы/кварталы
- **Историчность** — снапшоты данных сотрудников по периодам
- **Аудит** — `created_at`, `updated_at`, мягкое удаление (`deleted_at`)

---

## Концептуальная модель (ERD)

```
organizations
    │
    ├── users
    │
    └── periods
            │
            ├── settings ──── abc_coefficients
            │          └──── project_limit_exceptions ─── employees
            │
            ├── employees (снапшот на период)
            │       │
            │       └── participation
            │                │
            └── projects      │
                    │         │
                    └── checkpoints ──── participation
```

---

## Перечисления (ENUM)

```sql
CREATE TYPE employee_role      AS ENUM ('A', 'BA', 'S');
CREATE TYPE abc_grade          AS ENUM ('A', 'B+', 'B', 'B-', 'C');
CREATE TYPE payout_period      AS ENUM ('Q1', 'Q2', 'Q3', 'Q4', 'H1', 'H2');
CREATE TYPE formula_mode       AS ENUM ('multiplier', 'component');
CREATE TYPE abc_coeff_type     AS ENUM ('standard', 'newcomer');
CREATE TYPE user_role          AS ENUM ('admin', 'hr_manager', 'viewer');
CREATE TYPE period_status      AS ENUM ('draft', 'active', 'closed', 'archived');
```

---

## Таблицы

### `organizations` — Организации (тенант)

| Колонка      | Тип           | Ограничения         | Описание                        |
|--------------|---------------|---------------------|---------------------------------|
| `id`         | `uuid`        | PK, default gen     | Идентификатор организации       |
| `name`       | `varchar(255)` | NOT NULL            | Название организации            |
| `slug`       | `varchar(100)` | UNIQUE, NOT NULL    | URL-идентификатор               |
| `created_at` | `timestamptz` | NOT NULL, default now | Дата создания                 |
| `updated_at` | `timestamptz` | NOT NULL, default now | Дата обновления               |

```sql
CREATE TABLE organizations (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(255) NOT NULL,
    slug       VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

### `users` — Пользователи

| Колонка         | Тип           | Ограничения         | Описание                     |
|-----------------|---------------|---------------------|------------------------------|
| `id`            | `uuid`        | PK                  | Идентификатор пользователя   |
| `org_id`        | `uuid`        | FK → organizations  | Организация                  |
| `email`         | `varchar(255)` | UNIQUE, NOT NULL   | E-mail / логин               |
| `name`          | `varchar(255)` | NOT NULL           | Имя пользователя             |
| `role`          | `user_role`   | NOT NULL, default 'hr_manager' | Роль в системе  |
| `password_hash` | `varchar(255)` | NOT NULL           | Хэш пароля (bcrypt)          |
| `created_at`    | `timestamptz` | NOT NULL            | Дата регистрации             |
| `updated_at`    | `timestamptz` | NOT NULL            | Дата обновления              |
| `deleted_at`    | `timestamptz` | NULL                | Мягкое удаление              |

```sql
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email         VARCHAR(255) NOT NULL UNIQUE,
    name          VARCHAR(255) NOT NULL,
    role          user_role NOT NULL DEFAULT 'hr_manager',
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at    TIMESTAMPTZ
);
```

---

### `periods` — Расчётные периоды

Период — это единица расчёта (например, «2025 год», «2025 Q1–Q2»).
Все сущности данных (сотрудники, проекты, участие) привязаны к периоду.

| Колонка      | Тип           | Ограничения         | Описание                              |
|--------------|---------------|---------------------|---------------------------------------|
| `id`         | `uuid`        | PK                  | Идентификатор периода                 |
| `org_id`     | `uuid`        | FK → organizations  | Организация                           |
| `name`       | `varchar(100)` | NOT NULL           | Название: «2025», «2025 H1» и т.д.   |
| `year`       | `smallint`    | NOT NULL            | Год (2024, 2025…)                     |
| `start_date` | `date`        | NOT NULL            | Начало периода                        |
| `end_date`   | `date`        | NOT NULL            | Конец периода                         |
| `status`     | `period_status` | NOT NULL, default 'draft' | Статус периода            |
| `created_by` | `uuid`        | FK → users          | Создал                                |
| `created_at` | `timestamptz` | NOT NULL            |                                       |
| `updated_at` | `timestamptz` | NOT NULL            |                                       |

```sql
CREATE TABLE periods (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name       VARCHAR(100) NOT NULL,
    year       SMALLINT NOT NULL CHECK (year BETWEEN 2000 AND 2100),
    start_date DATE NOT NULL,
    end_date   DATE NOT NULL CHECK (end_date >= start_date),
    status     period_status NOT NULL DEFAULT 'draft',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (org_id, name)
);
```

---

### `employees` — Сотрудники (снапшот на период)

Одна запись = один сотрудник в рамках одного расчётного периода.
Зарплата, грейд, роль могут меняться от периода к периоду.

| Колонка              | Тип           | Ограничения              | Описание                                  |
|----------------------|---------------|--------------------------|-------------------------------------------|
| `id`                 | `uuid`        | PK                       | Идентификатор записи                      |
| `org_id`             | `uuid`        | FK → organizations       | Организация                               |
| `period_id`          | `uuid`        | FK → periods             | Расчётный период                          |
| `external_id`        | `varchar(100)` | NULL                    | ID из HR-системы (для интеграции)         |
| `name`               | `varchar(255)` | NOT NULL                | ФИО                                       |
| `role`               | `employee_role` | NOT NULL              | Роль: A (PM), BA, S                       |
| `salary`             | `numeric(14,2)` | NOT NULL, ≥ 0          | Оклад в рублях                            |
| `ceiling_multiplier` | `numeric(5,2)` | NOT NULL, ≥ 0, default 2 | Количество окладов в год. потолке       |
| `abc_grade`          | `abc_grade`   | NOT NULL, default 'B'    | ABC-грейд за период                       |
| `hire_date`          | `date`        | NULL                     | Дата приёма на работу (для новичков)      |
| `created_at`         | `timestamptz` | NOT NULL                 |                                           |
| `updated_at`         | `timestamptz` | NOT NULL                 |                                           |
| `deleted_at`         | `timestamptz` | NULL                     | Мягкое удаление                           |

**Вычисляемые поля** (хранятся в коде / materialized view):
- `annual_ceiling = salary × ceiling_multiplier`
- `project_ceiling = annual_ceiling` (если role = A/BA) или `annual_ceiling / 3` (если role = S)
- `is_newcomer = (period.start_date - hire_date) < settings.newcomer_months × 30`

```sql
CREATE TABLE employees (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id             UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    period_id          UUID NOT NULL REFERENCES periods(id) ON DELETE CASCADE,
    external_id        VARCHAR(100),
    name               VARCHAR(255) NOT NULL,
    role               employee_role NOT NULL,
    salary             NUMERIC(14,2) NOT NULL CHECK (salary >= 0),
    ceiling_multiplier NUMERIC(5,2)  NOT NULL DEFAULT 2.0 CHECK (ceiling_multiplier >= 0),
    abc_grade          abc_grade NOT NULL DEFAULT 'B',
    hire_date          DATE,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at         TIMESTAMPTZ,
    UNIQUE (period_id, external_id)
);
```

---

### `projects` — Проекты

| Колонка       | Тип           | Ограничения        | Описание                               |
|---------------|---------------|--------------------|----------------------------------------|
| `id`          | `uuid`        | PK                 | Идентификатор проекта                  |
| `org_id`      | `uuid`        | FK → organizations | Организация                            |
| `period_id`   | `uuid`        | FK → periods       | Расчётный период                       |
| `name`        | `varchar(255)` | NOT NULL          | Название проекта                       |
| `budget_plan` | `numeric(18,2)` | NULL, ≥ 0        | Плановый бюджет (руб.) — компон. режим |
| `budget_fact` | `numeric(6,4)` | NULL, ≥ 0        | Факт/план (0.97 = 97%) — компон. режим |
| `sort_order`  | `smallint`    | NOT NULL, default 0 | Порядок отображения                  |
| `created_at`  | `timestamptz` | NOT NULL           |                                        |
| `updated_at`  | `timestamptz` | NOT NULL           |                                        |
| `deleted_at`  | `timestamptz` | NULL               | Мягкое удаление                        |

```sql
CREATE TABLE projects (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    period_id   UUID NOT NULL REFERENCES periods(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    budget_plan NUMERIC(18,2) CHECK (budget_plan >= 0),
    budget_fact NUMERIC(6,4)  CHECK (budget_fact >= 0),
    sort_order  SMALLINT NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ
);
```

---

### `checkpoints` — Контрольные точки проекта

| Колонка       | Тип           | Ограничения        | Описание                          |
|---------------|---------------|--------------------|-----------------------------------|
| `id`          | `uuid`        | PK                 | Идентификатор КТ                  |
| `project_id`  | `uuid`        | FK → projects      | Проект                            |
| `name`        | `varchar(255)` | NOT NULL          | Название КТ                       |
| `weight_pct`  | `numeric(5,2)` | NOT NULL, 0–100   | Вес в % (сумма по проекту = 100)  |
| `planned_days`| `smallint`    | NOT NULL, ≥ 0     | Плановые дни                      |
| `sort_order`  | `smallint`    | NOT NULL, default 0 | Порядок в таблице               |
| `created_at`  | `timestamptz` | NOT NULL           |                                   |
| `updated_at`  | `timestamptz` | NOT NULL           |                                   |
| `deleted_at`  | `timestamptz` | NULL               | Мягкое удаление                   |

```sql
CREATE TABLE checkpoints (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name         VARCHAR(255) NOT NULL,
    weight_pct   NUMERIC(5,2) NOT NULL CHECK (weight_pct BETWEEN 0 AND 100),
    planned_days SMALLINT NOT NULL CHECK (planned_days >= 0),
    sort_order   SMALLINT NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at   TIMESTAMPTZ
);
```

> **Ограничение на уровне приложения:** сумма `weight_pct` по всем КТ одного проекта должна равняться 100%.
> В БД можно реализовать через триггер или CHECK CONSTRAINT с оконной функцией.

---

### `participation` — Участие сотрудника в КТ

Ключевая транзакционная таблица. Одна запись = один сотрудник на одной КТ за один период выплаты.

| Колонка         | Тип           | Ограничения          | Описание                              |
|-----------------|---------------|----------------------|---------------------------------------|
| `id`            | `uuid`        | PK                   | Идентификатор записи                  |
| `employee_id`   | `uuid`        | FK → employees       | Сотрудник                             |
| `project_id`    | `uuid`        | FK → projects        | Проект                                |
| `checkpoint_id` | `uuid`        | FK → checkpoints     | Контрольная точка                     |
| `actual_days`   | `smallint`    | NOT NULL, ≥ 0        | Фактические дни работы                |
| `payout_period` | `payout_period` | NOT NULL           | Период выплаты: Q1–Q4, H1–H2         |
| `note`          | `text`        | NULL                 | Примечание (отпуск, замена и т.д.)    |
| `created_at`    | `timestamptz` | NOT NULL             |                                       |
| `updated_at`    | `timestamptz` | NOT NULL             |                                       |

```sql
CREATE TABLE participation (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id   UUID NOT NULL REFERENCES employees(id)   ON DELETE CASCADE,
    project_id    UUID NOT NULL REFERENCES projects(id)    ON DELETE CASCADE,
    checkpoint_id UUID NOT NULL REFERENCES checkpoints(id) ON DELETE CASCADE,
    actual_days   SMALLINT NOT NULL CHECK (actual_days >= 0),
    payout_period payout_period NOT NULL,
    note          TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

### `settings` — Настройки формулы (на период + организацию)

| Колонка                    | Тип           | Ограничения           | Описание                              |
|----------------------------|---------------|-----------------------|---------------------------------------|
| `id`                       | `uuid`        | PK                    |                                       |
| `org_id`                   | `uuid`        | FK → organizations    |                                       |
| `period_id`                | `uuid`        | FK → periods, UNIQUE  | Одни настройки на период              |
| `formula_mode`             | `formula_mode` | NOT NULL             | Режим формулы                         |
| `weight_milestones`        | `smallint`    | NOT NULL, 0–100       | Вес «Вехи» в компонентной формуле     |
| `weight_budget`            | `smallint`    | NOT NULL, 0–100       | Вес «Бюджет» в компонентной формуле   |
| `weight_abc`               | `smallint`    | NOT NULL, 0–100       | Вес «ABC» в компонентной формуле      |
| `use_role_weights`         | `boolean`     | NOT NULL, default true | Использовать ролевые веса            |
| `project_limit_enabled`    | `boolean`     | NOT NULL, default true | Включить лимит проектов              |
| `project_limit_max`        | `smallint`    | NOT NULL, default 3   | Макс. кол-во проектов на сотрудника   |
| `newcomer_enabled`         | `boolean`     | NOT NULL, default true | Включить режим новичка               |
| `newcomer_months`          | `smallint`    | NOT NULL, default 6   | Порог стажа новичка (месяцев)         |
| `created_at`               | `timestamptz` | NOT NULL              |                                       |
| `updated_at`               | `timestamptz` | NOT NULL              |                                       |

```sql
CREATE TABLE settings (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                 UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    period_id              UUID NOT NULL REFERENCES periods(id) ON DELETE CASCADE UNIQUE,
    formula_mode           formula_mode NOT NULL DEFAULT 'multiplier',
    weight_milestones      SMALLINT NOT NULL DEFAULT 40 CHECK (weight_milestones BETWEEN 0 AND 100),
    weight_budget          SMALLINT NOT NULL DEFAULT 40 CHECK (weight_budget     BETWEEN 0 AND 100),
    weight_abc             SMALLINT NOT NULL DEFAULT 20 CHECK (weight_abc        BETWEEN 0 AND 100),
    use_role_weights       BOOLEAN NOT NULL DEFAULT true,
    project_limit_enabled  BOOLEAN NOT NULL DEFAULT true,
    project_limit_max      SMALLINT NOT NULL DEFAULT 3 CHECK (project_limit_max >= 1),
    newcomer_enabled       BOOLEAN NOT NULL DEFAULT true,
    newcomer_months        SMALLINT NOT NULL DEFAULT 6  CHECK (newcomer_months >= 1),
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT weights_sum_100 CHECK (weight_milestones + weight_budget + weight_abc = 100)
);
```

---

### `abc_coefficients` — Коэффициенты ABC

Хранит коэффициенты для стандартных сотрудников и новичков отдельными строками.

| Колонка       | Тип            | Ограничения           | Описание                             |
|---------------|----------------|-----------------------|--------------------------------------|
| `id`          | `uuid`         | PK                    |                                      |
| `setting_id`  | `uuid`         | FK → settings         | Настройки периода                    |
| `coeff_type`  | `abc_coeff_type` | NOT NULL            | `standard` или `newcomer`            |
| `grade`       | `abc_grade`    | NOT NULL              | Грейд: A, B+, B, B−, C              |
| `coefficient` | `numeric(4,2)` | NOT NULL, ≥ 0        | Коэффициент (0.0 – 2.0)              |

```sql
CREATE TABLE abc_coefficients (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_id  UUID NOT NULL REFERENCES settings(id) ON DELETE CASCADE,
    coeff_type  abc_coeff_type NOT NULL,
    grade       abc_grade NOT NULL,
    coefficient NUMERIC(4,2) NOT NULL CHECK (coefficient >= 0),
    UNIQUE (setting_id, coeff_type, grade)
);

-- Дефолтные значения (вставляются при создании settings)
-- standard: A=1.2, B+=1.1, B=1.0, B−=0, C=0
-- newcomer: A=1.0, B+=1.0, B=0,   B−=0, C=0
```

---

### `project_limit_exceptions` — Исключения лимита проектов

Индивидуальный лимит проектов для конкретного сотрудника (переопределяет `settings.project_limit_max`).

| Колонка       | Тип      | Ограничения           | Описание                        |
|---------------|----------|-----------------------|---------------------------------|
| `id`          | `uuid`   | PK                    |                                 |
| `setting_id`  | `uuid`   | FK → settings         | Настройки периода               |
| `employee_id` | `uuid`   | FK → employees        | Сотрудник-исключение            |
| `limit_max`   | `smallint` | NOT NULL, ≥ 1       | Индивидуальный лимит проектов   |

```sql
CREATE TABLE project_limit_exceptions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_id  UUID NOT NULL REFERENCES settings(id)   ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id)  ON DELETE CASCADE,
    limit_max   SMALLINT NOT NULL CHECK (limit_max >= 1),
    UNIQUE (setting_id, employee_id)
);
```

---

### `calculation_results` — Кэш результатов расчёта

Хранит результаты последнего расчёта. Пересчитывается при изменении данных периода.

| Колонка           | Тип            | Ограничения            | Описание                                |
|-------------------|----------------|------------------------|-----------------------------------------|
| `id`              | `uuid`         | PK                     |                                         |
| `period_id`       | `uuid`         | FK → periods           | Период                                  |
| `employee_id`     | `uuid`         | FK → employees         | Сотрудник                               |
| `project_id`      | `uuid`         | FK → projects          | Проект                                  |
| `checkpoint_id`   | `uuid`         | FK → checkpoints       | Контрольная точка                       |
| `participation_id`| `uuid`         | FK → participation     | Запись участия                          |
| `project_ceiling` | `numeric(14,2)` | NOT NULL              | Проектный потолок сотрудника (руб.)     |
| `participation_coeff` | `numeric(5,4)` | NOT NULL, 0–1      | Коэффициент участия (факт/план)         |
| `abc_coeff`       | `numeric(4,2)` | NOT NULL               | Применённый ABC-коэффициент             |
| `budget_coeff`    | `numeric(4,2)` | NULL                   | Бюджетный коэффициент (компон. режим)   |
| `bonus`           | `numeric(14,2)` | NOT NULL, ≥ 0         | Рассчитанная премия (руб.)              |
| `payout_period`   | `payout_period` | NOT NULL              | Период выплаты                          |
| `formula_mode`    | `formula_mode` | NOT NULL               | Режим формулы на момент расчёта         |
| `calculated_at`   | `timestamptz`  | NOT NULL               | Время расчёта                           |

```sql
CREATE TABLE calculation_results (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_id           UUID NOT NULL REFERENCES periods(id)       ON DELETE CASCADE,
    employee_id         UUID NOT NULL REFERENCES employees(id)     ON DELETE CASCADE,
    project_id          UUID NOT NULL REFERENCES projects(id)      ON DELETE CASCADE,
    checkpoint_id       UUID NOT NULL REFERENCES checkpoints(id)   ON DELETE CASCADE,
    participation_id    UUID NOT NULL REFERENCES participation(id)  ON DELETE CASCADE,
    project_ceiling     NUMERIC(14,2) NOT NULL,
    participation_coeff NUMERIC(5,4)  NOT NULL CHECK (participation_coeff BETWEEN 0 AND 1),
    abc_coeff           NUMERIC(4,2)  NOT NULL CHECK (abc_coeff >= 0),
    budget_coeff        NUMERIC(4,2)  CHECK (budget_coeff >= 0),
    bonus               NUMERIC(14,2) NOT NULL CHECK (bonus >= 0),
    payout_period       payout_period NOT NULL,
    formula_mode        formula_mode  NOT NULL,
    calculated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## Индексы

```sql
-- employees
CREATE INDEX idx_employees_period   ON employees(period_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_org      ON employees(org_id)    WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_ext      ON employees(external_id) WHERE external_id IS NOT NULL;

-- projects
CREATE INDEX idx_projects_period    ON projects(period_id)  WHERE deleted_at IS NULL;

-- checkpoints
CREATE INDEX idx_checkpoints_proj   ON checkpoints(project_id) WHERE deleted_at IS NULL;

-- participation
CREATE INDEX idx_part_employee      ON participation(employee_id);
CREATE INDEX idx_part_project       ON participation(project_id);
CREATE INDEX idx_part_checkpoint    ON participation(checkpoint_id);
CREATE INDEX idx_part_period        ON participation(payout_period);

-- calculation_results
CREATE INDEX idx_calc_period        ON calculation_results(period_id);
CREATE INDEX idx_calc_employee      ON calculation_results(employee_id);
CREATE INDEX idx_calc_project       ON calculation_results(project_id);

-- settings / abc_coefficients
CREATE INDEX idx_abc_coeff_setting  ON abc_coefficients(setting_id, coeff_type);
```

---

## Таблица бюджетной шкалы (SCALE)

Фиксированная справочная таблица. Не изменяется пользователем.

```sql
CREATE TABLE budget_scale (
    id        SERIAL PRIMARY KEY,
    range_min NUMERIC(5,3) NOT NULL,  -- включительно
    range_max NUMERIC(5,3) NOT NULL,  -- включительно
    coeff     NUMERIC(3,1) NOT NULL,
    label     VARCHAR(50)
);

INSERT INTO budget_scale (range_min, range_max, coeff, label) VALUES
    (0,    0.799, 0.0, '< 80%'),
    (0.80, 0.949, 0.8, '80–95%'),
    (0.95, 1.049, 1.0, '95–105%'),
    (1.05, 1.199, 1.2, '105–120%'),
    (1.20, 9.999, 1.5, '> 120%');
```

---

## Связи (сводная таблица)

| Таблица                    | FK                   | Ссылается на         | Каскад         |
|----------------------------|----------------------|----------------------|----------------|
| `users`                    | `org_id`             | `organizations`      | CASCADE DELETE |
| `periods`                  | `org_id`             | `organizations`      | CASCADE DELETE |
| `employees`                | `org_id`, `period_id`| `organizations`, `periods` | CASCADE DELETE |
| `projects`                 | `org_id`, `period_id`| `organizations`, `periods` | CASCADE DELETE |
| `checkpoints`              | `project_id`         | `projects`           | CASCADE DELETE |
| `participation`            | `employee_id`, `project_id`, `checkpoint_id` | соотв. таблицы | CASCADE DELETE |
| `settings`                 | `org_id`, `period_id`| `organizations`, `periods` | CASCADE DELETE |
| `abc_coefficients`         | `setting_id`         | `settings`           | CASCADE DELETE |
| `project_limit_exceptions` | `setting_id`, `employee_id` | `settings`, `employees` | CASCADE DELETE |
| `calculation_results`      | `period_id`, `employee_id`, `project_id`, `checkpoint_id`, `participation_id` | соотв. таблицы | CASCADE DELETE |

---

## Бизнес-правила, реализуемые в БД

### 1. Сумма весов КТ = 100% (триггер)

```sql
CREATE OR REPLACE FUNCTION check_checkpoint_weights()
RETURNS TRIGGER AS $$
DECLARE total_weight NUMERIC;
BEGIN
    SELECT COALESCE(SUM(weight_pct), 0) INTO total_weight
    FROM checkpoints
    WHERE project_id = NEW.project_id AND deleted_at IS NULL;

    IF total_weight > 100 THEN
        RAISE EXCEPTION 'Сумма весов КТ проекта превышает 100%% (текущая: %%)', total_weight;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_checkpoint_weights
AFTER INSERT OR UPDATE ON checkpoints
FOR EACH ROW EXECUTE FUNCTION check_checkpoint_weights();
```

### 2. Сумма компонентных весов = 100% (CHECK в settings)

```sql
CONSTRAINT weights_sum_100 CHECK (weight_milestones + weight_budget + weight_abc = 100)
```

### 3. Участие: actual_days не может превышать planned_days × 2 (мягкое ограничение)

```sql
-- Реализуется через CHECK на уровне приложения или предупреждение в UI
-- В БД: soft check через триггер с RAISE WARNING
```

### 4. auto-updated_at (триггер)

```sql
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- Применить ко всем таблицам с updated_at:
CREATE TRIGGER trg_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
-- (повторить для projects, checkpoints, participation, settings, ...)
```

---

## Миграция с localStorage

При переходе с текущего фронтенда (localStorage) на БД:

1. **Экспорт**: `JSON.parse(localStorage.getItem('pm-calc-data'))` → `{ employees, projects, participation, settings }`
2. **Создать** организацию + период `year = текущий год`
3. **Импорт employees** → таблица `employees`
4. **Импорт projects** → таблица `projects`, вложенные `checkpoints` → таблица `checkpoints`
5. **Импорт participation** → таблица `participation` (маппинг старых числовых ID → новые UUID через временную map-таблицу)
6. **Импорт settings** → таблица `settings` + `abc_coefficients` (развернуть объект `abcCoeffs`)

---

## Технологический стек (рекомендуемый)

| Слой            | Технология                   | Примечание                          |
|-----------------|------------------------------|-------------------------------------|
| БД              | PostgreSQL 15+               |                                     |
| Миграции        | Prisma / Drizzle / Flyway    | TypeScript-first ORM предпочтителен |
| API             | Hono / Fastify (Node.js)     | или Next.js API routes              |
| Auth            | NextAuth / Lucia              |                                     |
| Хостинг БД      | Supabase / Neon / Railway    | managed PostgreSQL                  |
