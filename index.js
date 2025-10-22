// index.js
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, Events } = require('discord.js');
require('dotenv').config();

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
            const humanMembers = channel.members.filter(m => !m.user.bot);
            
            if (humanMembers.size === 0) {
                // ⭐️ استفاده از امبد برای خروج
                const leaveEmbed = createInfoEmbed('👋 کانال خالی شد. منم می‌رم. خداحافظ!');
                queue.textChannel.send({ embeds: [leaveEmbed] });
                if (queue.connection) queue.connection.disconnect();
                serverQueues.delete(oldState.guild.id);
            }
        }
    }
});

// لاگین
client.login(process.env.DISCORD_TOKEN);