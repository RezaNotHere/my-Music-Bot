// commands/controls.js
const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { pause, resume, skip, stop, serverQueues, createErrorEmbed, createInfoEmbed } = require('../music-player.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('controls')
        .setDescription('نمایش پنل کنترل موسیقی با دکمه‌های تعاملی'),
    
    async execute(interaction) {
        await interaction.deferReply();

        const queue = serverQueues.get(interaction.guildId);
        if (!queue || !queue.nowPlaying) {
            return interaction.editReply({ embeds: [createErrorEmbed('❌ هیچ آهنگی در حال پخش نیست!')] });
        }

        // ساخت دکمه‌های کنترلی
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('music_pause')
                    .setLabel('⏸️ Pause')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('music_resume')
                    .setLabel('▶️ Resume')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('music_skip')
                    .setLabel('⏭️ Skip')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('music_stop')
                    .setLabel('⏹️ Stop')
                    .setStyle(ButtonStyle.Danger)
            );

        const embed = createInfoEmbed(
            `**در حال پخش:** ${queue.nowPlaying.title}\n` +
            `**خواننده:** ${queue.nowPlaying.channel?.name || 'نامشخص'}\n` +
            `**مدت زمان:** ${queue.nowPlaying.durationRaw}\n\n` +
            `از دکمه‌های زیر برای کنترل پخش استفاده کنید:`,
            '🎮 پنل کنترل موسیقی'
        );

        const response = await interaction.editReply({ 
            embeds: [embed], 
            components: [row] 
        });

        // Collector برای دکمه‌ها
        const collector = response.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 300000 // 5 دقیقه
        });

        collector.on('collect', async i => {
            // چک کردن اینکه آیا کاربر در voice channel است
            if (!i.member.voice.channel) {
                return i.reply({ content: '❌ شما باید در کانال صوتی باشید!', ephemeral: true });
            }

            let resultEmbed;
            
            switch(i.customId) {
                case 'music_pause':
                    resultEmbed = await pause(i.guildId);
                    break;
                case 'music_resume':
                    resultEmbed = await resume(i.guildId);
                    break;
                case 'music_skip':
                    resultEmbed = createInfoEmbed('⏩ آهنگ رد شد!');
                    const { skip: skipFunc } = require('../music-player.js');
                    await skipFunc(i);
                    break;
                case 'music_stop':
                    resultEmbed = createInfoEmbed('⏹ پخش موسیقی متوقف شد!');
                    const { stop: stopFunc } = require('../music-player.js');
                    await stopFunc(i);
                    collector.stop();
                    break;
            }

            if (resultEmbed) {
                await i.reply({ embeds: [resultEmbed], ephemeral: true });
            }
        });

        collector.on('end', () => {
            // غیرفعال کردن دکمه‌ها بعد از اتمام زمان
            const disabledRow = new ActionRowBuilder()
                .addComponents(
                    row.components.map(button => 
                        ButtonBuilder.from(button).setDisabled(true)
                    )
                );
            
            interaction.editReply({ components: [disabledRow] }).catch(console.error);
        });
    },
};
