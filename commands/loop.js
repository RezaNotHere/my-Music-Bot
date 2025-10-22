// commands/loop.js
const { SlashCommandBuilder } = require('discord.js');
const { loop } = require('../music-player.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('loop')
        .setDescription('تکرار آهنگ یا صف.')
        .addStringOption(option =>
            option.setName('mode')
                .setDescription('انتخاب حالت تکرار')
                .setRequired(true)
                .addChoices(
                    { name: 'Off (خاموش)', value: 'off' },
                    { name: 'Song (تکرار آهنگ فعلی)', value: 'song' },
                    { name: 'Queue (تکرار کل صف)', value: 'queue' }
                )),
    async execute(interaction) {
        await interaction.deferReply();
        const mode = interaction.options.getString('mode');
        const output = await loop(interaction.guildId, mode);
        await interaction.editReply(output);
    },
};