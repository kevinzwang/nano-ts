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
    if (!adminGuild || !msg.guild || msg.guild.id !== adminGuild) {
        return
    }
    
    let m = msg as GuildMessage
})

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