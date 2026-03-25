import React, { useState, useMemo } from 'react';
import { PAYOUT_PERIODS, getProjectColor } from '../data/constants';

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

export default function ParticipationPage({ employees, projects, participation, addPart, delPart, upPart }) {
  const [cpFilters, setCpFilters] = useState({});

  const partByProj = useMemo(() => {
    const g = {};
    projects.forEach(p => { g[p.id] = []; });
    participation.forEach(r => { if (g[r.projectId]) g[r.projectId].push(r); });
    return g;
  }, [participation, projects]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, color: '#D85A30' }}>Участие в проектах</h2>
        <button onClick={addPart} style={{ ...S.btn, background: '#D85A30', color: '#fff' }}>
          + Запись об участии
        </button>
      </div>
      <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 16 }}>
        Новая запись добавляется в первый проект. Смените проект через редактирование.
      </div>

      {projects.map((proj, pi) => {
        const items = partByProj[proj.id] || [];
        const col = getProjectColor(pi);
        const filterVal = cpFilters[proj.id] || 0;
        const filtered = filterVal === 0 ? items : items.filter(p => p.checkpointId === filterVal);

        return (
          <div key={proj.id} style={{ marginBottom: 28, border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
            {/* Project header */}
            <div style={{
              padding: '10px 14px', fontWeight: 600, fontSize: 14, color: col,
              borderBottom: `2px solid ${col}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: '#fff',
            }}>
              <span>{proj.name}</span>
              <span style={{ fontWeight: 400, fontSize: 12, color: '#9ca3af' }}>
                {filtered.length !== items.length ? `${filtered.length} из ${items.length}` : `${items.length} записей`}
              </span>
            </div>

            {/* Checkpoint filter pills */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '8px 12px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <button
                onClick={() => setCpFilters(f => ({ ...f, [proj.id]: 0 }))}
                style={{
                  ...S.btn, padding: '3px 12px', fontSize: 12,
                  background: filterVal === 0 ? col : 'transparent',
                  color: filterVal === 0 ? '#fff' : '#6b7280',
                  border: filterVal === 0 ? 'none' : '1px solid #d1d5db',
                }}
              >Все КТ</button>
              {proj.checkpoints.map(cp => {
                const active = filterVal === cp.id;
                const count = items.filter(p => p.checkpointId === cp.id).length;
                return (
                  <button
                    key={cp.id}
                    onClick={() => setCpFilters(f => ({ ...f, [proj.id]: active ? 0 : cp.id }))}
                    style={{
                      ...S.btn, padding: '3px 12px', fontSize: 12,
                      background: active ? col : 'transparent',
                      color: active ? '#fff' : '#6b7280',
                      border: active ? 'none' : '1px solid #d1d5db',
                    }}
                  >
                    {cp.name} <span style={{ opacity: 0.7, marginLeft: 3 }}>({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Participation table */}
            {filtered.length === 0 ? (
              <div style={{ padding: '14px 16px', fontSize: 13, color: '#9ca3af', fontStyle: 'italic' }}>
                Нет записей{filterVal !== 0 ? ' по выбранной контрольной точке' : ''}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                      const cp = proj.checkpoints.find(c => c.id === part.checkpointId);
                      const coeff = cp && cp.plannedDays > 0 ? Math.min(part.actualDays / cp.plannedDays, 1) : 0;
                      const coeffColor = coeff < 0.5 ? '#dc2626' : coeff < 1 ? '#d97706' : '#15803d';
                      const emp = employees.find(e => e.id === part.empId);

                      return (
                        <tr key={part.id}>
                          <Td>
                            <select
                              style={S.input}
                              value={part.empId}
                              onChange={e => upPart(part.id, 'empId', +e.target.value)}
                            >
                              <option value={0}>—</option>
                              {employees.map(e => (
                                <option key={e.id} value={e.id}>{e.name || '(без имени)'}</option>
                              ))}
                            </select>
                          </Td>
                          <Td style={{ fontSize: 12, color: '#6b7280', textAlign: 'center' }}>
                            {emp?.role || '—'}
                          </Td>
                          <Td>
                            <select
                              style={S.input}
                              value={part.checkpointId}
                              onChange={e => upPart(part.id, 'checkpointId', +e.target.value)}
                            >
                              <option value={0}>—</option>
                              {proj.checkpoints.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                          </Td>
                          <Td align="right" style={{ color: '#9ca3af' }}>
                            {cp?.plannedDays || '—'}
                          </Td>
                          <Td>
                            <input
                              style={{ ...S.input, textAlign: 'right' }}
                              type="number"
                              min={0}
                              value={part.actualDays || ''}
                              onChange={e => upPart(part.id, 'actualDays', +e.target.value)}
                            />
                          </Td>
                          <Td align="right" style={{ fontWeight: 600, color: coeffColor }}>
                            {coeff.toFixed(2)}
                          </Td>
                          <Td>
                            <select
                              style={{ ...S.input, width: 64 }}
                              value={part.period}
                              onChange={e => upPart(part.id, 'period', e.target.value)}
                            >
                              {PAYOUT_PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                          </Td>
                          <Td>
                            <input
                              style={S.input}
                              value={part.note}
                              onChange={e => upPart(part.id, 'note', e.target.value)}
                              placeholder="отпуск, замена..."
                            />
                          </Td>
                          <Td>
                            <button
                              onClick={() => delPart(part.id)}
                              style={{ ...S.btn, background: 'transparent', color: '#dc2626', padding: '2px 8px', fontSize: 16 }}
                            >×</button>
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

      <button onClick={addPart} style={{ ...S.btn, background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' }}>
        + Запись об участии
      </button>
    </div>
  );
}
