import express from 'express';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3001;
const CONFIG_FILE = path.join(__dirname, '.api-config.json');

// Env var takes priority; config file used for local dev
let apiKey = process.env.RIOT_API_KEY || '';
if (!apiKey && existsSync(CONFIG_FILE)) {
  try {
    apiKey = JSON.parse(readFileSync(CONFIG_FILE, 'utf-8')).apiKey || '';
  } catch {}
}

const app = express();
app.use(express.json());

async function riotProxy(url, res) {
  try {
    const r = await fetch(url, { headers: { 'X-Riot-Token': apiKey } });
    const text = await r.text();
    let body;
    try { body = JSON.parse(text); } catch { body = { error: text.slice(0, 200) }; }
    res.status(r.status).json(body);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Account by Riot ID
app.get('/api/account/:routing/:gameName/:tagLine', (req, res) => {
  const { routing, gameName, tagLine } = req.params;
  riotProxy(
    `https://${routing}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
    res
  );
});

// Summoner by PUUID
app.get('/api/summoner/:platform/:puuid', (req, res) => {
  const { platform, puuid } = req.params;
  riotProxy(
    `https://${platform}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`,
    res
  );
});

// Ranked entries by PUUID
app.get('/api/ranked/:platform/:puuid', (req, res) => {
  const { platform, puuid } = req.params;
  riotProxy(
    `https://${platform}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`,
    res
  );
});

// Match IDs
app.get('/api/matches/:routing/:puuid', (req, res) => {
  const { routing, puuid } = req.params;
  const { queue, count } = req.query;
  riotProxy(
    `https://${routing}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?queue=${queue}&count=${count}`,
    res
  );
});

// Match detail
app.get('/api/match/:routing/:matchId', (req, res) => {
  const { routing, matchId } = req.params;
  riotProxy(
    `https://${routing}.api.riotgames.com/lol/match/v5/matches/${matchId}`,
    res
  );
});

// leagueofgraphs champion rank scraper
app.get('/api/lol-graphs/:gameName/:tagLine', async (req, res) => {
  const { gameName, tagLine } = req.params;
  try {
    const slug = `${gameName}-${tagLine}`.replace(/ /g, '+');
    const url = `https://www.leagueofgraphs.com/summoner/euw/${slug}`;
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });
    if (!r.ok) return res.json({ ranks: {} });
    const html = await r.text();

    const ranks = {};
    const rowRe = /champion-row[^>]*>([\s\S]{20,800}?)<\/tr>/g;
    let m;
    while ((m = rowRe.exec(html)) !== null) {
      const row = m[1];
      const nameM = row.match(/champion[_-]name[^>]*>[\s\S]*?<a[^>]*>([\w\s'.]+)<\/a>/);
      const rankM = row.match(/Top\s+([\d.]+)%/i);
      if (nameM && rankM) {
        ranks[nameM[1].trim()] = `Top ${rankM[1]}%`;
      }
    }
    res.json({ ranks });
  } catch (err) {
    res.json({ ranks: {}, error: err.message });
  }
});

// Update API key (local dev only — on Netlify use RIOT_API_KEY env var)
app.post('/api/set-key', (req, res) => {
  const { key } = req.body;
  if (!key || typeof key !== 'string' || !key.trim().startsWith('RGAPI-')) {
    return res.status(400).json({ error: 'Formato inválido. La key debe empezar por RGAPI-' });
  }
  apiKey = key.trim();
  try { writeFileSync(CONFIG_FILE, JSON.stringify({ apiKey })); } catch {}
  res.json({ ok: true });
});

// Export for Netlify Functions
export { app };

// Start standalone server only when invoked directly (local dev)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  app.listen(PORT, () => {
    console.log(`[proxy] http://localhost:${PORT}`);
    if (apiKey) console.log(`[proxy] API key cargada (${apiKey.slice(0, 12)}...)`);
    else console.log('[proxy] Sin API key — usa el panel ⚙ para configurarla');
  });
}
