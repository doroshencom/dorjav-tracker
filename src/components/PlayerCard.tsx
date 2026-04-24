import type { PlayerState } from '../types';
import { TIER_COLORS, winRate, kdaRatio, profileIconUrl, championIconUrl } from '../utils';

interface Props {
  player: PlayerState;
  ddVersion: string;
  onViewDetail: () => void;
}

export default function PlayerCard({ player, ddVersion, onViewDetail }: Props) {
  const { config, summoner, flexRanked, championStats, loading, loadingChampions, error } = player;

  const tier = flexRanked?.tier ?? 'UNRANKED';
  const tierColor = TIER_COLORS[tier] ?? '#555';
  const wr = flexRanked ? winRate(flexRanked.wins, flexRanked.losses) : null;

  const topChamp = championStats?.[0];
  const splashUrl = topChamp
    ? `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${topChamp.championName}_0.jpg`
    : null;

  if (loading) {
    return (
      <div className="pcard pcard--skeleton">
        <div className="pcard-content">
          <span className="pcard-name-static">{config.gameName}</span>
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pcard pcard--error">
        <div className="pcard-content">
          <div className="pcard-identity">
            <button className="pcard-name" onClick={onViewDetail}>{config.gameName}</button>
            <span className="pcard-tag">#{config.tagLine}</span>
          </div>
          <p className="pcard-error">{error}</p>
        </div>
      </div>
    );
  }

  const iconUrl = ddVersion && summoner ? profileIconUrl(ddVersion, summoner.profileIconId) : '';

  return (
    <div className="pcard" onClick={onViewDetail} style={{ cursor: 'pointer' }}>
      {/* Champion splash background */}
      {splashUrl && (
        <img
          src={splashUrl}
          alt=""
          className="pcard-splash"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      )}
      <div className="pcard-fade" />

      <div className="pcard-content">

        {/* Top bar: badges + avatar */}
        <div className="pcard-topbar">
          <div className="pcard-badges">
            {tier !== 'UNRANKED' && (
              <span className="badge-tier" style={{ color: tierColor, borderColor: `${tierColor}50` }}>
                {tier}
              </span>
            )}
            {summoner && (
              <span className="badge-level">Nv. {summoner.summonerLevel}</span>
            )}
          </div>
          {iconUrl && (
            <img
              src={iconUrl}
              alt=""
              className="pcard-avatar"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
        </div>

        <div className="pcard-identity">
          <span className="pcard-name">{config.gameName}</span>
          <span className="pcard-tag">#{config.tagLine}</span>
        </div>

        {/* Rank + record */}
        {flexRanked ? (
          <div className="pcard-rank-block">
            <span className="pcard-rank" style={{ color: tierColor }}>
              {tier} {flexRanked.rank} · {flexRanked.leaguePoints} LP
            </span>
            <span className="pcard-record">
              <span className="wins">{flexRanked.wins}V</span>
              <span className="sep"> / </span>
              <span className="losses">{flexRanked.losses}D</span>
              <span className="pcard-wr"> · {wr}%</span>
            </span>
          </div>
        ) : (
          <div className="pcard-rank-block">
            <span className="pcard-rank" style={{ color: '#555' }}>Sin clasificar</span>
          </div>
        )}

        <div className="pcard-divider" />

        {/* Champions */}
        {loadingChampions ? (
          <p className="pcard-champ-status">Cargando campeones…</p>
        ) : championStats && championStats.length > 0 ? (
          <div className="pcard-champs">
            {championStats.map(champ => {
              const cwr = winRate(champ.wins, champ.losses);
              const ratio = kdaRatio(champ.totalKills, champ.totalDeaths, champ.totalAssists);
              const cIcon = ddVersion ? championIconUrl(ddVersion, champ.championName) : '';
              return (
                <div key={champ.championName} className="champ-row">
                  {cIcon && (
                    <img
                      src={cIcon}
                      alt={champ.championName}
                      className="champ-row-icon"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}
                  <span className="champ-row-name">{champ.championName}</span>
                  <span className="champ-row-games">{champ.games}p</span>
                  <span className={`champ-row-wr ${cwr >= 50 ? 'wr-pos' : 'wr-neg'}`}>{cwr}%</span>
                  <span className="champ-row-kda">{ratio} KDA</span>
                </div>
              );
            })}
          </div>
        ) : championStats !== null ? (
          <p className="pcard-champ-status">Sin partidas Flex recientes</p>
        ) : null}

      </div>
    </div>
  );
}
