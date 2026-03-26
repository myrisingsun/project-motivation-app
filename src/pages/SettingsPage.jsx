import React from 'react';
import { ABC_GRADES, STD_MILESTONES, SCALE } from '../data/constants';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert';
import { Tooltip, TooltipTrigger, TooltipPopup, TooltipProvider } from '../components/ui/tooltip';
import { AlertTriangle } from 'lucide-react';
import {
  NumberField, NumberFieldGroup,
  NumberFieldDecrement, NumberFieldIncrement, NumberFieldInput,
} from '../components/ui/number-field';
import { RadioGroup, Radio } from '../components/ui/radio-group';
import { Switch } from '../components/ui/switch';
import { Fieldset, FieldsetLegend } from '../components/ui/fieldset';
import {
  Accordion, AccordionItem, AccordionTrigger, AccordionPanel,
} from '../components/ui/accordion';

const ABC_HINTS = {
  A: 'Топ-исполнители. По умолчанию ×1.2',
  'B+': 'Выше среднего. По умолчанию ×1.1',
  B: 'Базовый уровень. По умолчанию ×1.0',
  'B-': 'Ниже ожиданий. По умолчанию ×0 (нет премии)',
  C: 'Критически низкая результативность. По умолчанию ×0',
};

function AbcCoeffRow({ grades, coeffs, onChange }) {
  return (
    <TooltipProvider>
      <div className="flex gap-4 flex-wrap">
        {grades.map(g => (
          <div key={g} className="flex flex-col items-center gap-1">
            <Tooltip>
              <TooltipTrigger render={<span className="text-xs text-muted-foreground cursor-help underline decoration-dotted" />}>
                {g}
              </TooltipTrigger>
              <TooltipPopup>{ABC_HINTS[g]}</TooltipPopup>
            </Tooltip>
            <NumberField
              value={coeffs[g] ?? 1}
              onValueChange={v => onChange(g, v)}
              min={0}
              max={3}
              step={0.1}
            >
              <NumberFieldGroup size="sm">
                <NumberFieldDecrement />
                <NumberFieldInput className="w-14 text-right" />
                <NumberFieldIncrement />
              </NumberFieldGroup>
            </NumberField>
          </div>
        ))}
      </div>
    </TooltipProvider>
  );
}

export default function SettingsPage({ settings, employees, upSet, resetAll }) {
  const s = settings;
  const totalCW = s.componentWeights.milestones + s.componentWeights.budget + s.componentWeights.abc;

  return (
    <div className="max-w-2xl flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold" style={{ color: '#534AB7' }}>Настройки расчёта</h2>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => { if (window.confirm('Сбросить все данные к стандартным?')) resetAll(); }}
        >
          Сбросить к стандартным
        </Button>
      </div>

      <Accordion multiple defaultValue={['formula', 'limits', 'abc']}>

        {/* ── Модель расчёта ── */}
        <AccordionItem value="formula">
          <AccordionTrigger>Модель расчёта</AccordionTrigger>
          <AccordionPanel>
            <div className="flex flex-col gap-4 py-2">
              <TooltipProvider>
                <RadioGroup
                  value={s.formulaMode}
                  onValueChange={v => upSet('formulaMode', v)}
                  aria-label="Модель расчёта"
                  className="flex flex-col gap-2"
                >
                  {[
                    {
                      key: 'multiplier',
                      label: 'Множитель',
                      formula: 'Потолок × Вес × Участие × ABC',
                      hint: 'Простая модель: каждый множитель применяется последовательно. Подходит для равномерного учёта всех факторов.',
                    },
                    {
                      key: 'component',
                      label: 'Компонентная',
                      formula: 'Потолок × (Вехи×W1 + Бюджет×W2 + ABC×W3)',
                      hint: 'Взвешенная модель: три независимых компонента с настраиваемыми долями (W1+W2+W3 = 100%). Бюджет проходит через шкалу коэффициентов.',
                    },
                  ].map(m => (
                    <Tooltip key={m.key}>
                      <TooltipTrigger render={
                        <Label className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/40 transition-colors" />
                      }>
                        <Radio value={m.key} className="mt-0.5" />
                        <div>
                          <span className="font-semibold text-sm">{m.label}</span>
                          <p className="text-muted-foreground text-xs font-mono mt-0.5">{m.formula}</p>
                        </div>
                      </TooltipTrigger>
                      <TooltipPopup>{m.hint}</TooltipPopup>
                    </Tooltip>
                  ))}
                </RadioGroup>
              </TooltipProvider>

              {s.formulaMode === 'component' && (
                <Fieldset>
                  <FieldsetLegend>Веса компонентов (сумма должна = 100%)</FieldsetLegend>
                  <div className="flex gap-5 flex-wrap items-end mt-3">
                    {[
                      { key: 'milestones', label: 'Вехи' },
                      { key: 'budget', label: 'Бюджет' },
                      { key: 'abc', label: 'ABC' },
                    ].map(c => (
                      <div key={c.key} className="flex flex-col gap-1">
                        <Label className="text-xs text-muted-foreground">{c.label}</Label>
                        <div className="flex items-center gap-1">
                          <NumberField
                            value={s.componentWeights[c.key]}
                            onValueChange={v => upSet(`componentWeights.${c.key}`, v)}
                            min={0}
                            max={100}
                          >
                            <NumberFieldGroup size="sm">
                              <NumberFieldDecrement />
                              <NumberFieldInput className="w-14 text-right" />
                              <NumberFieldIncrement />
                            </NumberFieldGroup>
                          </NumberField>
                          <span className="text-xs text-muted-foreground">%</span>
                        </div>
                      </div>
                    ))}
                    <span className={`text-sm font-semibold mb-1 ${totalCW === 100 ? 'text-green-700' : 'text-red-600'}`}>
                      = {totalCW}%
                    </span>
                  </div>
                  {totalCW !== 100 && (
                    <Alert variant="warning" className="mt-3">
                      <AlertTriangle />
                      <AlertTitle>Веса не равны 100%</AlertTitle>
                      <AlertDescription>
                        Текущая сумма: {totalCW}%. Скорректируйте значения — расчёт будет некорректным.
                      </AlertDescription>
                    </Alert>
                  )}
                </Fieldset>
              )}
            </div>
          </AccordionPanel>
        </AccordionItem>

        {/* ── Лимит проектов ── */}
        <AccordionItem value="limits">
          <AccordionTrigger>Лимит проектов на сотрудника</AccordionTrigger>
          <AccordionPanel>
            <div className="flex flex-col gap-4 py-2">
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <Label htmlFor="proj-limit-sw" className="text-sm font-medium cursor-pointer">
                    Включить ограничение
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Подсвечивает сотрудников с превышением лимита проектов
                  </p>
                </div>
                <Switch
                  id="proj-limit-sw"
                  checked={s.projectLimitEnabled}
                  onCheckedChange={v => upSet('projectLimitEnabled', v)}
                />
              </div>

              {s.projectLimitEnabled && (
                <>
                  <div className="flex items-center gap-3">
                    <Label className="text-sm min-w-[160px]">Максимум проектов</Label>
                    <NumberField
                      value={s.projectLimitMax}
                      onValueChange={v => upSet('projectLimitMax', v)}
                      min={1}
                      max={10}
                    >
                      <NumberFieldGroup size="sm">
                        <NumberFieldDecrement />
                        <NumberFieldInput className="w-14 text-right" />
                        <NumberFieldIncrement />
                      </NumberFieldGroup>
                    </NumberField>
                  </div>

                  {employees?.length > 0 && (
                    <Fieldset>
                      <FieldsetLegend>Исключения (индивидуальный лимит)</FieldsetLegend>
                      <div className="flex flex-col gap-2 mt-2">
                        {employees.map(emp => {
                          const exc = s.projectLimitExceptions?.[emp.id];
                          return (
                            <div key={emp.id} className="flex items-center gap-3">
                              <span className="text-sm w-44 text-foreground truncate">
                                {emp.name || '(без имени)'}
                              </span>
                              <Label className="cursor-pointer font-normal text-sm gap-1.5">
                                <Checkbox
                                  checked={exc !== undefined}
                                  onCheckedChange={checked => {
                                    const updated = { ...(s.projectLimitExceptions || {}) };
                                    if (checked) updated[emp.id] = s.projectLimitMax + 1;
                                    else delete updated[emp.id];
                                    upSet('projectLimitExceptions', updated);
                                  }}
                                />
                                Исключение
                              </Label>
                              {exc !== undefined && (
                                <NumberField
                                  value={exc}
                                  onValueChange={v => {
                                    const updated = { ...(s.projectLimitExceptions || {}), [emp.id]: v };
                                    upSet('projectLimitExceptions', updated);
                                  }}
                                  min={1}
                                  max={20}
                                >
                                  <NumberFieldGroup size="sm">
                                    <NumberFieldDecrement />
                                    <NumberFieldInput className="w-14 text-right" />
                                    <NumberFieldIncrement />
                                  </NumberFieldGroup>
                                </NumberField>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </Fieldset>
                  )}
                </>
              )}
            </div>
          </AccordionPanel>
        </AccordionItem>

        {/* ── Коэффициенты ABC ── */}
        <AccordionItem value="abc">
          <AccordionTrigger>Коэффициенты ABC</AccordionTrigger>
          <AccordionPanel>
            <div className="flex flex-col gap-6 py-2">
              <Fieldset>
                <FieldsetLegend>Стандартные сотрудники</FieldsetLegend>
                <div className="mt-3">
                  <AbcCoeffRow
                    grades={ABC_GRADES}
                    coeffs={s.abcCoeffs}
                    onChange={(g, v) => upSet('abcCoeffs', { ...s.abcCoeffs, [g]: v })}
                  />
                </div>
              </Fieldset>
            </div>
          </AccordionPanel>
        </AccordionItem>

        {/* ── Новички ── */}
        <AccordionItem value="newcomers">
          <AccordionTrigger>Новички</AccordionTrigger>
          <AccordionPanel>
            <div className="flex flex-col gap-4 py-2">
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <Label htmlFor="newcomer-sw" className="text-sm font-medium cursor-pointer">
                    Применять коэффициенты новичков
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Отдельные ABC-коэффициенты для сотрудников с малым стажем
                  </p>
                </div>
                <Switch
                  id="newcomer-sw"
                  checked={s.newcomerEnabled}
                  onCheckedChange={v => upSet('newcomerEnabled', v)}
                />
              </div>

              {s.newcomerEnabled && (
                <>
                  <div className="flex items-center gap-3">
                    <Label className="text-sm min-w-[160px]">Порог стажа</Label>
                    <NumberField
                      value={s.newcomerMonths}
                      onValueChange={v => upSet('newcomerMonths', v)}
                      min={1}
                      max={36}
                    >
                      <NumberFieldGroup size="sm">
                        <NumberFieldDecrement />
                        <NumberFieldInput className="w-14 text-right" />
                        <NumberFieldIncrement />
                      </NumberFieldGroup>
                    </NumberField>
                    <span className="text-sm text-muted-foreground">мес.</span>
                  </div>

                  <Fieldset>
                    <FieldsetLegend>
                      Коэффициенты для новичков (стаж &lt; {s.newcomerMonths} мес.)
                    </FieldsetLegend>
                    <div className="mt-3">
                      <AbcCoeffRow
                        grades={ABC_GRADES}
                        coeffs={s.newcomerAbcCoeffs}
                        onChange={(g, v) => upSet('newcomerAbcCoeffs', { ...s.newcomerAbcCoeffs, [g]: v })}
                      />
                    </div>
                  </Fieldset>
                </>
              )}
            </div>
          </AccordionPanel>
        </AccordionItem>

        {/* ── Справочник: вехи PMI ── */}
        <AccordionItem value="milestones">
          <AccordionTrigger>Справочник: стандартные вехи (PMI)</AccordionTrigger>
          <AccordionPanel>
            <div className="overflow-x-auto py-2">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    {['Веха', 'PM (%)', 'BA (%)', 'S (%)'].map(h => (
                      <th
                        key={h}
                        className="px-3 py-2 text-xs font-medium bg-muted border-b text-left last:text-right [&:not(:first-child)]:text-right"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {STD_MILESTONES.map((m, i) => (
                    <tr key={i} className={i % 2 ? 'bg-muted/30' : ''}>
                      <td className="px-3 py-1.5 text-xs border-b border-border/40">{m.name}</td>
                      <td className="px-3 py-1.5 text-xs text-right border-b border-border/40">{m.wPM}%</td>
                      <td className="px-3 py-1.5 text-xs text-right border-b border-border/40">{m.wBA}%</td>
                      <td className="px-3 py-1.5 text-xs text-right border-b border-border/40">{m.wS}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AccordionPanel>
        </AccordionItem>

        {/* ── Справочник: шкала бюджета (только component mode) ── */}
        {s.formulaMode === 'component' && (
          <AccordionItem value="scale">
            <AccordionTrigger>Справочник: шкала исполнения бюджета</AccordionTrigger>
            <AccordionPanel>
              <div className="py-2">
                <table className="border-collapse text-sm">
                  <thead>
                    <tr>
                      {['Диапазон', 'Коэффициент'].map(h => (
                        <th
                          key={h}
                          className="px-4 py-2 text-xs font-medium bg-muted border-b text-left last:text-right"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {SCALE.map((row, i) => (
                      <tr key={i}>
                        <td className="px-4 py-1.5 text-sm border-b border-border/40">{row.label}</td>
                        <td className="px-4 py-1.5 text-sm font-medium text-right border-b border-border/40">{row.coeff}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </AccordionPanel>
          </AccordionItem>
        )}

      </Accordion>
    </div>
  );
}
