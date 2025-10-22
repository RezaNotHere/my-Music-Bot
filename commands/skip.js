// commands/skip.js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('رد کردن آهنگ فعلی'),
    
    async execute(interaction) {
        const { skip } = require('../music-player.js');
        await interaction.deferReply();
        
        if (!interaction.member.voice.channel) {
            return interaction.reply({ embeds: [createErrorEmbed('❌ شما باید در کانال صوتی باشید!')], ephemeral: true });
        }

        try {
            await skip(interaction);
        } catch (error) {
            await interaction.editReply(`خطایی رخ داد: ${error.message}`);
        }
    },
};