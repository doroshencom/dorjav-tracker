import type { AccountData, SummonerData, RankedEntry, MatchData, ChampionStats } from './types';
import { REGION, ROUTING, FLEX_QUEUE_ID, MATCHES_TO_FETCH } from './config';

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

async function apiFetch(url: string): Promise<Response> {
  const res = await fetch(url);
  if (res.status === 429) {
    const wait = parseInt(res.headers.get('Retry-After') || '2', 10);
    await sleep(wait * 1000);
    return apiFetch(url);
  }
  return res;
}

export async function getAccount(gameName: string, tagLine: string): Promise<AccountData> {
  const res = await apiFetch(`/api/account/${ROUTING}/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`);
  if (!res.ok) throw new Error(`${gameName}#${tagLine} no encontrado (${res.status})`);
  return res.json();
}

export async function getSummoner(puuid: string): Promise<SummonerData> {
  const res = await apiFetch(`/api/summoner/${REGION}/${puuid}`);
  if (!res.ok) throw new Error(`Error al obtener invocador (${res.status})`);
  return res.json();
}

export async function getRankedEntries(puuid: string): Promise<RankedEntry[]> {
  const res = await apiFetch(`/api/ranked/${REGION}/${puuid}`);
  if (!res.ok) throw new Error(`Error al obtener ranked (${res.status})`);
  return res.json();
}

async function getFlexMatchIds(puuid: string): Promise<string[]> {
  const res = await apiFetch(`/api/matches/${ROUTING}/${puuid}?queue=${FLEX_QUEUE_ID}&count=${MATCHES_TO_FETCH}`);
  if (!res.ok) throw new Error(`Error al obtener partidas (${res.status})`);
  return res.json();
}

async function getMatch(matchId: string): Promise<MatchData> {
  const res = await apiFetch(`/api/match/${ROUTING}/${matchId}`);
  if (!res.ok) throw new Error(`Error en partida ${matchId} (${res.status})`);
  return res.json();
}

function buildChampionStats(matches: MatchData[], puuid: string): ChampionStats[] {
  const map = new Map<string, ChampionStats>();

  for (const match of matches) {
    const p = match.info.participants.find(par => par.puuid === puuid);
    if (!p) continue;

    const prev = map.get(p.championName) ?? {
      championName: p.championName,
      games: 0, wins: 0, losses: 0,
      totalKills: 0, totalDeaths: 0, totalAssists: 0,
      totalCS: 0, totalDamage: 0, totalVisionScore: 0,
    };

    map.set(p.championName, {
      ...prev,
      games: prev.games + 1,
      wins: prev.wins + (p.win ? 1 : 0),
      losses: prev.losses + (p.win ? 0 : 1),
      totalKills: prev.totalKills + p.kills,
      totalDeaths: prev.totalDeaths + p.deaths,
      totalAssists: prev.totalAssists + p.assists,
      totalCS: prev.totalCS + (p.totalMinionsKilled ?? 0) + (p.neutralMinionsKilled ?? 0),
      totalDamage: prev.totalDamage + (p.totalDamageDealtToChampions ?? 0),
      totalVisionScore: prev.totalVisionScore + (p.visionScore ?? 0),
    });
  }

  return Array.from(map.values()).sort((a, b) => b.games - a.games).slice(0, 5);
}

export async function fetchFlexData(puuid: string): Promise<{ championStats: ChampionStats[]; matches: MatchData[] }> {
  const matchIds = await getFlexMatchIds(puuid);
  const matches: MatchData[] = [];

  for (const id of matchIds) {
    await sleep(120);
    try {
      matches.push(await getMatch(id));
    } catch {
      // skip failed match
    }
  }

  return { championStats: buildChampionStats(matches, puuid), matches };
}

export async function setApiKey(key: string): Promise<void> {
  const res = await fetch('/api/set-key', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Error al guardar la API key');
  }
}

export async function getDDragonVersion(): Promise<string> {
  const res = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
  const versions: string[] = await res.json();
  return versions[0];
}

export async function getLoLGraphsRanks(gameName: string, tagLine: string): Promise<Record<string, string>> {
  try {
    const res = await fetch(`/api/lol-graphs/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`);
    if (!res.ok) return {};
    const data = await res.json();
    return data.ranks ?? {};
  } catch {
    return {};
  }
}
