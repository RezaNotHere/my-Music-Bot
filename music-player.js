// music-player.js
const { 
    joinVoiceChannel, 
    createAudioPlayer, 
    createAudioResource, 
    AudioPlayerStatus
} = require('@discordjs/voice');
const { EmbedBuilder, Colors } = require('discord.js');
const play = require('play-dl');

const serverQueues = new Map();

//================================================================
// ⭐️⭐️ توابع کمکی جدید برای ساخت امبد ⭐️⭐️
//================================================================

/**
 * @param {string} message The error message
 * @returns {EmbedBuilder} A red embed
 */
function createErrorEmbed(message) {
    return new EmbedBuilder()
        .setColor(Colors.Red)
        .setTitle('❌ خطا')
        .setDescription(message);
}

/**
 * @param {string} message The success message
 * @returns {EmbedBuilder} A green embed
 */
function createSuccessEmbed(message) {
    return new EmbedBuilder()
        .setColor(Colors.Green)
        .setTitle('✅ موفقیت')
        .setDescription(message);
}

/**
 * @param {string} message The info message
 * @param {string} [title='ℹ️ اطلاع‌رسانی'] Optional title
 * @returns {EmbedBuilder} A blue embed
 */
function createInfoEmbed(message, title = 'ℹ️ اطلاع‌رسانی') {
    return new EmbedBuilder()
        .setColor(Colors.Blue)
        .setTitle(title)
        .setDescription(message);
}

//================================================================
// تابع اصلی: /play
//================================================================
async function playCommand(interaction, query, voiceChannel) {
    let queue = serverQueues.get(interaction.guildId);

    // --- ۱. جستجو و دریافت اطلاعات آهنگ ---
    let songInfo = null;
    let isPlaylist = false;

    try {
        let validation = await play.validate(query);

        if (validation === 'yt_video' || validation === 'sp_track' || validation === 'so_track') {
            songInfo = (await play.search(query, { limit: 1 }))[0];
        } else if (validation === 'yt_playlist' || validation === 'sp_playlist' || validation === 'so_playlist') {
            const playlist = await play.playlist_info(query, { incomplete: true });
            const videos = await playlist.all_videos();
            songInfo = videos;
            isPlaylist = true;
        } else {
            const searchResults = await play.search(query, { limit: 1 });
            if (searchResults.length === 0) {
                return interaction.editReply({ embeds: [createErrorEmbed('آهنگی با این مشخصات پیدا نشد.')] });
            }
            songInfo = searchResults[0];
        }
    } catch (e) {
        console.error(e);
        return interaction.editReply({ embeds: [createErrorEmbed(`خطا در جستجوی آهنگ: ${e.message}`)] });
    }

    // --- ۲. ساخت یا به‌روزرسانی صف (Queue) ---
    if (!queue) {
        queue = {
            voiceChannel: voiceChannel,
            connection: null,
            player: createAudioPlayer(),
            songs: [],
            textChannel: interaction.channel,
            isPlaying: false,
            nowPlaying: null,
            loopMode: 'off'
        };
        serverQueues.set(interaction.guildId, queue);

        if (isPlaylist) {
            queue.songs.push(...songInfo);
        } else {
            queue.songs.push(songInfo);
        }

        // --- ۳. اتصال به کانال صوتی ---
        try {
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: interaction.guildId,
                adapterCreator: interaction.guild.voiceAdapterCreator,
            });
            queue.connection = connection;
            setupPlayerEvents(interaction.guildId, queue);
            await playNextSong(interaction.guildId);
            
            const embed = new EmbedBuilder()
                .setColor(Colors.Green)
                .setTitle(isPlaylist ? '🎶 پلی‌لیست به صف اضافه شد' : '🎵 آهنگ به صف اضافه شد')
                .setDescription(isPlaylist ? `${songInfo.length} آهنگ از پلی‌لیست` : `[${songInfo.title}](${songInfo.url})`)
                .setThumbnail(isPlaylist ? null : songInfo.thumbnails[0]?.url)
                .setFooter({ text: `درخواست توسط ${interaction.user.username}` });
            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            serverQueues.delete(interaction.guildId);
            return interaction.editReply({ embeds: [createErrorEmbed('خطا در اتصال به کانال صوتی.')] });
        }

    } else {
        // اضافه کردن آهنگ به صف موجود
        if (isPlaylist) {
            queue.songs.push(...songInfo);
        } else {
            queue.songs.push(songInfo);
        }
        
        if (!queue.isPlaying) {
            await playNextSong(interaction.guildId);
        }

        const embed = new EmbedBuilder()
            .setColor(Colors.Blue)
            .setTitle(isPlaylist ? '🎶 پلی‌لیست به صف اضافه شد' : '🎵 آهنگ به صف اضافه شد')
            .setDescription(isPlaylist ? `${songInfo.length} آهنگ` : `[${songInfo.title}](${songInfo.url})`)
            .setThumbnail(isPlaylist ? null : songInfo.thumbnails[0]?.url);
        await interaction.editReply({ embeds: [embed] });
    }
}

//================================================================
// تابع مدیریت رویدادهای پلیر
//================================================================
function setupPlayerEvents(guildId, queue) {
    queue.player.on(AudioPlayerStatus.Idle, () => {
        const finishedSong = queue.nowPlaying;
        queue.isPlaying = false;
        queue.nowPlaying = null;

        if (queue.loopMode === 'song' && finishedSong) {
            queue.songs.unshift(finishedSong);
        } else if (queue.loopMode === 'queue' && finishedSong) {
            queue.songs.push(finishedSong);
        }
        
        if (queue.songs.length > 0) {
            playNextSong(guildId);
        } else if (queue.loopMode === 'off') {
            queue.textChannel.send({ embeds: [createInfoEmbed('✅ صف موسیقی تمام شد. کانال را ترک می‌کنم.')] });
            setTimeout(() => {
                if (queue.connection) queue.connection.disconnect();
                serverQueues.delete(guildId);
            }, 1000);
        }
    });

    queue.player.on('error', (error) => {
        console.error('Player Error:', error.message);
        queue.textChannel.send({ embeds: [createErrorEmbed(`خطا در پخش: ${error.message}`)] });
        queue.isPlaying = false;
        playNextSong(guildId);
    });
}

//================================================================
// تابع کمکی: پخش آهنگ بعدی
//================================================================
async function playNextSong(guildId) {
    const queue = serverQueues.get(guildId);
    if (!queue) return;

    if (queue.isPlaying || queue.songs.length === 0) {
        return;
    }

    queue.isPlaying = true;
    const song = queue.songs.shift();
    queue.nowPlaying = song;

    if (!song) {
        queue.isPlaying = false;
        return;
    }

    try {
        const stream = await play.stream(song.url);
        const resource = createAudioResource(stream.stream, {
            inputType: stream.type
        });

        queue.player.play(resource);
        queue.connection.subscribe(queue.player);

        const embed = new EmbedBuilder()
            .setColor(Colors.Aqua)
            .setTitle('▶️ در حال پخش')
            .setDescription(`[${song.title}](${song.url})`)
            .setThumbnail(song.thumbnails[0]?.url)
            .addFields(
                { name: 'خواننده', value: song.channel?.name || 'N/A', inline: true },
                { name: 'مدت زمان', value: song.durationRaw, inline: true }
            );
        await queue.textChannel.send({ embeds: [embed] });

    } catch (error) {
        console.error(`Error streaming song: ${error.message}`);
        await queue.textChannel.send({ embeds: [createErrorEmbed(`خطا در استریم آهنگ: ${song.title}`)] });
        queue.isPlaying = false;
        queue.nowPlaying = null;
        playNextSong(guildId);
    }
}

//================================================================
// توابع دستورات (آپدیت شده برای برگرداندن امبد)
//================================================================

async function skipCommand(interaction) {
    const queue = serverQueues.get(interaction.guildId);
    if (!queue) return interaction.editReply({ embeds: [createErrorEmbed('هیچ آهنگی در حال پخش نیست.')] });
    if (!queue.nowPlaying) return interaction.editReply({ embeds: [createErrorEmbed('آهنگی در حال حاضر پخش نمی‌شود.')] });

    queue.player.stop();
    await interaction.editReply({ embeds: [createSuccessEmbed('⏩ آهنگ رد شد!')] });
}

async function stopCommand(interaction) {
    const queue = serverQueues.get(interaction.guildId);
    if (!queue) return interaction.editReply({ embeds: [createErrorEmbed('هیچ آهنگی در حال پخش نیست.')] });

    queue.songs = [];
    queue.loopMode = 'off';
    queue.player.stop();
    
    await interaction.editReply({ embeds: [createSuccessEmbed('⏹ پخش موسیقی متوقف شد و صف پاک شد.')] });
}

async function pauseCommand(guildId) {
    const queue = serverQueues.get(guildId);
    if (!queue || !queue.isPlaying) return createErrorEmbed('آهنگی در حال پخش نیست که متوقف شود.');
    
    const success = queue.player.pause();
    return success ? createSuccessEmbed('⏸ موسیقی متوقف شد (Paused).') : createErrorEmbed('متوقف کردن موسیقی ناموفق بود.');
}

async function resumeCommand(guildId) {
    const queue = serverQueues.get(guildId);
    if (!queue) return createErrorEmbed('صفی برای ادامه وجود ندارد.');
    if (queue.isPlaying) return createInfoEmbed('▶️ موسیقی هم‌اکنون در حال پخش است!');

    const success = queue.player.unpause();
    return success ? createSuccessEmbed('▶️ پخش موسیقی ادامه می‌یابد (Resumed).') : createErrorEmbed('ادامه پخش ناموفق بود.');
}

async function loopCommand(guildId, mode) {
    const queue = serverQueues.get(guildId);
    if (!queue) return createErrorEmbed('صفی برای تکرار وجود ندارد.');

    queue.loopMode = mode;
    let icon = '❌';
    if (mode === 'song') icon = '🔂';
    if (mode === 'queue') icon = '🔁';

    return createInfoEmbed(`${icon} حالت تکرار به **${mode}** تغییر یافت.`, '🔁 تکرار');
}

async function nowPlayingCommand(guildId) {
    const queue = serverQueues.get(guildId);
    if (!queue || !queue.nowPlaying) {
        return createErrorEmbed('هیچ آهنگی در حال پخش نیست.');
    }
    
    const song = queue.nowPlaying;
    const embed = new EmbedBuilder()
        .setColor(Colors.Aqua)
        .setTitle('▶️ در حال پخش')
        .setDescription(`[${song.title}](${song.url})`)
        .setThumbnail(song.thumbnails[0]?.url)
        .addFields(
            { name: 'خواننده', value: song.channel?.name || 'N/A', inline: true },
            { name: 'مدت زمان', value: song.durationRaw, inline: true }
        );
    return embed;
}

async function getQueueCommand(guildId) {
    const queue = serverQueues.get(guildId);
    if (!queue) {
        return createErrorEmbed('صف خالی است.');
    }

    const embed = new EmbedBuilder()
        .setColor(Colors.Blue)
        .setTitle('🎶 صف موسیقی');

    if (queue.nowPlaying) {
        embed.addFields({ name: '▶️ در حال پخش', value: `[${queue.nowPlaying.title}](${queue.nowPlaying.url}) - \`${queue.nowPlaying.durationRaw}\`` });
    }

    const nextSongs = queue.songs.slice(0, 10).map((song, index) => {
        return `**${index + 1}.** [${song.title}](${song.url}) - \`${song.durationRaw}\``;
    }).join('\n');

    if (nextSongs) {
        embed.setDescription(nextSongs);
    } else if (!queue.nowPlaying) {
        embed.setDescription('صف خالی است.');
    }
    
    embed.setFooter({ text: `مجموع: ${queue.songs.length} آهنگ در صف | حالت تکرار: ${queue.loopMode}` });
    return embed;
}

// Export کردن همه توابع
module.exports = {
    play: playCommand,
    skip: skipCommand,
    stop: stopCommand,
    pause: pauseCommand,
    resume: resumeCommand,
    loop: loopCommand,
    nowPlaying: nowPlayingCommand,
    getQueue: getQueueCommand,
    serverQueues,
    // ⭐️ توابع کمکی را هم اکسپورت می‌کنیم
    createErrorEmbed,
    createSuccessEmbed,
    createInfoEmbed
};