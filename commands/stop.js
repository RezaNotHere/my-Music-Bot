// commands/stop.js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('توقف کامل موسیقی و پاک کردن صف'),
    
    async execute(interaction) {
        const { stop } = require('../music-player.js');
        await interaction.deferReply();

        if (!interaction.member.voice.channel) {
        return interaction.reply({ embeds: [createErrorEmbed('❌ شما باید در کانال صوتی باشید!')], ephemeral: true });
        }

        try {
            await stop(interaction);
        } catch (error) {
            await interaction.editReply(`خطایی رخ داد: ${error.message}`);
        }
    },
};