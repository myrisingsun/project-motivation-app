import React from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import { getProjectColor } from '../data/constants';
import { getProjectCeiling } from '../utils/calculations';

const fmt = n => Math.round(n).toLocaleString('ru-RU');

function StatCard({ label, value, sub, color = '#374151' }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '14px 18px', minWidth: 160 }}>
      <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export default function DashboardPage({ employees, projects, participation, calcData, empProjCount, settings }) {
  const { empTotals, projTotals, grandTotal, results } = calcData;

  // Fund distribution by project
  const pieData = projects
    .map((p, i) => ({ name: p.name.split('—')[0].trim(), value: Math.round(projTotals[p.id] || 0), color: getProjectColor(i) }))
    .filter(d => d.value > 0);

  // Employee ceiling usage
  const ceilingData = employees
    .map(emp => {
      const ceil = getProjectCeiling(emp);
      const accrued = empTotals[emp.id]?.total || 0;
      return {
        name: emp.name.split(' ')[0],
        Начислено: Math.round(accrued),
        Остаток: Math.max(0, Math.round(ceil - accrued)),
        Потолок: Math.round(ceil),
        exceeded: accrued > ceil,
      };
    })
    .filter(d => d.Потолок > 0);

  // Quarterly payout
  const qData = ['Q1', 'Q2', 'Q3', 'Q4'].map(q => {
    const total = results.filter(r => r.period === q).reduce((s, r) => s + r.bonus, 0);
    return { name: q, Сумма: Math.round(total) };
  });

  // Summary stats
  const totalProjectFund = employees.reduce((s, e) => s + getProjectCeiling(e), 0);
  const usagePercent = totalProjectFund > 0 ? Math.round(grandTotal / totalProjectFund * 100) : 0;
  const overLimitCount = settings.projectLimitEnabled
    ? employees.filter(e => {
        const limit = settings.projectLimitExceptions?.[e.id] ?? settings.projectLimitMax;
        return (empProjCount[e.id] || 0) > limit;
      }).length
    : 0;

  return (
    <div>
      <h2 style={{ fontSize: 17, fontWeight: 600, color: '#0F6E56', marginBottom: 16 }}>Дашборд</h2>

      {/* Summary stats */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <StatCard label="Общий итог начислений" value={fmt(grandTotal)} sub="руб." color="#A32D2D" />
        <StatCard label="Использование фонда" value={`${usagePercent}%`} sub={`из ${fmt(totalProjectFund)} руб.`} color="#185FA5" />
        <StatCard label="Сотрудников" value={employees.length} sub={`в ${projects.length} проектах`} />
        {overLimitCount > 0 && (
          <StatCard label="Превышение лимита" value={overLimitCount} sub="сотрудников" color="#dc2626" />
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20, marginBottom: 24 }}>
        {/* Pie chart: fund by project */}
        {pieData.length > 0 && (
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 12 }}>Распределение фонда по проектам</div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`}
                  labelLine={false}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={v => fmt(v) + ' руб.'} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {pieData.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                  <span style={{ color: '#374151' }}>{d.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quarterly payout bar chart */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 12 }}>Выплаты по кварталам</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={qData} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => (v / 1000).toFixed(0) + 'k'} />
              <Tooltip formatter={v => fmt(v) + ' руб.'} />
              <Bar dataKey="Сумма" fill="#A32D2D" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Employee ceiling usage bar chart */}
      {ceilingData.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 12 }}>Использование потолка по сотрудникам</div>
          <ResponsiveContainer width="100%" height={Math.max(220, ceilingData.length * 36)}>
            <BarChart data={ceilingData} layout="vertical" margin={{ top: 4, right: 40, bottom: 4, left: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => (v / 1000).toFixed(0) + 'k'} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={55} />
              <Tooltip formatter={v => fmt(v) + ' руб.'} />
              <Legend iconType="square" iconSize={10} />
              <Bar dataKey="Начислено" stackId="a" fill="#A32D2D" />
              <Bar dataKey="Остаток" stackId="a" fill="#e5e7eb" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Project participation load */}
      {projects.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 12 }}>Загрузка по проектам</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {projects.map((proj, pi) => {
              const col = getProjectColor(pi);
              const empIds = new Set(participation.filter(p => p.projectId === proj.id).map(p => p.empId));
              const projBonus = projTotals[proj.id] || 0;
              return (
                <div key={proj.id} style={{ border: `1px solid ${col}44`, borderLeft: `4px solid ${col}`, borderRadius: 6, padding: '10px 14px', minWidth: 200, flex: '1 1 200px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: col, marginBottom: 4 }}>{proj.name}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>
                    Участников: <strong>{empIds.size}</strong>
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>
                    КТ: <strong>{proj.checkpoints.length}</strong>
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                    Начислено: <strong style={{ color: col }}>{fmt(projBonus)} руб.</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
