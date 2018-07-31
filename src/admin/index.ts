import * as Discord from 'discord.js'

import * as config from '../config';
import { GuildMessage } from '../interfaces/discord'
import { ProcessEvent } from '../interfaces/process'

const client = new Discord.Client();

const adminGuild = config.getAdminGuild()

client.on('ready', () => {
    console.log(`Admin bot logged in as ${client.user.tag}!`)
});

client.on('error', (err) => {
    console.log(err)
})

client.on('message', function(msg) {
    if (!adminGuild || msg.guild.id !== adminGuild) {
        return
    }
    
    let m = msg as GuildMessage

    enforce4Chan(m)
})

function enforce4Chan(msg: GuildMessage) {
    if (msg.channel.name === '4chan' && msg.attachments.size == 0) {
        msg.delete()
    }
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