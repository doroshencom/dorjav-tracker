const getKey = () => process.env.RIOT_API_KEY ?? '';

const jsonResp = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

async function riotFetch(url) {
  const r = await fetch(url, { headers: { 'X-Riot-Token': getKey() } });
  const text = await r.text();
  let body;
  try { body = JSON.parse(text); } catch { body = { error: text.slice(0, 200) }; }
  return { statusCode: r.status, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

export const handler = async (event) => {
  // rawUrl preserves the original request path regardless of redirects
  const reqPath = event.rawUrl
    ? new URL(event.rawUrl).pathname
    : (event.path ?? '');
  const qs = event.queryStringParameters ?? {};
  let m;

  // GET /api/account/:routing/:gameName/:tagLine
  m = reqPath.match(/^\/api\/account\/([^/]+)\/([^/]+)\/([^/]+)$/);
  if (m) {
    return riotFetch(
      `https://${m[1]}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${m[2]}/${m[3]}`
    );
  }

  // GET /api/summoner/:platform/:puuid
  m = reqPath.match(/^\/api\/summoner\/([^/]+)\/([^/]+)$/);
  if (m) {
    return riotFetch(
      `https://${m[1]}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${m[2]}`
    );
  }

  // GET /api/ranked/:platform/:puuid
  m = reqPath.match(/^\/api\/ranked\/([^/]+)\/([^/]+)$/);
  if (m) {
    return riotFetch(
      `https://${m[1]}.api.riotgames.com/lol/league/v4/entries/by-puuid/${m[2]}`
    );
  }

  // GET /api/matches/:routing/:puuid?queue=&count=
  m = reqPath.match(/^\/api\/matches\/([^/]+)\/([^/]+)$/);
  if (m) {
    return riotFetch(
      `https://${m[1]}.api.riotgames.com/lol/match/v5/matches/by-puuid/${m[2]}/ids?queue=${qs.queue ?? ''}&count=${qs.count ?? '10'}`
    );
  }

  // GET /api/match/:routing/:matchId
  m = reqPath.match(/^\/api\/match\/([^/]+)\/([^/]+)$/);
  if (m) {
    return riotFetch(
      `https://${m[1]}.api.riotgames.com/lol/match/v5/matches/${m[2]}`
    );
  }

  // GET /api/lol-graphs/:gameName/:tagLine
  m = reqPath.match(/^\/api\/lol-graphs\/([^/]+)\/([^/]+)$/);
  if (m) {
    try {
      const slug = `${decodeURIComponent(m[1])}-${decodeURIComponent(m[2])}`.replace(/ /g, '+');
      const r = await fetch(`https://www.leagueofgraphs.com/summoner/euw/${slug}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html',
        },
      });
      if (!r.ok) return jsonResp(200, { ranks: {} });
      const html = await r.text();
      const ranks = {};
      const rowRe = /champion-row[^>]*>([\s\S]{20,800}?)<\/tr>/g;
      let rm;
      while ((rm = rowRe.exec(html)) !== null) {
        const row = rm[1];
        const nameM = row.match(/champion[_-]name[^>]*>[\s\S]*?<a[^>]*>([\w\s'.]+)<\/a>/);
        const rankM = row.match(/Top\s+([\d.]+)%/i);
        if (nameM && rankM) ranks[nameM[1].trim()] = `Top ${rankM[1]}%`;
      }
      return jsonResp(200, { ranks });
    } catch {
      return jsonResp(200, { ranks: {} });
    }
  }

  // POST /api/set-key — no-op on Netlify (use RIOT_API_KEY env var instead)
  if (reqPath === '/api/set-key' && event.httpMethod === 'POST') {
    return jsonResp(200, { ok: true });
  }

  return jsonResp(404, { error: 'Not found' });
};
