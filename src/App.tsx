import { useState, useEffect } from 'react';
import './App.css';
import type { PlayerState } from './types';
import { PLAYERS } from './config';
import { getAccount, getSummoner, getRankedEntries, fetchFlexData, getDDragonVersion, setApiKey } from './api';
import Dashboard from './components/Dashboard';
import PlayerDetail from './components/PlayerDetail';

const blank = (): PlayerState[] =>
  PLAYERS.map(config => ({
    config,
    account: null,
    summoner: null,
    flexRanked: null,
    championStats: null,
    matches: null,
    loading: true,
    loadingChampions: false,
    error: null,
  }));

export default function App() {
  const [ddVersion, setDdVersion] = useState('');
  const [view, setView] = useState<'dashboard' | 'player'>('dashboard');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [players, setPlayers] = useState<PlayerState[]>(blank);
  const [showKey, setShowKey] = useState(false);
  const [tempKey, setTempKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const patch = (index: number, update: Partial<PlayerState>) =>
    setPlayers(prev => prev.map((p, i) => (i === index ? { ...p, ...update } : p)));

  const loadBasic = async (index: number): Promise<string | null> => {
    patch(index, { loading: true, error: null });
    try {
      const config = PLAYERS[index];
      const account = await getAccount(config.gameName, config.tagLine);
      const summoner = await getSummoner(account.puuid);
      const entries = await getRankedEntries(account.puuid);
      const flexRanked = entries.find(e => e.queueType === 'RANKED_FLEX_SR') ?? null;
      patch(index, { account, summoner, flexRanked, loading: false });
      return account.puuid;
    } catch (err) {
      patch(index, { loading: false, error: (err as Error).message });
      return null;
    }
  };

  const loadChampions = async (index: number, puuid: string) => {
    patch(index, { loadingChampions: true });
    try {
      const { championStats, matches } = await fetchFlexData(puuid);
      patch(index, { championStats, matches, loadingChampions: false });
    } catch {
      patch(index, { championStats: [], matches: [], loadingChampions: false });
    }
  };

  const loadAll = async () => {
    setPlayers(blank());
    getDDragonVersion().then(setDdVersion).catch(() => setDdVersion('15.1.1'));
    const results = await Promise.allSettled(PLAYERS.map((_, i) => loadBasic(i)));
    const puuids = results.map(r => (r.status === 'fulfilled' ? r.value : null));
    for (let i = 0; i < PLAYERS.length; i++) {
      if (puuids[i]) await loadChampions(i, puuids[i]!);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      await setApiKey(tempKey.trim());
      setShowKey(false);
      setTempKey('');
      loadAll();
    } catch (err) {
      setSaveError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const goToPlayer = (i: number) => { setSelectedIndex(i); setView('player'); };
  const goToGeneral = () => { setSelectedIndex(null); setView('dashboard'); };

  useEffect(() => { loadAll(); }, []);

  return (
    <div className="app">

      {/* ── Persistent header ── */}
      <div className="app-header-outer">
        <header className="dash-header">
          <div className="dash-header-top">
            <div className="dash-title">
              <h1>Team Stats</h1>
              <span className="queue-badge">Ranked Flex 5v5</span>
            </div>
            <div className="dash-actions">
              <button className="action-btn" onClick={loadAll}>↺ Recargar</button>
              <button className="action-btn" onClick={() => setShowKey(v => !v)}>⚙ API Key</button>
            </div>
          </div>

          <nav className="dash-nav">
            <button
              className={`nav-tab ${view === 'dashboard' ? 'nav-tab--active' : ''}`}
              onClick={goToGeneral}
            >General</button>
            {players.map((p, i) => (
              <button
                key={i}
                className={`nav-tab ${view === 'player' && selectedIndex === i ? 'nav-tab--active' : ''}`}
                onClick={() => goToPlayer(i)}
              >
                {p.config.gameName}
              </button>
            ))}
          </nav>
        </header>

        {showKey && (
          <div className="api-key-panel">
            <span className="api-key-label">Nueva Riot API Key</span>
            <input
              className="api-key-input"
              type="text"
              value={tempKey}
              onChange={e => setTempKey(e.target.value)}
              placeholder="RGAPI-…"
              spellCheck={false}
            />
            <button className="btn-save" onClick={handleSave} disabled={saving || !tempKey}>
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
            <button className="btn-cancel" onClick={() => { setTempKey(''); setShowKey(false); }}>Cancelar</button>
            {saveError && <span className="save-error">{saveError}</span>}
          </div>
        )}
      </div>

      {/* ── Main content ── */}
      {view === 'dashboard' ? (
        <Dashboard
          players={players}
          ddVersion={ddVersion}
          onSelectPlayer={goToPlayer}
        />
      ) : selectedIndex !== null ? (
        <PlayerDetail
          player={players[selectedIndex]}
          ddVersion={ddVersion}
        />
      ) : null}
    </div>
  );
}
