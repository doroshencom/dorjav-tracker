import { Client, GatewayIntentBits, AttachmentBuilder } from 'discord.js';
import 'dotenv/config';
import { fetchAllPlayers } from './riot.js';
import { renderStatsImage } from './render.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', () => {
  console.log(`✅ Bot online: ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'stats') {
    await interaction.deferReply();
    try {
      const players = await fetchAllPlayers();
      const imageBuffer = await renderStatsImage(players);
      const attachment = new AttachmentBuilder(imageBuffer, { name: 'stats.png' });
      await interaction.editReply({ files: [attachment] });
    } catch (err) {
      console.error(err);
      await interaction.editReply('❌ Error al obtener los datos. Inténtalo en unos segundos.');
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
