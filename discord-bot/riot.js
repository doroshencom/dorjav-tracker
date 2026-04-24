const PLAYERS = [
  { gameName: 'JoseBretøn',     tagLine: '666'   },
  { gameName: 'usgo98',          tagLine: 'EUW'   },
  { gameName: 'Ferrari poppy',   tagLine: 'kchow' },
  { gameName: 'zinedine ziIean', tagLine: '6969'  },
  { gameName: 'Javizht',         tagLine: 'EUW'   },
];

async function jsonGet(url, headers = {}) {
  const r = await fetch(url, { headers });
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${url}`);
  return r.json();
}

async function riotGet(url) {
  return jsonGet(url, { 'X-Riot-Token': process.env.RIOT_API_KEY });
}

// Cache champion ID → DDragon name map (fetched once per process)
let champMap = null;
async function getChampMap() {
  if (champMap) return champMap;
  const versions = await jsonGet('https://ddragon.leagueoflegends.com/api/versions.json');
  const v = versions[0];
  const data = await jsonGet(`https://ddragon.leagueoflegends.com/cdn/${v}/data/en_US/champion.json`);
  champMap = {};
  for (const [name, info] of Object.entries(data.data)) {
    champMap[info.key] = name; // numeric string ID → DDragon name
  }
  return champMap;
}

export async function fetchAllPlayers() {
  const champs = await getChampMap();

  return Promise.all(PLAYERS.map(async (p) => {
    try {
      const account = await riotGet(
        `https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(p.gameName)}/${encodeURIComponent(p.tagLine)}`
      );

      const [entries, masteries] = await Promise.all([
        riotGet(`https://euw1.api.riotgames.com/lol/league/v4/entries/by-puuid/${account.puuid}`),
        riotGet(`https://euw1.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${account.puuid}/top?count=3`),
      ]);

      const flex = entries.find(e => e.queueType === 'RANKED_FLEX_SR') ?? null;
      const topChamps = masteries.slice(0, 3).map(m => ({
        name: champs[String(m.championId)] ?? null,
      }));

      return { config: p, flex, topChamps, error: null };
    } catch (err) {
      return { config: p, flex: null, topChamps: [], error: err.message };
    }
  }));
}
