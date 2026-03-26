import React, { useRef, useState } from 'react';
import { ROLES, ABC_GRADES } from '../data/constants';
import { getProjectCeiling, isNewcomer } from '../utils/calculations';
import { importEmployeesFromExcel } from '../utils/excelIO';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Select, SelectTrigger, SelectValue, SelectPopup, SelectItem,
} from '../components/ui/select';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '../components/ui/table';
import {
  AlertDialog, AlertDialogClose, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogPopup, AlertDialogTitle,
} from '../components/ui/alert-dialog';
import {
  Dialog, DialogClose, DialogDescription,
  DialogFooter, DialogHeader, DialogPopup, DialogTitle,
} from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { toastManager } from '../components/ui/toast';
import { Tooltip, TooltipTrigger, TooltipPopup, TooltipProvider } from '../components/ui/tooltip';

const fmt = n => Math.round(n).toLocaleString('ru-RU');

export default function EmployeesPage({ employees, empProjCount, settings, upEmp, addEmp, delEmp, setEmployees }) {
  const fileRef = useRef(null);
  const [pendingImport, setPendingImport] = useState(null); // { employees, count }
  const [importError, setImportError] = useState(null);

  const totalCeiling = employees.reduce((s, emp) => s + emp.salary * emp.ceilingMultiplier, 0);
  const totalProjectFund = employees.reduce((s, emp) => s + getProjectCeiling(emp), 0);

  async function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importEmployeesFromExcel(file);
      if (imported.length > 0) {
        setPendingImport({ employees: imported, count: imported.length });
      }
    } catch (err) {
      setImportError(err.message);
    }
    e.target.value = '';
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[17px] font-semibold" style={{ color: '#1D9E75' }}>Сотрудники</h2>
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            Импорт Excel
          </Button>
          <Button variant="default" size="sm" onClick={addEmp}>
            + Сотрудник
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TooltipProvider>
          <TableRow>
            <TableHead>ФИО</TableHead>
            <TableHead className="w-[150px]">Роль</TableHead>
            <TableHead className="w-[120px]">Оклад</TableHead>
            <TableHead className="w-[90px]">Кол-во окл.</TableHead>
            <TableHead className="w-[120px] text-right">Потолок/год</TableHead>
            <TableHead className="w-[120px] text-right">
              <Tooltip>
                <TooltipTrigger render={<span className="cursor-help underline decoration-dotted" />}>
                  Проектн. доля
                </TooltipTrigger>
                <TooltipPopup>PM/BA — 100% годового потолка. S — 1/3 (соотношение 2:1 функциональный/проектный)</TooltipPopup>
              </Tooltip>
            </TableHead>
            <TableHead className="w-[80px]">ABC</TableHead>
            <TableHead className="w-[90px] text-right">
              <Tooltip>
                <TooltipTrigger render={<span className="cursor-help underline decoration-dotted" />}>
                  ABC коэфф.
                </TooltipTrigger>
                <TooltipPopup>A=1.2 · B+=1.1 · B=1.0 · B−=0 · C=0. Новички — отдельные коэффициенты из настроек</TooltipPopup>
              </Tooltip>
            </TableHead>
            <TableHead className="w-[140px]">Дата найма</TableHead>
            <TableHead className="w-[70px] text-center">Проекты</TableHead>
            <TableHead className="w-[40px]" />
          </TableRow>
          </TooltipProvider>
        </TableHeader>
        <TableBody>
          {employees.length === 0 && (
            <TableRow>
              <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                Нет сотрудников. Нажмите «+ Сотрудник» для добавления.
              </TableCell>
            </TableRow>
          )}
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
              <TableRow key={emp.id} className={overLimit ? 'bg-red-50 hover:bg-red-50' : ''}>
                <TableCell>
                  <Input
                    type="text"
                    size="sm"
                    value={emp.name}
                    onChange={e => upEmp(emp.id, 'name', e.target.value)}
                    placeholder="ФИО"
                  />
                </TableCell>
                <TableCell>
                  <Select value={emp.role} onValueChange={v => upEmp(emp.id, 'role', v)}>
                    <SelectTrigger size="sm" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectPopup>
                      {ROLES.map(r => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectPopup>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    size="sm"
                    className="[&_input]:text-right"
                    value={emp.salary || ''}
                    onChange={e => upEmp(emp.id, 'salary', +e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step={0.5}
                    size="sm"
                    className="w-[70px] [&_input]:text-right"
                    value={emp.ceilingMultiplier || ''}
                    onChange={e => upEmp(emp.id, 'ceilingMultiplier', +e.target.value)}
                  />
                </TableCell>
                <TableCell className="text-right tabular-nums">{fmt(fullCeil)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {fmt(projCeil)}
                  {emp.role === 'S' && (
                    <span className="text-xs text-muted-foreground ml-1">(1/3)</span>
                  )}
                </TableCell>
                <TableCell>
                  <Select value={emp.abcGrade || 'B'} onValueChange={v => upEmp(emp.id, 'abcGrade', v)}>
                    <SelectTrigger size="sm" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectPopup>
                      {ABC_GRADES.map(g => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectPopup>
                  </Select>
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-medium">{abcC.toFixed(1)}</span>
                  {newcomer && (
                    <Badge variant="warning" className="ml-1.5">новичок</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Input
                    type="date"
                    size="sm"
                    nativeInput
                    value={emp.hireDate || ''}
                    onChange={e => upEmp(emp.id, 'hireDate', e.target.value)}
                  />
                </TableCell>
                <TableCell className="text-center">
                  {overLimit ? (
                    <span className="font-semibold text-red-600 bg-red-100 rounded px-2 py-0.5 text-xs">
                      {projCount}<span className="opacity-70">/{limitMax}</span>
                    </span>
                  ) : (
                    <span className="font-semibold">{projCount}</span>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Удалить сотрудника"
                    onClick={() => delEmp(emp.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >×</Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Summary footer */}
      <div className="mt-4 flex flex-wrap gap-6 items-center px-4 py-3.5 rounded-lg bg-muted/40 border">
        <div>
          <div className="text-xs text-muted-foreground mb-0.5">Сотрудников</div>
          <div className="text-lg font-medium">{employees.length}</div>
        </div>
        <div className="w-px h-9 bg-border" />
        <div>
          <div className="text-xs text-muted-foreground mb-0.5">Общий премиальный фонд</div>
          <div className="text-lg font-medium tabular-nums">{fmt(totalCeiling)}</div>
        </div>
        <div className="w-px h-9 bg-border" />
        <div>
          <div className="text-xs text-muted-foreground mb-0.5">Плановый проектный фонд</div>
          <div className="text-lg font-medium tabular-nums" style={{ color: '#1D9E75' }}>{fmt(totalProjectFund)}</div>
        </div>
      </div>

      {/* Import confirmation */}
      <AlertDialog
        open={!!pendingImport}
        onOpenChange={open => { if (!open) setPendingImport(null); }}
      >
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>Подтверждение импорта</AlertDialogTitle>
            <AlertDialogDescription>
              Импортировать {pendingImport?.count} сотрудников? Существующие данные будут заменены.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="ghost" />}>Отмена</AlertDialogClose>
            <AlertDialogClose
              render={<Button variant="destructive" />}
              onClick={() => {
                setEmployees(pendingImport.employees);
                toastManager.add({ title: 'Импорт завершён', description: `Загружено ${pendingImport.count} сотрудников.`, variant: 'success' });
              }}
            >
              Импортировать
            </AlertDialogClose>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>

      {/* Import error */}
      <Dialog
        open={!!importError}
        onOpenChange={open => { if (!open) setImportError(null); }}
      >
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>Ошибка импорта</DialogTitle>
            <DialogDescription>{importError}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>Закрыть</DialogClose>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </div>
  );
}
