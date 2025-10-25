// commands/search.js
const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, ComponentType } = require('discord.js');
const { searchMusic, createInfoEmbed, createErrorEmbed } = require('../music-player.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('search')
        .setDescription('جستجو و انتخاب آهنگ از نتایج')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('نام آهنگ برای جستجو')
                .setRequired(true)),
    
    async execute(interaction) {
        await interaction.deferReply();
        
        const query = interaction.options.getString('query');
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            return interaction.editReply({ embeds: [createErrorEmbed('❌ شما باید در کانال صوتی باشید!')] });
        }

        // جستجو برای 5 نتیجه
        const results = await searchMusic(query, 5);
        
        if (!results || results.length === 0) {
            return interaction.editReply({ embeds: [createErrorEmbed('❌ هیچ نتیجه‌ای یافت نشد!')] });
        }

        // ساخت Select Menu
        const options = results.map((song, index) => ({
            label: song.title.substring(0, 100), // محدود به 100 کاراکتر
            description: `${song.channel?.name || 'نامشخص'} • ${song.durationRaw}`,
            value: index.toString()
        }));

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('music_search_select')
            .setPlaceholder('یک آهنگ را انتخاب کنید')
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const embed = createInfoEmbed(
            results.map((song, i) => 
                `**${i + 1}.** ${song.title}\n└ ${song.channel?.name || 'نامشخص'} • ${song.durationRaw}`
            ).join('\n\n'),
            '🔍 نتایج جستجو'
        );

        const response = await interaction.editReply({ 
            embeds: [embed], 
            components: [row] 
        });

        // منتظر انتخاب کاربر
        try {
            const collector = response.createMessageComponentCollector({
                componentType: ComponentType.StringSelect,
                time: 60000 // 60 ثانیه
            });

            collector.on('collect', async i => {
                if (i.user.id !== interaction.user.id) {
                    return i.reply({ content: '❌ فقط کسی که دستور را اجرا کرده می‌تواند انتخاب کند!', ephemeral: true });
                }

                const selectedIndex = parseInt(i.values[0]);
                const selectedSong = results[selectedIndex];

                // پخش آهنگ انتخاب شده
                const { play } = require('../music-player.js');
                await i.update({ 
                    content: `✅ در حال پخش: **${selectedSong.title}**`,
                    components: [],
                    embeds: []
                });
                
                await play(interaction, selectedSong.url, voiceChannel);
                collector.stop();
            });

            collector.on('end', (collected, reason) => {
                if (reason === 'time') {
                    interaction.editReply({ 
                        content: '⏱️ زمان انتخاب به پایان رسید.',
                        components: [],
                        embeds: []
                    }).catch(console.error);
                }
            });

        } catch (error) {
            console.error('Error in search collector:', error);
            await interaction.editReply({ 
                embeds: [createErrorEmbed('خطایی در پردازش انتخاب رخ داد!')],
                components: []
            });
        }
    },
};
