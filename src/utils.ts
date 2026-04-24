export const TIER_COLORS: Record<string, string> = {
  IRON: '#7B7B7B',
  BRONZE: '#8C523A',
  SILVER: '#87AABB',
  GOLD: '#C89B3C',
  PLATINUM: '#009B8B',
  EMERALD: '#1CB670',
  DIAMOND: '#576BCE',
  MASTER: '#9D48E0',
  GRANDMASTER: '#E03737',
  CHALLENGER: '#F4C874',
};

export const RANK_LABELS: Record<string, string> = {
  I: 'I', II: 'II', III: 'III', IV: 'IV',
};

export function winRate(wins: number, losses: number): number {
  const total = wins + losses;
  if (total === 0) return 0;
  return Math.round((wins / total) * 100);
}

export function kda(kills: number, deaths: number, assists: number, games: number): string {
  const avgK = (kills / games).toFixed(1);
  const avgD = (deaths / games).toFixed(1);
  const avgA = (assists / games).toFixed(1);
  return `${avgK} / ${avgD} / ${avgA}`;
}

export function kdaRatio(kills: number, deaths: number, assists: number): string {
  if (deaths === 0) return 'Perfect';
  return ((kills + assists) / deaths).toFixed(2);
}

export function computeTeamGames(players: import('./types').PlayerState[], minPlayers: number) {
  const puuids = new Set(
    players.map(p => p.account?.puuid).filter((p): p is string => !!p)
  );

  const seen = new Set<string>();
  let wins = 0, losses = 0;

  for (const player of players) {
    for (const match of player.matches ?? []) {
      const id = match.metadata.matchId;
      if (seen.has(id)) continue;
      seen.add(id);

      for (const teamId of [100, 200]) {
        const side = match.info.participants.filter(p => p.teamId === teamId);
        const ours = side.filter(p => puuids.has(p.puuid));
        if (ours.length >= minPlayers) {
          ours[0].win ? wins++ : losses++;
          break;
        }
      }
    }
  }

  return { games: wins + losses, wins, losses };
}

export function profileIconUrl(version: string, iconId: number): string {
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/${iconId}.png`;
}

export function championIconUrl(version: string, championName: string): string {
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${championName}.png`;
}
