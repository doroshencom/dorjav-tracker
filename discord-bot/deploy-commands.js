import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import 'dotenv/config';

const commands = [
  new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Muestra las stats de Ranked Flex del equipo')
    .toJSON(),
];

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

console.log('Registrando comandos…');
await rest.put(
  Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
  { body: commands },
);
console.log('✅ Comandos registrados correctamente.');
