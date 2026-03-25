import React, { useRef } from 'react';
import { ROLES, ABC_GRADES } from '../data/constants';
import { getProjectCeiling, isNewcomer } from '../utils/calculations';
import { importEmployeesFromExcel } from '../utils/excelIO';

const fmt = n => Math.round(n).toLocaleString('ru-RU');

const S = {
  input: { padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, background: '#fff', outline: 'none', width: '100%', boxSizing: 'border-box' },
  btn: { padding: '6px 14px', borderRadius: 6, border: 'none', fontSize: 13, cursor: 'pointer', fontWeight: 500 },
};

const Th = ({ children, w, align }) => (
  <th style={{ padding: '8px 10px', fontSize: 12, fontWeight: 500, textAlign: align || 'left', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap', width: w }}>{children}</th>
);
const Td = ({ children, align, style: sx }) => (
  <td style={{ padding: '6px 10px', fontSize: 13, borderBottom: '1px solid #f3f4f6', textAlign: align || 'left', verticalAlign: 'middle', ...sx }}>{children}</td>
);

export default function EmployeesPage({ employees, empProjCount, settings, upEmp, addEmp, delEmp, setEmployees }) {
  const fileRef = useRef(null);

  const totalCeiling = employees.reduce((s, emp) => s + emp.salary * emp.ceilingMultiplier, 0);
  const totalProjectFund = employees.reduce((s, emp) => s + getProjectCeiling(emp), 0);

  async function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importEmployeesFromExcel(file);
      if (imported.length > 0) {
        if (window.confirm(`Импортировать ${imported.length} сотрудников? Существующие данные будут заменены.`)) {
          setEmployees(imported);
        }
      }
    } catch (err) {
      alert('Ошибка при импорте: ' + err.message);
    }
    e.target.value = '';
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, color: '#1D9E75' }}>Сотрудники</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleImport} />
          <button onClick={() => fileRef.current?.click()} style={{ ...S.btn, background: '#ecfdf5', color: '#065f46' }}>
            Импорт Excel
          </button>
          <button onClick={addEmp} style={{ ...S.btn, background: '#1D9E75', color: '#fff' }}>
            + Сотрудник
          </button>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <Th>ФИО</Th>
              <Th w="150px">Роль</Th>
              <Th w="120px">Оклад</Th>
              <Th w="90px">Кол-во окл.</Th>
              <Th w="120px" align="right">Потолок/год</Th>
              <Th w="120px" align="right">Проектн. доля</Th>
              <Th w="80px">ABC</Th>
              <Th w="80px" align="right">ABC коэфф.</Th>
              <Th w="120px">Дата найма</Th>
              <Th w="70px" align="center">Проекты</Th>
              <Th w="36px"></Th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => {
              const fullCeil = emp.salary * emp.ceilingMultiplier;
              const projCeil = getProjectCeiling(emp);
              const projCount = empProjCount[emp.id] || 0;
              const limitMax = settings.projectLimitExceptions?.[emp.id] ?? settings.projectLimitMax;
              const overLimit = settings.projectLimitEnabled && projCount > limitMax;
              const newcomer = settings.newcomerEnabled && isNewcomer(emp.hireDate, settings.newcomerMonths);
              const abcC = newcomer
                ? (settings.newcomerAbcCoeffs[emp.abcGrade] ?? 0)
                : (settings.abcCoeffs[emp.abcGrade] ?? 1);

              return (
                <tr key={emp.id}>
                  <Td>
                    <input
                      style={S.input}
                      value={emp.name}
                      onChange={e => upEmp(emp.id, 'name', e.target.value)}
                      placeholder="ФИО"
                    />
                  </Td>
                  <Td>
                    <select style={S.input} value={emp.role} onChange={e => upEmp(emp.id, 'role', e.target.value)}>
                      {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </Td>
                  <Td>
                    <input
                      style={{ ...S.input, textAlign: 'right' }}
                      type="number"
                      value={emp.salary || ''}
                      onChange={e => upEmp(emp.id, 'salary', +e.target.value)}
                    />
                  </Td>
                  <Td>
                    <input
                      style={{ ...S.input, textAlign: 'right', width: 70 }}
                      type="number"
                      step={0.5}
                      value={emp.ceilingMultiplier || ''}
                      onChange={e => upEmp(emp.id, 'ceilingMultiplier', +e.target.value)}
                    />
                  </Td>
                  <Td align="right">{fmt(fullCeil)}</Td>
                  <Td align="right">
                    {fmt(projCeil)}
                    {emp.role === 'S' && <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 4 }}>(1/3)</span>}
                  </Td>
                  <Td>
                    <select style={S.input} value={emp.abcGrade || 'B'} onChange={e => upEmp(emp.id, 'abcGrade', e.target.value)}>
                      {ABC_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </Td>
                  <Td align="right">
                    <span style={{ fontWeight: 500 }}>{abcC.toFixed(1)}</span>
                    {newcomer && (
                      <span style={{ fontSize: 10, background: '#fef3c7', color: '#92400e', borderRadius: 4, padding: '1px 5px', marginLeft: 4 }}>новичок</span>
                    )}
                  </Td>
                  <Td>
                    <input
                      type="date"
                      style={S.input}
                      value={emp.hireDate || ''}
                      onChange={e => upEmp(emp.id, 'hireDate', e.target.value)}
                    />
                  </Td>
                  <Td align="center">
                    <span style={{
                      fontWeight: 600,
                      color: overLimit ? '#dc2626' : '#374151',
                      background: overLimit ? '#fee2e2' : 'transparent',
                      borderRadius: 4,
                      padding: overLimit ? '2px 8px' : 0,
                    }}>
                      {projCount}
                      {overLimit && <span style={{ fontSize: 10 }}>/{limitMax}</span>}
                    </span>
                  </Td>
                  <Td>
                    <button
                      onClick={() => delEmp(emp.id)}
                      style={{ ...S.btn, background: 'transparent', color: '#dc2626', padding: '2px 8px', fontSize: 16 }}
                    >×</button>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary footer */}
      <div style={{
        marginTop: 16, padding: '14px 18px', borderRadius: 8,
        background: '#f9fafb', border: '1px solid #e5e7eb',
        display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>Сотрудников</div>
          <div style={{ fontSize: 18, fontWeight: 500 }}>{employees.length}</div>
        </div>
        <div style={{ width: 1, height: 36, background: '#e5e7eb' }} />
        <div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>Общий премиальный фонд</div>
          <div style={{ fontSize: 18, fontWeight: 500 }}>{fmt(totalCeiling)}</div>
        </div>
        <div style={{ width: 1, height: 36, background: '#e5e7eb' }} />
        <div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>Плановый проектный фонд</div>
          <div style={{ fontSize: 18, fontWeight: 500, color: '#1D9E75' }}>{fmt(totalProjectFund)}</div>
        </div>
      </div>
    </div>
  );
}
