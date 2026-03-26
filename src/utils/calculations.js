import { applyScale } from '../data/constants';

export function isNewcomer(hireDate, thresholdMonths) {
  if (!hireDate) return false;
  const diff = (new Date() - new Date(hireDate)) / (1000 * 60 * 60 * 24 * 30.44);
  return diff < thresholdMonths;
}

export function getAbcCoeff(grade, hireDate, settings) {
  if (settings.newcomerEnabled && isNewcomer(hireDate, settings.newcomerMonths)) {
    return settings.newcomerAbcCoeffs[grade] ?? 1.0;
  }
  return settings.abcCoeffs[grade] ?? 1.0;
}

export function getProjectCeiling(employee) {
  const full = employee.salary * employee.ceilingMultiplier;
  return employee.role === 'S' ? full / 3 : full;
}

export function calculateAll(employees, projects, participation, settings) {
  const results = [];
  const empTotals = {};
  const projTotals = {};
  let grandTotal = 0;

  const mode = settings.formulaMode;
  const cw = settings.componentWeights;
  const cwSum = cw.milestones + cw.budget + cw.abc;

  participation.forEach(part => {
    // eslint-disable-next-line eqeqeq
    const emp = employees.find(e => e.id == part.empId);
    // eslint-disable-next-line eqeqeq
    const proj = projects.find(p => p.id == part.projectId);
    // eslint-disable-next-line eqeqeq
    const cp = proj?.checkpoints?.find(c => c.id == part.checkpointId);
    if (!emp || !proj || !cp) return;

    const pCeil = getProjectCeiling(emp);
    const wf = cp.weight / 100;
    const pc = cp.plannedDays > 0 ? Math.min(part.actualDays / cp.plannedDays, 1) : 0;
    const abcC = getAbcCoeff(emp.abcGrade, emp.hireDate, settings);

    let bonus, budgetCoeff = null;

    if (mode === 'multiplier') {
      bonus = pCeil * wf * pc * abcC;
    } else {
      budgetCoeff = proj.budgetFact > 0 ? applyScale(proj.budgetFact) : 0;
      const combined = (wf * pc * cw.milestones + budgetCoeff * cw.budget + abcC * cw.abc) / (cwSum || 100);
      bonus = pCeil * combined;
    }

    if (!empTotals[emp.id]) empTotals[emp.id] = { total: 0, ceiling: emp.salary * emp.ceilingMultiplier, byProj: {} };
    empTotals[emp.id].total += bonus;
    empTotals[emp.id].byProj[proj.id] = (empTotals[emp.id].byProj[proj.id] || 0) + bonus;
    projTotals[proj.id] = (projTotals[proj.id] || 0) + bonus;
    grandTotal += bonus;

    results.push({
      empId: emp.id, empName: emp.name, role: emp.role,
      projectId: proj.id, projectName: proj.name,
      cpName: cp.name, weight: cp.weight, pCeil, pc,
      abcGrade: emp.abcGrade, abcC,
      bonus, period: part.period, note: part.note,
      budgetFact: proj.budgetFact, budgetCoeff,
    });
  });

  // Group results by project
  const resultsByProj = {};
  projects.forEach(p => { resultsByProj[p.id] = []; });
  results.forEach(r => { if (resultsByProj[r.projectId]) resultsByProj[r.projectId].push(r); });

  return { results, empTotals, projTotals, grandTotal, resultsByProj };
}

// Count projects per employee
export function getEmpProjectCounts(participation) {
  const counts = {};
  participation.forEach(p => {
    if (!counts[p.empId]) counts[p.empId] = new Set();
    counts[p.empId].add(p.projectId);
  });
  const result = {};
  Object.keys(counts).forEach(k => { result[k] = counts[k].size; });
  return result;
}
