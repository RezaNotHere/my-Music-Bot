// commands/queue.js
const { SlashCommandBuilder } = require('discord.js');
const { getQueue } = require('../music-player.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('نمایش صف (لیست) آهنگ‌های بعدی.'),
    async execute(interaction) {
        await interaction.deferReply();
        const embed = await getQueue(interaction.guildId);
        await interaction.editReply({ embeds: [embed] });
    },
};