import { EmbedBuilder } from 'discord.js';

const TIER_EMOJI = {
  IRON: '⬛',
  BRONZE: '🟫',
  SILVER: '🪨',
  GOLD: '🥇',
  PLATINUM: '🟩',
  EMERALD: '💚',
  DIAMOND: '💎',
  MASTER: '🔮',
  GRANDMASTER: '🔴',
  CHALLENGER: '⭐',
};

function winRate(wins, losses) {
  const total = wins + losses;
  return total === 0 ? 0 : Math.round((wins / total) * 100);
}

export function buildStatsEmbed(players) {
  const embed = new EmbedBuilder()
    .setTitle('📊 Dorjav Team · Ranked Flex 5v5')
    .setColor(0xC89B3C)
    .setTimestamp()
    .setFooter({ text: 'EUW · Temporada actual' });

  for (const { config, flex, error } of players) {
    const name = `${config.gameName}`;

    if (error) {
      embed.addFields({ name, value: '❌ Sin datos', inline: true });
      continue;
    }

    if (!flex) {
      embed.addFields({ name, value: '— Sin clasificar', inline: true });
      continue;
    }

    const wr = winRate(flex.wins, flex.losses);
    const emoji = TIER_EMOJI[flex.tier] ?? '•';
    const wrIcon = wr >= 50 ? '🟢' : '🔴';

    embed.addFields({
      name,
      value: [
        `${emoji} **${flex.tier} ${flex.rank}** · ${flex.leaguePoints} LP`,
        `${wrIcon} ${wr}% WR · ${flex.wins}V / ${flex.losses}D`,
      ].join('\n'),
      inline: true,
    });
  }

  return embed;
}
