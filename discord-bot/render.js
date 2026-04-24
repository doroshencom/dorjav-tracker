import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
GlobalFonts.registerFromPath(join(__dirname, 'fonts/Roboto-Regular.ttf'), 'Roboto');
GlobalFonts.registerFromPath(join(__dirname, 'fonts/Roboto-Bold.ttf'), 'Roboto');

// ── Palette (matches index.css variables) ─────────────────────────────────
const BG       = '#060d1a';
const CARD_BG  = '#0d1c35';
const BORDER   = '#1a2f50';
const GOLD     = '#c89b3c';
const TEXT     = '#d8cfc4';
const TEXT_DIM = '#7a8aaa';
const WIN_COL  = '#4caf74';
const LOSS_COL = '#e84057';

const TIER_COLOR = {
  IRON:        '#8c8c8c',
  BRONZE:      '#b07844',
  SILVER:      '#aab4c0',
  GOLD:        '#c89b3c',
  PLATINUM:    '#40c8a0',
  EMERALD:     '#4caf74',
  DIAMOND:     '#7cb4f0',
  MASTER:      '#c460e0',
  GRANDMASTER: '#e84057',
  CHALLENGER:  '#f4c874',
};

// ── Layout constants ───────────────────────────────────────────────────────
const CW     = 640;
const CARD_W = CW - 20;   // 620px
const CARD_H = 158;
const GAP    = 8;
const HDR_H  = 56;
const PAD    = 10;
const N      = 5;
const CH     = HDR_H + PAD + N * CARD_H + (N - 1) * GAP + PAD;

// ── Helpers ────────────────────────────────────────────────────────────────
function winRate(w, l) { const t = w + l; return t === 0 ? 0 : Math.round(w / t * 100); }
function cap(s)        { return s.charAt(0) + s.slice(1).toLowerCase(); }

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

// ── Main export ────────────────────────────────────────────────────────────
export async function renderStatsImage(players) {
  // Load champion splash images in parallel (DDragon, not rate-limited)
  const splashes = await Promise.all(
    players.map(({ topChamps }) => {
      const name = topChamps?.[0]?.name;
      if (!name) return Promise.resolve(null);
      return loadImage(
        `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${name}_0.jpg`
      ).catch(() => null);
    })
  );

  const canvas = createCanvas(CW, CH);
  const ctx    = canvas.getContext('2d');

  // ── Background ────────────────────────────────────────────────────────────
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, CW, CH);

  // ── Header ────────────────────────────────────────────────────────────────
  ctx.textAlign = 'left';
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 20px Roboto, Arial, sans-serif';
  ctx.fillText('ELO TRAIN', PAD, PAD + 22);
  ctx.fillStyle = TEXT_DIM;
  ctx.font = '13px Roboto, Arial, sans-serif';
  ctx.fillText('Ranked Flex 5v5  ·  EUW', PAD, PAD + 42);

  // ── Cards ─────────────────────────────────────────────────────────────────
  players.forEach(({ config, flex, topChamps, error }, i) => {
    const cx     = PAD;
    const cy     = HDR_H + PAD + i * (CARD_H + GAP);
    const splash = splashes[i];

    // Card base
    ctx.fillStyle = CARD_BG;
    rr(ctx, cx, cy, CARD_W, CARD_H, 10);
    ctx.fill();

    // Champion splash + dark gradient overlay
    if (splash) {
      ctx.save();
      rr(ctx, cx, cy, CARD_W, CARD_H, 10);
      ctx.clip();

      // Draw splash on the right 62% of the card, cover-scaled
      const sx     = cx + CARD_W * 0.38;
      const sw     = CARD_W * 0.65;
      const scale  = Math.max(sw / splash.width, CARD_H / splash.height);
      const dw     = splash.width  * scale;
      const dh     = splash.height * scale;
      ctx.drawImage(splash, sx + (sw - dw) / 2, cy + (CARD_H - dh) / 2, dw, dh);

      // Left→right gradient: opaque dark left, transparent right
      const g = ctx.createLinearGradient(cx, 0, cx + CARD_W, 0);
      g.addColorStop(0,    'rgba(13,28,53,0.99)');
      g.addColorStop(0.38, 'rgba(13,28,53,0.97)');
      g.addColorStop(0.58, 'rgba(13,28,53,0.72)');
      g.addColorStop(0.80, 'rgba(13,28,53,0.20)');
      g.addColorStop(1,    'rgba(13,28,53,0.04)');
      ctx.fillStyle = g;
      ctx.fillRect(cx, cy, CARD_W, CARD_H);

      ctx.restore();
    }

    // Card border
    ctx.strokeStyle = BORDER;
    ctx.lineWidth = 1;
    rr(ctx, cx, cy, CARD_W, CARD_H, 10);
    ctx.stroke();

    const tierColor = (!error && flex) ? (TIER_COLOR[flex.tier] ?? GOLD) : TEXT_DIM;

    // Tier accent strip on left edge (inside rounded corners)
    ctx.fillStyle = tierColor;
    ctx.fillRect(cx + 1, cy + 10, 4, CARD_H - 20);

    const tx = cx + 18; // left content X

    // ── Tier badge ─────────────────────────────────────────────────────────
    if (!error && flex?.tier) {
      ctx.font = 'bold 10px Roboto, Arial, sans-serif';
      const bw = ctx.measureText(flex.tier).width + 18;
      ctx.fillStyle = tierColor + '22';
      rr(ctx, tx, cy + 11, bw, 20, 4);
      ctx.fill();
      ctx.strokeStyle = tierColor + '80';
      ctx.lineWidth = 1;
      rr(ctx, tx, cy + 11, bw, 20, 4);
      ctx.stroke();
      ctx.fillStyle = tierColor;
      ctx.textAlign = 'center';
      ctx.fillText(flex.tier, tx + bw / 2, cy + 25);
      ctx.textAlign = 'left';
    }

    // ── Player name ────────────────────────────────────────────────────────
    ctx.fillStyle = '#f0e6d3';
    ctx.font = 'bold 22px Roboto, Arial, sans-serif';
    ctx.fillText(config.gameName, tx, cy + 63);

    // ── Tag ────────────────────────────────────────────────────────────────
    ctx.fillStyle = TEXT_DIM;
    ctx.font = '13px Roboto, Arial, sans-serif';
    ctx.fillText(`#${config.tagLine}`, tx, cy + 81);

    if (error || !flex) {
      ctx.fillStyle = TEXT_DIM;
      ctx.font = 'italic 13px Roboto, Arial, sans-serif';
      ctx.fillText('Sin clasificar', tx, cy + 106);
      return;
    }

    const rate = winRate(flex.wins, flex.losses);
    const rc   = rate >= 50 ? WIN_COL : LOSS_COL;

    // ── Rank + LP ──────────────────────────────────────────────────────────
    const rankStr = `${cap(flex.tier)} ${flex.rank}`;
    ctx.fillStyle = tierColor;
    ctx.font = 'bold 14px Roboto, Arial, sans-serif';
    ctx.fillText(rankStr, tx, cy + 105);
    const rankW = ctx.measureText(rankStr).width;
    ctx.fillStyle = TEXT_DIM;
    ctx.font = '13px Roboto, Arial, sans-serif';
    ctx.fillText(` · ${flex.leaguePoints} LP`, tx + rankW, cy + 105);

    // ── WR bar ─────────────────────────────────────────────────────────────
    const barX  = tx;
    const barY  = cy + 117;
    const barW  = 130;
    const barHt = 6;

    ctx.fillStyle = BORDER;
    rr(ctx, barX, barY, barW, barHt, 3);
    ctx.fill();

    const filled = Math.max(3, Math.round(barW * rate / 100));
    ctx.fillStyle = rc;
    rr(ctx, barX, barY, filled, barHt, 3);
    ctx.fill();

    // WR percentage next to bar
    ctx.fillStyle = rc;
    ctx.font = 'bold 13px Roboto, Arial, sans-serif';
    ctx.fillText(`${rate}%`, barX + barW + 8, cy + 124);

    // ── W / L ──────────────────────────────────────────────────────────────
    const wlX = barX + barW + 52;
    ctx.fillStyle = WIN_COL;
    ctx.font = 'bold 12px Roboto, Arial, sans-serif';
    ctx.fillText(`${flex.wins}W`, wlX, cy + 124);
    const wW = ctx.measureText(`${flex.wins}W`).width;

    ctx.fillStyle = TEXT_DIM;
    ctx.font = '12px Roboto, Arial, sans-serif';
    ctx.fillText(' / ', wlX + wW, cy + 124);
    const sepW = ctx.measureText(' / ').width;

    ctx.fillStyle = LOSS_COL;
    ctx.font = 'bold 12px Roboto, Arial, sans-serif';
    ctx.fillText(`${flex.losses}L`, wlX + wW + sepW, cy + 124);

    // ── Top champions (mastery) ────────────────────────────────────────────
    if (topChamps?.length > 0) {
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.moveTo(tx, cy + 136);
      ctx.lineTo(tx + 310, cy + 136);
      ctx.stroke();
      ctx.globalAlpha = 1;

      ctx.fillStyle = TEXT_DIM;
      ctx.font = '11px Roboto, Arial, sans-serif';
      ctx.fillText(
        topChamps.map(c => c.name ?? '—').join('  ·  '),
        tx,
        cy + 150
      );
    }
  });

  return canvas.toBuffer('image/png');
}
