// commands/pause.js
const { SlashCommandBuilder } = require('discord.js');
// ⭐️ وارد کردن توابع کمکی
const { pause, createErrorEmbed } = require('../music-player.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('موسیقی در حال پخش را متوقف می‌کند (Pause).'),
    async execute(interaction) {
        if (!interaction.member.voice.channel) {
            // ⭐️ استفاده از امبد خطا
          return interaction.reply({ embeds: [createErrorEmbed('❌ شما باید در کانال صوتی باشید!')], ephemeral: true });
        }
        await interaction.deferReply();
        // ⭐️ تابع pause حالا یک امبد برمی‌گرداند
        const embed = await pause(interaction.guildId);
        await interaction.editReply({ embeds: [embed] });
    },
};