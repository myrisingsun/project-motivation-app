import React, { useState, useMemo } from 'react';
import { PAYOUT_PERIODS, getProjectColor } from '../data/constants';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Select, SelectTrigger, SelectValue, SelectPopup, SelectItem,
} from '../components/ui/select';
// Note: employee/checkpoint selects use native <select> for reliable numeric-ID matching
import { Alert, AlertDescription } from '../components/ui/alert';
import { AlertTriangle } from 'lucide-react';

const Th = ({ children, w, align }) => (
  <th
    className={`px-2.5 py-2 text-xs font-medium bg-muted border-b whitespace-nowrap ${align === 'right' ? 'text-right' : 'text-left'}`}
    style={w ? { width: w } : undefined}
  >{children}</th>
);
const Td = ({ children, align, style: sx, className: cx = '' }) => (
  <td
    className={`px-2.5 py-1.5 text-[13px] border-b border-border/40 align-middle ${align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'} ${cx}`}
    style={sx}
  >{children}</td>
);

export default function ParticipationPage({ employees, projects, participation, addPart, delPart, upPart }) {
  const [cpFilters, setCpFilters] = useState({});

  const partByProj = useMemo(() => {
    const g = {};
    projects.forEach(p => { g[p.id] = []; });
    participation.forEach(r => { if (g[r.projectId]) g[r.projectId].push(r); });
    return g;
  }, [participation, projects]);

  const incompleteCount = participation.filter(r => !r.empId || !r.checkpointId).length;

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-[17px] font-semibold" style={{ color: '#D85A30' }}>Участие в проектах</h2>
        <Button variant="default" size="sm" onClick={addPart}>+ Запись об участии</Button>
      </div>

      {incompleteCount > 0 && (
        <Alert variant="warning" className="mb-4">
          <AlertTriangle />
          <AlertDescription>
            {incompleteCount} {incompleteCount === 1 ? 'запись не заполнена' : 'записи не заполнены'} (выделены жёлтым) — они не учитываются в расчёте.
          </AlertDescription>
        </Alert>
      )}

      {projects.map((proj, pi) => {
        const items = partByProj[proj.id] || [];
        const col = getProjectColor(pi);
        const filterVal = cpFilters[proj.id] || 0;
        // eslint-disable-next-line eqeqeq
        const filtered = filterVal === 0 ? items : items.filter(p => p.checkpointId == filterVal);

        return (
          <div key={proj.id} className="mb-7 border rounded-lg overflow-hidden">
            {/* Project header */}
            <div
              className="px-3.5 py-2.5 font-semibold text-sm bg-background flex justify-between items-center"
              style={{ color: col, borderBottom: `2px solid ${col}` }}
            >
              <span>{proj.name}</span>
              <span className="font-normal text-xs text-muted-foreground">
                {filtered.length !== items.length
                  ? `${filtered.length} из ${items.length}`
                  : `${items.length} записей`}
              </span>
            </div>

            {/* Checkpoint filter pills */}
            <div className="flex gap-1.5 flex-wrap px-3 py-2 bg-muted/40 border-b">
              <Button
                size="sm"
                variant={filterVal === 0 ? 'default' : 'ghost'}
                style={filterVal === 0 ? { background: col, borderColor: col } : {}}
                onClick={() => setCpFilters(f => ({ ...f, [proj.id]: 0 }))}
              >Все КТ</Button>
              {proj.checkpoints.map(cp => {
                const active = filterVal === cp.id;
                // eslint-disable-next-line eqeqeq
                const count = items.filter(p => p.checkpointId == cp.id).length;
                return (
                  <Button
                    key={cp.id}
                    size="sm"
                    variant={active ? 'default' : 'ghost'}
                    style={active ? { background: col, borderColor: col } : {}}
                    onClick={() => setCpFilters(f => ({ ...f, [proj.id]: active ? 0 : cp.id }))}
                  >
                    {cp.name} <span className="opacity-70 ml-0.5">({count})</span>
                  </Button>
                );
              })}
            </div>

            {/* Participation table */}
            {filtered.length === 0 ? (
              <div className="px-4 py-3.5 text-[13px] text-muted-foreground italic">
                Нет записей{filterVal !== 0 ? ' по выбранной контрольной точке' : ''}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <Th>Сотрудник</Th>
                      <Th w="44px">Роль</Th>
                      <Th>Контр. точка</Th>
                      <Th w="75px" align="right">План</Th>
                      <Th w="75px" align="right">Факт</Th>
                      <Th w="70px" align="right">Коэфф.</Th>
                      <Th w="65px">Период</Th>
                      <Th>Примечание</Th>
                      <Th w="36px"></Th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(part => {
                      // eslint-disable-next-line eqeqeq
                      const cp = proj.checkpoints.find(c => c.id == part.checkpointId);
                      const coeff = cp && cp.plannedDays > 0 ? Math.min(part.actualDays / cp.plannedDays, 1) : 0;
                      const coeffColor = coeff < 0.5 ? '#dc2626' : coeff < 1 ? '#d97706' : '#15803d';
                      // eslint-disable-next-line eqeqeq
                      const emp = employees.find(e => e.id == part.empId);
                      const incomplete = !part.empId || !part.checkpointId;

                      return (
                        <tr key={part.id} className={incomplete ? 'bg-amber-50' : ''}>
                          <Td>
                            <select
                              className="w-full h-7 rounded-md border border-input bg-background text-[13px] px-2 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                              value={part.empId || ''}
                              onChange={e => upPart(part.id, 'empId', +e.target.value)}
                            >
                              <option value="">— выберите —</option>
                              {employees.map(e => (
                                <option key={e.id} value={e.id}>{e.name || '(без имени)'}</option>
                              ))}
                            </select>
                          </Td>
                          <Td align="center" className="text-xs text-muted-foreground">
                            {emp?.role || '—'}
                          </Td>
                          <Td>
                            <select
                              className="w-full h-7 rounded-md border border-input bg-background text-[13px] px-2 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                              value={part.checkpointId || ''}
                              onChange={e => upPart(part.id, 'checkpointId', +e.target.value)}
                            >
                              <option value="">— выберите —</option>
                              {proj.checkpoints.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                          </Td>
                          <Td align="right" className="text-muted-foreground">{cp?.plannedDays || '—'}</Td>
                          <Td>
                            <Input
                              type="number"
                              min={0}
                              size="sm"
                              className="[&_input]:text-right"
                              value={part.actualDays || ''}
                              onChange={e => upPart(part.id, 'actualDays', +e.target.value)}
                            />
                          </Td>
                          <Td align="right" className="font-semibold" style={{ color: coeffColor }}>
                            {coeff.toFixed(2)}
                          </Td>
                          <Td>
                            <Select value={part.period} onValueChange={v => upPart(part.id, 'period', v)}>
                              <SelectTrigger size="sm" className="w-[72px]"><SelectValue /></SelectTrigger>
                              <SelectPopup>
                                {PAYOUT_PERIODS.map(p => (
                                  <SelectItem key={p} value={p}>{p}</SelectItem>
                                ))}
                              </SelectPopup>
                            </Select>
                          </Td>
                          <Td>
                            <Input
                              type="text"
                              size="sm"
                              value={part.note}
                              onChange={e => upPart(part.id, 'note', e.target.value)}
                              placeholder="отпуск, замена..."
                            />
                          </Td>
                          <Td>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Удалить запись"
                              onClick={() => delPart(part.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >×</Button>
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}

      <Button variant="outline" size="sm" onClick={addPart}>+ Запись об участии</Button>
    </div>
  );
}
