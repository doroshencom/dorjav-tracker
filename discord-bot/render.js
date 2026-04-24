import { createCanvas } from '@napi-rs/canvas';

const BG        = '#060d1a';
const CARD_BG   = '#0d1c35';
const BORDER    = '#1a2f50';
const GOLD      = '#c89b3c';
const TEXT      = '#d8cfc4';
const TEXT_DIM  = '#7a8aaa';
const WIN_COL   = '#4caf74';
const LOSS_COL  = '#e84057';

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

const W = 600;
const HEADER_H = 52;
const CARD_H = 70;
const CARD_GAP = 8;
const CARD_MARGIN = 10;
const N = 5;
const H = HEADER_H + N * CARD_H + (N - 1) * CARD_GAP + CARD_MARGIN * 2;

function wr(wins, losses) {
  const t = wins + losses;
  return t === 0 ? 0 : Math.round((wins / t) * 100);
}

function cap(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function roundRect(ctx, x, y, w, h, r) {
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

export function renderStatsImage(players) {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // Title
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 16px Arial, sans-serif';
  ctx.fillText('DORJAV TEAM', CARD_MARGIN, 26);

  ctx.fillStyle = TEXT_DIM;
  ctx.font = '13px Arial, sans-serif';
  ctx.fillText('Ranked Flex 5v5  ·  EUW', CARD_MARGIN, 44);

  // Separator line
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(CARD_MARGIN, HEADER_H);
  ctx.lineTo(W - CARD_MARGIN, HEADER_H);
  ctx.stroke();

  players.forEach(({ config, flex, error }, i) => {
    const cx = CARD_MARGIN;
    const cy = HEADER_H + CARD_MARGIN + i * (CARD_H + CARD_GAP);
    const cw = W - CARD_MARGIN * 2;

    // Card bg
    ctx.fillStyle = CARD_BG;
    roundRect(ctx, cx, cy, cw, CARD_H, 8);
    ctx.fill();

    // Card border
    ctx.strokeStyle = BORDER;
    ctx.lineWidth = 1;
    roundRect(ctx, cx, cy, cw, CARD_H, 8);
    ctx.stroke();

    // Tier accent strip (left edge)
    const tierColor = (!error && flex) ? (TIER_COLOR[flex.tier] ?? GOLD) : TEXT_DIM;
    ctx.fillStyle = tierColor;
    ctx.beginPath();
    ctx.moveTo(cx + 4, cy);
    ctx.lineTo(cx, cy + 8);
    ctx.lineTo(cx, cy + CARD_H - 8);
    ctx.arcTo(cx, cy + CARD_H, cx + 8, cy + CARD_H, 8);
    ctx.lineTo(cx + 4, cy + CARD_H);
    ctx.lineTo(cx + 4, cy);
    ctx.closePath();
    // simpler: just a 4px left strip inside rounded rect
    ctx.fillStyle = tierColor;
    ctx.fillRect(cx + 1, cy + 8, 4, CARD_H - 16);

    // Player name
    ctx.fillStyle = TEXT;
    ctx.font = 'bold 14px Arial, sans-serif';
    ctx.fillText(config.gameName, cx + 18, cy + 24);

    // Tag
    ctx.fillStyle = TEXT_DIM;
    ctx.font = '11px Arial, sans-serif';
    ctx.fillText(`#${config.tagLine ?? ''}`, cx + 18, cy + 42);

    if (error || !flex) {
      ctx.fillStyle = TEXT_DIM;
      ctx.font = 'italic 12px Arial, sans-serif';
      ctx.fillText('Sin clasificar', cx + 200, cy + 36);
      return;
    }

    const rate = wr(flex.wins, flex.losses);
    const rateColor = rate >= 50 ? WIN_COL : LOSS_COL;

    // Tier + Rank + LP  (column 2)
    const col2x = cx + 210;
    ctx.fillStyle = tierColor;
    ctx.font = 'bold 14px Arial, sans-serif';
    ctx.fillText(`${cap(flex.tier)} ${flex.rank}`, col2x, cy + 24);

    ctx.fillStyle = TEXT_DIM;
    ctx.font = '11px Arial, sans-serif';
    ctx.fillText(`${flex.leaguePoints} LP`, col2x, cy + 42);

    // WR % (column 3)
    const col3x = cx + 360;
    ctx.fillStyle = rateColor;
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.fillText(`${rate}%`, col3x, cy + 26);

    // WR bar
    const barX = col3x;
    const barY = cy + 34;
    const barW = 100;
    const barH = 7;

    ctx.fillStyle = BORDER;
    roundRect(ctx, barX, barY, barW, barH, 3);
    ctx.fill();

    const winW = Math.max(4, Math.round(barW * rate / 100));
    ctx.fillStyle = rateColor;
    roundRect(ctx, barX, barY, winW, barH, 3);
    ctx.fill();

    // W / L (column 4)
    const col4x = cx + 480;
    ctx.fillStyle = WIN_COL;
    ctx.font = 'bold 13px Arial, sans-serif';
    ctx.fillText(`${flex.wins}W`, col4x, cy + 26);

    ctx.fillStyle = LOSS_COL;
    ctx.font = 'bold 13px Arial, sans-serif';
    ctx.fillText(`${flex.losses}L`, col4x, cy + 44);
  });

  return canvas.toBuffer('image/png');
}
