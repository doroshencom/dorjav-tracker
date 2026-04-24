import { useState } from 'react';
import type { PlayerState } from '../types';
import { winRate, computeTeamGames } from '../utils';
import PlayerCard from './PlayerCard';

interface Props {
  players: PlayerState[];
  ddVersion: string;
  onSelectPlayer: (index: number) => void;
}

export default function Dashboard({ players, ddVersion, onSelectPlayer }: Props) {
  const [togetherMin, setTogetherMin] = useState<4 | 5>(4);

  const ranked = players.filter(p => !p.loading && !p.error && p.flexRanked);
  const totalW = ranked.reduce((s, p) => s + (p.flexRanked?.wins ?? 0), 0);
  const totalL = ranked.reduce((s, p) => s + (p.flexRanked?.losses ?? 0), 0);

  const allMatchesLoaded = players.every(p => p.matches !== null || p.error !== null);
  const together = allMatchesLoaded ? computeTeamGames(players, togetherMin) : null;
  const togetherWR = together && together.games > 0
    ? winRate(together.wins, together.losses)
    : null;

  return (
    <div className="dashboard">

      {/* ── Partidas juntos (HERO SECTION) ── */}
      <section className="together-section">
        <div className="together-section-header">
          <span className="together-section-title">Jugando Juntos</span>
          <div className="together-toggle">
            <button
              className={`tog-btn ${togetherMin === 4 ? 'tog-btn--active' : ''}`}
              onClick={() => setTogetherMin(4)}
            >4+</button>
            <button
              className={`tog-btn ${togetherMin === 5 ? 'tog-btn--active' : ''}`}
              onClick={() => setTogetherMin(5)}
            >5/5</button>
          </div>
        </div>

        {together === null ? (
          <div className="together-loading-row">
            <div className="spinner spinner--sm" />
            <span>Cargando historial de partidas…</span>
          </div>
        ) : together.games === 0 ? (
          <p className="together-empty">Sin partidas en común en los últimos 20 registros por jugador.</p>
        ) : (
          <div className="together-stats-row">
            <div className="together-stat together-stat--hero">
              <span
                className="together-big-wr"
                style={{ color: togetherWR !== null && togetherWR >= 50 ? 'var(--wins)' : 'var(--losses)' }}
              >
                {togetherWR}%
              </span>
              <span className="together-stat-lbl">Winrate Juntos</span>
            </div>
            <div className="together-divider-v" />
            <div className="together-stat">
              <span className="together-stat-val">{together.games}</span>
              <span className="together-stat-lbl">Partidas</span>
            </div>
            <div className="together-stat">
              <span className="together-stat-val wins">{together.wins}</span>
              <span className="together-stat-lbl">Victorias</span>
            </div>
            <div className="together-stat">
              <span className="together-stat-val losses">{together.losses}</span>
              <span className="together-stat-lbl">Derrotas</span>
            </div>
          </div>
        )}
      </section>

      {/* ── Team season summary ── */}
      {ranked.length > 0 && (
        <div className="team-summary">
          <div className="team-stat-box">
            <span className="team-stat-val">{totalW + totalL}</span>
            <span className="team-stat-lbl">Partidas</span>
          </div>
          <div className="team-stat-box">
            <span className="team-stat-val wins">{totalW}</span>
            <span className="team-stat-lbl">Victorias</span>
          </div>
          <div className="team-stat-box">
            <span className="team-stat-val losses">{totalL}</span>
            <span className="team-stat-lbl">Derrotas</span>
          </div>
        </div>
      )}

      {/* ── Player cards ── */}
      <div className="players-grid">
        {players.map((player, index) => (
          <PlayerCard
            key={index}
            player={player}
            ddVersion={ddVersion}
            onViewDetail={() => onSelectPlayer(index)}
          />
        ))}
      </div>
    </div>
  );
}
