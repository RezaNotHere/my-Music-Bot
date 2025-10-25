// index.js
const fs = require('node:fs');
const path = require('node:path');
const play = require('play-dl')
const { Client, Collection, GatewayIntentBits, Events, ActivityType } = require('discord.js');
require('dotenv').config();


// ⭐️ ۲. تنظیم کردن play-dl برای استفاده از کوکی‌ها
// ⭐️⭐️⭐️ بلوک صحیح (مربوط به ساندکلود) ⭐️⭐️⭐️


        (async () => {
            try {
                // فقط تنظیم کردن ساندکلود
                await play.setToken({
                    soundcloud: {
                        client_id: process.env.SOUNDCLOUD_CLIENT_ID
                    }
                });
                console.log('✅ play-dl (SoundCloud) با Client ID احراز هویت شد.');

            } catch (e) {
                console.error(`❌ خطا در احراز هویت play-dl با SoundCloud: ${e.message}`);
            }
        })();
        
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates
    ]
});

// لود کردن دستورات
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    }
}

// رویداد ready
client.once(Events.ClientReady, readyClient => {
    console.log(`✅ Ready! Logged in as ${readyClient.user.tag}`);
    //readyClient.user.setActivity('موسیقی', { type: ActivityType.Listening });
    console.log('💡Make By Reza')
    const statusText = "یــــوســــــف پیامــــبر";
    readyClient.user.setActivity(statusText, {
        type: ActivityType.Watching
    });
});

// ⭐️ وارد کردن توابع کمکی امبد
const { serverQueues, createErrorEmbed, createInfoEmbed } = require('./music-player.js');

// شنونده اصلی دستورات
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        // ⭐️ استفاده از امبد برای خطا
        const errorEmbed = createErrorEmbed('خطایی هنگام اجرای این دستور رخ داد!');
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
        } else {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
});

// شنونده جدید: مدیریت پایداری و خروج خودکار
client.on(Events.VoiceStateUpdate, (oldState, newState) => {
    if (newState.id === client.user.id && newState.channelId === null) {
        const queue = serverQueues.get(oldState.guild.id);
        if (queue) {
            queue.player.stop();
            serverQueues.delete(oldState.guild.id);
            console.log(`Queue for ${oldState.guild.name} cleared as bot was disconnected.`);
        }
    }

    const queue = serverQueues.get(oldState.guild.id);
    if (queue && oldState.channelId === queue.voiceChannel.id) {
        const channel = oldState.guild.channels.cache.get(queue.voiceChannel.id);
        if (channel) {
            const members = channel.members.filter(member => !member.user.bot);
            if (members.size === 0) {
                queue.player.stop();
                serverQueues.delete(oldState.guild.id);
                console.log(`Queue for ${oldState.guild.name} cleared as all members left the voice channel.`);
            }            

            
        }
    }
});

// لاگین
client.login(process.env.DISCORD_TOKEN);