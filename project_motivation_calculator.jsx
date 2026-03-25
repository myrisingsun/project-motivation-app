import React, { useState, useMemo } from "react";

const ROLES = [
  { value: "A", label: "PM (Руководитель проекта)" },
  { value: "BA", label: "BA (Бизнес-аналитик)" },
  { value: "S", label: "S (Функц. исполнитель)" },
];
const PAYOUT_PERIODS = ["Q1","Q2","Q3","Q4","H1","H2"];
const ABC_GRADES = ["A","B+","B","B-","C"];

// Standard milestones with weights per role (from Справ sheet)
const STD_MILESTONES = [
  { name: "Утверждение проектного задания",    wPM: 5, wBA: 0, wS: 0 },
  { name: "Утверждение плана и бюджета",       wPM: 10, wBA: 0, wS: 0 },
  { name: "Утверждение требований",            wPM: 5, wBA: 10, wS: 10 },
  { name: "Утверждение архитектуры и дизайна",  wPM: 10, wBA: 10, wS: 10 },
  { name: "Завершение ключевых модулей",       wPM: 10, wBA: 10, wS: 10 },
  { name: "Интеграционное тестирование",       wPM: 10, wBA: 15, wS: 15 },
  { name: "Пользовательское приемочное тестирование", wPM: 15, wBA: 15, wS: 15 },
  { name: "Запуск в production (ОПЭ)",         wPM: 10, wBA: 15, wS: 15 },
  { name: "Обучение и приемка заказчиков",     wPM: 10, wBA: 10, wS: 10 },
  { name: "Закрытие проекта",                  wPM: 15, wBA: 15, wS: 15 },
];

// Scale table for component model
const SCALE = [
  { label: "< 80%", min: 0, max: 0.7999, coeff: 0 },
  { label: "80–95%", min: 0.80, max: 0.9499, coeff: 0.8 },
  { label: "95–105%", min: 0.95, max: 1.0499, coeff: 1.0 },
  { label: "105–120%", min: 1.05, max: 1.1999, coeff: 1.2 },
  { label: "> 120%", min: 1.20, max: 999, coeff: 1.5 },
];
const applyScale = (v) => { for (const s of SCALE) { if (v >= s.min && v <= s.max) return s.coeff; } return 0; };

// ===== SETTINGS =====
const defaultSettings = {
  formulaMode: "multiplier", // "multiplier" | "component"
  componentWeights: { milestones: 40, budget: 40, abc: 20 },
  useRoleWeights: true,
  projectLimitEnabled: true, projectLimitMax: 3, projectLimitExceptions: {},
  abcCoeffs: { "A": 1.2, "B+": 1.1, "B": 1.0, "B-": 0, "C": 0 },
  newcomerEnabled: true, newcomerMonths: 6,
  newcomerAbcCoeffs: { "A": 1.0, "B+": 1.0, "B": 0, "B-": 0, "C": 0 },
};

// ===== DATA =====
const defaultEmployees = [
  { id:1, name:"Иванов И.И.",  role:"A",  salary:200000, ceilingMultiplier:2, abcGrade:"B+", hireDate:"2024-01-15" },
  { id:2, name:"Петров П.П.",  role:"BA", salary:180000, ceilingMultiplier:2, abcGrade:"B",  hireDate:"2023-06-01" },
  { id:3, name:"Сидоров С.С.", role:"S",  salary:150000, ceilingMultiplier:2, abcGrade:"A",  hireDate:"2022-03-10" },
  { id:4, name:"Козлова К.К.", role:"S",  salary:160000, ceilingMultiplier:2, abcGrade:"B",  hireDate:"2025-11-01" },
  { id:5, name:"Морозов М.М.", role:"A",  salary:210000, ceilingMultiplier:2, abcGrade:"B+", hireDate:"2021-09-01" },
  { id:6, name:"Волкова В.В.", role:"S",  salary:140000, ceilingMultiplier:2, abcGrade:"B",  hireDate:"2025-12-15" },
  { id:7, name:"Новиков Н.Н.", role:"BA", salary:175000, ceilingMultiplier:2, abcGrade:"A",  hireDate:"2024-07-01" },
];

const defaultProjects = [
  { id:1, name:"Проект Alpha — CRM-система", budget:1000000, budgetFact:0.97, checkpoints:[
    { id:1, name:"Анализ требований", weight:20, plannedDays:59 },
    { id:2, name:"Разработка решения", weight:30, plannedDays:92 },
    { id:3, name:"Тестирование", weight:20, plannedDays:61 },
    { id:4, name:"Внедрение", weight:30, plannedDays:61 },
  ]},
  { id:2, name:"Проект Beta — Автоматизация склада", budget:400000, budgetFact:0.88, checkpoints:[
    { id:21, name:"Обследование процессов", weight:25, plannedDays:45 },
    { id:22, name:"Проектирование", weight:25, plannedDays:60 },
    { id:23, name:"Разработка и настройка", weight:30, plannedDays:75 },
    { id:24, name:"Пилотный запуск", weight:20, plannedDays:30 },
  ]},
  { id:3, name:"Проект Gamma — Миграция данных", budget:600000, budgetFact:1.05, checkpoints:[
    { id:31, name:"Аудит источников данных", weight:30, plannedDays:40 },
    { id:32, name:"Разработка ETL-процессов", weight:40, plannedDays:70 },
    { id:33, name:"Миграция и верификация", weight:30, plannedDays:50 },
  ]},
];

const defaultParticipation = [
  { id:1,  empId:1, projectId:1, checkpointId:1,  actualDays:59, period:"Q1", note:"" },
  { id:2,  empId:1, projectId:1, checkpointId:2,  actualDays:92, period:"Q2", note:"" },
  { id:3,  empId:2, projectId:1, checkpointId:1,  actualDays:59, period:"Q1", note:"" },
  { id:4,  empId:2, projectId:1, checkpointId:2,  actualDays:72, period:"Q2", note:"отпуск 20 дней" },
  { id:5,  empId:3, projectId:1, checkpointId:1,  actualDays:40, period:"Q1", note:"подключён с 20.01" },
  { id:6,  empId:3, projectId:1, checkpointId:2,  actualDays:92, period:"Q2", note:"" },
  { id:7,  empId:4, projectId:1, checkpointId:3,  actualDays:55, period:"Q3", note:"больничный 6 дней" },
  { id:10, empId:5, projectId:2, checkpointId:21, actualDays:45, period:"Q1", note:"" },
  { id:11, empId:5, projectId:2, checkpointId:22, actualDays:60, period:"Q2", note:"" },
  { id:12, empId:7, projectId:2, checkpointId:21, actualDays:45, period:"Q1", note:"" },
  { id:13, empId:7, projectId:2, checkpointId:22, actualDays:50, period:"Q2", note:"отпуск 10 дней" },
  { id:14, empId:3, projectId:2, checkpointId:21, actualDays:30, period:"Q1", note:"частичная загрузка" },
  { id:15, empId:3, projectId:2, checkpointId:22, actualDays:45, period:"Q2", note:"" },
  { id:16, empId:4, projectId:2, checkpointId:23, actualDays:75, period:"Q3", note:"" },
  { id:17, empId:4, projectId:2, checkpointId:24, actualDays:30, period:"Q4", note:"" },
  { id:18, empId:6, projectId:2, checkpointId:21, actualDays:40, period:"Q1", note:"" },
  { id:20, empId:1, projectId:3, checkpointId:31, actualDays:35, period:"Q2", note:"параллельно Alpha" },
  { id:21, empId:1, projectId:3, checkpointId:32, actualDays:60, period:"Q3", note:"" },
  { id:22, empId:2, projectId:3, checkpointId:31, actualDays:40, period:"Q2", note:"" },
  { id:23, empId:2, projectId:3, checkpointId:32, actualDays:70, period:"Q3", note:"" },
  { id:24, empId:6, projectId:3, checkpointId:31, actualDays:40, period:"Q2", note:"" },
  { id:25, empId:6, projectId:3, checkpointId:32, actualDays:55, period:"Q3", note:"больничный 15 дней" },
  { id:26, empId:6, projectId:3, checkpointId:33, actualDays:50, period:"Q4", note:"" },
  { id:27, empId:4, projectId:3, checkpointId:33, actualDays:25, period:"Q4", note:"подключена для усиления" },
];

// ===== UTILS =====
let nextId = 200; const gid = () => ++nextId;
const fmt = n => Math.round(n).toLocaleString("ru-RU");
const PC = ["#185FA5","#0F6E56","#993C1D","#72243E","#444441"];
const getPC = i => PC[i % PC.length];
const isNewcomer = (d, m) => { if (!d) return false; return (new Date() - new Date(d)) / (1000*60*60*24*30.44) < m; };
const getAbcC = (g, d, s) => (s.newcomerEnabled && isNewcomer(d, s.newcomerMonths) ? s.newcomerAbcCoeffs : s.abcCoeffs)[g] ?? 1;
const getRoleWeightKey = r => r === "A" ? "wPM" : r === "BA" ? "wBA" : "wS";

// ===== UI HELPERS =====
const S = {
  input: { padding:"6px 10px", border:"1px solid var(--color-border-secondary,#ccc)", borderRadius:6, fontSize:13, background:"var(--color-background-primary,#fff)", color:"var(--color-text-primary,#222)", outline:"none", width:"100%", boxSizing:"border-box" },
  btn: { padding:"6px 14px", borderRadius:6, border:"none", fontSize:13, cursor:"pointer", fontWeight:500, transition:"opacity .15s" },
};
const Th = ({children,w,align}) => <th style={{padding:"8px 10px",fontSize:12,fontWeight:500,textAlign:align||"left",background:"var(--color-background-secondary)",borderBottom:"1px solid var(--color-border-tertiary)",whiteSpace:"nowrap",width:w}}>{children}</th>;
const Td = ({children,align,style:sx}) => <td style={{padding:"6px 10px",fontSize:13,borderBottom:"1px solid var(--color-border-tertiary,#eee)",textAlign:align||"left",verticalAlign:"middle",...sx}}>{children}</td>;
const Del = ({onClick}) => <button onClick={onClick} style={{...S.btn,background:"transparent",color:"var(--color-text-danger,#c00)",padding:"2px 8px",fontSize:16,lineHeight:1}}>×</button>;
const Add = ({onClick,label}) => <button onClick={onClick} style={{...S.btn,background:"var(--color-background-info,#e6f1fb)",color:"var(--color-text-info,#185fa5)",marginTop:8}}>+ {label}</button>;
const Badge = ({ok,text}) => <span style={{padding:"3px 10px",borderRadius:12,fontSize:12,fontWeight:500,background:ok?"var(--color-background-success,#dfd)":"var(--color-background-danger,#fdd)",color:ok?"var(--color-text-success,#070)":"var(--color-text-danger,#c00)"}}>{text}</span>;
const Card = ({title,children}) => <div style={{padding:16,borderRadius:8,border:"1px solid var(--color-border-tertiary)",background:"var(--color-background-secondary)",marginBottom:16}}><div style={{fontSize:14,fontWeight:500,marginBottom:10}}>{title}</div>{children}</div>;
const Toggle = ({checked,onChange,label}) => <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:13}}><div onClick={()=>onChange(!checked)} style={{width:36,height:20,borderRadius:10,background:checked?"var(--color-text-info,#185fa5)":"var(--color-border-secondary,#ccc)",position:"relative",transition:"background .2s",cursor:"pointer"}}><div style={{width:16,height:16,borderRadius:8,background:"#fff",position:"absolute",top:2,left:checked?18:2,transition:"left .2s"}}/></div>{label}</label>;

// ===== COMPONENT =====
export default function ProjectMotivationCalculator() {
  const [employees, setEmployees] = useState(defaultEmployees);
  const [projects, setProjects] = useState(defaultProjects);
  const [participation, setParticipation] = useState(defaultParticipation);
  const [settings, setSettings] = useState(defaultSettings);
  const [activeTab, setActiveTab] = useState("results");
  const [cpFilters, setCpFilters] = useState({});
  const [payoutScenario, setPayoutScenario] = useState("quarterly");

  const upSet = (path, val) => setSettings(s => {
    const c = JSON.parse(JSON.stringify(s)); const k = path.split(".");
    let o = c; for (let i=0;i<k.length-1;i++) o=o[k[i]]; o[k[k.length-1]]=val; return c;
  });
  const upEmp = (id,f,v) => setEmployees(p => p.map(e => e.id===id?{...e,[f]:v}:e));
  const addEmp = () => setEmployees(p => [...p,{id:gid(),name:"",role:"S",salary:0,ceilingMultiplier:2,abcGrade:"B",hireDate:""}]);
  const delEmp = id => setEmployees(p => p.filter(e => e.id!==id));
  const addProj = () => setProjects(p => [...p,{id:gid(),name:"",budget:0,budgetFact:0,checkpoints:[]}]);
  const delProj = id => setProjects(p => p.filter(pr => pr.id!==id));
  const upProj = (id,f,v) => setProjects(p => p.map(pr => pr.id===id?{...pr,[f]:v}:pr));
  const addCP = pid => setProjects(p => p.map(pr => pr.id===pid?{...pr,checkpoints:[...pr.checkpoints,{id:gid(),name:"",weight:0,plannedDays:0}]}:pr));
  const delCP = (pid,cid) => setProjects(p => p.map(pr => pr.id===pid?{...pr,checkpoints:pr.checkpoints.filter(c=>c.id!==cid)}:pr));
  const upCP = (pid,cid,f,v) => setProjects(p => p.map(pr => pr.id===pid?{...pr,checkpoints:pr.checkpoints.map(c=>c.id===cid?{...c,[f]:v}:c)}:pr));
  const addPart = () => setParticipation(p => [...p,{id:gid(),empId:employees[0]?.id||0,projectId:projects[0]?.id||0,checkpointId:projects[0]?.checkpoints?.[0]?.id||0,actualDays:0,period:"Q1",note:""}]);
  const delPart = id => setParticipation(p => p.filter(r => r.id!==id));
  const upPart = (id,f,v) => setParticipation(p => p.map(r => r.id===id?{...r,[f]:v}:r));

  const empProjCount = useMemo(() => {
    const c = {}; participation.forEach(p => { if(!c[p.empId]) c[p.empId]=new Set(); c[p.empId].add(p.projectId); });
    const r = {}; Object.keys(c).forEach(k => { r[k]=c[k].size; }); return r;
  }, [participation]);

  const partByProj = useMemo(() => {
    const g = {}; projects.forEach(p => {g[p.id]=[];}); participation.forEach(r => {if(g[r.projectId]) g[r.projectId].push(r);}); return g;
  }, [participation, projects]);

  // ===== CALCULATION ENGINE =====
  const { results, empTotals, projTotals, grandTotal, resultsByProj } = useMemo(() => {
    const res=[], empT={}, projT={}; let gt=0;
    const mode = settings.formulaMode;
    const cw = settings.componentWeights;
    const cwSum = cw.milestones + cw.budget + cw.abc;

    participation.forEach(part => {
      const emp = employees.find(e => e.id===part.empId);
      const proj = projects.find(p => p.id===part.projectId);
      const cp = proj?.checkpoints?.find(c => c.id===part.checkpointId);
      if (!emp||!proj||!cp) return;

      const ceil = emp.salary * emp.ceilingMultiplier;
      const pCeil = emp.role==="S" ? ceil/3 : ceil;
      const wf = cp.weight/100;
      const pc = cp.plannedDays>0 ? Math.min(part.actualDays/cp.plannedDays, 1) : 0;
      const abcC = getAbcC(emp.abcGrade, emp.hireDate, settings);

      let bonus, budgetCoeff=null, milestoneCoeffScaled=null;

      if (mode === "multiplier") {
        // Потолок × Вес КТ × Коэфф.участия × ABC
        bonus = pCeil * wf * pc * abcC;
      } else {
        // Компонентная: Потолок × (Вехи×W1 + Бюджет×W2 + ABC×W3) / 100
        // Вехи = вес КТ × коэфф.участия (уже есть: wf * pc)
        const milestoneVal = wf * pc; // доля выполнения этой КТ
        milestoneCoeffScaled = milestoneVal; // для отображения
        budgetCoeff = proj.budgetFact > 0 ? applyScale(proj.budgetFact) : 0;
        const combined = (milestoneVal * cw.milestones + budgetCoeff * cw.budget + abcC * cw.abc) / (cwSum || 100);
        bonus = pCeil * combined;
      }

      if (!empT[emp.id]) empT[emp.id]={total:0,ceiling:ceil,byProj:{}};
      empT[emp.id].total += bonus;
      empT[emp.id].byProj[proj.id] = (empT[emp.id].byProj[proj.id]||0) + bonus;
      projT[proj.id] = (projT[proj.id]||0) + bonus;
      gt += bonus;

      res.push({ empId:emp.id, empName:emp.name, role:emp.role, projectId:proj.id, projectName:proj.name,
        cpName:cp.name, weight:cp.weight, pCeil, pc, abcGrade:emp.abcGrade, abcC,
        bonus, period:part.period, note:part.note,
        budgetFact:proj.budgetFact, budgetCoeff, milestoneCoeffScaled });
    });

    const byP = {}; projects.forEach(p => {byP[p.id]=[];}); res.forEach(r => {if(byP[r.projectId]) byP[r.projectId].push(r);});
    return { results:res, empTotals:empT, projTotals:projT, grandTotal:gt, resultsByProj:byP };
  }, [employees, projects, participation, settings]);

  // Export to CSV
  const exportCSV = () => {
    const hdr = ["ФИО","Роль","Проект","Контр.точка","Вес%","Коэфф.участия","ABC","ABC К","Премия","Период","Примечание"];
    const rows = results.map(r => [r.empName,r.role,r.projectName,r.cpName,r.weight,r.pc.toFixed(2),r.abcGrade,r.abcC,Math.round(r.bonus),r.period,r.note]);
    const csv = [hdr,...rows].map(r => r.map(c => `"${c}"`).join(";")).join("\n");
    const blob = new Blob(["\uFEFF"+csv], {type:"text/csv;charset=utf-8;"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download="project_motivation_export.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    {key:"settings",label:"Настройки",color:"#534AB7"},
    {key:"employees",label:"Сотрудники",color:"#1D9E75"},
    {key:"projects",label:"Проекты",color:"#185FA5"},
    {key:"participation",label:"Участие",color:"#D85A30"},
    {key:"results",label:"Расчёт",color:"#A32D2D"},
  ];

  const isComp = settings.formulaMode === "component";

  return (
    <div style={{fontFamily:"var(--font-sans,sans-serif)",maxWidth:1020,padding:"0 0 20px"}}>
      <div style={{display:"flex",gap:4,marginBottom:20,flexWrap:"wrap"}}>
        {tabs.map(t => <button key={t.key} onClick={()=>setActiveTab(t.key)} style={{...S.btn,background:activeTab===t.key?t.color:"var(--color-background-secondary)",color:activeTab===t.key?"#fff":"var(--color-text-secondary)",padding:"8px 18px",fontSize:14}}>{t.label}</button>)}
      </div>

      {/* ========== SETTINGS ========== */}
      {activeTab === "settings" && (
        <div style={{marginBottom:28}}>
          <h2 style={{fontSize:17,fontWeight:500,color:"#534AB7",marginBottom:12,borderBottom:"2px solid #534AB722",paddingBottom:6}}>Настройки</h2>

          <Card title="Модель расчёта">
            <div style={{display:"flex",gap:8,marginBottom:12}}>
              {[{k:"multiplier",l:"Множитель (Потолок × КТ × Участие × ABC)"},{k:"component",l:"Компонентная (Вехи + Бюджет + ABC с весами)"}].map(m => (
                <button key={m.k} onClick={()=>upSet("formulaMode",m.k)} style={{...S.btn,padding:"8px 16px",fontSize:12,background:settings.formulaMode===m.k?"#534AB7":"transparent",color:settings.formulaMode===m.k?"#fff":"var(--color-text-secondary)",border:settings.formulaMode===m.k?"none":"1px solid var(--color-border-secondary)"}}>{m.l}</button>
              ))}
            </div>
            {isComp && (
              <div style={{display:"flex",gap:16,alignItems:"center",flexWrap:"wrap"}}>
                <span style={{fontSize:13}}>Веса компонентов (%):</span>
                {[{k:"milestones",l:"Вехи"},{k:"budget",l:"Бюджет"},{k:"abc",l:"ABC"}].map(c => (
                  <label key={c.k} style={{display:"flex",alignItems:"center",gap:4,fontSize:13}}>
                    {c.l}: <input style={{...S.input,width:50,textAlign:"center"}} type="number" min={0} max={100} value={settings.componentWeights[c.k]} onChange={e=>upSet(`componentWeights.${c.k}`,+e.target.value)} />
                  </label>
                ))}
                <span style={{fontSize:12,color: (settings.componentWeights.milestones+settings.componentWeights.budget+settings.componentWeights.abc)===100?"var(--color-text-success)":"var(--color-text-danger)"}}>
                  Σ = {settings.componentWeights.milestones+settings.componentWeights.budget+settings.componentWeights.abc}%
                  {(settings.componentWeights.milestones+settings.componentWeights.budget+settings.componentWeights.abc)!==100?" (нужно 100%)":" ✓"}
                </span>
              </div>
            )}
          </Card>

          <Card title="Веса вех по ролям (справочник)">
            <Toggle checked={settings.useRoleWeights} onChange={v=>upSet("useRoleWeights",v)} label="Использовать разные веса вех для PM / BA / S" />
            {settings.useRoleWeights && (
              <div style={{overflowX:"auto",marginTop:10}}>
                <table style={{borderCollapse:"collapse",width:"100%"}}>
                  <thead><tr><Th>Веха</Th><Th w="60px" align="right">PM</Th><Th w="60px" align="right">BA</Th><Th w="60px" align="right">S</Th></tr></thead>
                  <tbody>
                    {STD_MILESTONES.map((m,i) => <tr key={i}><Td style={{fontSize:12}}>{m.name}</Td><Td align="right">{m.wPM}%</Td><Td align="right">{m.wBA}%</Td><Td align="right">{m.wS}%</Td></tr>)}
                    <tr style={{background:"var(--color-background-secondary)"}}><Td style={{fontWeight:500}}>Итого</Td><Td align="right" style={{fontWeight:500}}>{STD_MILESTONES.reduce((s,m)=>s+m.wPM,0)}%</Td><Td align="right" style={{fontWeight:500}}>{STD_MILESTONES.reduce((s,m)=>s+m.wBA,0)}%</Td><Td align="right" style={{fontWeight:500}}>{STD_MILESTONES.reduce((s,m)=>s+m.wS,0)}%</Td></tr>
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card title="Лимит проектов на сотрудника">
            <Toggle checked={settings.projectLimitEnabled} onChange={v=>upSet("projectLimitEnabled",v)} label="Ограничить количество проектов" />
            {settings.projectLimitEnabled && (<>
              <div style={{marginTop:10,display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:13}}>Максимум:</span>
                <input style={{...S.input,width:60,textAlign:"center"}} type="number" min={1} max={10} value={settings.projectLimitMax} onChange={e=>upSet("projectLimitMax",+e.target.value)} />
              </div>
              <div style={{marginTop:12,fontSize:12,color:"var(--color-text-secondary)",marginBottom:6}}>Исключения (без лимита):</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {employees.map(emp => {
                  const isE = !!settings.projectLimitExceptions[emp.id];
                  return <label key={emp.id} style={{display:"flex",alignItems:"center",gap:4,fontSize:12,padding:"4px 8px",borderRadius:6,border:`1px solid ${isE?"var(--color-text-info)":"var(--color-border-tertiary)"}`,background:isE?"var(--color-background-info,#e6f1fb)":"transparent",cursor:"pointer"}}>
                    <input type="checkbox" checked={isE} onChange={e=>{const c={...settings.projectLimitExceptions};if(e.target.checked)c[emp.id]=true;else delete c[emp.id];upSet("projectLimitExceptions",c);}} />{emp.name||`#${emp.id}`}
                  </label>;
                })}
              </div>
            </>)}
          </Card>

          <Card title="ABC-оценка — коэффициенты">
            <table style={{borderCollapse:"collapse"}}><thead><tr><Th>Оценка</Th><Th w="100px" align="right">Коэффициент</Th></tr></thead>
              <tbody>{ABC_GRADES.map(g => <tr key={g}><Td style={{fontWeight:500}}>{g}</Td><Td><input style={{...S.input,textAlign:"right",width:80}} type="number" step="0.1" min="0" max="2" value={settings.abcCoeffs[g]} onChange={e=>upSet(`abcCoeffs.${g}`,+e.target.value)} /></Td></tr>)}</tbody>
            </table>
          </Card>

          <Card title="Новички — специальные коэффициенты">
            <Toggle checked={settings.newcomerEnabled} onChange={v=>upSet("newcomerEnabled",v)} label="Спец. коэффициенты для новичков" />
            {settings.newcomerEnabled && (<>
              <div style={{marginTop:10,display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:13}}>Порог стажа (мес.):</span>
                <input style={{...S.input,width:60,textAlign:"center"}} type="number" min={1} max={24} value={settings.newcomerMonths} onChange={e=>upSet("newcomerMonths",+e.target.value)} />
              </div>
              <table style={{borderCollapse:"collapse",marginTop:8}}><thead><tr><Th>Оценка</Th><Th w="100px" align="right">Новичок</Th><Th w="100px" align="right">Обычный</Th></tr></thead>
                <tbody>{ABC_GRADES.map(g => <tr key={g}><Td style={{fontWeight:500}}>{g}</Td><Td><input style={{...S.input,textAlign:"right",width:80}} type="number" step="0.1" min="0" max="2" value={settings.newcomerAbcCoeffs[g]} onChange={e=>upSet(`newcomerAbcCoeffs.${g}`,+e.target.value)} /></Td><Td align="right" style={{color:"var(--color-text-tertiary)"}}>{settings.abcCoeffs[g]}</Td></tr>)}</tbody>
              </table>
            </>)}
          </Card>

          {isComp && (
            <Card title="Шкала пересчёта (бюджет)">
              <div style={{fontSize:12,color:"var(--color-text-secondary)",marginBottom:8}}>Применяется к % выполнения бюджета проекта</div>
              <table style={{borderCollapse:"collapse"}}><thead><tr><Th>Выполнение</Th><Th w="100px" align="right">Коэффициент</Th></tr></thead>
                <tbody>{SCALE.map(s => <tr key={s.label}><Td>{s.label}</Td><Td align="right" style={{fontWeight:500}}>{s.coeff}</Td></tr>)}</tbody>
              </table>
            </Card>
          )}
        </div>
      )}

      {/* ========== EMPLOYEES ========== */}
      {activeTab === "employees" && (
        <div style={{marginBottom:28}}>
          <h2 style={{fontSize:17,fontWeight:500,color:"#1D9E75",marginBottom:12,borderBottom:"2px solid #1D9E7522",paddingBottom:6}}>Сотрудники</h2>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr><Th>ФИО</Th><Th w="110px">Роль</Th><Th w="90px">Оклад</Th><Th w="60px">Окл/год</Th><Th w="95px" align="right">Проектн.</Th><Th w="45px">ABC</Th><Th w="45px" align="right">К</Th><Th w="95px">Приём</Th><Th w="45px" align="center">Пр.</Th><Th w="30px"></Th></tr></thead>
              <tbody>{employees.map(emp => {
                const c=emp.salary*emp.ceilingMultiplier; const pc=emp.role==="S"?c/3:c;
                const abcC=getAbcC(emp.abcGrade,emp.hireDate,settings);
                const nw=settings.newcomerEnabled&&isNewcomer(emp.hireDate,settings.newcomerMonths);
                const pCnt=empProjCount[emp.id]||0; const isE=!!settings.projectLimitExceptions[emp.id];
                const over=settings.projectLimitEnabled&&!isE&&pCnt>settings.projectLimitMax;
                return <tr key={emp.id} style={over?{background:"var(--color-background-danger,#fdd)"}:{}}>
                  <Td><input style={S.input} value={emp.name} onChange={e=>upEmp(emp.id,"name",e.target.value)} /></Td>
                  <Td><select style={S.input} value={emp.role} onChange={e=>upEmp(emp.id,"role",e.target.value)}>{ROLES.map(r=><option key={r.value} value={r.value}>{r.label}</option>)}</select></Td>
                  <Td><input style={{...S.input,textAlign:"right"}} type="number" value={emp.salary||""} onChange={e=>upEmp(emp.id,"salary",+e.target.value)} /></Td>
                  <Td><input style={{...S.input,textAlign:"right",width:45}} type="number" step="0.5" value={emp.ceilingMultiplier||""} onChange={e=>upEmp(emp.id,"ceilingMultiplier",+e.target.value)} /></Td>
                  <Td align="right">{fmt(pc)}{emp.role==="S"&&<span style={{fontSize:10,color:"var(--color-text-tertiary)",marginLeft:2}}>⅓</span>}</Td>
                  <Td><select style={{...S.input,width:45}} value={emp.abcGrade} onChange={e=>upEmp(emp.id,"abcGrade",e.target.value)}>{ABC_GRADES.map(g=><option key={g} value={g}>{g}</option>)}</select></Td>
                  <Td align="right" style={{fontWeight:500,color:abcC===0?"var(--color-text-danger)":abcC>1?"#185FA5":"var(--color-text-primary)"}}>{abcC}{nw&&<span style={{fontSize:9,color:"var(--color-text-warning,#a60)",marginLeft:1}}>н</span>}</Td>
                  <Td><input style={{...S.input,width:95}} type="date" value={emp.hireDate||""} onChange={e=>upEmp(emp.id,"hireDate",e.target.value)} /></Td>
                  <Td align="center" style={{fontWeight:500,color:over?"var(--color-text-danger)":"var(--color-text-primary)"}}>{pCnt}{isE&&<span style={{fontSize:9,color:"var(--color-text-info)",marginLeft:1}}>∞</span>}</Td>
                  <Td><Del onClick={()=>delEmp(emp.id)} /></Td>
                </tr>;
              })}</tbody>
            </table>
          </div>
          {(()=>{const tf=employees.reduce((s,e)=>s+(e.role==="S"?e.salary*e.ceilingMultiplier/3:e.salary*e.ceilingMultiplier),0);return(
            <div style={{marginTop:16,padding:"14px 18px",borderRadius:8,background:"var(--color-background-secondary)",border:"1px solid var(--color-border-tertiary)",display:"flex",gap:24,alignItems:"center",flexWrap:"wrap"}}>
              <div><div style={{fontSize:11,color:"var(--color-text-tertiary)",marginBottom:2}}>Плановый проектный фонд</div><div style={{fontSize:18,fontWeight:500,color:"#1D9E75"}}>{fmt(tf)}</div></div>
              <div style={{width:1,height:36,background:"var(--color-border-tertiary)"}}></div>
              <div><div style={{fontSize:11,color:"var(--color-text-tertiary)",marginBottom:2}}>Сотрудников</div><div style={{fontSize:18,fontWeight:500}}>{employees.length}</div></div>
              <div style={{width:1,height:36,background:"var(--color-border-tertiary)"}}></div>
              <div><div style={{fontSize:11,color:"var(--color-text-tertiary)",marginBottom:2}}>Модель</div><div style={{fontSize:14,fontWeight:500,color:"#534AB7"}}>{isComp?"Компонентная":"Множитель"}</div></div>
            </div>);
          })()}
          <Add onClick={addEmp} label="Сотрудник" />
        </div>
      )}

      {/* ========== PROJECTS ========== */}
      {activeTab === "projects" && (
        <div style={{marginBottom:28}}>
          <h2 style={{fontSize:17,fontWeight:500,color:"#185FA5",marginBottom:12,borderBottom:"2px solid #185FA522",paddingBottom:6}}>Проекты и контрольные точки</h2>
          {projects.map((proj,pi) => {
            const tw=proj.checkpoints.reduce((s,c)=>s+(c.weight||0),0); const col=getPC(pi);
            return <div key={proj.id} style={{marginBottom:20,padding:14,borderRadius:8,border:"1px solid var(--color-border-tertiary)",borderLeft:`4px solid ${col}`,background:"var(--color-background-secondary)"}}>
              <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:10}}>
                <input style={{...S.input,fontWeight:500,fontSize:14,flex:1}} value={proj.name} onChange={e=>upProj(proj.id,"name",e.target.value)} placeholder="Название проекта" />
                <Del onClick={()=>delProj(proj.id)} />
              </div>
              {isComp && (
                <div style={{display:"flex",gap:16,alignItems:"center",marginBottom:10,flexWrap:"wrap"}}>
                  <label style={{fontSize:13,display:"flex",alignItems:"center",gap:6}}>Бюджет: <input style={{...S.input,width:120,textAlign:"right"}} type="number" value={proj.budget||""} onChange={e=>upProj(proj.id,"budget",+e.target.value)} /></label>
                  <label style={{fontSize:13,display:"flex",alignItems:"center",gap:6}}>Факт выполнения: <input style={{...S.input,width:70,textAlign:"right"}} type="number" step="0.01" min="0" max="2" value={proj.budgetFact||""} onChange={e=>upProj(proj.id,"budgetFact",+e.target.value)} placeholder="0.95" />
                    {proj.budgetFact>0 && <span style={{fontSize:11,fontWeight:500,color:applyScale(proj.budgetFact)===0?"var(--color-text-danger)":"var(--color-text-success)"}}>→ К={applyScale(proj.budgetFact)}</span>}
                  </label>
                </div>
              )}
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr><Th>Контрольная точка</Th><Th w="100px">Вес (%)</Th><Th w="120px">Плановые дни</Th><Th w="36px"></Th></tr></thead>
                <tbody>{proj.checkpoints.map(cp => <tr key={cp.id}>
                  <Td><input style={S.input} value={cp.name} onChange={e=>upCP(proj.id,cp.id,"name",e.target.value)} /></Td>
                  <Td><input style={{...S.input,textAlign:"right"}} type="number" value={cp.weight||""} onChange={e=>upCP(proj.id,cp.id,"weight",+e.target.value)} /></Td>
                  <Td><input style={{...S.input,textAlign:"right"}} type="number" value={cp.plannedDays||""} onChange={e=>upCP(proj.id,cp.id,"plannedDays",+e.target.value)} /></Td>
                  <Td><Del onClick={()=>delCP(proj.id,cp.id)} /></Td>
                </tr>)}</tbody>
              </table>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:6}}>
                <Add onClick={()=>addCP(proj.id)} label="Контрольная точка" />
                <span style={{fontSize:12,fontWeight:500,color:tw===100?"var(--color-text-success)":"var(--color-text-danger)"}}>Σ={tw}%{tw!==100?" (нужно 100%)":" ✓"}</span>
              </div>
            </div>;
          })}
          <Add onClick={addProj} label="Проект" />
        </div>
      )}

      {/* ========== PARTICIPATION ========== */}
      {activeTab === "participation" && (
        <div style={{marginBottom:28}}>
          <h2 style={{fontSize:17,fontWeight:500,color:"#D85A30",marginBottom:12,borderBottom:"2px solid #D85A3022",paddingBottom:6}}>Участие в проектах</h2>
          {projects.map((proj,pi) => {
            const items=partByProj[proj.id]||[]; const col=getPC(pi);
            const fv=cpFilters[proj.id]||0;
            const filtered=fv===0?items:items.filter(p=>p.checkpointId===fv);
            return <div key={proj.id} style={{marginBottom:28}}>
              <div style={{padding:"8px 12px",fontWeight:500,fontSize:14,color:col,borderBottom:`2px solid ${col}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span>{proj.name}</span><span style={{fontWeight:400,fontSize:12,color:"var(--color-text-tertiary)"}}>{filtered.length} из {items.length}</span>
              </div>
              <div style={{display:"flex",gap:4,flexWrap:"wrap",padding:"8px 12px 6px",background:"var(--color-background-secondary)",borderBottom:"1px solid var(--color-border-tertiary)"}}>
                <button onClick={()=>setCpFilters(f=>({...f,[proj.id]:0}))} style={{...S.btn,padding:"4px 12px",fontSize:12,background:fv===0?col:"transparent",color:fv===0?"#fff":"var(--color-text-secondary)",border:fv===0?"none":"1px solid var(--color-border-secondary)"}}>Все КТ</button>
                {proj.checkpoints.map(cp=>{const a=fv===cp.id;const cn=items.filter(p=>p.checkpointId===cp.id).length;return<button key={cp.id} onClick={()=>setCpFilters(f=>({...f,[proj.id]:a?0:cp.id}))} style={{...S.btn,padding:"4px 12px",fontSize:12,background:a?col:"transparent",color:a?"#fff":"var(--color-text-secondary)",border:a?"none":"1px solid var(--color-border-secondary)"}}>{cp.name} ({cn})</button>;})}
              </div>
              {filtered.length===0?<div style={{padding:12,fontSize:13,color:"var(--color-text-tertiary)",fontStyle:"italic"}}>Нет записей</div>:(
                <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr><Th>Сотрудник</Th><Th w="40px">Роль</Th><Th>Контр. точка</Th><Th w="65px" align="right">План</Th><Th w="65px" align="right">Факт</Th><Th w="55px" align="right">К</Th><Th w="55px">Период</Th><Th>Примечание</Th><Th w="30px"></Th></tr></thead>
                  <tbody>{filtered.map(part=>{const cp=proj.checkpoints.find(c=>c.id===part.checkpointId);const coeff=cp&&cp.plannedDays>0?Math.min(part.actualDays/cp.plannedDays,1):0;return<tr key={part.id}>
                    <Td><select style={S.input} value={part.empId} onChange={e=>upPart(part.id,"empId",+e.target.value)}><option value={0}>—</option>{employees.map(emp=><option key={emp.id} value={emp.id}>{emp.name||`#${emp.id}`}</option>)}</select></Td>
                    <Td style={{fontSize:12,textAlign:"center",color:"var(--color-text-secondary)"}}>{employees.find(e=>e.id===part.empId)?.role||"—"}</Td>
                    <Td><select style={S.input} value={part.checkpointId} onChange={e=>upPart(part.id,"checkpointId",+e.target.value)}><option value={0}>—</option>{proj.checkpoints.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></Td>
                    <Td align="right" style={{color:"var(--color-text-tertiary)"}}>{cp?.plannedDays||"—"}</Td>
                    <Td><input style={{...S.input,textAlign:"right"}} type="number" value={part.actualDays||""} onChange={e=>upPart(part.id,"actualDays",+e.target.value)} /></Td>
                    <Td align="right" style={{fontWeight:500,color:coeff<.5?"var(--color-text-danger)":coeff<1?"var(--color-text-warning,#a60)":"var(--color-text-success)"}}>{coeff.toFixed(2)}</Td>
                    <Td><select style={{...S.input,width:50}} value={part.period} onChange={e=>upPart(part.id,"period",e.target.value)}>{PAYOUT_PERIODS.map(p=><option key={p} value={p}>{p}</option>)}</select></Td>
                    <Td><input style={S.input} value={part.note} onChange={e=>upPart(part.id,"note",e.target.value)} placeholder="отпуск, замена..." /></Td>
                    <Td><Del onClick={()=>delPart(part.id)} /></Td>
                  </tr>;})}</tbody>
                </table></div>
              )}
            </div>;
          })}
          <Add onClick={addPart} label="Запись" />
        </div>
      )}

      {/* ========== RESULTS ========== */}
      {activeTab === "results" && (
        <div style={{marginBottom:28}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,borderBottom:"2px solid #A32D2D22",paddingBottom:6}}>
            <h2 style={{fontSize:17,fontWeight:500,color:"#A32D2D",margin:0}}>Расчёт премий</h2>
            <button onClick={exportCSV} style={{...S.btn,background:"#A32D2D",color:"#fff",padding:"6px 16px"}}>Экспорт CSV</button>
          </div>

          <div style={{padding:"8px 14px",borderRadius:6,background:"var(--color-background-info,#e6f1fb)",color:"var(--color-text-info,#185fa5)",fontSize:12,marginBottom:16}}>
            Активная модель: <strong>{isComp?"Компонентная (Вехи×"+settings.componentWeights.milestones+"% + Бюджет×"+settings.componentWeights.budget+"% + ABC×"+settings.componentWeights.abc+"%)":"Множитель (Потолок × Вес КТ × Коэфф. участия × ABC)"}</strong>
          </div>

          {projects.map((proj,pi) => {
            const rows=resultsByProj[proj.id]||[]; if(rows.length===0)return null;
            const col=getPC(pi); const pt=projTotals[proj.id]||0;
            const empOrder=[]; const byEmp={};
            rows.forEach(r=>{if(!byEmp[r.empId]){byEmp[r.empId]=[];empOrder.push(r.empId);}byEmp[r.empId].push(r);});
            return <div key={proj.id} style={{marginBottom:28,overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead>
                  <tr><td colSpan={99} style={{padding:"10px 12px 6px",fontWeight:500,fontSize:14,color:col,borderBottom:`2px solid ${col}`}}>{proj.name}{isComp&&proj.budgetFact>0&&<span style={{fontWeight:400,fontSize:12,marginLeft:10,color:"var(--color-text-secondary)"}}>Бюджет: {(proj.budgetFact*100).toFixed(0)}% → К={applyScale(proj.budgetFact)}</span>}</td></tr>
                  <tr><Th>ФИО</Th><Th w="36px">Роль</Th><Th>Контр. точка</Th><Th w="42px" align="right">Вес</Th><Th w="50px" align="right">Участ.</Th><Th w="55px" align="right">ABC</Th>{isComp&&<Th w="50px" align="right">Бюдж.</Th>}<Th w="105px" align="right">Премия</Th><Th w="45px">Период</Th></tr>
                </thead>
                <tbody>
                  {empOrder.map(eId=>{const empRows=byEmp[eId];const empTotal=empRows.reduce((s,r)=>s+r.bonus,0);const emp=employees.find(e=>e.id===eId);const exceeded=emp&&empTotals[eId]?.total>(emp.role==="S"?emp.salary*emp.ceilingMultiplier/3:emp.salary*emp.ceilingMultiplier);
                  return empRows.map((r,i)=><React.Fragment key={`${eId}-${i}`}>
                    <tr style={exceeded?{background:"var(--color-background-danger,#fdd)"}:{}}>
                      {i===0?<Td style={{fontWeight:500,borderBottom:"none"}}>{r.empName}</Td>:<Td style={{borderBottom:"none",color:"transparent",fontSize:1}}>.</Td>}
                      {i===0?<Td style={{borderBottom:"none"}}>{r.role}</Td>:<Td style={{borderBottom:"none"}}></Td>}
                      <Td>{r.cpName}</Td><Td align="right">{r.weight}%</Td><Td align="right">{r.pc.toFixed(2)}</Td>
                      <Td align="right" style={{fontSize:12,color:r.abcC===0?"var(--color-text-danger)":r.abcC>1?"#185FA5":"var(--color-text-tertiary)"}}>{r.abcGrade}×{r.abcC}</Td>
                      {isComp&&<Td align="right" style={{fontSize:12}}>{r.budgetCoeff!=null?r.budgetCoeff:"—"}</Td>}
                      <Td align="right"><strong>{fmt(r.bonus)}</strong></Td><Td>{r.period}</Td>
                    </tr>
                    {i===empRows.length-1&&<tr>
                      <td colSpan={isComp?6:5} style={{padding:"4px 12px",textAlign:"right",fontSize:12,fontWeight:500,color:"var(--color-text-secondary)",borderBottom:"1px solid var(--color-border-tertiary)",background:"var(--color-background-secondary)"}}>Итого {r.empName}:</td>
                      {isComp&&<td style={{borderBottom:"1px solid var(--color-border-tertiary)",background:"var(--color-background-secondary)"}}></td>}
                      <td style={{padding:"4px 12px",textAlign:"right",fontSize:13,fontWeight:500,borderBottom:"1px solid var(--color-border-tertiary)",background:"var(--color-background-secondary)"}}>{fmt(empTotal)}</td>
                      <td style={{borderBottom:"1px solid var(--color-border-tertiary)",background:"var(--color-background-secondary)"}}></td>
                    </tr>}
                  </React.Fragment>);})}
                  <tr><td colSpan={99} style={{padding:"8px 12px",textAlign:"right",fontWeight:500,fontSize:13,borderBottom:`2px solid ${col}44`,background:`${col}08`,color:col}}>Итого по проекту: <strong style={{fontSize:15}}>{fmt(pt)}</strong></td></tr>
                </tbody>
              </table>
            </div>;
          })}

          <div style={{padding:"14px 18px",borderRadius:8,display:"flex",justifyContent:"space-between",alignItems:"center",background:"var(--color-background-secondary)",border:"1px solid var(--color-border-tertiary)",marginBottom:28}}>
            <span style={{fontWeight:500,fontSize:16}}>Общий итог</span>
            <span style={{fontWeight:500,fontSize:20,color:"#A32D2D"}}>{fmt(grandTotal)}</span>
          </div>

          {/* Payout */}
          {(()=>{const periods=payoutScenario==="annual"?["Год"]:["Q1","Q2","Q3","Q4"];const empPay={};employees.forEach(e=>{empPay[e.id]={};periods.forEach(p=>{empPay[e.id][p]=0;});});results.forEach(r=>{const k=payoutScenario==="annual"?"Год":r.period;if(empPay[r.empId])empPay[r.empId][k]=(empPay[r.empId][k]||0)+r.bonus;});const pT={};periods.forEach(p=>{pT[p]=0;});employees.forEach(e=>periods.forEach(p=>{pT[p]+=empPay[e.id]?.[p]||0;}));return(
            <div style={{marginBottom:28}}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                <h3 style={{fontSize:15,fontWeight:500,color:"#A32D2D",margin:0}}>График выплат</h3>
                {[{k:"quarterly",l:"Поквартально"},{k:"annual",l:"Раз в год"}].map(s=><button key={s.k} onClick={()=>setPayoutScenario(s.k)} style={{...S.btn,padding:"5px 14px",fontSize:12,background:payoutScenario===s.k?"#A32D2D":"transparent",color:payoutScenario===s.k?"#fff":"var(--color-text-secondary)",border:payoutScenario===s.k?"none":"1px solid var(--color-border-secondary)"}}>{s.l}</button>)}
              </div>
              <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr><Th>ФИО</Th><Th w="36px">Роль</Th>{periods.map(p=><Th key={p} w="95px" align="right">{p}</Th>)}<Th w="105px" align="right">Итого</Th></tr></thead>
                <tbody>
                  {employees.map(emp=>{const row=empPay[emp.id]||{};const total=periods.reduce((s,p)=>s+(row[p]||0),0);if(total===0)return null;return<tr key={emp.id}><Td>{emp.name}</Td><Td>{emp.role}</Td>{periods.map(p=><Td key={p} align="right">{row[p]>0?fmt(row[p]):"—"}</Td>)}<Td align="right"><strong>{fmt(total)}</strong></Td></tr>;})}
                  <tr style={{background:"var(--color-background-secondary)"}}>
                    <td colSpan={2} style={{padding:"8px 12px",fontWeight:500,textAlign:"right",borderTop:"2px solid var(--color-border-tertiary)"}}>Итого:</td>
                    {periods.map(p=><td key={p} style={{padding:"8px 12px",textAlign:"right",fontWeight:500,fontSize:14,color:"#A32D2D",borderTop:"2px solid var(--color-border-tertiary)"}}>{fmt(pT[p])}</td>)}
                    <td style={{padding:"8px 12px",textAlign:"right",fontWeight:500,fontSize:14,color:"#A32D2D",borderTop:"2px solid var(--color-border-tertiary)"}}>{fmt(grandTotal)}</td>
                  </tr>
                </tbody>
              </table></div>
            </div>);
          })()}

          {/* Summary */}
          <h3 style={{fontSize:15,fontWeight:500,color:"#A32D2D",marginBottom:10}}>Сводка по сотрудникам</h3>
          <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr><Th>ФИО</Th><Th w="36px">Роль</Th><Th w="36px">ABC</Th>
              {projects.map((p,i)=><Th key={p.id} w="90px" align="right"><span style={{color:getPC(i),fontSize:11}}>{p.name.split("—")[0].trim()}</span></Th>)}
              <Th w="90px" align="right">Итого</Th><Th w="105px" align="right">Потолок(пр.)</Th><Th w="80px" align="right">Остаток</Th><Th w="70px">Статус</Th>
            </tr></thead>
            <tbody>{employees.map(emp=>{const d=empTotals[emp.id]||{total:0,byProj:{}};const fc=emp.salary*emp.ceilingMultiplier;const ceil=emp.role==="S"?fc/3:fc;const exc=d.total>ceil;return<tr key={emp.id} style={exc?{background:"var(--color-background-danger,#fdd)"}:{}}>
              <Td>{emp.name}</Td><Td>{emp.role}</Td><Td style={{fontSize:12}}>{emp.abcGrade}</Td>
              {projects.map(p=><Td key={p.id} align="right" style={{fontSize:12}}>{d.byProj[p.id]?fmt(d.byProj[p.id]):"—"}</Td>)}
              <Td align="right"><strong>{fmt(d.total)}</strong></Td><Td align="right">{fmt(ceil)}</Td>
              <Td align="right" style={{color:exc?"var(--color-text-danger)":"var(--color-text-success)"}}>{fmt(ceil-d.total)}</Td>
              <Td><Badge ok={!exc} text={exc?"Превышение!":"ОК"} /></Td>
            </tr>;})}</tbody>
          </table></div>

          <div style={{marginTop:20,padding:14,borderRadius:8,background:"var(--color-background-secondary)",fontSize:12,color:"var(--color-text-secondary)",lineHeight:1.7}}>
            <strong>Формула ({isComp?"компонентная":"множитель"}):</strong> {isComp?`Премия = Потолок × (Вехи×${settings.componentWeights.milestones}% + Бюджет×${settings.componentWeights.budget}% + ABC×${settings.componentWeights.abc}%)`:"Премия = Потолок × Вес КТ × Коэфф. участия × ABC"}<br />
            <strong>Потолок:</strong> PM/BA = N окладов | S = 1/3 от N окладов (пропорция 2:1)<br />
            <strong>ABC:</strong> {ABC_GRADES.map(g=>`${g}=${settings.abcCoeffs[g]}`).join(", ")}{settings.newcomerEnabled&&<> | Новички (&lt;{settings.newcomerMonths} мес.): {ABC_GRADES.filter(g=>settings.newcomerAbcCoeffs[g]>0).map(g=>`${g}=${settings.newcomerAbcCoeffs[g]}`).join(", ")}</>}
          </div>
        </div>
      )}
    </div>
  );
}
