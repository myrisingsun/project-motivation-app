import React, { useState } from 'react';
import { getProjectColor, SCALE } from '../data/constants';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Select, SelectTrigger, SelectValue, SelectPopup, SelectItem,
} from '../components/ui/select';
import {
  AlertDialog, AlertDialogClose, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogPopup, AlertDialogTitle,
} from '../components/ui/alert-dialog';

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

export default function ProjectsPage({
  projects, settings, employees, participation,
  upProj, addProj, delProj, addCP, delCP, upCP,
  addEmpToProj, delPartByEmpProj,
}) {
  const isComponent = settings.formulaMode === 'component';
  const [newMemberIds, setNewMemberIds] = useState({});
  const [removeConfirm, setRemoveConfirm] = useState(null);

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-[17px] font-semibold" style={{ color: '#185FA5' }}>Проекты и контрольные точки</h2>
        <Button variant="default" size="sm" onClick={addProj}>+ Проект</Button>
      </div>

      {projects.length === 0 && (
        <div className="text-center py-10 text-muted-foreground text-sm">
          Нет проектов. Нажмите «+ Проект» для добавления.
        </div>
      )}

      {projects.map((proj, pi) => {
        const col = getProjectColor(pi);
        const tw = proj.checkpoints.reduce((s, c) => s + (c.weight || 0), 0);
        const teamEmpIds = new Set(
          participation.filter(r => r.projectId === proj.id).map(r => r.empId)
        );
        const teamEmps = employees.filter(e => teamEmpIds.has(e.id));
        const availableEmps = employees.filter(e => !teamEmpIds.has(e.id));
        const newMemberId = newMemberIds[proj.id] || 0;

        return (
          <div
            key={proj.id}
            className="mb-5 rounded-lg border bg-muted/20 overflow-hidden"
            style={{ borderLeft: `4px solid ${col}` }}
          >
            {/* Project header */}
            <div className="px-3.5 py-3 flex gap-2.5 items-center bg-background border-b">
              <Input
                type="text"
                size="sm"
                className="flex-1 [&]:font-semibold"
                value={proj.name}
                onChange={e => upProj(proj.id, 'name', e.target.value)}
                placeholder="Название проекта"
              />
              {isComponent && (
                <>
                  <div className="flex items-center gap-1.5 whitespace-nowrap">
                    <span className="text-xs text-muted-foreground">Бюджет:</span>
                    <Input
                      type="number"
                      size="sm"
                      className="w-[110px] [&_input]:text-right"
                      value={proj.budget || ''}
                      onChange={e => upProj(proj.id, 'budget', +e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 whitespace-nowrap">
                    <span className="text-xs text-muted-foreground">Факт/план:</span>
                    <Input
                      type="number"
                      step={0.01} min={0} max={3}
                      size="sm"
                      className="w-[80px] [&_input]:text-right"
                      value={proj.budgetFact || ''}
                      onChange={e => upProj(proj.id, 'budgetFact', +e.target.value)}
                      placeholder="1.0"
                    />
                    {proj.budgetFact > 0 && (
                      <span className="text-xs text-muted-foreground">
                        → коэфф. {SCALE.find(s => proj.budgetFact >= s.min && proj.budgetFact <= s.max)?.coeff ?? 0}
                      </span>
                    )}
                  </div>
                </>
              )}
              <Button
                variant="ghost"
                size="icon"
                aria-label="Удалить проект"
                onClick={() => delProj(proj.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >×</Button>
            </div>

            {/* Team section */}
            <div className="px-3.5 py-2.5 border-b bg-background/50">
              <div className="text-xs font-medium text-muted-foreground mb-2">
                Команда проекта
                {teamEmps.length > 0 && (
                  <span className="ml-1.5 font-normal opacity-70">({teamEmps.length})</span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 items-center min-h-[26px]">
                {teamEmps.length === 0 && (
                  <span className="text-xs text-muted-foreground italic">Нет исполнителей — добавьте из списка ниже</span>
                )}
                {teamEmps.map(emp => (
                  <span
                    key={emp.id}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-background border"
                    style={{ color: col, borderColor: `${col}66` }}
                  >
                    {emp.name || '(без имени)'}
                    <button
                      className="ml-0.5 opacity-50 hover:opacity-100 hover:text-red-600 leading-none transition-opacity"
                      aria-label={`Удалить ${emp.name} из проекта`}
                      onClick={() => setRemoveConfirm({
                        empId: emp.id,
                        projId: proj.id,
                        empName: emp.name || '(без имени)',
                        projName: proj.name || 'проект',
                      })}
                    >×</button>
                  </span>
                ))}
              </div>
              {availableEmps.length > 0 && (
                <div className="flex gap-1.5 mt-2 items-center">
                  <Select
                    value={String(newMemberId || '')}
                    onValueChange={v => setNewMemberIds(ids => ({ ...ids, [proj.id]: +v }))}
                  >
                    <SelectTrigger size="sm" className="w-[200px]">
                      <SelectValue placeholder="Выберите сотрудника" />
                    </SelectTrigger>
                    <SelectPopup>
                      {availableEmps.map(e => (
                        <SelectItem key={e.id} value={String(e.id)}>{e.name || '(без имени)'}</SelectItem>
                      ))}
                    </SelectPopup>
                  </Select>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!newMemberId}
                    onClick={() => {
                      addEmpToProj(proj.id, newMemberId);
                      setNewMemberIds(ids => ({ ...ids, [proj.id]: 0 }));
                    }}
                  >
                    + Добавить
                  </Button>
                </div>
              )}
              {availableEmps.length === 0 && employees.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1 italic">Все сотрудники уже добавлены в проект</p>
              )}
            </div>

            {/* Checkpoints table */}
            <div className="p-3.5">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <Th>Контрольная точка</Th>
                    <Th w="100px" align="right">Вес (%)</Th>
                    <Th w="130px" align="right">Плановые дни</Th>
                    <Th w="36px"></Th>
                  </tr>
                </thead>
                <tbody>
                  {proj.checkpoints.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-2.5 py-2.5 text-[13px] text-muted-foreground italic">
                        Нет контрольных точек
                      </td>
                    </tr>
                  )}
                  {proj.checkpoints.map(cp => (
                    <tr key={cp.id}>
                      <Td>
                        <Input
                          type="text"
                          size="sm"
                          value={cp.name}
                          onChange={e => upCP(proj.id, cp.id, 'name', e.target.value)}
                          placeholder="Название контрольной точки"
                        />
                      </Td>
                      <Td>
                        <Input
                          type="number"
                          min={0} max={100}
                          size="sm"
                          className="[&_input]:text-right"
                          value={cp.weight || ''}
                          onChange={e => upCP(proj.id, cp.id, 'weight', +e.target.value)}
                        />
                      </Td>
                      <Td>
                        <Input
                          type="number"
                          min={0}
                          size="sm"
                          className="[&_input]:text-right"
                          value={cp.plannedDays || ''}
                          onChange={e => upCP(proj.id, cp.id, 'plannedDays', +e.target.value)}
                        />
                      </Td>
                      <Td>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Удалить контрольную точку"
                          onClick={() => delCP(proj.id, cp.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >×</Button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-between items-center mt-2">
                <Button variant="outline" size="sm" onClick={() => addCP(proj.id)}>
                  + Контрольная точка
                </Button>
                <span className={`text-xs font-semibold ${tw === 100 ? 'text-green-700' : 'text-red-600'}`}>
                  Сумма весов: {tw}%{tw !== 100 ? ' ⚠ должно быть 100%' : ' ✓'}
                </span>
              </div>
            </div>
          </div>
        );
      })}

      {projects.length > 0 && (
        <Button variant="outline" size="sm" className="mt-1" onClick={addProj}>
          + Проект
        </Button>
      )}

      {/* Remove team member confirmation */}
      <AlertDialog
        open={!!removeConfirm}
        onOpenChange={open => { if (!open) setRemoveConfirm(null); }}
      >
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить исполнителя из проекта?</AlertDialogTitle>
            <AlertDialogDescription>
              Все записи участия <strong>{removeConfirm?.empName}</strong> в проекте
              «{removeConfirm?.projName}» будут удалены. Данные для расчёта премий по этому
              сотруднику в данном проекте будут потеряны.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="ghost" />}>Отмена</AlertDialogClose>
            <AlertDialogClose
              render={<Button variant="destructive" />}
              onClick={() => delPartByEmpProj(removeConfirm.empId, removeConfirm.projId)}
            >
              Удалить
            </AlertDialogClose>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </div>
  );
}
