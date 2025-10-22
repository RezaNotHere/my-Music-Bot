// commands/play.js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('پخش موسیقی از یوتیوب، اسپاتیفای یا ساندکلود')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('اسم آهنگ یا لینک (یوتیوب، اسپاتیفای، ساندکلود)')
                .setRequired(true)),
    
    async execute(interaction) {
        // این فایل را در مرحله بعد خواهیم ساخت
        const { play } = require('../music-player.js');
        
        // 1. اول پاسخ را به تعویق می‌اندازیم
        await interaction.deferReply({ ephemeral: false }); // ephemeral: false چون همه باید ببینند

        // 2. گرفتن اطلاعات
        const query = interaction.options.getString('query');
        const voiceChannel = interaction.member.voice.channel; // کانال صوتی کاربر

        // 3. چک کردن اینکه آیا کاربر در کانال صوتی است؟
        if (!voiceChannel) {
            return interaction.reply({ embeds: [createErrorEmbed('❌ شما باید در کانال صوتی باشید!')], ephemeral: true });
        }

        try {
            // 4. ارسال اطلاعات به مغز ربات (music-player.js)
            await play(interaction, query, voiceChannel);
        } catch (error) {
            console.error(error);
            await interaction.editReply(`خطایی رخ داد: ${error.message}`);
        }
    },
};