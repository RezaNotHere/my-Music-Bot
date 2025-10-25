// commands/volume.js
const { SlashCommandBuilder } = require('discord.js');
const { setVolume } = require('../music-player.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('volume')
        .setDescription('تنظیم صدای پخش موسیقی')
        .addIntegerOption(option =>
            option.setName('level')
                .setDescription('سطح صدا (0-100)')
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(100)),
    
    async execute(interaction) {
        await interaction.deferReply();
        const level = interaction.options.getInteger('level');
        const embed = await setVolume(interaction.guildId, level);
        await interaction.editReply({ embeds: [embed] });
    },
};
