export interface PlayerConfig {
  gameName: string;
  tagLine: string;
}

export interface AccountData {
  puuid: string;
  gameName: string;
  tagLine: string;
}

export interface SummonerData {
  puuid: string;
  profileIconId: number;
  summonerLevel: number;
}

export interface RankedEntry {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  hotStreak: boolean;
  veteran: boolean;
}

export interface MatchParticipant {
  puuid: string;
  championName: string;
  kills: number;
  deaths: number;
  assists: number;
  win: boolean;
  teamId: number;
  totalMinionsKilled: number;
  neutralMinionsKilled: number;
  totalDamageDealtToChampions: number;
  visionScore: number;
  champLevel: number;
  goldEarned: number;
}

export interface MatchData {
  metadata: { matchId: string };
  info: {
    participants: MatchParticipant[];
    gameDuration: number;
    gameCreation: number;
  };
}

export interface ChampionStats {
  championName: string;
  games: number;
  wins: number;
  losses: number;
  totalKills: number;
  totalDeaths: number;
  totalAssists: number;
  totalCS: number;
  totalDamage: number;
  totalVisionScore: number;
}

export interface PlayerState {
  config: PlayerConfig;
  account: AccountData | null;
  summoner: SummonerData | null;
  flexRanked: RankedEntry | null;
  championStats: ChampionStats[] | null;
  matches: MatchData[] | null;
  loading: boolean;
  loadingChampions: boolean;
  error: string | null;
}
