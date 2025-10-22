// commands/nowplaying.js
const { SlashCommandBuilder } = require('discord.js');
const { nowPlaying } = require('../music-player.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('نمایش اطلاعات آهنگ در حال پخش.'),
    async execute(interaction) {
        await interaction.deferReply();
        const embed = await nowPlaying(interaction.guildId);
        await interaction.editReply({ embeds: [embed] });
    },
};