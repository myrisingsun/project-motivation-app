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
import { Settings, Users, FolderKanban, ClipboardList, Calculator, LayoutDashboard, Sun, Moon } from 'lucide-react';
import { Tabs, TabsList, TabsTab, TabsPanel } from './components/ui/tabs';
import { ToastProvider, AnchoredToastProvider } from './components/ui/toast';
import { Button } from './components/ui/button';

const STORAGE_KEY = 'pm-calc-data';

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    // Normalize all IDs to numbers (guards against old string-ID data)
    if (data.participation) {
      data.participation = data.participation.map(r => ({
        ...r,
        empId: +r.empId || 0,
        projectId: +r.projectId || 0,
        checkpointId: +r.checkpointId || 0,
      }));
    }
    return data;
  } catch { return null; }
}

export default function App() {
  const saved = useMemo(() => loadSaved(), []);

  const [employees, setEmployees] = useState(saved?.employees || defaultEmployees);
  const [projects, setProjects] = useState(saved?.projects || defaultProjects);
  const [participation, setParticipation] = useState(saved?.participation || defaultParticipation);
  const [settings, setSettings] = useState(saved?.settings || defaultSettings);
  const [activeTab, setActiveTab] = useState('results');
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem('pm-calc-theme') === 'dark'; } catch { return false; }
  });

  // Apply dark class to <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('pm-calc-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

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
    // Add single employee to project (creates one participation record to be filled in)
    addEmpToProj: (projId, empId) => {
      const proj = projects.find(p => p.id === projId);
      setParticipation(p => [...p, {
        id: generateId(),
        empId,
        projectId: projId,
        checkpointId: proj?.checkpoints?.[0]?.id || 0,
        actualDays: 0,
        period: 'Q1',
        note: '',
      }]);
    },
    // Remove all participation records for an employee in a project
    delPartByEmpProj: (empId, projId) => setParticipation(p => p.filter(r => !(r.empId === empId && r.projectId === projId))),
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

  const ctx = { employees, projects, participation, settings, calcData, empProjCount, ...crud, resetAll };

  return (
    <ToastProvider>
    <AnchoredToastProvider>
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-background border-b border-border px-4 py-3 no-print">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-semibold text-foreground">Проектная мотивация</h1>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">v2.0 • Данные сохраняются автоматически</span>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Переключить тему"
              onClick={() => setDarkMode(d => !d)}
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </Button>
          </div>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col">
        {/* Navigation */}
        <div className="bg-background border-b border-border px-4 no-print">
          <div className="max-w-7xl mx-auto overflow-x-auto">
            <TabsList variant="underline">
              <TabsTab value="dashboard"><LayoutDashboard size={16} />Дашборд</TabsTab>
              <TabsTab value="employees"><Users size={16} />Сотрудники</TabsTab>
              <TabsTab value="projects"><FolderKanban size={16} />Проекты</TabsTab>
              <TabsTab value="participation"><ClipboardList size={16} />Участие</TabsTab>
              <TabsTab value="results"><Calculator size={16} />Расчёт</TabsTab>
              <TabsTab value="settings"><Settings size={16} />Настройки</TabsTab>
            </TabsList>
          </div>
        </div>

        {/* Content */}
        <main className="max-w-7xl mx-auto w-full px-4 py-6">
          <TabsPanel value="dashboard"><DashboardPage {...ctx} /></TabsPanel>
          <TabsPanel value="employees"><EmployeesPage {...ctx} /></TabsPanel>
          <TabsPanel value="projects"><ProjectsPage {...ctx} /></TabsPanel>
          <TabsPanel value="participation"><ParticipationPage {...ctx} /></TabsPanel>
          <TabsPanel value="results"><ResultsPage {...ctx} /></TabsPanel>
          <TabsPanel value="settings"><SettingsPage {...ctx} /></TabsPanel>
        </main>
      </Tabs>
    </div>
    </AnchoredToastProvider>
    </ToastProvider>
  );
}
