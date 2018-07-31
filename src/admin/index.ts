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

    enforce4Chan(m)
})

let channers: any = {}
let badPeople: any = {}
function enforce4Chan(msg: GuildMessage) {
    if (msg.channel.name === 'kevin' && (msg.attachments.size == 0 || channers[msg.author.id] > Date.now())) {
        msg.delete()

        if (!badPeople[msg.author.id]) {
            badPeople[msg.author.id] = 0
        }
        badPeople[msg.author.id]++

        if (badPeople[msg.author.id] == 6) {
            msg.author.createDM().then(chan => {
                chan.send('ur gonna get kicked if you continue')
            })
        }

        if (badPeople[msg.author.id] == 8) {
            let member = msg.guild.members.get(msg.author.id)
            if (member != undefined) {
                member.kick('no u')
            }
            badPeople[msg.author.id] = 0
        }
    } else {
        channers[msg.author.id] = Date.now() + 120000
        badPeople[msg.author.id] = 0
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