import { useState, useEffect } from 'react';
import './App.css';
import type { PlayerState } from './types';
import { PLAYERS } from './config';
import { getAccount, getSummoner, getRankedEntries, fetchFlexData, getDDragonVersion } from './api';
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

    // All basic data in parallel
    const results = await Promise.allSettled(PLAYERS.map((_, i) => loadBasic(i)));
    const puuids = results.map(r => (r.status === 'fulfilled' ? r.value : null));

    // Champion stats one player at a time (rate-limit safe)
    for (let i = 0; i < PLAYERS.length; i++) {
      if (puuids[i]) await loadChampions(i, puuids[i]!);
    }
  };

  useEffect(() => { loadAll(); }, []);

  return (
    <div className="app">
      {view === 'dashboard' ? (
        <Dashboard
          players={players}
          ddVersion={ddVersion}
          onSelectPlayer={i => { setSelectedIndex(i); setView('player'); }}
          onRefresh={loadAll}
        />
      ) : selectedIndex !== null ? (
        <PlayerDetail
          player={players[selectedIndex]}
          ddVersion={ddVersion}
          onBack={() => { setView('dashboard'); setSelectedIndex(null); }}
        />
      ) : null}
    </div>
  );
}
