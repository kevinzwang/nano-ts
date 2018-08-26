import * as Discord from 'discord.js'

import * as config from '../config';
import { GuildMessage, RawEvent } from '../interfaces/discord'
import { ProcessEvent } from '../interfaces/process'

const client = new Discord.Client();

const adminGuild = config.getAdminGuild()
const starChannel = config.getStarChannel()

client.on('ready', () => {
    console.log(`Admin bot logged in as ${client.user.tag}!`)
});

client.on('error', (err) => {
    console.log(err)
})

client.on('message', function(msg) {
    if (!adminGuild || !msg.guild || msg.guild.id !== adminGuild) {
        return
    }
    
    let m = msg as GuildMessage
})

const events = {
	MESSAGE_REACTION_ADD: 'messageReactionAdd',
	MESSAGE_REACTION_REMOVE: 'messageReactionRemove',
};

client.on('raw', async (event: RawEvent) => {
	// `event.t` is the raw event name
	if (!events.hasOwnProperty(event.t)) return;

	const { d: data } = event;
    const user = client.users.get(data.user_id);
    if (!user) {
        return
    }
	const channel = (client.channels.get(data.channel_id) || await user.createDM()) as Discord.TextChannel;

	// if the message is already in the cache, don't re-emit the event
	if (channel.messages.has(data.message_id)) return;

	// if you're on the master/v12 branch, use `channel.messages.fetch()`
	const message = await channel.fetchMessage(data.message_id);

	// custom emojis reactions are keyed in a `name:ID` format, while unicode emojis are keyed by names
	// if you're on the master/v12 branch, custom emojis reactions are keyed by their ID
	const emojiKey = (data.emoji.id) ? `${data.emoji.name}:${data.emoji.id}` : data.emoji.name;
	const reaction = message.reactions.get(emojiKey);

	client.emit((events as any)[event.t], reaction, user);
});

client.on('messageReactionAdd', function(r: Discord.MessageReaction, usr: Discord.User) {
    if (r.message.guild.id !== adminGuild) {
        return
    }
    star(r, usr)
})

function star (r: Discord.MessageReaction, usr: Discord.User) {
    if (!starChannel || r.emoji.name !== '⭐' || usr.bot) { // || (r.message.channel as Discord.TextChannel).name === starChannel) {
        return
    }

    if (r.message.embeds.length) {
        r.message.channel.send(`${usr}, unfortunately I can't embed embeds. What you can do is take a screenshot and star that.`)
        return
    }

    if (r.count > 1) {
        return
    }

    let chan = r.message.guild.channels.find('name', starChannel) as Discord.TextChannel

    chan.send({
        embed: {
            color: 0xfdc130,
            author: {
                name: `${r.message.author.tag} in #${(r.message.channel as Discord.TextChannel).name}`,
                icon_url: r.message.author.displayAvatarURL
            },
            description: r.message.content,
            image: {
                url: r.message.attachments.first().url
            },
            footer: {
                text: r.message.createdAt.toLocaleString()
            }
        }
    })
}

client.login(config.getMainToken());

process.on('message', (msg: ProcessEvent) => {
    switch(msg.type) {
        case 'EXIT':
            exit()
            break
    }
})

function exit() {
    client.destroy().then(() => process.exit())
}

process.on('SIGINT', exit)