import React, { useState, useMemo } from "react";

const ROLES = [
  { value: "A", label: "PM (Руководитель проекта)" },
  { value: "BA", label: "BA (Бизнес-аналитик)" },
  { value: "S", label: "S (Функц. исполнитель)" },
];

const PAYOUT_PERIODS = ["Q1", "Q2", "Q3", "Q4", "H1", "H2"];

const defaultEmployees = [
  { id: 1, name: "Иванов И.И.", role: "A", salary: 200000, ceilingMultiplier: 2 },
  { id: 2, name: "Петров П.П.", role: "BA", salary: 180000, ceilingMultiplier: 2 },
  { id: 3, name: "Сидоров С.С.", role: "S", salary: 150000, ceilingMultiplier: 2 },
  { id: 4, name: "Козлова К.К.", role: "S", salary: 160000, ceilingMultiplier: 2 },
  { id: 5, name: "Морозов М.М.", role: "A", salary: 210000, ceilingMultiplier: 2 },
  { id: 6, name: "Волкова В.В.", role: "S", salary: 140000, ceilingMultiplier: 2 },
  { id: 7, name: "Новиков Н.Н.", role: "BA", salary: 175000, ceilingMultiplier: 2 },
];

const defaultProjects = [
  {
    id: 1,
    name: "Проект Alpha — CRM-система",
    checkpoints: [
      { id: 1, name: "Анализ требований", weight: 20, plannedDays: 59 },
      { id: 2, name: "Разработка решения", weight: 30, plannedDays: 92 },
      { id: 3, name: "Тестирование", weight: 20, plannedDays: 61 },
      { id: 4, name: "Внедрение", weight: 30, plannedDays: 61 },
    ],
  },
  {
    id: 2,
    name: "Проект Beta — Автоматизация склада",
    checkpoints: [
      { id: 21, name: "Обследование процессов", weight: 25, plannedDays: 45 },
      { id: 22, name: "Проектирование", weight: 25, plannedDays: 60 },
      { id: 23, name: "Разработка и настройка", weight: 30, plannedDays: 75 },
      { id: 24, name: "Пилотный запуск", weight: 20, plannedDays: 30 },
    ],
  },
  {
    id: 3,
    name: "Проект Gamma — Миграция данных",
    checkpoints: [
      { id: 31, name: "Аудит источников данных", weight: 30, plannedDays: 40 },
      { id: 32, name: "Разработка ETL-процессов", weight: 40, plannedDays: 70 },
      { id: 33, name: "Миграция и верификация", weight: 30, plannedDays: 50 },
    ],
  },
];

const defaultParticipation = [
  { id: 1, empId: 1, projectId: 1, checkpointId: 1, actualDays: 59, period: "Q1", note: "" },
  { id: 2, empId: 1, projectId: 1, checkpointId: 2, actualDays: 92, period: "Q2", note: "" },
  { id: 3, empId: 2, projectId: 1, checkpointId: 1, actualDays: 59, period: "Q1", note: "" },
  { id: 4, empId: 2, projectId: 1, checkpointId: 2, actualDays: 72, period: "Q2", note: "отпуск 20 дней" },
  { id: 5, empId: 3, projectId: 1, checkpointId: 1, actualDays: 40, period: "Q1", note: "подключён с 20.01" },
  { id: 6, empId: 3, projectId: 1, checkpointId: 2, actualDays: 92, period: "Q2", note: "" },
  { id: 7, empId: 4, projectId: 1, checkpointId: 3, actualDays: 55, period: "Q3", note: "больничный 6 дней" },
  { id: 10, empId: 5, projectId: 2, checkpointId: 21, actualDays: 45, period: "Q1", note: "" },
  { id: 11, empId: 5, projectId: 2, checkpointId: 22, actualDays: 60, period: "Q2", note: "" },
  { id: 12, empId: 7, projectId: 2, checkpointId: 21, actualDays: 45, period: "Q1", note: "" },
  { id: 13, empId: 7, projectId: 2, checkpointId: 22, actualDays: 50, period: "Q2", note: "отпуск 10 дней" },
  { id: 14, empId: 3, projectId: 2, checkpointId: 21, actualDays: 30, period: "Q1", note: "частичная загрузка, параллельно Alpha" },
  { id: 15, empId: 3, projectId: 2, checkpointId: 22, actualDays: 45, period: "Q2", note: "" },
  { id: 16, empId: 4, projectId: 2, checkpointId: 23, actualDays: 75, period: "Q3", note: "" },
  { id: 17, empId: 4, projectId: 2, checkpointId: 24, actualDays: 30, period: "Q4", note: "" },
  { id: 18, empId: 6, projectId: 2, checkpointId: 21, actualDays: 40, period: "Q1", note: "" },
  { id: 20, empId: 1, projectId: 3, checkpointId: 31, actualDays: 35, period: "Q2", note: "параллельно Alpha" },
  { id: 21, empId: 1, projectId: 3, checkpointId: 32, actualDays: 60, period: "Q3", note: "" },
  { id: 22, empId: 2, projectId: 3, checkpointId: 31, actualDays: 40, period: "Q2", note: "" },
  { id: 23, empId: 2, projectId: 3, checkpointId: 32, actualDays: 70, period: "Q3", note: "" },
  { id: 24, empId: 6, projectId: 3, checkpointId: 31, actualDays: 40, period: "Q2", note: "" },
  { id: 25, empId: 6, projectId: 3, checkpointId: 32, actualDays: 55, period: "Q3", note: "больничный 15 дней" },
  { id: 26, empId: 6, projectId: 3, checkpointId: 33, actualDays: 50, period: "Q4", note: "" },
  { id: 27, empId: 4, projectId: 3, checkpointId: 33, actualDays: 25, period: "Q4", note: "подключена для усиления" },
];

let nextId = 200;
const genId = () => ++nextId;
const fmt = (n) => Math.round(n).toLocaleString("ru-RU");
const PROJECT_COLORS = ["#185FA5", "#0F6E56", "#993C1D", "#72243E", "#444441"];
const getPC = (i) => PROJECT_COLORS[i % PROJECT_COLORS.length];

const S = {
  input: { padding: "6px 10px", border: "1px solid var(--color-border-secondary, #ccc)", borderRadius: 6, fontSize: 13, background: "var(--color-background-primary, #fff)", color: "var(--color-text-primary, #222)", outline: "none", width: "100%", boxSizing: "border-box" },
  btn: { padding: "6px 14px", borderRadius: 6, border: "none", fontSize: 13, cursor: "pointer", fontWeight: 500, transition: "opacity .15s" },
};

const Th = ({ children, w, align }) => (
  <th style={{ padding: "8px 10px", fontSize: 12, fontWeight: 500, textAlign: align || "left", background: "var(--color-background-secondary, #f6f6f6)", borderBottom: "1px solid var(--color-border-tertiary, #e0e0e0)", whiteSpace: "nowrap", width: w }}>{children}</th>
);
const Td = ({ children, align, style: sx }) => (
  <td style={{ padding: "6px 10px", fontSize: 13, borderBottom: "1px solid var(--color-border-tertiary, #eee)", textAlign: align || "left", verticalAlign: "middle", ...sx }}>{children}</td>
);
const Del = ({ onClick }) => (
  <button onClick={onClick} style={{ ...S.btn, background: "transparent", color: "var(--color-text-danger, #c00)", padding: "2px 8px", fontSize: 16, lineHeight: 1 }}>×</button>
);
const Add = ({ onClick, label }) => (
  <button onClick={onClick} style={{ ...S.btn, background: "var(--color-background-info, #e6f1fb)", color: "var(--color-text-info, #185fa5)", marginTop: 8 }}>+ {label}</button>
);

export default function ProjectMotivationCalculator() {
  const [employees, setEmployees] = useState(defaultEmployees);
  const [projects, setProjects] = useState(defaultProjects);
  const [participation, setParticipation] = useState(defaultParticipation);
  const [activeTab, setActiveTab] = useState("results");
  const [cpFilters, setCpFilters] = useState({});  // { projectId: checkpointId or 0 for all }

  const upEmp = (id, f, v) => setEmployees((p) => p.map((e) => (e.id === id ? { ...e, [f]: v } : e)));
  const addEmp = () => setEmployees((p) => [...p, { id: genId(), name: "", role: "S", salary: 0, ceilingMultiplier: 2 }]);
  const delEmp = (id) => setEmployees((p) => p.filter((e) => e.id !== id));
  const addProj = () => setProjects((p) => [...p, { id: genId(), name: "", checkpoints: [] }]);
  const delProj = (id) => setProjects((p) => p.filter((pr) => pr.id !== id));
  const upProj = (id, f, v) => setProjects((p) => p.map((pr) => (pr.id === id ? { ...pr, [f]: v } : pr)));
  const addCP = (pid) => setProjects((p) => p.map((pr) => pr.id === pid ? { ...pr, checkpoints: [...pr.checkpoints, { id: genId(), name: "", weight: 0, plannedDays: 0 }] } : pr));
  const delCP = (pid, cid) => setProjects((p) => p.map((pr) => pr.id === pid ? { ...pr, checkpoints: pr.checkpoints.filter((c) => c.id !== cid) } : pr));
  const upCP = (pid, cid, f, v) => setProjects((p) => p.map((pr) => pr.id === pid ? { ...pr, checkpoints: pr.checkpoints.map((c) => (c.id === cid ? { ...c, [f]: v } : c)) } : pr));
  const addPart = () => setParticipation((p) => [...p, { id: genId(), empId: employees[0]?.id || 0, projectId: projects[0]?.id || 0, checkpointId: projects[0]?.checkpoints?.[0]?.id || 0, actualDays: 0, period: "Q1", note: "" }]);
  const delPart = (id) => setParticipation((p) => p.filter((r) => r.id !== id));
  const upPart = (id, f, v) => setParticipation((p) => p.map((r) => (r.id === id ? { ...r, [f]: v } : r)));

  const partByProj = useMemo(() => {
    const g = {};
    projects.forEach((p) => { g[p.id] = []; });
    participation.forEach((r) => { if (g[r.projectId]) g[r.projectId].push(r); });
    return g;
  }, [participation, projects]);

  const { results, empTotals, projTotals, grandTotal, resultsByProj } = useMemo(() => {
    const res = [], empT = {}, projT = {};
    let gt = 0;
    participation.forEach((part) => {
      const emp = employees.find((e) => e.id === part.empId);
      const proj = projects.find((p) => p.id === part.projectId);
      const cp = proj?.checkpoints?.find((c) => c.id === part.checkpointId);
      if (!emp || !proj || !cp) return;
      const ceil = emp.salary * emp.ceilingMultiplier;
      const pCeil = emp.role === "S" ? ceil / 3 : ceil;
      const wf = cp.weight / 100;
      const pc = cp.plannedDays > 0 ? Math.min(part.actualDays / cp.plannedDays, 1) : 0;
      const bonus = pCeil * wf * pc;
      if (!empT[emp.id]) empT[emp.id] = { total: 0, ceiling: ceil, byProj: {} };
      empT[emp.id].total += bonus;
      empT[emp.id].byProj[proj.id] = (empT[emp.id].byProj[proj.id] || 0) + bonus;
      projT[proj.id] = (projT[proj.id] || 0) + bonus;
      gt += bonus;
      res.push({ empId: emp.id, empName: emp.name, role: emp.role, projectId: proj.id, projectName: proj.name, cpName: cp.name, weight: cp.weight, pCeil, pc, bonus, period: part.period, note: part.note });
    });
    const byP = {};
    projects.forEach((p) => { byP[p.id] = []; });
    res.forEach((r) => { if (byP[r.projectId]) byP[r.projectId].push(r); });
    return { results: res, empTotals: empT, projTotals: projT, grandTotal: gt, resultsByProj: byP };
  }, [employees, projects, participation]);

  const tabs = [
    { key: "employees", label: "Сотрудники", color: "#1D9E75" },
    { key: "projects", label: "Проекты", color: "#185FA5" },
    { key: "participation", label: "Участие", color: "#D85A30" },
    { key: "results", label: "Расчёт", color: "#A32D2D" },
  ];

  return (
    <div style={{ fontFamily: "var(--font-sans, sans-serif)", maxWidth: 980, padding: "0 0 20px" }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 20, flexWrap: "wrap" }}>
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{ ...S.btn, background: activeTab === t.key ? t.color : "var(--color-background-secondary, #f0f0f0)", color: activeTab === t.key ? "#fff" : "var(--color-text-secondary, #666)", padding: "8px 18px", fontSize: 14 }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ===== EMPLOYEES ===== */}
      {activeTab === "employees" && (
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 17, fontWeight: 500, color: "#1D9E75", marginBottom: 12, borderBottom: "2px solid #1D9E7522", paddingBottom: 6 }}>Сотрудники</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><Th>ФИО</Th><Th w="130px">Роль</Th><Th w="120px">Оклад</Th><Th w="100px">Кол-во окл.</Th><Th w="120px" align="right">Потолок/год</Th><Th w="120px" align="right">Проектн. доля</Th><Th w="36px"></Th></tr></thead>
              <tbody>
                {employees.map((emp) => {
                  const c = emp.salary * emp.ceilingMultiplier;
                  const pc = emp.role === "S" ? c / 3 : c;
                  return (
                    <tr key={emp.id}>
                      <Td><input style={S.input} value={emp.name} onChange={(e) => upEmp(emp.id, "name", e.target.value)} placeholder="ФИО" /></Td>
                      <Td><select style={S.input} value={emp.role} onChange={(e) => upEmp(emp.id, "role", e.target.value)}>{ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</select></Td>
                      <Td><input style={{ ...S.input, textAlign: "right" }} type="number" value={emp.salary || ""} onChange={(e) => upEmp(emp.id, "salary", +e.target.value)} /></Td>
                      <Td><input style={{ ...S.input, textAlign: "right", width: 70 }} type="number" step="0.5" value={emp.ceilingMultiplier || ""} onChange={(e) => upEmp(emp.id, "ceilingMultiplier", +e.target.value)} /></Td>
                      <Td align="right">{fmt(c)}</Td>
                      <Td align="right">{fmt(pc)}{emp.role === "S" && <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginLeft: 4 }}>(1/3)</span>}</Td>
                      <Td><Del onClick={() => delEmp(emp.id)} /></Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Total planned project bonus fund */}
          {(() => {
            const totalCeiling = employees.reduce((s, emp) => s + emp.salary * emp.ceilingMultiplier, 0);
            const totalProjectFund = employees.reduce((s, emp) => {
              const c = emp.salary * emp.ceilingMultiplier;
              return s + (emp.role === "S" ? c / 3 : c);
            }, 0);
            return (
              <div style={{ marginTop: 16, padding: "14px 18px", borderRadius: 8, background: "var(--color-background-secondary)", border: "1px solid var(--color-border-tertiary)", display: "flex", flexWrap: "wrap", gap: "24px", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginBottom: 2 }}>Общий премиальный фонд (все)</div>
                  <div style={{ fontSize: 18, fontWeight: 500, color: "var(--color-text-primary)" }}>{fmt(totalCeiling)}</div>
                </div>
                <div style={{ width: 1, height: 36, background: "var(--color-border-tertiary)" }}></div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginBottom: 2 }}>Плановый проектный премиальный фонд</div>
                  <div style={{ fontSize: 18, fontWeight: 500, color: "#1D9E75" }}>{fmt(totalProjectFund)}</div>
                </div>
                <div style={{ width: 1, height: 36, background: "var(--color-border-tertiary)" }}></div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginBottom: 2 }}>Сотрудников</div>
                  <div style={{ fontSize: 18, fontWeight: 500, color: "var(--color-text-primary)" }}>{employees.length}</div>
                </div>
              </div>
            );
          })()}

          <Add onClick={addEmp} label="Сотрудник" />
        </div>
      )}

      {/* ===== PROJECTS ===== */}
      {activeTab === "projects" && (
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 17, fontWeight: 500, color: "#185FA5", marginBottom: 12, borderBottom: "2px solid #185FA522", paddingBottom: 6 }}>Проекты и контрольные точки</h2>
          {projects.map((proj, pi) => {
            const tw = proj.checkpoints.reduce((s, c) => s + (c.weight || 0), 0);
            const col = getPC(pi);
            return (
              <div key={proj.id} style={{ marginBottom: 20, padding: 14, borderRadius: 8, border: "1px solid var(--color-border-tertiary)", borderLeft: `4px solid ${col}`, background: "var(--color-background-secondary, #fafafa)" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
                  <input style={{ ...S.input, fontWeight: 500, fontSize: 14, flex: 1 }} value={proj.name} onChange={(e) => upProj(proj.id, "name", e.target.value)} placeholder="Название проекта" />
                  <Del onClick={() => delProj(proj.id)} />
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr><Th>Контрольная точка</Th><Th w="100px">Вес (%)</Th><Th w="120px">Плановые дни</Th><Th w="36px"></Th></tr></thead>
                  <tbody>
                    {proj.checkpoints.map((cp) => (
                      <tr key={cp.id}>
                        <Td><input style={S.input} value={cp.name} onChange={(e) => upCP(proj.id, cp.id, "name", e.target.value)} /></Td>
                        <Td><input style={{ ...S.input, textAlign: "right" }} type="number" value={cp.weight || ""} onChange={(e) => upCP(proj.id, cp.id, "weight", +e.target.value)} /></Td>
                        <Td><input style={{ ...S.input, textAlign: "right" }} type="number" value={cp.plannedDays || ""} onChange={(e) => upCP(proj.id, cp.id, "plannedDays", +e.target.value)} /></Td>
                        <Td><Del onClick={() => delCP(proj.id, cp.id)} /></Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                  <Add onClick={() => addCP(proj.id)} label="Контрольная точка" />
                  <span style={{ fontSize: 12, fontWeight: 500, color: tw === 100 ? "var(--color-text-success, #0a7)" : "var(--color-text-danger, #c00)" }}>
                    Сумма весов: {tw}%{tw !== 100 ? " (должно быть 100%)" : " ✓"}
                  </span>
                </div>
              </div>
            );
          })}
          <Add onClick={addProj} label="Проект" />
        </div>
      )}

      {/* ===== PARTICIPATION — grouped by project with checkpoint filter ===== */}
      {activeTab === "participation" && (
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 17, fontWeight: 500, color: "#D85A30", marginBottom: 12, borderBottom: "2px solid #D85A3022", paddingBottom: 6 }}>Участие в проектах</h2>
          {projects.map((proj, pi) => {
            const items = partByProj[proj.id] || [];
            const col = getPC(pi);
            const filterVal = cpFilters[proj.id] || 0;
            const filtered = filterVal === 0 ? items : items.filter((p) => p.checkpointId === filterVal);
            return (
              <div key={proj.id} style={{ marginBottom: 28 }}>
                <div style={{ padding: "8px 12px", fontWeight: 500, fontSize: 14, color: col, borderBottom: `2px solid ${col}`, marginBottom: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>{proj.name}</span>
                  <span style={{ fontWeight: 400, fontSize: 12, color: "var(--color-text-tertiary)" }}>{filtered.length} из {items.length}</span>
                </div>
                {/* Checkpoint filter pills */}
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", padding: "8px 12px 6px", background: "var(--color-background-secondary, #fafafa)", borderBottom: "1px solid var(--color-border-tertiary)" }}>
                  <button onClick={() => setCpFilters((f) => ({ ...f, [proj.id]: 0 }))} style={{
                    ...S.btn, padding: "4px 12px", fontSize: 12,
                    background: filterVal === 0 ? col : "transparent",
                    color: filterVal === 0 ? "#fff" : "var(--color-text-secondary, #666)",
                    border: filterVal === 0 ? "none" : "1px solid var(--color-border-secondary, #ccc)",
                  }}>Все КТ</button>
                  {proj.checkpoints.map((cp) => {
                    const active = filterVal === cp.id;
                    const count = items.filter((p) => p.checkpointId === cp.id).length;
                    return (
                      <button key={cp.id} onClick={() => setCpFilters((f) => ({ ...f, [proj.id]: active ? 0 : cp.id }))} style={{
                        ...S.btn, padding: "4px 12px", fontSize: 12,
                        background: active ? col : "transparent",
                        color: active ? "#fff" : "var(--color-text-secondary, #666)",
                        border: active ? "none" : "1px solid var(--color-border-secondary, #ccc)",
                      }}>
                        {cp.name} <span style={{ opacity: 0.7, marginLeft: 3 }}>({count})</span>
                      </button>
                    );
                  })}
                </div>
                {filtered.length === 0 ? (
                  <div style={{ padding: "12px", fontSize: 13, color: "var(--color-text-tertiary)", fontStyle: "italic" }}>Нет записей{filterVal !== 0 ? " по выбранной контрольной точке" : ""}</div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead><tr>
                        <Th>Сотрудник</Th><Th w="44px">Роль</Th><Th>Контр. точка</Th><Th w="75px" align="right">План</Th>
                        <Th w="75px" align="right">Факт</Th><Th w="65px" align="right">Коэфф.</Th>
                        <Th w="65px">Период</Th><Th>Примечание</Th><Th w="36px"></Th>
                      </tr></thead>
                      <tbody>
                        {filtered.map((part) => {
                          const cp = proj.checkpoints.find((c) => c.id === part.checkpointId);
                          const coeff = cp && cp.plannedDays > 0 ? Math.min(part.actualDays / cp.plannedDays, 1) : 0;
                          return (
                            <tr key={part.id}>
                              <Td><select style={S.input} value={part.empId} onChange={(e) => upPart(part.id, "empId", +e.target.value)}>
                                <option value={0}>—</option>
                                {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name || "(без имени)"}</option>)}
                              </select></Td>
                              <Td style={{ fontSize: 12, color: "var(--color-text-secondary)", textAlign: "center" }}>{employees.find((e) => e.id === part.empId)?.role || "—"}</Td>
                              <Td><select style={S.input} value={part.checkpointId} onChange={(e) => upPart(part.id, "checkpointId", +e.target.value)}>
                                <option value={0}>—</option>
                                {proj.checkpoints.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                              </select></Td>
                              <Td align="right" style={{ color: "var(--color-text-tertiary)" }}>{cp?.plannedDays || "—"}</Td>
                              <Td><input style={{ ...S.input, textAlign: "right" }} type="number" value={part.actualDays || ""} onChange={(e) => upPart(part.id, "actualDays", +e.target.value)} /></Td>
                              <Td align="right" style={{ fontWeight: 500, color: coeff < 0.5 ? "var(--color-text-danger, #c00)" : coeff < 1 ? "var(--color-text-warning, #a60)" : "var(--color-text-success, #070)" }}>{coeff.toFixed(2)}</Td>
                              <Td><select style={{ ...S.input, width: 60 }} value={part.period} onChange={(e) => upPart(part.id, "period", e.target.value)}>
                                {PAYOUT_PERIODS.map((p) => <option key={p} value={p}>{p}</option>)}
                              </select></Td>
                              <Td><input style={S.input} value={part.note} onChange={(e) => upPart(part.id, "note", e.target.value)} placeholder="отпуск, замена..." /></Td>
                              <Td><Del onClick={() => delPart(part.id)} /></Td>
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
          <Add onClick={addPart} label="Запись об участии" />
          <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 6 }}>Новая запись добавляется в первый проект. Смените проект через редактирование.</div>
        </div>
      )}

      {/* ===== RESULTS — grouped by project + subtotals + grand total + employee summary ===== */}
      {activeTab === "results" && (
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 17, fontWeight: 500, color: "#A32D2D", marginBottom: 12, borderBottom: "2px solid #A32D2D22", paddingBottom: 6 }}>Расчёт премий</h2>

          {/* Per-project detail tables with per-employee subtotals */}
          {projects.map((proj, pi) => {
            const rows = resultsByProj[proj.id] || [];
            if (rows.length === 0) return null;
            const col = getPC(pi);
            const pt = projTotals[proj.id] || 0;

            // Group rows by employee, preserving order of first appearance
            const empOrder = [];
            const byEmp = {};
            rows.forEach((r) => {
              if (!byEmp[r.empId]) { byEmp[r.empId] = []; empOrder.push(r.empId); }
              byEmp[r.empId].push(r);
            });

            return (
              <div key={proj.id} style={{ marginBottom: 28 }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr><td colSpan={99} style={{ padding: "10px 12px 6px", fontWeight: 500, fontSize: 14, color: col, borderBottom: `2px solid ${col}` }}>
                        {proj.name}<span style={{ fontWeight: 400, fontSize: 12, color: "var(--color-text-tertiary)", marginLeft: 8 }}>({rows.length} начислений)</span>
                      </td></tr>
                      <tr><Th>ФИО</Th><Th w="44px">Роль</Th><Th>Контрольная точка</Th><Th w="50px" align="right">Вес</Th><Th w="60px" align="right">Коэфф.</Th><Th w="110px" align="right">Премия</Th><Th w="55px">Период</Th><Th>Примечание</Th></tr>
                    </thead>
                    <tbody>
                      {empOrder.map((eId) => {
                        const empRows = byEmp[eId];
                        const empTotal = empRows.reduce((s, r) => s + r.bonus, 0);
                        const emp = employees.find(e => e.id === eId);
                        const exceeded = emp && empTotals[eId]?.total > (emp.role === "S" ? emp.salary * emp.ceilingMultiplier / 3 : emp.salary * emp.ceilingMultiplier);
                        return empRows.map((r, i) => (
                          <React.Fragment key={`${eId}-${i}`}>
                            <tr style={exceeded ? { background: "var(--color-background-danger, #fdd)" } : {}}>
                              {i === 0 ? <Td style={{ fontWeight: 500, borderBottom: "none" }}>{r.empName}</Td> : <Td style={{ borderBottom: "none", color: "transparent", fontSize: 1 }}>.</Td>}
                              {i === 0 ? <Td style={{ borderBottom: "none" }}>{r.role}</Td> : <Td style={{ borderBottom: "none" }}></Td>}
                              <Td>{r.cpName}</Td>
                              <Td align="right">{r.weight}%</Td><Td align="right">{r.pc.toFixed(2)}</Td>
                              <Td align="right"><strong>{fmt(r.bonus)}</strong></Td>
                              <Td>{r.period}</Td>
                              <Td style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>{r.note}</Td>
                            </tr>
                            {i === empRows.length - 1 && (
                              <tr>
                                <td colSpan={5} style={{ padding: "4px 12px", textAlign: "right", fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", borderBottom: "1px solid var(--color-border-tertiary)", background: "var(--color-background-secondary)" }}>
                                  Итого {r.empName}:
                                </td>
                                <td style={{ padding: "4px 12px", textAlign: "right", fontSize: 13, fontWeight: 500, borderBottom: "1px solid var(--color-border-tertiary)", background: "var(--color-background-secondary)" }}>
                                  {fmt(empTotal)}
                                </td>
                                <td colSpan={2} style={{ borderBottom: "1px solid var(--color-border-tertiary)", background: "var(--color-background-secondary)" }}></td>
                              </tr>
                            )}
                          </React.Fragment>
                        ));
                      })}
                      <tr><td colSpan={99} style={{ padding: "8px 12px", textAlign: "right", fontWeight: 500, fontSize: 13, borderBottom: `2px solid ${col}44`, background: `${col}08`, color: col }}>
                        Итого по проекту: <strong style={{ fontSize: 15 }}>{fmt(pt)}</strong>
                      </td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

          {/* Grand total */}
          <div style={{ padding: "14px 18px", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--color-background-secondary)", border: "1px solid var(--color-border-tertiary)", marginBottom: 28 }}>
            <span style={{ fontWeight: 500, fontSize: 16, color: "var(--color-text-primary)" }}>Общий итог по всем проектам</span>
            <span style={{ fontWeight: 500, fontSize: 20, color: "#A32D2D" }}>{fmt(grandTotal)}</span>
          </div>

          {/* Employee summary with per-project breakdown */}
          <h3 style={{ fontSize: 15, fontWeight: 500, color: "#A32D2D", marginBottom: 10 }}>Сводка по сотрудникам (разбивка по проектам)</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                <Th>ФИО</Th><Th w="44px">Роль</Th>
                {projects.map((p, i) => <Th key={p.id} w="100px" align="right"><span style={{ color: getPC(i), fontSize: 11 }}>{p.name.split("—")[0].trim()}</span></Th>)}
                <Th w="100px" align="right">Итого</Th><Th w="120px" align="right">Потолок (проектн.)</Th><Th w="90px" align="right">Остаток</Th><Th w="80px">Статус</Th>
              </tr></thead>
              <tbody>
                {employees.map((emp) => {
                  const d = empTotals[emp.id] || { total: 0, byProj: {} };
                  const fullCeil = emp.salary * emp.ceilingMultiplier;
                  const ceil = emp.role === "S" ? fullCeil / 3 : fullCeil;
                  const exc = d.total > ceil;
                  return (
                    <tr key={emp.id} style={exc ? { background: "var(--color-background-danger, #fdd)" } : {}}>
                      <Td>{emp.name}</Td><Td>{emp.role}</Td>
                      {projects.map((p) => <Td key={p.id} align="right" style={{ fontSize: 12 }}>{d.byProj[p.id] ? fmt(d.byProj[p.id]) : "—"}</Td>)}
                      <Td align="right"><strong>{fmt(d.total)}</strong></Td>
                      <Td align="right">{fmt(ceil)}</Td>
                      <Td align="right" style={{ color: exc ? "var(--color-text-danger, #c00)" : "var(--color-text-success, #070)" }}>{fmt(ceil - d.total)}</Td>
                      <Td>
                        <span style={{ padding: "3px 10px", borderRadius: 12, fontSize: 12, fontWeight: 500, background: exc ? "var(--color-background-danger, #fdd)" : "var(--color-background-success, #dfd)", color: exc ? "var(--color-text-danger, #c00)" : "var(--color-text-success, #070)" }}>
                          {exc ? "Превышение!" : "ОК"}
                        </span>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 20, padding: 14, borderRadius: 8, background: "var(--color-background-secondary)", fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
            <strong>Формула:</strong> Премия за КТ = Проектная доля потолка × Вес КТ (%) × Коэфф. участия (факт.дни / план.дни)<br />
            <strong>Проектная доля:</strong> PM/BA = 100% годового потолка | S = 1/3 годового потолка (пропорция 2:1)<br />
            <strong>Ограничение:</strong> Сумма всех премий за год ≤ Годовой потолок (N окладов)
          </div>
        </div>
      )}
    </div>
  );
}
