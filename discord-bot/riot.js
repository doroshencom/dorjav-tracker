const PLAYERS = [
  { gameName: 'JoseBretøn',     tagLine: '666' },
  { gameName: 'usgo98',          tagLine: 'EUW' },
  { gameName: 'Ferrari poppy',   tagLine: 'kchow' },
  { gameName: 'zinedine ziIean', tagLine: '6969' },
  { gameName: 'Javizht',         tagLine: 'EUW' },
];

async function riotGet(url) {
  const r = await fetch(url, {
    headers: { 'X-Riot-Token': process.env.RIOT_API_KEY },
  });
  if (!r.ok) throw new Error(`Riot API ${r.status}`);
  return r.json();
}

export async function fetchAllPlayers() {
  return Promise.all(PLAYERS.map(async (p) => {
    try {
      const account = await riotGet(
        `https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(p.gameName)}/${encodeURIComponent(p.tagLine)}`
      );
      const entries = await riotGet(
        `https://euw1.api.riotgames.com/lol/league/v4/entries/by-puuid/${account.puuid}`
      );
      const flex = entries.find(e => e.queueType === 'RANKED_FLEX_SR') ?? null;
      return { config: p, flex, error: null };
    } catch (err) {
      return { config: p, flex: null, error: err.message };
    }
  }));
}
