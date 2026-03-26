import React, { useState } from 'react';
import { getProjectColor } from '../data/constants';
import { getProjectCeiling } from '../utils/calculations';
import { exportToExcel } from '../utils/excelIO';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert';
import { toastManager } from '../components/ui/toast';
import { Tooltip, TooltipTrigger, TooltipPopup, TooltipProvider } from '../components/ui/tooltip';
import { Card, CardPanel } from '../components/ui/card';
import { AlertTriangle } from 'lucide-react';

const roleVariant = r => r === 'A' ? 'info' : r === 'BA' ? 'secondary' : 'outline';
const abcVariant = g => (g === 'A' || g === 'B+') ? 'success' : g === 'B' ? 'secondary' : 'error';
const fmt = n => Math.round(n).toLocaleString('ru-RU');

const Th = ({ children, w, align }) => (
  <th
    className={`px-2.5 py-2 text-xs font-medium bg-muted border-b whitespace-nowrap ${align === 'right' ? 'text-right' : 'text-left'}`}
    style={w ? { width: w } : undefined}
  >{children}</th>
);
const Td = ({ children, align, style: sx, className: cx = '' }) => (
  <td
    className={`px-2.5 py-1.5 text-[13px] border-b border-border/40 align-middle ${align === 'right' ? 'text-right' : 'text-left'} ${cx}`}
    style={sx}
  >{children}</td>
);

export default function ResultsPage({ employees, projects, participation, settings, calcData }) {
  const [payoutMode, setPayoutMode] = useState('quarterly');
  const { results, empTotals, projTotals, grandTotal, resultsByProj } = calcData;

  const PERIODS = payoutMode === 'quarterly' ? ['Q1', 'Q2', 'Q3', 'Q4'] : ['H1', 'H2'];

  const payoutSchedule = {};
  results.forEach(r => {
    if (!payoutSchedule[r.empId]) payoutSchedule[r.empId] = {};
    const p = payoutMode === 'quarterly'
      ? r.period
      : r.period.startsWith('H') ? r.period : (r.period === 'Q1' || r.period === 'Q2' ? 'H1' : 'H2');
    payoutSchedule[r.empId][p] = (payoutSchedule[r.empId][p] || 0) + r.bonus;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-[17px] font-semibold" style={{ color: '#A32D2D' }}>Расчёт премий</h2>
        <div className="flex gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              exportToExcel(results, employees, projects, empTotals, settings);
              toastManager.add({ title: 'Экспорт готов', description: 'Файл Excel сохранён.', variant: 'success' });
            }}
          >
            Экспорт Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>Печать</Button>
        </div>
      </div>

      {/* Per-project detail tables */}
      {projects.map((proj, pi) => {
        const rows = resultsByProj[proj.id] || [];
        if (rows.length === 0) return null;
        const col = getProjectColor(pi);
        const pt = projTotals[proj.id] || 0;

        const empOrder = [];
        const byEmp = {};
        rows.forEach(r => {
          if (!byEmp[r.empId]) { byEmp[r.empId] = []; empOrder.push(r.empId); }
          byEmp[r.empId].push(r);
        });

        return (
          <div key={proj.id} className="mb-7">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <td
                      colSpan={99}
                      className="px-3 pt-2.5 pb-1.5 font-semibold text-sm"
                      style={{ color: col, borderBottom: `2px solid ${col}` }}
                    >
                      {proj.name}
                      <span className="font-normal text-xs text-muted-foreground ml-2">
                        ({rows.length} начислений)
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <Th>ФИО</Th>
                    <Th w="44px">Роль</Th>
                    <Th>Контрольная точка</Th>
                    <Th w="55px" align="right">Вес</Th>
                    <Th w="70px" align="right">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger render={<span className="cursor-help underline decoration-dotted" />}>
                            Коэфф.
                          </TooltipTrigger>
                          <TooltipPopup>Коэффициент участия = факт.дни / план.дни, не более 1.0</TooltipPopup>
                        </Tooltip>
                      </TooltipProvider>
                    </Th>
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
                        <tr className={exceeded ? 'bg-red-50' : ''}>
                          {i === 0
                            ? <Td className="font-semibold border-b-0">{r.empName}</Td>
                            : <Td className="border-b-0" style={{ color: 'transparent', fontSize: 1 }}>.</Td>}
                          {i === 0
                            ? <Td className="border-b-0"><Badge variant={roleVariant(r.role)}>{r.role}</Badge></Td>
                            : <Td className="border-b-0"></Td>}
                          <Td>{r.cpName}</Td>
                          <Td align="right">{r.weight}%</Td>
                          <Td align="right">{r.pc.toFixed(2)}</Td>
                          {settings.formulaMode !== 'multiplier' && (
                            <Td align="right">{r.abcGrade} × {r.abcC.toFixed(1)}</Td>
                          )}
                          <Td align="right"><strong>{fmt(r.bonus)}</strong></Td>
                          <Td>{r.period}</Td>
                          <Td className="text-xs text-muted-foreground">{r.note}</Td>
                        </tr>
                        {i === empRows.length - 1 && (
                          <tr>
                            <td
                              colSpan={settings.formulaMode !== 'multiplier' ? 6 : 5}
                              className="px-3 py-1 text-right text-xs font-medium text-muted-foreground border-b bg-muted"
                            >
                              Итого {r.empName}:
                            </td>
                            <td className="px-3 py-1 text-right text-[13px] font-semibold border-b bg-muted">
                              {fmt(empTotal)}
                            </td>
                            <td colSpan={2} className="border-b bg-muted"></td>
                          </tr>
                        )}
                      </React.Fragment>
                    ));
                  })}
                  <tr>
                    <td
                      colSpan={99}
                      className="px-3 py-2 text-right font-medium text-[13px]"
                      style={{ borderBottom: `2px solid ${col}44`, background: `${col}0d`, color: col }}
                    >
                      Итого по проекту: <strong className="text-[15px]">{fmt(pt)}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* Grand total */}
      <Card className="mb-7">
        <CardPanel className="flex justify-between items-center">
          <span className="font-medium text-base">Общий итог по всем проектам</span>
          <span className="font-bold text-xl" style={{ color: '#A32D2D' }}>{fmt(grandTotal)}</span>
        </CardPanel>
      </Card>

      {/* Payout schedule */}
      <div className="mb-7">
        <div className="flex justify-between items-center mb-2.5">
          <h3 className="text-[15px] font-semibold" style={{ color: '#A32D2D' }}>График выплат</h3>
          <div className="flex gap-1.5">
            {[
              { key: 'quarterly', label: 'Квартально' },
              { key: 'biannual', label: 'Полугодично' },
            ].map(m => (
              <Button
                key={m.key}
                size="sm"
                variant={payoutMode === m.key ? 'default' : 'ghost'}
                onClick={() => setPayoutMode(m.key)}
              >
                {m.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
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
                    <Td><Badge variant={roleVariant(emp.role)}>{emp.role}</Badge></Td>
                    {PERIODS.map(p => (
                      <Td key={p} align="right" className="text-xs">
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
      <h3 className="text-[15px] font-semibold mb-2.5" style={{ color: '#A32D2D' }}>
        Сводка по сотрудникам
      </h3>
      {employees.some(emp => (empTotals[emp.id]?.total || 0) > getProjectCeiling(emp)) && (
        <Alert variant="error" className="mb-4">
          <AlertTriangle />
          <AlertTitle>Превышение проектного потолка</AlertTitle>
          <AlertDescription>
            Один или несколько сотрудников получили премию сверх проектной доли годового потолка.
          </AlertDescription>
        </Alert>
      )}
      <div className="overflow-x-auto mb-6">
        <table className="w-full border-collapse">
          <thead>
            <TooltipProvider>
              <tr>
                <Th>ФИО</Th>
                <Th w="44px">Роль</Th>
                <Th w="60px">ABC</Th>
                {projects.map((p, i) => (
                  <Th key={p.id} w="100px" align="right">
                    <span className="text-[11px]" style={{ color: getProjectColor(i) }}>
                      {p.name.split('—')[0].trim()}
                    </span>
                  </Th>
                ))}
                <Th w="110px" align="right">Итого</Th>
                <Th w="130px" align="right">
                  <Tooltip>
                    <TooltipTrigger render={<span className="cursor-help underline decoration-dotted" />}>
                      Потолок (проектн.)
                    </TooltipTrigger>
                    <TooltipPopup>PM/BA = оклад × множитель. S = 1/3 от этой суммы</TooltipPopup>
                  </Tooltip>
                </Th>
                <Th w="100px" align="right">Остаток</Th>
                <Th w="80px">Статус</Th>
              </tr>
            </TooltipProvider>
          </thead>
          <tbody>
            {employees.map(emp => {
              const d = empTotals[emp.id] || { total: 0, byProj: {} };
              const ceil = getProjectCeiling(emp);
              const exc = d.total > ceil;
              return (
                <tr key={emp.id} className={exc ? 'bg-red-50' : ''}>
                  <Td>{emp.name}</Td>
                  <Td><Badge variant={roleVariant(emp.role)}>{emp.role}</Badge></Td>
                  <Td><Badge variant={abcVariant(emp.abcGrade)}>{emp.abcGrade}</Badge></Td>
                  {projects.map(p => (
                    <Td key={p.id} align="right" className="text-xs">
                      {d.byProj[p.id] ? fmt(d.byProj[p.id]) : '—'}
                    </Td>
                  ))}
                  <Td align="right"><strong>{fmt(d.total)}</strong></Td>
                  <Td align="right">{fmt(ceil)}</Td>
                  <Td align="right" style={{ color: exc ? '#dc2626' : '#15803d' }}>
                    {fmt(ceil - d.total)}
                  </Td>
                  <Td>
                    <Badge variant={exc ? 'error' : 'success'}>
                      {exc ? 'Превышение!' : 'ОК'}
                    </Badge>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Formula explanation */}
      <div className="p-3.5 rounded-lg bg-muted/50 border text-xs text-muted-foreground leading-relaxed">
        <strong>Формула ({settings.formulaMode === 'multiplier' ? 'множитель' : 'компонентная'}):</strong>{' '}
        {settings.formulaMode === 'multiplier'
          ? 'Премия = Проектный потолок × Вес КТ (%) × Коэфф. участия × ABC коэфф.'
          : `Премия = Проектный потолок × (Вехи×${settings.componentWeights.milestones}% + Бюджет×${settings.componentWeights.budget}% + ABC×${settings.componentWeights.abc}%) / 100`}
        <br />
        <strong>Проектная доля:</strong> PM/BA = 100% годового потолка | S = 1/3 годового потолка
        <br />
        <strong>Ограничение:</strong> Сумма всех премий ≤ Годовой потолок (N окладов)
      </div>
      {results.some(r => r.abcC === 0) && (
        <Alert variant="warning" className="mt-3">
          <AlertTriangle />
          <AlertTitle>Нулевые коэффициенты ABC</AlertTitle>
          <AlertDescription>
            Некоторые сотрудники имеют ABC коэфф. = 0 (B−, C или новички) — их премии равны нулю.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
