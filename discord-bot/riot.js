const PLAYERS = [
  { gameName: 'JoseBretøn',     tagLine: '666'   },
  { gameName: 'usgo98',          tagLine: 'EUW'   },
  { gameName: 'Ferrari poppy',   tagLine: 'kchow' },
  { gameName: 'zinedine ziIean', tagLine: '6969'  },
  { gameName: 'Javizht',         tagLine: 'EUW'   },
];

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function riotGet(url) {
  const r = await fetch(url, { headers: { 'X-Riot-Token': process.env.RIOT_API_KEY } });
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${url}`);
  return r.json();
}

// Fetch top champions from the last N Flex matches (queue=440)
async function fetchFlexChamps(puuid, count = 5) {
  try {
    const ids = await riotGet(
      `https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?queue=440&count=${count}`
    );
    const stats = {};
    for (const id of ids) {
      await sleep(200);
      try {
        const match = await riotGet(`https://europe.api.riotgames.com/lol/match/v5/matches/${id}`);
        const p = match.info.participants.find(x => x.puuid === puuid);
        if (!p) continue;
        const n = p.championName;
        if (!stats[n]) stats[n] = { name: n, games: 0, wins: 0 };
        stats[n].games++;
        if (p.win) stats[n].wins++;
      } catch { /* skip failed match */ }
    }
    return Object.values(stats).sort((a, b) => b.games - a.games).slice(0, 3);
  } catch {
    return [];
  }
}

export async function fetchAllPlayers() {
  // Phase 1 — account + ranked entries in parallel (10 calls total)
  const basic = await Promise.all(PLAYERS.map(async (p) => {
    try {
      const account = await riotGet(
        `https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(p.gameName)}/${encodeURIComponent(p.tagLine)}`
      );
      const entries = await riotGet(
        `https://euw1.api.riotgames.com/lol/league/v4/entries/by-puuid/${account.puuid}`
      );
      return {
        config: p,
        puuid: account.puuid,
        flex: entries.find(e => e.queueType === 'RANKED_FLEX_SR') ?? null,
        error: null,
      };
    } catch (err) {
      return { config: p, puuid: null, flex: null, error: err.message };
    }
  }));

  // Phase 2 — match history per player sequentially (avoids rate limit spikes)
  const results = [];
  for (const player of basic) {
    const topChamps = player.puuid ? await fetchFlexChamps(player.puuid, 5) : [];
    results.push({ config: player.config, flex: player.flex, topChamps, error: player.error });
  }
  return results;
}
