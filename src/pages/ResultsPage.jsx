import React, { useState } from 'react';
import { getProjectColor } from '../data/constants';
import { getProjectCeiling } from '../utils/calculations';
import { exportToExcel } from '../utils/excelIO';

const fmt = n => Math.round(n).toLocaleString('ru-RU');

const Th = ({ children, w, align }) => (
  <th style={{ padding: '8px 10px', fontSize: 12, fontWeight: 500, textAlign: align || 'left', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap', width: w }}>{children}</th>
);
const Td = ({ children, align, style: sx }) => (
  <td style={{ padding: '6px 10px', fontSize: 13, borderBottom: '1px solid #f3f4f6', textAlign: align || 'left', verticalAlign: 'middle', ...sx }}>{children}</td>
);

export default function ResultsPage({ employees, projects, participation, settings, calcData }) {
  const [payoutMode, setPayoutMode] = useState('quarterly');
  const { results, empTotals, projTotals, grandTotal, resultsByProj } = calcData;

  const PERIODS = payoutMode === 'quarterly' ? ['Q1', 'Q2', 'Q3', 'Q4'] : ['H1', 'H2'];

  // Payout schedule: per employee per period
  const payoutSchedule = {};
  results.forEach(r => {
    if (!payoutSchedule[r.empId]) payoutSchedule[r.empId] = {};
    const p = payoutMode === 'quarterly' ? r.period : (r.period === 'Q1' || r.period === 'Q2' || r.period === 'H1' ? 'H1' : 'H2');
    payoutSchedule[r.empId][p] = (payoutSchedule[r.empId][p] || 0) + r.bonus;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, color: '#A32D2D' }}>Расчёт премий</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => exportToExcel(results, employees, projects, empTotals, settings)}
            style={{ padding: '6px 14px', borderRadius: 6, border: 'none', fontSize: 13, cursor: 'pointer', fontWeight: 500, background: '#15803d', color: '#fff' }}
          >
            Экспорт Excel
          </button>
          <button
            onClick={() => window.print()}
            style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, cursor: 'pointer', fontWeight: 500, background: '#fff' }}
          >
            Печать
          </button>
        </div>
      </div>

      {/* Per-project detail tables */}
      {projects.map((proj, pi) => {
        const rows = resultsByProj[proj.id] || [];
        if (rows.length === 0) return null;
        const col = getProjectColor(pi);
        const pt = projTotals[proj.id] || 0;

        // Group by employee
        const empOrder = [];
        const byEmp = {};
        rows.forEach(r => {
          if (!byEmp[r.empId]) { byEmp[r.empId] = []; empOrder.push(r.empId); }
          byEmp[r.empId].push(r);
        });

        return (
          <div key={proj.id} style={{ marginBottom: 28 }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <td colSpan={99} style={{ padding: '10px 12px 6px', fontWeight: 600, fontSize: 14, color: col, borderBottom: `2px solid ${col}` }}>
                      {proj.name}
                      <span style={{ fontWeight: 400, fontSize: 12, color: '#9ca3af', marginLeft: 8 }}>
                        ({rows.length} начислений)
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <Th>ФИО</Th>
                    <Th w="44px">Роль</Th>
                    <Th>Контрольная точка</Th>
                    <Th w="55px" align="right">Вес</Th>
                    <Th w="70px" align="right">Коэфф.</Th>
                    {settings.formulaMode !== 'multiplier' && <Th w="70px" align="right">ABC</Th>}
                    <Th w="120px" align="right">Премия</Th>
                    <Th w="60px">Период</Th>
                    <Th>Примечание</Th>
                  </tr>
                </thead>
                <tbody>
                  {empOrder.map(eId => {
                    const empRows = byEmp[eId];
                    const empTotal = empRows.reduce((s, r) => s + r.bonus, 0);
                    const emp = employees.find(e => e.id === eId);
                    const ceil = emp ? getProjectCeiling(emp) : 0;
                    const exceeded = empTotals[eId]?.total > ceil;

                    return empRows.map((r, i) => (
                      <React.Fragment key={`${eId}-${i}`}>
                        <tr style={exceeded ? { background: '#fff1f1' } : {}}>
                          {i === 0
                            ? <Td style={{ fontWeight: 600, borderBottom: 'none' }}>{r.empName}</Td>
                            : <Td style={{ borderBottom: 'none', color: 'transparent', fontSize: 1 }}>.</Td>}
                          {i === 0
                            ? <Td style={{ borderBottom: 'none' }}>{r.role}</Td>
                            : <Td style={{ borderBottom: 'none' }}></Td>}
                          <Td>{r.cpName}</Td>
                          <Td align="right">{r.weight}%</Td>
                          <Td align="right">{r.pc.toFixed(2)}</Td>
                          {settings.formulaMode !== 'multiplier' && (
                            <Td align="right">{r.abcGrade} × {r.abcC.toFixed(1)}</Td>
                          )}
                          <Td align="right"><strong>{fmt(r.bonus)}</strong></Td>
                          <Td>{r.period}</Td>
                          <Td style={{ fontSize: 12, color: '#9ca3af' }}>{r.note}</Td>
                        </tr>
                        {i === empRows.length - 1 && (
                          <tr>
                            <td
                              colSpan={settings.formulaMode !== 'multiplier' ? 6 : 5}
                              style={{ padding: '4px 12px', textAlign: 'right', fontSize: 12, fontWeight: 500, color: '#6b7280', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}
                            >
                              Итого {r.empName}:
                            </td>
                            <td style={{ padding: '4px 12px', textAlign: 'right', fontSize: 13, fontWeight: 600, borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                              {fmt(empTotal)}
                            </td>
                            <td colSpan={2} style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}></td>
                          </tr>
                        )}
                      </React.Fragment>
                    ));
                  })}
                  <tr>
                    <td colSpan={99} style={{
                      padding: '8px 12px', textAlign: 'right', fontWeight: 500, fontSize: 13,
                      borderBottom: `2px solid ${col}44`, background: `${col}0d`, color: col,
                    }}>
                      Итого по проекту: <strong style={{ fontSize: 15 }}>{fmt(pt)}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* Grand total */}
      <div style={{
        padding: '14px 18px', borderRadius: 8,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: '#f9fafb', border: '1px solid #e5e7eb', marginBottom: 28,
      }}>
        <span style={{ fontWeight: 500, fontSize: 16 }}>Общий итог по всем проектам</span>
        <span style={{ fontWeight: 700, fontSize: 20, color: '#A32D2D' }}>{fmt(grandTotal)}</span>
      </div>

      {/* Payout schedule */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#A32D2D' }}>График выплат</h3>
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { key: 'quarterly', label: 'Квартально' },
              { key: 'biannual', label: 'Полугодично' },
            ].map(m => (
              <button
                key={m.key}
                onClick={() => setPayoutMode(m.key)}
                style={{
                  padding: '4px 12px', borderRadius: 6, border: 'none', fontSize: 12,
                  cursor: 'pointer', fontWeight: 500,
                  background: payoutMode === m.key ? '#A32D2D' : '#f3f4f6',
                  color: payoutMode === m.key ? '#fff' : '#374151',
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <Th>ФИО</Th>
                <Th w="44px">Роль</Th>
                {PERIODS.map(p => <Th key={p} w="110px" align="right">{p}</Th>)}
                <Th w="120px" align="right">Итого</Th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => {
                const d = payoutSchedule[emp.id] || {};
                const total = Object.values(d).reduce((s, v) => s + v, 0);
                if (total === 0) return null;
                return (
                  <tr key={emp.id}>
                    <Td>{emp.name}</Td>
                    <Td>{emp.role}</Td>
                    {PERIODS.map(p => (
                      <Td key={p} align="right" style={{ fontSize: 12 }}>
                        {d[p] ? fmt(d[p]) : '—'}
                      </Td>
                    ))}
                    <Td align="right"><strong>{fmt(total)}</strong></Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee summary */}
      <h3 style={{ fontSize: 15, fontWeight: 600, color: '#A32D2D', marginBottom: 10 }}>
        Сводка по сотрудникам
      </h3>
      <div style={{ overflowX: 'auto', marginBottom: 24 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <Th>ФИО</Th>
              <Th w="44px">Роль</Th>
              <Th w="60px">ABC</Th>
              {projects.map((p, i) => (
                <Th key={p.id} w="100px" align="right">
                  <span style={{ color: getProjectColor(i), fontSize: 11 }}>
                    {p.name.split('—')[0].trim()}
                  </span>
                </Th>
              ))}
              <Th w="110px" align="right">Итого</Th>
              <Th w="130px" align="right">Потолок (проектн.)</Th>
              <Th w="100px" align="right">Остаток</Th>
              <Th w="80px">Статус</Th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => {
              const d = empTotals[emp.id] || { total: 0, byProj: {} };
              const ceil = getProjectCeiling(emp);
              const exc = d.total > ceil;
              return (
                <tr key={emp.id} style={exc ? { background: '#fff1f1' } : {}}>
                  <Td>{emp.name}</Td>
                  <Td>{emp.role}</Td>
                  <Td>{emp.abcGrade}</Td>
                  {projects.map(p => (
                    <Td key={p.id} align="right" style={{ fontSize: 12 }}>
                      {d.byProj[p.id] ? fmt(d.byProj[p.id]) : '—'}
                    </Td>
                  ))}
                  <Td align="right"><strong>{fmt(d.total)}</strong></Td>
                  <Td align="right">{fmt(ceil)}</Td>
                  <Td align="right" style={{ color: exc ? '#dc2626' : '#15803d' }}>
                    {fmt(ceil - d.total)}
                  </Td>
                  <Td>
                    <span style={{
                      padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                      background: exc ? '#fee2e2' : '#dcfce7',
                      color: exc ? '#dc2626' : '#15803d',
                    }}>
                      {exc ? 'Превышение!' : 'ОК'}
                    </span>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Formula explanation */}
      <div style={{ padding: 14, borderRadius: 8, background: '#f9fafb', border: '1px solid #e5e7eb', fontSize: 12, color: '#6b7280', lineHeight: 1.7 }}>
        <strong>Формула ({settings.formulaMode === 'multiplier' ? 'множитель' : 'компонентная'}):</strong>{' '}
        {settings.formulaMode === 'multiplier'
          ? 'Премия = Проектный потолок × Вес КТ (%) × Коэфф. участия × ABC коэфф.'
          : `Премия = Проектный потолок × (Вехи×${settings.componentWeights.milestones}% + Бюджет×${settings.componentWeights.budget}% + ABC×${settings.componentWeights.abc}%) / 100`}
        <br />
        <strong>Проектная доля:</strong> PM/BA = 100% годового потолка | S = 1/3 годового потолка
        <br />
        <strong>Ограничение:</strong> Сумма всех премий ≤ Годовой потолок (N окладов)
        {results.some(r => r.abcC === 0) && (
          <div style={{ marginTop: 6, color: '#dc2626' }}>
            ⚠ Некоторые сотрудники имеют ABC коэфф. = 0 (B−, C или новички) — их премии равны нулю.
          </div>
        )}
      </div>
    </div>
  );
}
