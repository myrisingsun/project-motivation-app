import React from 'react';
import { getProjectColor } from '../data/constants';
import { SCALE } from '../data/constants';

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

export default function ProjectsPage({ projects, settings, upProj, addProj, delProj, addCP, delCP, upCP }) {
  const isComponent = settings.formulaMode === 'component';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, color: '#185FA5' }}>Проекты и контрольные точки</h2>
        <button onClick={addProj} style={{ ...S.btn, background: '#185FA5', color: '#fff' }}>
          + Проект
        </button>
      </div>

      {projects.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af', fontSize: 14 }}>
          Нет проектов. Нажмите «+ Проект» для добавления.
        </div>
      )}

      {projects.map((proj, pi) => {
        const col = getProjectColor(pi);
        const tw = proj.checkpoints.reduce((s, c) => s + (c.weight || 0), 0);

        return (
          <div key={proj.id} style={{
            marginBottom: 20, borderRadius: 8,
            border: '1px solid #e5e7eb',
            borderLeft: `4px solid ${col}`,
            background: '#fafafa',
            overflow: 'hidden',
          }}>
            {/* Project header */}
            <div style={{ padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'center', background: '#fff', borderBottom: '1px solid #e5e7eb' }}>
              <input
                style={{ ...S.input, fontWeight: 600, fontSize: 14, flex: 1 }}
                value={proj.name}
                onChange={e => upProj(proj.id, 'name', e.target.value)}
                placeholder="Название проекта"
              />
              {isComponent && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>Бюджет:</span>
                    <input
                      type="number"
                      style={{ ...S.input, width: 110, textAlign: 'right' }}
                      value={proj.budget || ''}
                      onChange={e => upProj(proj.id, 'budget', +e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>Факт/план:</span>
                    <input
                      type="number"
                      step={0.01} min={0} max={3}
                      style={{ ...S.input, width: 80, textAlign: 'right' }}
                      value={proj.budgetFact || ''}
                      onChange={e => upProj(proj.id, 'budgetFact', +e.target.value)}
                      placeholder="1.0"
                    />
                    {proj.budgetFact > 0 && (
                      <span style={{ fontSize: 12, color: '#6b7280' }}>
                        → коэфф. {SCALE.find(s => proj.budgetFact >= s.min && proj.budgetFact <= s.max)?.coeff ?? 0}
                      </span>
                    )}
                  </div>
                </>
              )}
              <button
                onClick={() => delProj(proj.id)}
                style={{ ...S.btn, background: 'transparent', color: '#dc2626', padding: '4px 10px', fontSize: 16 }}
              >×</button>
            </div>

            {/* Checkpoints table */}
            <div style={{ padding: 14 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                      <td colSpan={4} style={{ padding: '10px 10px', fontSize: 13, color: '#9ca3af', fontStyle: 'italic' }}>
                        Нет контрольных точек
                      </td>
                    </tr>
                  )}
                  {proj.checkpoints.map(cp => (
                    <tr key={cp.id}>
                      <Td>
                        <input
                          style={S.input}
                          value={cp.name}
                          onChange={e => upCP(proj.id, cp.id, 'name', e.target.value)}
                          placeholder="Название контрольной точки"
                        />
                      </Td>
                      <Td>
                        <input
                          style={{ ...S.input, textAlign: 'right' }}
                          type="number"
                          min={0} max={100}
                          value={cp.weight || ''}
                          onChange={e => upCP(proj.id, cp.id, 'weight', +e.target.value)}
                        />
                      </Td>
                      <Td>
                        <input
                          style={{ ...S.input, textAlign: 'right' }}
                          type="number"
                          min={0}
                          value={cp.plannedDays || ''}
                          onChange={e => upCP(proj.id, cp.id, 'plannedDays', +e.target.value)}
                        />
                      </Td>
                      <Td>
                        <button
                          onClick={() => delCP(proj.id, cp.id)}
                          style={{ ...S.btn, background: 'transparent', color: '#dc2626', padding: '2px 8px', fontSize: 16 }}
                        >×</button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <button
                  onClick={() => addCP(proj.id)}
                  style={{ ...S.btn, background: '#e0f2fe', color: '#0369a1' }}
                >
                  + Контрольная точка
                </button>
                <span style={{ fontSize: 12, fontWeight: 600, color: tw === 100 ? '#15803d' : '#dc2626' }}>
                  Сумма весов: {tw}%{tw !== 100 ? ' ⚠ должно быть 100%' : ' ✓'}
                </span>
              </div>
            </div>
          </div>
        );
      })}

      {projects.length > 0 && (
        <button onClick={addProj} style={{ ...S.btn, background: '#e0f2fe', color: '#0369a1', marginTop: 4 }}>
          + Проект
        </button>
      )}
    </div>
  );
}
