// music-player.js
const { 
    joinVoiceChannel, 
    createAudioPlayer, 
    createAudioResource, 
    getVoiceConnection,
    AudioPlayerStatus
} = require('@discordjs/voice');
const { EmbedBuilder, Colors } = require('discord.js');
const play = require('play-dl');

const serverQueues = new Map();

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
// تابع کمکی: جستجوی اجباری در SoundCloud
//================================================================
async function searchSoundCloud(query) {
    try {
        const results = await play.search(query, {
            source: { soundcloud: 'tracks' },
            limit: 1
        });
        if (results.length > 0) return results[0];
        else return null;
    } catch (e) {
        console.error(`Error searching SoundCloud: ${e.message}`);
        return null;
    }
}


//================================================================
// تابع اصلی: /play (⭐️ نسخه نهایی با اولویت اسپاتیفای ⭐️)
//================================================================
async function playCommand(interaction, query, voiceChannel) {
    let queue = serverQueues.get(interaction.guildId);
    let connection = getVoiceConnection(interaction.guildId);

    // --- ۱. گرفتن اطلاعات آهنگ ---
    let songsToAdd = [];
    let isPlaylist = false;

    try {
        let validation = await play.validate(query);

        if (validation === 'so_track') {
            const song = await play.soundcloud(query);
            if (song) songsToAdd.push(song); // اطمینان از اینکه نتیجه معتبر است
        } else if (validation === 'so_playlist') {
            const playlist = await play.playlist_info(query, { incomplete: true });
            const videos = await playlist.all_videos();
            if (videos && videos.length > 0) songsToAdd.push(...videos);
            isPlaylist = true;
        } else if (validation === 'yt_video') { // هنوز یوتیوب رو داریم
            return interaction.editReply({ embeds: [createErrorEmbed('این بات فقط از SoundCloud پشتیبانی می‌کند. لطفاً لینک یا نام آهنگ SoundCloud ارسال کنید.')] });
        } else if (validation === 'yt_playlist') { // هنوز یوتیوب رو داریم
            return interaction.editReply({ embeds: [createErrorEmbed('این بات فقط از SoundCloud پشتیبانی می‌کند. لطفاً لینک پلی‌لیست SoundCloud ارسال کنید.')] });
        } else { // جستجوی متنی
            const sc_song = await searchSoundCloud(query);
            if (sc_song) {
                 songsToAdd.push(sc_song);
            } else {
                 // ⭐ اگر اینجا چیزی پیدا نشد، مستقیم خارج شو ⭐
                 return interaction.editReply({ embeds: [createErrorEmbed('آهنگی با این مشخصات در SoundCloud پیدا نشد.')] });
            }
        }
    } catch (e) {
        console.error("!!! خطا در حین جستجوی آهنگ:", e);
        // ⭐ اگر در حین جستجو خطا رخ داد، خارج شو ⭐
        return interaction.editReply({ embeds: [createErrorEmbed(`خطا در پردازش درخواست: ${e.message}`)] });
    }

    // --- ۲. ⭐ چک نهایی قبل از ادامه ⭐ ---
    if (songsToAdd.length === 0) {
        // اگر با وجود همه چیز، songsToAdd هنوز خالی بود، خارج شو
        console.error("خطای منطقی: songsToAdd بعد از جستجو خالی ماند.");
        return interaction.editReply({ embeds: [createErrorEmbed('نتوانستم هیچ آهنگی برای اضافه کردن پیدا کنم.')] });
    }
    // حالا مطمئنیم که songsToAdd حداقل یک آهنگ دارد
    const displaySong = songsToAdd[0]; // تعریف displaySong اینجا امن است

    // --- ۳. ساخت یا به‌روزرسانی صف و اتصال ---
    if (!queue) {
        console.log("--- ساخت صف جدید ---");
        queue = {
            voiceChannel: voiceChannel, connection: null, player: createAudioPlayer(),
            songs: [], textChannel: interaction.channel, isPlaying: false,
            nowPlaying: null, loopMode: 'off', autoplay: false, volume: 1.0
        };
        serverQueues.set(interaction.guildId, queue);
        queue.songs.push(...songsToAdd); // اضافه کردن آهنگ(ها)

        try {
            if (!connection) {
                console.log("در حال ساخت اتصال جدید...");
                connection = joinVoiceChannel({ /* ... */
                    channelId: voiceChannel.id, guildId: interaction.guildId, adapterCreator: interaction.guild.voiceAdapterCreator,
                });
            } else {
                 console.log("استفاده از اتصال موجود.");
            }
            queue.connection = connection;
            console.log("اتصال برقرار شد.");
            console.log("تنظیم رویدادهای پلیر...");
            setupPlayerEvents(interaction.guildId, queue);
            console.log("رویدادهای پلیر تنظیم شد.");

            // ⭐ playNextSong رو *بعد* از ساخت امبد صدا می‌زنیم ⭐
            const embed = new EmbedBuilder()
                .setColor(Colors.Green)
                .setTitle(isPlaylist ? '🎶 پلی‌لیست به صف اضافه شد' : '🎵 آهنگ به صف اضافه شد')
                .setDescription(isPlaylist ? `${songsToAdd.length} آهنگ` : `[${displaySong.title || displaySong.name || 'آهنگ ناشناخته'}](${displaySong.url || '#'})`)
                .setThumbnail(isPlaylist ? null : (displaySong.thumbnail || displaySong.thumbnails?.[0]?.url || null))
                .setFooter({ text: `درخواست توسط ${interaction.user.username}` });

            // ⭐ اول پیام رو می‌فرستیم ⭐
            await interaction.editReply({ embeds: [embed] });
            console.log("صف جدید ساخته شد و پیام ارسال شد.");

            // ⭐ حالا پخش رو شروع می‌کنیم ⭐
            console.log("فراخوانی playNextSong...");
            await playNextSong(interaction.guildId);
            console.log("playNextSong فراخوانی شد.");


        } catch (error) {
             console.error("!!! خطا در حین ساخت صف جدید یا اتصال:", error); // فقط خطای اتصال یا تنظیم رویداد
             if (queue.connection) queue.connection.destroy();
             serverQueues.delete(interaction.guildId);
             return interaction.editReply({ embeds: [createErrorEmbed(`خطا در اتصال به کانال صوتی: ${error.message}`)] });
        }

    } else { // اضافه کردن به صف موجود
        console.log("--- اضافه کردن به صف موجود ---");
        queue.songs.push(...songsToAdd);

        const embed = new EmbedBuilder()
           .setColor(Colors.Blue)
           .setTitle(isPlaylist ? '🎶 پلی‌لیست به صف اضافه شد' : '🎵 آهنگ به صف اضافه شد')
           .setDescription(isPlaylist ? `${songsToAdd.length} آهنگ` : `[${displaySong.title || displaySong.name || 'آهنگ ناشناخته'}](${displaySong.url || '#'})`)
           .setThumbnail(isPlaylist ? null : (displaySong.thumbnail || displaySong.thumbnails?.[0]?.url || null));
        await interaction.editReply({ embeds: [embed] });
        console.log("آهنگ(ها) به صف موجود اضافه شد.");
    }
}


// ... (بقیه توابع مثل setupPlayerEvents, playNextSong, skip, stop و ... بدون تغییر باقی می‌مانند) ...


//================================================================
// تابع مدیریت رویدادهای پلیر
//================================================================
function setupPlayerEvents(guildId, queue) {
    // ... (داخل تابع setupPlayerEvents) ...

    queue.player.on(AudioPlayerStatus.Idle, async () => { // ⭐️ async رو اضافه کردیم
        const finishedSong = queue.nowPlaying;
        queue.isPlaying = false;
        queue.nowPlaying = null;

        // مدیریت Loop مثل قبل
        if (queue.loopMode === 'song' && finishedSong) {
            queue.songs.unshift(finishedSong);
        } else if (queue.loopMode === 'queue' && finishedSong) {
            queue.songs.push(finishedSong);
        }

        // ⭐⭐⭐ منطق Autoplay (بهبود یافته - پشتیبانی از SoundCloud و YouTube) ⭐⭐⭐
        if (queue.songs.length === 0 && queue.autoplay && finishedSong) {
            try {
                await queue.textChannel.send({ embeds: [createInfoEmbed('✅ صف خالی شد. در حال جستجوی آهنگ بعدی (Autoplay)...')] });

                let nextSong = null;
                
                // چک کردن نوع آهنگ (یوتیوب یا ساندکلود)
                if (false && (finishedSong.url.includes('youtube.com') || finishedSong.url.includes('youtu.be'))) {
                    // Autoplay برای YouTube
                    const videoInfo = await play.video_info(finishedSong.url);
                    const relatedVideo = videoInfo.related_videos?.[0];
                    
                    if (relatedVideo) {
                        const nextSongInfo = await play.video_info(`https://www.youtube.com/watch?v=${relatedVideo.id}`);
                        if (nextSongInfo) nextSong = nextSongInfo.video_details;
                    }
                } else {
                    // Autoplay برای SoundCloud - جستجو بر اساس نام آهنگ
                    const searchQuery = finishedSong.channel?.name || finishedSong.title?.split('-')[0];
                    const results = await play.search(searchQuery, {
                        source: { soundcloud: 'tracks' },
                        limit: 3
                    });
                    
                    // انتخاب آهنگی غیر از آهنگ فعلی
                    for (const result of results) {
                        if (result.url !== finishedSong.url) {
                            nextSong = result;
                            break;
                        }
                    }
                }

                if (nextSong) {
                    queue.songs.push(nextSong);
                    await queue.textChannel.send({ 
                        embeds: [createInfoEmbed(
                            `[${nextSong.title}](${nextSong.url})`,
                            '✨ Autoplay: پخش خودکار'
                        )] 
                    });
                    playNextSong(guildId);
                    return;
                } else {
                    await queue.textChannel.send({ embeds: [createInfoEmbed('🔍 آهنگ مرتبطی برای Autoplay پیدا نشد.')] });
                }

            } catch (error) {
                console.error("Autoplay Error:", error);
                await queue.textChannel.send({ embeds: [createErrorEmbed('خطایی در اجرای Autoplay رخ داد.')] });
            }
        }
        // ⭐⭐⭐ پایان منطق Autoplay ⭐⭐⭐

        // اگر Autoplay فعال نبود یا شکست خورد یا آهنگی در صف بود
        if (queue.songs.length > 0) {
            playNextSong(guildId);
        } else if (queue.loopMode === 'off') {
            queue.textChannel.send({ embeds: [createInfoEmbed('✅ صف موسیقی تمام شد. منتظر دستور بعدی...')] });
            serverQueues.delete(guildId);
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
        // اضافه Timeout برای جلوگیری از hang شدن
        const STREAM_TIMEOUT = 30000; // 30 ثانیه
        
        const streamPromise = play.stream(song.url);
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Stream timeout after 30s')), STREAM_TIMEOUT)
        );
        
        const stream = await Promise.race([streamPromise, timeoutPromise]);
        
        const resource = createAudioResource(stream.stream, {
            inputType: stream.type,
            inlineVolume: true
        });
        
        // اعمال volume
        if (resource.volume) {
            resource.volume.setVolume(queue.volume || 1.0);
        }

        queue.player.play(resource);
        queue.connection.subscribe(queue.player);

        const embed = new EmbedBuilder()
            .setColor(Colors.Aqua)
            .setTitle('▶️ در حال پخش')
            .setDescription(`[${song.title}](${song.url})`)
            .setThumbnail(song.thumbnails?.[0]?.url)
            .addFields(
                { name: 'خواننده', value: song.channel?.name || 'N/A', inline: true },
                { name: 'مدت زمان', value: song.durationRaw, inline: true }
            );
        await queue.textChannel.send({ embeds: [embed] });

    } catch (error) {
        console.error(`Error streaming song: ${error.message}`);
        
        let errorMessage = 'خطا در پخش آهنگ';
        if (error.message.includes('timeout')) {
            errorMessage = '⊗️ زمان بارگذاری آهنگ به پایان رسید. آهنگ بعدی...';
        } else if (error.message.includes('403') || error.message.includes('404')) {
            errorMessage = '❌ آهنگ در دسترس نیست. رد شد...';
        }
        
        await queue.textChannel.send({ 
            embeds: [createErrorEmbed(`${errorMessage}\n**آهنگ:** ${song.title}`)] 
        }).catch(console.error);
        
        queue.isPlaying = false;
        
        // اگر آهنگ بعدی وجود دارد، بپر به آن
        if (queue.songs.length > 0) {
            playNextSong(guildId);
        } else {
            queue.textChannel.send({ embeds: [createInfoEmbed('🚨 پخش متوقف شد. صف خالی است.')] }).catch(console.error);
        }
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

// --- ⭐️ تابع /nowplaying ⭐️ ---
async function nowPlayingCommand(guildId) {
    // ... (لاگ‌های قبلی برای بررسی) ...
    console.log(`--- NowPlaying Command Received ---`);
    console.log(`Guild ID: ${guildId}`);
    console.log(`Current Queues: ${[...serverQueues.keys()]}`);
    const queue = serverQueues.get(guildId);
    console.log(`Queue found for this guild? ${queue ? 'Yes' : 'NO!'}`);
    if (queue) {
        console.log(`Is nowPlaying defined? ${queue.nowPlaying ? 'Yes' : 'NO!'}`);
        // (اصلاحیه) فقط اگر nowPlaying وجود داشت، title رو لاگ کن
        if(queue.nowPlaying) {
             console.log(`Now playing title: ${queue.nowPlaying.title}`); // ممکنه هنوز undefined باشه
        }
    }
    // ===================================

    if (!queue || !queue.nowPlaying) {
        console.error(`NowPlaying failed: Queue or nowPlaying was null/undefined for guild ${guildId}`);
        return createErrorEmbed('❌ هیچ آهنگی در حال پخش نیست.');
    }

    const song = queue.nowPlaying;

    // ========== ✅✅ راه‌حل اینجاست ✅✅ ==========
    // قبل از ساخت امبد، مقادیر پیش‌فرض تعیین می‌کنیم
    const title = song.title || 'عنوان نامشخص';
    const url = song.url || '#'; // اگر URL نبود، لینک خالی می‌ذاریم
    const thumbnail = song.thumbnail || song.thumbnails?.[0]?.url || null;
    const artist = song.channel?.name || 'خواننده نامشخص';
    const duration = song.durationRaw || '??:??';
    // ==========================================

    const embed = new EmbedBuilder()
        .setColor(Colors.Aqua)
        .setTitle('▶️ در حال پخش')
        // استفاده از مقادیر ایمن شده
        .setDescription(`[${title}](${url})`)
        .setThumbnail(thumbnail)
        .addFields(
            { name: 'خواننده', value: artist, inline: true },
            { name: 'مدت زمان', value: duration, inline: true }
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

//================================================================
// توابع جدید
//================================================================

/**
 * تنظیم صدای پخش
 * @param {string} guildId 
 * @param {number} level - سطح صدا (0-100)
 * @returns {EmbedBuilder}
 */
async function setVolumeCommand(guildId, level) {
    const queue = serverQueues.get(guildId);
    if (!queue) return createErrorEmbed('هیچ آهنگی در حال پخش نیست.');
    
    // تبدیل از 0-100 به 0-1
    queue.volume = level / 100;
    
    return createSuccessEmbed(`🔊 صدا به **${level}%** تغییر یافت.\n\nتوجه: تغییر صدا از آهنگ بعدی اعمال می‌شود.`);
}

/**
 * Shuffle کردن صف (پخش تصادفی)
 * @param {string} guildId 
 * @returns {EmbedBuilder}
 */
async function shuffleCommand(guildId) {
    const queue = serverQueues.get(guildId);
    if (!queue || queue.songs.length < 2) {
        return createErrorEmbed('صف خالی است یا فقط یک آهنگ دارد.');
    }
    
    // الگوریتم Fisher-Yates shuffle
    for (let i = queue.songs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [queue.songs[i], queue.songs[j]] = [queue.songs[j], queue.songs[i]];
    }
    
    return createSuccessEmbed(`🔀 صف موسیقی به صورت تصادفی مرتب شد! (${queue.songs.length} آهنگ)`);
}

/**
 * حذف یک آهنگ خاص از صف
 * @param {string} guildId 
 * @param {number} position - شماره آهنگ در صف (1-indexed)
 * @returns {EmbedBuilder}
 */
async function removeSongCommand(guildId, position) {
    const queue = serverQueues.get(guildId);
    if (!queue || queue.songs.length === 0) {
        return createErrorEmbed('صف خالی است.');
    }
    
    const index = position - 1; // تبدیل به 0-indexed
    
    if (index < 0 || index >= queue.songs.length) {
        return createErrorEmbed(`شماره نامعتبر! صف فقط ${queue.songs.length} آهنگ دارد.`);
    }
    
    const removedSong = queue.songs.splice(index, 1)[0];
    return createSuccessEmbed(`✅ آهنگ حذف شد:\n**${removedSong.title}**`);
}

/**
 * پاک کردن تمام صف
 * @param {string} guildId 
 * @returns {EmbedBuilder}
 */
async function clearQueueCommand(guildId) {
    const queue = serverQueues.get(guildId);
    if (!queue) {
        return createErrorEmbed('صفی برای پاک کردن وجود ندارد.');
    }
    
    const clearedCount = queue.songs.length;
    queue.songs = [];
    
    return createSuccessEmbed(`🗑️ صف پاک شد! (${clearedCount} آهنگ حذف شد)\n\nتوجه: آهنگ فعلی همچنان پخش می‌شود.`);
}

/**
 * جستجوی موسیقی برای دستور search
 * @param {string} query 
 * @param {number} limit 
 * @returns {Array}
 */
async function searchMusicCommand(query, limit = 5) {
    try {
        // جستجو در SoundCloud
        const results = await play.search(query, {
            source: { soundcloud: 'tracks' },
            limit: limit
        });
        
        return results;
    } catch (error) {
        console.error(`Error searching music: ${error.message}`);
        return [];
    }
}

/**
 * فرمت کردن زمان (ثانیه به MM:SS)
 * @param {number} seconds 
 * @returns {string}
 */
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * ساخت Progress Bar
 * @param {number} current - زمان فعلی (ثانیه)
 * @param {number} total - مدت کل (ثانیه)
 * @param {number} length - طول نوار
 * @returns {string}
 */
function createProgressBar(current, total, length = 20) {
    const progress = Math.round((current / total) * length);
    const empty = length - progress;
    const bar = '▓'.repeat(progress) + '░'.repeat(empty);
    return `${formatTime(current)} ${bar} ${formatTime(total)}`;
}

/**
 * فعال/غیرفعال کردن Autoplay
 * @param {string} guildId 
 * @returns {EmbedBuilder}
 */
async function toggleAutoplayCommand(guildId) {
    const queue = serverQueues.get(guildId);
    if (!queue) {
        return createErrorEmbed('هیچ صفی برای تغییر حالت Autoplay وجود ندارد.');
    }
    
    queue.autoplay = !queue.autoplay;
    const status = queue.autoplay ? 'فعال 🔛' : 'غیرفعال ❌';
    
    return createSuccessEmbed(
        `Autoplay حالا **${status}** است.\n\n` +
        `${queue.autoplay ? '✨ بعد از اتمام صف، آهنگ‌های مرتبط پخش می‌شوند.' : '🛑 بعد از اتمام صف، پخش متوقف می‌شه.'}`
    );
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
    setVolume: setVolumeCommand,
    shuffle: shuffleCommand,
    removeSong: removeSongCommand,
    clearQueue: clearQueueCommand,
    searchMusic: searchMusicCommand,
    toggleAutoplay: toggleAutoplayCommand,
    serverQueues,
    createErrorEmbed,
    createSuccessEmbed,
    createInfoEmbed,
    formatTime,
    createProgressBar
};