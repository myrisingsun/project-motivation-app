import * as XLSX from 'xlsx';

// ===== EXPORT =====
export function exportToExcel(results, employees, projects, empTotals, settings) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Detailed results
  const detailRows = results.map(r => ({
    'ФИО': r.empName,
    'Роль': r.role,
    'Проект': r.projectName,
    'Контр. точка': r.cpName,
    'Вес (%)': r.weight,
    'Коэфф. участия': +r.pc.toFixed(2),
    'ABC': r.abcGrade,
    'ABC коэфф.': r.abcC,
    'Премия': Math.round(r.bonus),
    'Период': r.period,
    'Примечание': r.note || '',
  }));
  const ws1 = XLSX.utils.json_to_sheet(detailRows);
  XLSX.utils.book_append_sheet(wb, ws1, 'Расчёт');

  // Sheet 2: Employee summary
  const summaryRows = employees.map(emp => {
    const d = empTotals[emp.id] || { total: 0, byProj: {} };
    const ceil = emp.role === 'S' ? emp.salary * emp.ceilingMultiplier / 3 : emp.salary * emp.ceilingMultiplier;
    const row = {
      'ФИО': emp.name,
      'Роль': emp.role,
      'ABC': emp.abcGrade,
    };
    projects.forEach(p => {
      row[p.name.split('—')[0].trim()] = Math.round(d.byProj[p.id] || 0);
    });
    row['Итого'] = Math.round(d.total);
    row['Потолок (проектн.)'] = Math.round(ceil);
    row['Остаток'] = Math.round(ceil - d.total);
    row['Статус'] = d.total > ceil ? 'ПРЕВЫШЕНИЕ' : 'ОК';
    return row;
  });
  const ws2 = XLSX.utils.json_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, ws2, 'Сводка');

  // Sheet 3: Settings
  const settingsRows = [
    { 'Параметр': 'Модель расчёта', 'Значение': settings.formulaMode === 'multiplier' ? 'Множитель' : 'Компонентная' },
    { 'Параметр': 'Лимит проектов', 'Значение': settings.projectLimitEnabled ? `Макс. ${settings.projectLimitMax}` : 'Отключен' },
    { 'Параметр': 'Новички', 'Значение': settings.newcomerEnabled ? `Порог ${settings.newcomerMonths} мес.` : 'Отключено' },
  ];
  if (settings.formulaMode === 'component') {
    settingsRows.push(
      { 'Параметр': 'Вес Вехи', 'Значение': `${settings.componentWeights.milestones}%` },
      { 'Параметр': 'Вес Бюджет', 'Значение': `${settings.componentWeights.budget}%` },
      { 'Параметр': 'Вес ABC', 'Значение': `${settings.componentWeights.abc}%` },
    );
  }
  const ws3 = XLSX.utils.json_to_sheet(settingsRows);
  XLSX.utils.book_append_sheet(wb, ws3, 'Настройки');

  XLSX.writeFile(wb, `project_motivation_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// ===== IMPORT =====
export function importEmployeesFromExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);

        const employees = data.map((row, i) => ({
          id: Date.now() + i,
          name: row['ФИО'] || row['name'] || row['Name'] || '',
          role: mapRole(row['Роль'] || row['role'] || row['Должность'] || 'S'),
          salary: parseNum(row['Оклад'] || row['salary'] || row['Оклад, gross'] || 0),
          ceilingMultiplier: parseNum(row['Кол-во окладов'] || row['ceilingMultiplier'] || row['Кол-во окладов, ШР'] || 2),
          abcGrade: row['ABC'] || row['abcGrade'] || 'B',
          hireDate: parseDate(row['Дата приёма'] || row['hireDate'] || row['Дата приема'] || ''),
        })).filter(e => e.name);

        resolve(employees);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function mapRole(raw) {
  const r = String(raw).toUpperCase().trim();
  if (r === 'PM' || r === 'A' || r === 'РП' || r === 'РМ') return 'A';
  if (r === 'BA' || r === 'БА') return 'BA';
  if (r === 'ФУ' || r === 'S' || r.includes('ФУНКЦ') || r.includes('ИСПОЛН')) return 'S';
  return 'S';
}

function parseNum(v) {
  if (typeof v === 'number') return v;
  return parseFloat(String(v).replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
}

function parseDate(v) {
  if (!v) return '';
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const d = new Date(v);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return '';
}
