import React from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import { getProjectColor } from '../data/constants';
import { getProjectCeiling } from '../utils/calculations';
import {
  Card, CardHeader, CardTitle, CardDescription, CardPanel,
} from '../components/ui/card';
import { Separator } from '../components/ui/separator';

const fmt = n => Math.round(n).toLocaleString('ru-RU');

function StatCard({ label, value, sub, color = '#374151' }) {
  return (
    <Card className="min-w-[160px]">
      <CardPanel className="py-3.5 px-[18px]">
        <div className="text-[11px] text-muted-foreground mb-1">{label}</div>
        <div className="text-[22px] font-bold" style={{ color }}>{value}</div>
        {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
      </CardPanel>
    </Card>
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
    <div className="flex flex-col gap-6">
      <h2 className="text-[17px] font-semibold" style={{ color: '#0F6E56' }}>Дашборд</h2>

      {/* Summary stats */}
      <div className="flex gap-3 flex-wrap">
        <StatCard label="Общий итог начислений" value={fmt(grandTotal)} sub="руб." color="#A32D2D" />
        <StatCard label="Использование фонда" value={`${usagePercent}%`} sub={`из ${fmt(totalProjectFund)} руб.`} color="#185FA5" />
        <StatCard label="Сотрудников" value={employees.length} sub={`в ${projects.length} проектах`} />
        {overLimitCount > 0 && (
          <StatCard label="Превышение лимита" value={overLimitCount} sub="сотрудников" color="#dc2626" />
        )}
      </div>

      <Separator />

      {/* Top charts: pie + quarterly bar */}
      <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))' }}>
        {pieData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Распределение фонда по проектам</CardTitle>
              <CardDescription>Доля начислений каждого проекта в общем фонде</CardDescription>
            </CardHeader>
            <CardPanel>
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
              <div className="flex flex-wrap gap-2 mt-2">
                {pieData.map((d, i) => (
                  <div key={i} className="flex items-center gap-1 text-xs">
                    <div className="w-2.5 h-2.5 rounded-[2px] shrink-0" style={{ background: d.color }} />
                    <span className="text-foreground">{d.name}</span>
                  </div>
                ))}
              </div>
            </CardPanel>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Выплаты по кварталам</CardTitle>
            <CardDescription>Суммарные начисления за каждый квартал</CardDescription>
          </CardHeader>
          <CardPanel>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={qData} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => (v / 1000).toFixed(0) + 'k'} />
                <Tooltip formatter={v => fmt(v) + ' руб.'} />
                <Bar dataKey="Сумма" fill="#A32D2D" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardPanel>
        </Card>
      </div>

      <Separator />

      {/* Employee ceiling usage */}
      {ceilingData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Использование потолка по сотрудникам</CardTitle>
            <CardDescription>Начисленные премии относительно проектной доли годового потолка</CardDescription>
          </CardHeader>
          <CardPanel>
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
          </CardPanel>
        </Card>
      )}

      <Separator />

      {/* Project participation load */}
      {projects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Загрузка по проектам</CardTitle>
            <CardDescription>Количество участников, контрольных точек и начислений по каждому проекту</CardDescription>
          </CardHeader>
          <CardPanel>
            <div className="flex flex-wrap gap-3">
              {projects.map((proj, pi) => {
                const col = getProjectColor(pi);
                const empIds = new Set(participation.filter(p => p.projectId === proj.id).map(p => p.empId));
                const projBonus = projTotals[proj.id] || 0;
                return (
                  <div
                    key={proj.id}
                    className="rounded-md p-3 min-w-[200px] flex-[1_1_200px]"
                    style={{ border: `1px solid ${col}44`, borderLeft: `4px solid ${col}` }}
                  >
                    <div className="text-[13px] font-semibold mb-1" style={{ color: col }}>{proj.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Участников: <strong>{empIds.size}</strong>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      КТ: <strong>{proj.checkpoints.length}</strong>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Начислено: <strong style={{ color: col }}>{fmt(projBonus)} руб.</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardPanel>
        </Card>
      )}
    </div>
  );
}
