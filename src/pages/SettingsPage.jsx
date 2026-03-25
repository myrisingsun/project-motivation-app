import React from 'react';
import { ABC_GRADES, STD_MILESTONES, SCALE } from '../data/constants';

const S = {
  input: { padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, background: '#fff', outline: 'none', width: '100%', boxSizing: 'border-box' },
  btn: { padding: '6px 14px', borderRadius: 6, border: 'none', fontSize: 13, cursor: 'pointer', fontWeight: 500 },
};

function SectionTitle({ children, color = '#534AB7' }) {
  return (
    <h3 style={{ fontSize: 15, fontWeight: 600, color, marginBottom: 12, borderBottom: `2px solid ${color}22`, paddingBottom: 6 }}>{children}</h3>
  );
}

function Row({ label, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
      <div style={{ width: 260, fontSize: 13, color: '#374151', flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

export default function SettingsPage({ settings, employees, upSet, resetAll }) {
  const s = settings;

  const totalCW = s.componentWeights.milestones + s.componentWeights.budget + s.componentWeights.abc;

  return (
    <div style={{ maxWidth: 780 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, color: '#534AB7' }}>Настройки расчёта</h2>
        <button
          onClick={() => { if (window.confirm('Сбросить все данные к стандартным?')) resetAll(); }}
          style={{ ...S.btn, background: '#fee2e2', color: '#991b1b' }}
        >
          Сбросить к стандартным
        </button>
      </div>

      {/* Formula mode */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <SectionTitle>Модель расчёта</SectionTitle>
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          {[
            { key: 'multiplier', label: 'Множитель', desc: 'Потолок × Вес × Участие × ABC' },
            { key: 'component', label: 'Компонентная', desc: 'Потолок × (Вехи×W1 + Бюджет×W2 + ABC×W3)' },
          ].map(m => (
            <button
              key={m.key}
              onClick={() => upSet('formulaMode', m.key)}
              style={{
                ...S.btn,
                flex: 1,
                padding: '10px 16px',
                textAlign: 'left',
                border: `2px solid ${s.formulaMode === m.key ? '#534AB7' : '#e5e7eb'}`,
                background: s.formulaMode === m.key ? '#534AB710' : '#fff',
                color: s.formulaMode === m.key ? '#534AB7' : '#374151',
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 2 }}>{m.label}</div>
              <div style={{ fontSize: 11, opacity: 0.7, fontFamily: 'monospace' }}>{m.desc}</div>
            </button>
          ))}
        </div>

        {s.formulaMode === 'component' && (
          <div style={{ background: '#f9fafb', borderRadius: 6, padding: 12, marginTop: 8 }}>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 10 }}>Веса компонентов (сумма должна = 100%)</div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              {[
                { key: 'milestones', label: 'Вехи' },
                { key: 'budget', label: 'Бюджет' },
                { key: 'abc', label: 'ABC' },
              ].map(c => (
                <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, minWidth: 60 }}>{c.label}:</span>
                  <input
                    type="number"
                    min={0} max={100}
                    style={{ ...S.input, width: 70, textAlign: 'right' }}
                    value={s.componentWeights[c.key]}
                    onChange={e => upSet(`componentWeights.${c.key}`, +e.target.value)}
                  />
                  <span style={{ fontSize: 12, color: '#6b7280' }}>%</span>
                </div>
              ))}
              <span style={{ fontSize: 13, fontWeight: 600, color: totalCW === 100 ? '#15803d' : '#dc2626', marginLeft: 8 }}>
                = {totalCW}%{totalCW !== 100 && ' ⚠ должно быть 100%'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Project limit */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <SectionTitle>Лимит проектов на сотрудника</SectionTitle>
        <Row label="Ограничение по проектам">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
            <input
              type="checkbox"
              checked={s.projectLimitEnabled}
              onChange={e => upSet('projectLimitEnabled', e.target.checked)}
              style={{ width: 16, height: 16 }}
            />
            Включить ограничение
          </label>
        </Row>
        {s.projectLimitEnabled && (
          <Row label="Максимум проектов">
            <input
              type="number"
              min={1} max={10}
              style={{ ...S.input, width: 80, textAlign: 'right' }}
              value={s.projectLimitMax}
              onChange={e => upSet('projectLimitMax', +e.target.value)}
            />
          </Row>
        )}
        {s.projectLimitEnabled && employees && employees.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>Исключения (индивидуальный лимит):</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {employees.map(emp => {
                const exc = s.projectLimitExceptions?.[emp.id];
                return (
                  <div key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                    <span style={{ width: 180, color: '#374151' }}>{emp.name || '(без имени)'}</span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={exc !== undefined}
                        onChange={e => {
                          const updated = { ...(s.projectLimitExceptions || {}) };
                          if (e.target.checked) updated[emp.id] = s.projectLimitMax + 1;
                          else delete updated[emp.id];
                          upSet('projectLimitExceptions', updated);
                        }}
                      />
                      Исключение
                    </label>
                    {exc !== undefined && (
                      <input
                        type="number"
                        min={1} max={20}
                        style={{ ...S.input, width: 70, textAlign: 'right' }}
                        value={exc}
                        onChange={e => {
                          const updated = { ...(s.projectLimitExceptions || {}), [emp.id]: +e.target.value };
                          upSet('projectLimitExceptions', updated);
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ABC coefficients */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <SectionTitle>Коэффициенты ABC</SectionTitle>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>Стандартные сотрудники</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {ABC_GRADES.map(g => (
                <div key={g} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: '#374151', marginBottom: 4 }}>Грейд {g}</div>
                  <input
                    type="number"
                    step={0.1} min={0} max={3}
                    style={{ ...S.input, width: 70, textAlign: 'right' }}
                    value={s.abcCoeffs[g] ?? 1}
                    onChange={e => {
                      const updated = { ...s.abcCoeffs, [g]: +e.target.value };
                      upSet('abcCoeffs', updated);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Newcomer settings */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <SectionTitle>Новички</SectionTitle>
        <Row label="Учитывать стаж работы">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
            <input
              type="checkbox"
              checked={s.newcomerEnabled}
              onChange={e => upSet('newcomerEnabled', e.target.checked)}
              style={{ width: 16, height: 16 }}
            />
            Применять коэффициенты новичков
          </label>
        </Row>
        {s.newcomerEnabled && (
          <>
            <Row label="Порог стажа (месяцев)">
              <input
                type="number"
                min={1} max={36}
                style={{ ...S.input, width: 80, textAlign: 'right' }}
                value={s.newcomerMonths}
                onChange={e => upSet('newcomerMonths', +e.target.value)}
              />
            </Row>
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>Коэффициенты для новичков (стаж &lt; {s.newcomerMonths} мес.)</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {ABC_GRADES.map(g => (
                  <div key={g} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: '#374151', marginBottom: 4 }}>Грейд {g}</div>
                    <input
                      type="number"
                      step={0.1} min={0} max={3}
                      style={{ ...S.input, width: 70, textAlign: 'right' }}
                      value={s.newcomerAbcCoeffs[g] ?? 0}
                      onChange={e => {
                        const updated = { ...s.newcomerAbcCoeffs, [g]: +e.target.value };
                        upSet('newcomerAbcCoeffs', updated);
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Reference tables */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <SectionTitle>Справочник: стандартные вехи (PMI)</SectionTitle>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Веха', 'PM (%)', 'BA (%)', 'S (%)'].map(h => (
                  <th key={h} style={{ padding: '6px 10px', fontSize: 12, fontWeight: 500, background: '#f9fafb', borderBottom: '1px solid #e5e7eb', textAlign: h === 'Веха' ? 'left' : 'right' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {STD_MILESTONES.map((m, i) => (
                <tr key={i} style={{ background: i % 2 ? '#fafafa' : '#fff' }}>
                  <td style={{ padding: '5px 10px', fontSize: 12, borderBottom: '1px solid #f3f4f6' }}>{m.name}</td>
                  <td style={{ padding: '5px 10px', fontSize: 12, textAlign: 'right', borderBottom: '1px solid #f3f4f6' }}>{m.wPM}%</td>
                  <td style={{ padding: '5px 10px', fontSize: 12, textAlign: 'right', borderBottom: '1px solid #f3f4f6' }}>{m.wBA}%</td>
                  <td style={{ padding: '5px 10px', fontSize: 12, textAlign: 'right', borderBottom: '1px solid #f3f4f6' }}>{m.wS}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {s.formulaMode === 'component' && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <SectionTitle>Справочник: шкала исполнения бюджета</SectionTitle>
          <table style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Диапазон', 'Коэффициент'].map(h => (
                  <th key={h} style={{ padding: '6px 14px', fontSize: 12, fontWeight: 500, background: '#f9fafb', borderBottom: '1px solid #e5e7eb', textAlign: h === 'Диапазон' ? 'left' : 'right' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SCALE.map((row, i) => (
                <tr key={i}>
                  <td style={{ padding: '5px 14px', fontSize: 13, borderBottom: '1px solid #f3f4f6' }}>{row.label}</td>
                  <td style={{ padding: '5px 14px', fontSize: 13, textAlign: 'right', borderBottom: '1px solid #f3f4f6', fontWeight: 500 }}>{row.coeff}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
