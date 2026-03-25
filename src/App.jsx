import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { defaultSettings, defaultEmployees, defaultProjects, defaultParticipation } from './data/defaults';
import { calculateAll, getEmpProjectCounts } from './utils/calculations';
import { generateId } from './utils/helpers';
import SettingsPage from './pages/SettingsPage';
import EmployeesPage from './pages/EmployeesPage';
import ProjectsPage from './pages/ProjectsPage';
import ParticipationPage from './pages/ParticipationPage';
import ResultsPage from './pages/ResultsPage';
import DashboardPage from './pages/DashboardPage';
import { Settings, Users, FolderKanban, ClipboardList, Calculator, LayoutDashboard } from 'lucide-react';

const STORAGE_KEY = 'pm-calc-data';

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export default function App() {
  const saved = useMemo(() => loadSaved(), []);

  const [employees, setEmployees] = useState(saved?.employees || defaultEmployees);
  const [projects, setProjects] = useState(saved?.projects || defaultProjects);
  const [participation, setParticipation] = useState(saved?.participation || defaultParticipation);
  const [settings, setSettings] = useState(saved?.settings || defaultSettings);
  const [activeTab, setActiveTab] = useState('results');

  // Auto-save
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ employees, projects, participation, settings }));
    }, 500);
    return () => clearTimeout(timer);
  }, [employees, projects, participation, settings]);

  // Calculations
  const calcData = useMemo(
    () => calculateAll(employees, projects, participation, settings),
    [employees, projects, participation, settings]
  );
  const empProjCount = useMemo(() => getEmpProjectCounts(participation), [participation]);

  // CRUD helpers
  const crud = useMemo(() => ({
    // Employees
    upEmp: (id, f, v) => setEmployees(p => p.map(e => e.id === id ? { ...e, [f]: v } : e)),
    addEmp: () => setEmployees(p => [...p, { id: generateId(), name: '', role: 'S', salary: 0, ceilingMultiplier: 2, abcGrade: 'B', hireDate: '' }]),
    delEmp: (id) => setEmployees(p => p.filter(e => e.id !== id)),
    setEmployees,
    // Projects
    upProj: (id, f, v) => setProjects(p => p.map(pr => pr.id === id ? { ...pr, [f]: v } : pr)),
    addProj: () => setProjects(p => [...p, { id: generateId(), name: '', budget: 0, budgetFact: 0, checkpoints: [] }]),
    delProj: (id) => setProjects(p => p.filter(pr => pr.id !== id)),
    addCP: (pid) => setProjects(p => p.map(pr => pr.id === pid ? { ...pr, checkpoints: [...pr.checkpoints, { id: generateId(), name: '', weight: 0, plannedDays: 0 }] } : pr)),
    delCP: (pid, cid) => setProjects(p => p.map(pr => pr.id === pid ? { ...pr, checkpoints: pr.checkpoints.filter(c => c.id !== cid) } : pr)),
    upCP: (pid, cid, f, v) => setProjects(p => p.map(pr => pr.id === pid ? { ...pr, checkpoints: pr.checkpoints.map(c => c.id === cid ? { ...c, [f]: v } : c) } : pr)),
    // Participation
    addPart: () => setParticipation(p => [...p, { id: generateId(), empId: employees[0]?.id || 0, projectId: projects[0]?.id || 0, checkpointId: projects[0]?.checkpoints?.[0]?.id || 0, actualDays: 0, period: 'Q1', note: '' }]),
    delPart: (id) => setParticipation(p => p.filter(r => r.id !== id)),
    upPart: (id, f, v) => setParticipation(p => p.map(r => r.id === id ? { ...r, [f]: v } : r)),
    // Settings
    upSet: (path, val) => setSettings(s => {
      const c = JSON.parse(JSON.stringify(s));
      const k = path.split('.');
      let o = c;
      for (let i = 0; i < k.length - 1; i++) o = o[k[i]];
      o[k[k.length - 1]] = val;
      return c;
    }),
  }), [employees, projects]);

  const resetAll = useCallback(() => {
    setEmployees(defaultEmployees);
    setProjects(defaultProjects);
    setParticipation(defaultParticipation);
    setSettings(defaultSettings);
  }, []);

  const tabs = [
    { key: 'dashboard', label: 'Дашборд', icon: LayoutDashboard, color: '#0F6E56' },
    { key: 'employees', label: 'Сотрудники', icon: Users, color: '#1D9E75' },
    { key: 'projects', label: 'Проекты', icon: FolderKanban, color: '#185FA5' },
    { key: 'participation', label: 'Участие', icon: ClipboardList, color: '#D85A30' },
    { key: 'results', label: 'Расчёт', icon: Calculator, color: '#A32D2D' },
    { key: 'settings', label: 'Настройки', icon: Settings, color: '#534AB7' },
  ];

  const ctx = { employees, projects, participation, settings, calcData, empProjCount, ...crud, resetAll };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 no-print">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-800">Проектная мотивация</h1>
          <span className="text-xs text-gray-400">v1.0 • Данные сохраняются автоматически</span>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 px-4 no-print">
        <div className="max-w-7xl mx-auto flex gap-1 overflow-x-auto py-2">
          {tabs.map(t => {
            const Icon = t.icon;
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${active ? 'text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                style={active ? { background: t.color } : {}}
              >
                <Icon size={16} />
                {t.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'dashboard' && <DashboardPage {...ctx} />}
        {activeTab === 'employees' && <EmployeesPage {...ctx} />}
        {activeTab === 'projects' && <ProjectsPage {...ctx} />}
        {activeTab === 'participation' && <ParticipationPage {...ctx} />}
        {activeTab === 'results' && <ResultsPage {...ctx} />}
        {activeTab === 'settings' && <SettingsPage {...ctx} />}
      </main>
    </div>
  );
}
