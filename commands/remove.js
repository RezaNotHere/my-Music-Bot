// commands/remove.js
const { SlashCommandBuilder } = require('discord.js');
const { removeSong } = require('../music-player.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('حذف یک آهنگ خاص از صف')
        .addIntegerOption(option =>
            option.setName('position')
                .setDescription('شماره آهنگ در صف (برای دیدن صف از /queue استفاده کنید)')
                .setRequired(true)
                .setMinValue(1)),
    
    async execute(interaction) {
        await interaction.deferReply();
        const position = interaction.options.getInteger('position');
        const embed = await removeSong(interaction.guildId, position);
        await interaction.editReply({ embeds: [embed] });
    },
};
