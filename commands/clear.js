// commands/clear.js
const { SlashCommandBuilder } = require('discord.js');
const { clearQueue } = require('../music-player.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('پاک کردن تمام صف موسیقی (آهنگ فعلی همچنان پخش می‌شود)'),
    
    async execute(interaction) {
        await interaction.deferReply();
        const embed = await clearQueue(interaction.guildId);
        await interaction.editReply({ embeds: [embed] });
    },
};
