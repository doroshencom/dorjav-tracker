// Run once from discord-bot/: node gen-og.js
// Generates ../public/og-image.png (1200×630)
import { createCanvas } from '@napi-rs/canvas';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '../public/og-image.png');

const W = 1200;
const H = 630;

const BG       = '#060d1a';
const BG_CARD  = '#0d1c35';
const BORDER   = '#1a2f50';
const GOLD     = '#c89b3c';
const GOLD_DIM = '#8a6b28';
const TEXT     = '#d8cfc4';
const TEXT_DIM = '#7a8aaa';
const BLUE     = '#0bc4e6';

const PLAYERS = ['JoseBretøn', 'usgo98', 'Ferrari poppy', 'zinedine ziIean', 'Javizht'];

const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

// ── Background ──────────────────────────────────────────────────────────────
ctx.fillStyle = BG;
ctx.fillRect(0, 0, W, H);

// Subtle dark panel in the centre
ctx.fillStyle = BG_CARD;
ctx.fillRect(60, 60, W - 120, H - 120);

// Panel border
ctx.strokeStyle = BORDER;
ctx.lineWidth = 1.5;
ctx.strokeRect(60, 60, W - 120, H - 120);

// ── Gold accent lines ────────────────────────────────────────────────────────
ctx.fillStyle = GOLD;
ctx.fillRect(60, 60, W - 120, 4);
ctx.fillRect(60, H - 64, W - 120, 4);

// ── Title ────────────────────────────────────────────────────────────────────
ctx.fillStyle = GOLD;
ctx.font = 'bold 88px Arial, sans-serif';
ctx.textAlign = 'center';
ctx.fillText('ELOTRAIN STATS', W / 2, 240);

// ── Subtitle ─────────────────────────────────────────────────────────────────
ctx.fillStyle = TEXT_DIM;
ctx.font = '32px Arial, sans-serif';
ctx.fillText('Ranked Flex 5v5  ·  EUW', W / 2, 300);

// ── Thin divider ─────────────────────────────────────────────────────────────
ctx.strokeStyle = BORDER;
ctx.lineWidth = 1;
ctx.beginPath();
ctx.moveTo(240, 336);
ctx.lineTo(W - 240, 336);
ctx.stroke();

// ── Player names ─────────────────────────────────────────────────────────────
ctx.fillStyle = TEXT;
ctx.font = '26px Arial, sans-serif';
ctx.fillText(PLAYERS.join('  ·  '), W / 2, 390);

// ── URL ───────────────────────────────────────────────────────────────────────
ctx.fillStyle = TEXT_DIM;
ctx.font = '22px Arial, sans-serif';
ctx.fillText('shenko.es', W / 2, 508);

// ── Blue dot accent ───────────────────────────────────────────────────────────
ctx.fillStyle = BLUE;
ctx.beginPath();
ctx.arc(W / 2, 460, 4, 0, Math.PI * 2);
ctx.fill();

writeFileSync(OUT, canvas.toBuffer('image/png'));
console.log('✅ og-image.png written to public/');
