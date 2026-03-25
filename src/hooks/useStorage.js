import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'project-motivation-data';
const SNAPSHOTS_KEY = 'project-motivation-snapshots';
const LOG_KEY = 'project-motivation-log';

// Load from localStorage with fallback
function loadState(defaults) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Save to localStorage
function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state:', e);
  }
}

// Hook: persistent state with auto-save
export function usePersistentState(key, defaultValue) {
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed[key] !== undefined) return parsed[key];
      }
    } catch {}
    return defaultValue;
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const current = saved ? JSON.parse(saved) : {};
      current[key] = state;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch {}
  }, [key, state]);

  return [state, setState];
}

// Hook: full app state persistence
export function useAppStorage(defaults) {
  const [data, setData] = useState(() => {
    const saved = loadState();
    return saved || {
      employees: defaults.employees,
      projects: defaults.projects,
      participation: defaults.participation,
      settings: defaults.settings,
    };
  });

  // Auto-save on change
  useEffect(() => {
    saveState(data);
  }, [data]);

  const update = useCallback((key, value) => {
    setData(prev => ({ ...prev, [key]: typeof value === 'function' ? value(prev[key]) : value }));
    addLog(`Изменение: ${key}`);
  }, []);

  const resetToDefaults = useCallback(() => {
    setData({
      employees: defaults.employees,
      projects: defaults.projects,
      participation: defaults.participation,
      settings: defaults.settings,
    });
    addLog('Сброс к настройкам по умолчанию');
  }, [defaults]);

  return { data, update, resetToDefaults };
}

// Snapshots (versioning)
export function saveSnapshot(label) {
  try {
    const state = localStorage.getItem(STORAGE_KEY);
    if (!state) return;
    const snapshots = JSON.parse(localStorage.getItem(SNAPSHOTS_KEY) || '[]');
    snapshots.push({
      id: Date.now(),
      label: label || `Версия ${snapshots.length + 1}`,
      date: new Date().toISOString(),
      data: state,
    });
    localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(snapshots));
    addLog(`Создан снимок: ${label}`);
  } catch {}
}

export function loadSnapshots() {
  try {
    return JSON.parse(localStorage.getItem(SNAPSHOTS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function restoreSnapshot(id) {
  try {
    const snapshots = loadSnapshots();
    const snap = snapshots.find(s => s.id === id);
    if (snap) {
      localStorage.setItem(STORAGE_KEY, snap.data);
      addLog(`Восстановлен снимок: ${snap.label}`);
      return JSON.parse(snap.data);
    }
  } catch {}
  return null;
}

export function deleteSnapshot(id) {
  try {
    const snapshots = loadSnapshots().filter(s => s.id !== id);
    localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(snapshots));
  } catch {}
}

// Change log
export function addLog(message) {
  try {
    const logs = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
    logs.push({ ts: new Date().toISOString(), msg: message });
    // Keep last 200 entries
    if (logs.length > 200) logs.splice(0, logs.length - 200);
    localStorage.setItem(LOG_KEY, JSON.stringify(logs));
  } catch {}
}

export function getLogs() {
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
  } catch {
    return [];
  }
}

export function clearLogs() {
  localStorage.setItem(LOG_KEY, '[]');
}
