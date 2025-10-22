// commands/resume.js
const { SlashCommandBuilder } = require('discord.js');
const { resume } = require('../music-player.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('ادامه پخش موسیقی (Resume).'),
    async execute(interaction) {
        if (!interaction.member.voice.channel) {
        return interaction.reply({ embeds: [createErrorEmbed('❌ شما باید در کانال صوتی باشید!')], ephemeral: true });
        }
        await interaction.deferReply();
        const output = await resume(interaction.guildId);
        await interaction.editReply(output);
    },
};