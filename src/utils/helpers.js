let counter = Date.now();
export const generateId = () => ++counter;
export const fmt = (n) => Math.round(n).toLocaleString('ru-RU');
