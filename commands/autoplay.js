// commands/autoplay.js
const { SlashCommandBuilder } = require('discord.js');
const { toggleAutoplay } = require('../music-player.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('autoplay')
        .setDescription('فعال/غیرفعال کردن پخش خودکار (Autoplay)'),
    
    async execute(interaction) {
        await interaction.deferReply();
        const embed = await toggleAutoplay(interaction.guildId);
        await interaction.editReply({ embeds: [embed] });
    },
};
