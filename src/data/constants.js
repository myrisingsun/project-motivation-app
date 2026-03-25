// Roles
export const ROLES = [
  { value: 'A', label: 'PM (Руководитель проекта)' },
  { value: 'BA', label: 'BA (Бизнес-аналитик)' },
  { value: 'S', label: 'S (Функц. исполнитель)' },
];

export const PAYOUT_PERIODS = ['Q1', 'Q2', 'Q3', 'Q4', 'H1', 'H2'];
export const ABC_GRADES = ['A', 'B+', 'B', 'B-', 'C'];

// Standard milestones with weights per role (from Справ sheet)
export const STD_MILESTONES = [
  { name: 'Утверждение проектного задания', wPM: 5, wBA: 0, wS: 0 },
  { name: 'Утверждение плана и бюджета', wPM: 10, wBA: 0, wS: 0 },
  { name: 'Утверждение требований', wPM: 5, wBA: 10, wS: 10 },
  { name: 'Утверждение архитектуры и дизайна', wPM: 10, wBA: 10, wS: 10 },
  { name: 'Завершение ключевых модулей', wPM: 10, wBA: 10, wS: 10 },
  { name: 'Интеграционное тестирование', wPM: 10, wBA: 15, wS: 15 },
  { name: 'Пользовательское приемочное тестирование', wPM: 15, wBA: 15, wS: 15 },
  { name: 'Запуск в production (ОПЭ)', wPM: 10, wBA: 15, wS: 15 },
  { name: 'Обучение и приемка заказчиков', wPM: 10, wBA: 10, wS: 10 },
  { name: 'Закрытие проекта', wPM: 15, wBA: 15, wS: 15 },
];

// Scale table for component model
export const SCALE = [
  { label: '< 80%', min: 0, max: 0.7999, coeff: 0 },
  { label: '80–95%', min: 0.80, max: 0.9499, coeff: 0.8 },
  { label: '95–105%', min: 0.95, max: 1.0499, coeff: 1.0 },
  { label: '105–120%', min: 1.05, max: 1.1999, coeff: 1.2 },
  { label: '> 120%', min: 1.20, max: 999, coeff: 1.5 },
];

export const applyScale = (v) => {
  for (const s of SCALE) {
    if (v >= s.min && v <= s.max) return s.coeff;
  }
  return 0;
};

// Project colors for visual grouping
export const PROJECT_COLORS = ['#185FA5', '#0F6E56', '#993C1D', '#72243E', '#444441'];
export const getProjectColor = (i) => PROJECT_COLORS[i % PROJECT_COLORS.length];
