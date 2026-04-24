import { useState, useEffect } from 'react';
import type { PlayerState } from '../types';
import { TIER_COLORS, winRate, kda, kdaRatio, profileIconUrl, championIconUrl } from '../utils';
import { getLoLGraphsRanks } from '../api';

interface Props {
  player: PlayerState;
  ddVersion: string;
  onBack: () => void;
}

function timeAgo(creationMs: number): string {
  const diffMs = Date.now() - creationMs;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `Hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `Hace ${days}d`;
}

function fmtDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}


export default function PlayerDetail({ player, ddVersion, onBack }: Props) {
  const { config, summoner, flexRanked, championStats, matches, loadingChampions } = player;
  const [champRanks, setChampRanks] = useState<Record<string, string>>({});
  const [ranksLoading, setRanksLoading] = useState(true);

  const tier = flexRanked?.tier ?? 'UNRANKED';
  const tierColor = TIER_COLORS[tier] ?? '#555';
  const wr = flexRanked ? winRate(flexRanked.wins, flexRanked.losses) : null;
  const iconUrl = ddVersion && summoner ? profileIconUrl(ddVersion, summoner.profileIconId) : '';

  useEffect(() => {
    setRanksLoading(true);
    getLoLGraphsRanks(config.gameName, config.tagLine).then(r => {
      setChampRanks(r);
      setRanksLoading(false);
    });
  }, [config.gameName, config.tagLine]);

  // Recent match history for this player
  const recentMatches = (matches ?? [])
    .map(m => {
      const p = m.info.participants.find(par => par.puuid === player.account?.puuid);
      if (!p) return null;
      return {
        matchId: m.metadata.matchId,
        champion: p.championName,
        win: p.win,
        kills: p.kills,
        deaths: p.deaths,
        assists: p.assists,
        cs: (p.totalMinionsKilled ?? 0) + (p.neutralMinionsKilled ?? 0),
        damage: p.totalDamageDealtToChampions ?? 0,
        visionScore: p.visionScore ?? 0,
        champLevel: p.champLevel ?? 0,
        gameDuration: m.info.gameDuration ?? 0,
        gameCreation: m.info.gameCreation ?? 0,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .slice(0, 10);

  const loLGraphsUrl = `https://www.leagueofgraphs.com/summoner/euw/${encodeURIComponent(config.gameName)}-${encodeURIComponent(config.tagLine)}`;

  return (
    <div className="player-detail">
      <button className="back-btn" onClick={onBack}>
        ← Volver
      </button>

      <div className="detail-header">
        <div className="detail-icon-wrap">
          {iconUrl && (
            <img
              src={iconUrl}
              alt=""
              className="detail-profile-icon"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
          {summoner && <span className="detail-level">{summoner.summonerLevel}</span>}
        </div>

        <div className="detail-meta">
          <h2 className="detail-name">
            {config.gameName}
            <span className="detail-tag"> #{config.tagLine}</span>
          </h2>

          {flexRanked ? (
            <div className="detail-rank" style={{ color: tierColor }}>
              {tier} {flexRanked.rank} — {flexRanked.leaguePoints} LP
              {flexRanked.hotStreak && <span className="streak-badge">🔥 Racha</span>}
            </div>
          ) : (
            <div className="detail-rank" style={{ color: '#555' }}>Sin clasificar en Flex</div>
          )}

          <a
            className="lolgraphs-link"
            href={loLGraphsUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Ver en leagueofgraphs ↗
          </a>
        </div>
      </div>

      {flexRanked && (
        <div className="detail-stats-row">
          <div className="stat-box">
            <div className="stat-value stat-wins">{flexRanked.wins}</div>
            <div className="stat-label">Victorias</div>
          </div>
          <div className="stat-box">
            <div className="stat-value stat-losses">{flexRanked.losses}</div>
            <div className="stat-label">Derrotas</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{wr}%</div>
            <div className="stat-label">% Victoria</div>
          </div>
        </div>
      )}

      {/* ── Champion stats ── */}
      <section className="champs-section">
        <h3 className="champs-title">Top Campeones en Flex</h3>

        {loadingChampions && (
          <div className="champs-loading">
            <div className="spinner" />
            <span>Cargando partidas (≈20 segundos)...</span>
          </div>
        )}

        {!loadingChampions && championStats && championStats.length === 0 && (
          <div className="champs-empty">No hay partidas Flex recientes.</div>
        )}

        {!loadingChampions && championStats && championStats.length > 0 && (
          <div className="champs-grid">
            {championStats.map(champ => {
              const champWr = winRate(champ.wins, champ.losses);
              const champKda = kda(champ.totalKills, champ.totalDeaths, champ.totalAssists, champ.games);
              const ratio = kdaRatio(champ.totalKills, champ.totalDeaths, champ.totalAssists);
              const imgUrl = ddVersion ? championIconUrl(ddVersion, champ.championName) : '';
              const lolRank = champRanks[champ.championName];
              const rankLoading = ranksLoading && !lolRank;
              const champRankUrl = `https://www.leagueofgraphs.com/rankings/summoners/${champ.championName.toLowerCase()}/euw`;

              return (
                <div key={champ.championName} className="champ-card">
                  <div className="champ-card-top">
                    <div className="champ-icon-wrap">
                      {imgUrl && (
                        <img
                          src={imgUrl}
                          alt={champ.championName}
                          className="champ-icon"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      )}
                    </div>
                    <div className="champ-info">
                      <div className="champ-name-row">
                        <span className="champ-name">{champ.championName}</span>
                        <span className="champ-games">{champ.games} partidas</span>
                      </div>
                      <div className="champ-wr-row">
                        <span className={`champ-wr ${champWr >= 50 ? 'wr-pos' : 'wr-neg'}`}>
                          {champWr}%
                        </span>
                        <span className="champ-record">
                          <span className="wins">{champ.wins}V</span>
                          {' / '}
                          <span className="losses">{champ.losses}D</span>
                        </span>
                      </div>
                      <div className="champ-kda">
                        <span className="kda-nums">{champKda}</span>
                        <span className="kda-ratio"> KDA {ratio}</span>
                      </div>
                    </div>
                  </div>

                  {/* leagueofgraphs rank */}
                  <div className="champ-lolgraphs">
                    {rankLoading ? (
                      <span className="lolgraphs-loading">Buscando rango EUW…</span>
                    ) : lolRank ? (
                      <a
                        className="lolgraphs-rank-badge"
                        href={champRankUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Ranking de ${champ.championName} en EUW`}
                      >
                        {lolRank} en EUW ↗
                      </a>
                    ) : (
                      <a
                        className="lolgraphs-rank-link"
                        href={champRankUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Rankings {champ.championName} EUW ↗
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Recent match history ── */}
      {!loadingChampions && recentMatches.length > 0 && (
        <section className="history-section">
          <h3 className="champs-title">Historial Reciente Flex</h3>
          <div className="history-list">
            {recentMatches.map(m => {
              const imgUrl = ddVersion ? championIconUrl(ddVersion, m.champion) : '';
              const ratio = kdaRatio(m.kills, m.deaths, m.assists);
              const csMins = m.gameDuration > 0
                ? (m.cs / (m.gameDuration / 60)).toFixed(1)
                : '—';
              return (
                <div key={m.matchId} className={`history-row ${m.win ? 'history-row--win' : 'history-row--loss'}`}>
                  <span className={`history-result ${m.win ? 'wins' : 'losses'}`}>
                    {m.win ? 'V' : 'D'}
                  </span>
                  {imgUrl && (
                    <img
                      src={imgUrl}
                      alt={m.champion}
                      className="history-champ-icon"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}
                  <span className="history-champ-name">{m.champion}</span>
                  <span className="history-kda">
                    {m.kills}/{m.deaths}/{m.assists}
                    <span className="history-kda-ratio"> · {ratio}</span>
                  </span>
                  <div className="history-extras">
                    <span className="history-extra">{m.cs} CS</span>
                    <span className="history-extra">{csMins}/min</span>
                    <span className="history-extra">{fmtDamage(m.damage)} dmg</span>
                    <span className="history-extra">{m.visionScore} visión</span>
                  </div>
                  <span className="history-duration">{fmtDuration(m.gameDuration)}</span>
                  {m.gameCreation > 0 && (
                    <span className="history-time">{timeAgo(m.gameCreation)}</span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
