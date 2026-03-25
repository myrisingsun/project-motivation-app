export const defaultSettings = {
  formulaMode: 'multiplier', // 'multiplier' | 'component'
  componentWeights: { milestones: 40, budget: 40, abc: 20 },
  useRoleWeights: true,
  projectLimitEnabled: true,
  projectLimitMax: 3,
  projectLimitExceptions: {},
  abcCoeffs: { 'A': 1.2, 'B+': 1.1, 'B': 1.0, 'B-': 0, 'C': 0 },
  newcomerEnabled: true,
  newcomerMonths: 6,
  newcomerAbcCoeffs: { 'A': 1.0, 'B+': 1.0, 'B': 0, 'B-': 0, 'C': 0 },
};

export const defaultEmployees = [
  { id: 1, name: 'Иванов И.И.', role: 'A', salary: 200000, ceilingMultiplier: 2, abcGrade: 'B+', hireDate: '2024-01-15' },
  { id: 2, name: 'Петров П.П.', role: 'BA', salary: 180000, ceilingMultiplier: 2, abcGrade: 'B', hireDate: '2023-06-01' },
  { id: 3, name: 'Сидоров С.С.', role: 'S', salary: 150000, ceilingMultiplier: 2, abcGrade: 'A', hireDate: '2022-03-10' },
  { id: 4, name: 'Козлова К.К.', role: 'S', salary: 160000, ceilingMultiplier: 2, abcGrade: 'B', hireDate: '2025-11-01' },
  { id: 5, name: 'Морозов М.М.', role: 'A', salary: 210000, ceilingMultiplier: 2, abcGrade: 'B+', hireDate: '2021-09-01' },
  { id: 6, name: 'Волкова В.В.', role: 'S', salary: 140000, ceilingMultiplier: 2, abcGrade: 'B', hireDate: '2025-12-15' },
  { id: 7, name: 'Новиков Н.Н.', role: 'BA', salary: 175000, ceilingMultiplier: 2, abcGrade: 'A', hireDate: '2024-07-01' },
];

export const defaultProjects = [
  { id: 1, name: 'Проект Alpha — CRM-система', budget: 1000000, budgetFact: 0.97, checkpoints: [
    { id: 1, name: 'Анализ требований', weight: 20, plannedDays: 59 },
    { id: 2, name: 'Разработка решения', weight: 30, plannedDays: 92 },
    { id: 3, name: 'Тестирование', weight: 20, plannedDays: 61 },
    { id: 4, name: 'Внедрение', weight: 30, plannedDays: 61 },
  ]},
  { id: 2, name: 'Проект Beta — Автоматизация склада', budget: 400000, budgetFact: 0.88, checkpoints: [
    { id: 21, name: 'Обследование процессов', weight: 25, plannedDays: 45 },
    { id: 22, name: 'Проектирование', weight: 25, plannedDays: 60 },
    { id: 23, name: 'Разработка и настройка', weight: 30, plannedDays: 75 },
    { id: 24, name: 'Пилотный запуск', weight: 20, plannedDays: 30 },
  ]},
  { id: 3, name: 'Проект Gamma — Миграция данных', budget: 600000, budgetFact: 1.05, checkpoints: [
    { id: 31, name: 'Аудит источников данных', weight: 30, plannedDays: 40 },
    { id: 32, name: 'Разработка ETL-процессов', weight: 40, plannedDays: 70 },
    { id: 33, name: 'Миграция и верификация', weight: 30, plannedDays: 50 },
  ]},
];

export const defaultParticipation = [
  { id: 1, empId: 1, projectId: 1, checkpointId: 1, actualDays: 59, period: 'Q1', note: '' },
  { id: 2, empId: 1, projectId: 1, checkpointId: 2, actualDays: 92, period: 'Q2', note: '' },
  { id: 3, empId: 2, projectId: 1, checkpointId: 1, actualDays: 59, period: 'Q1', note: '' },
  { id: 4, empId: 2, projectId: 1, checkpointId: 2, actualDays: 72, period: 'Q2', note: 'отпуск 20 дней' },
  { id: 5, empId: 3, projectId: 1, checkpointId: 1, actualDays: 40, period: 'Q1', note: 'подключён с 20.01' },
  { id: 6, empId: 3, projectId: 1, checkpointId: 2, actualDays: 92, period: 'Q2', note: '' },
  { id: 7, empId: 4, projectId: 1, checkpointId: 3, actualDays: 55, period: 'Q3', note: 'больничный 6 дней' },
  { id: 10, empId: 5, projectId: 2, checkpointId: 21, actualDays: 45, period: 'Q1', note: '' },
  { id: 11, empId: 5, projectId: 2, checkpointId: 22, actualDays: 60, period: 'Q2', note: '' },
  { id: 12, empId: 7, projectId: 2, checkpointId: 21, actualDays: 45, period: 'Q1', note: '' },
  { id: 13, empId: 7, projectId: 2, checkpointId: 22, actualDays: 50, period: 'Q2', note: 'отпуск 10 дней' },
  { id: 14, empId: 3, projectId: 2, checkpointId: 21, actualDays: 30, period: 'Q1', note: 'частичная загрузка' },
  { id: 15, empId: 3, projectId: 2, checkpointId: 22, actualDays: 45, period: 'Q2', note: '' },
  { id: 16, empId: 4, projectId: 2, checkpointId: 23, actualDays: 75, period: 'Q3', note: '' },
  { id: 17, empId: 4, projectId: 2, checkpointId: 24, actualDays: 30, period: 'Q4', note: '' },
  { id: 18, empId: 6, projectId: 2, checkpointId: 21, actualDays: 40, period: 'Q1', note: '' },
  { id: 20, empId: 1, projectId: 3, checkpointId: 31, actualDays: 35, period: 'Q2', note: 'параллельно Alpha' },
  { id: 21, empId: 1, projectId: 3, checkpointId: 32, actualDays: 60, period: 'Q3', note: '' },
  { id: 22, empId: 2, projectId: 3, checkpointId: 31, actualDays: 40, period: 'Q2', note: '' },
  { id: 23, empId: 2, projectId: 3, checkpointId: 32, actualDays: 70, period: 'Q3', note: '' },
  { id: 24, empId: 6, projectId: 3, checkpointId: 31, actualDays: 40, period: 'Q2', note: '' },
  { id: 25, empId: 6, projectId: 3, checkpointId: 32, actualDays: 55, period: 'Q3', note: 'больничный 15 дней' },
  { id: 26, empId: 6, projectId: 3, checkpointId: 33, actualDays: 50, period: 'Q4', note: '' },
  { id: 27, empId: 4, projectId: 3, checkpointId: 33, actualDays: 25, period: 'Q4', note: 'подключена для усиления' },
];
