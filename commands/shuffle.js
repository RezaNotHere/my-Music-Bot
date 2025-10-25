// commands/shuffle.js
const { SlashCommandBuilder } = require('discord.js');
const { shuffle } = require('../music-player.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shuffle')
        .setDescription('پخش تصادفی صف موسیقی (مخلوط کردن آهنگ‌ها)'),
    
    async execute(interaction) {
        await interaction.deferReply();
        const embed = await shuffle(interaction.guildId);
        await interaction.editReply({ embeds: [embed] });
    },
};
