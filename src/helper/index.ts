import * as Discord from 'discord.js'

import * as config from '../config';
import { ProcessEvent, SpoilerMsg } from '../interfaces/process'
import { TextChannel, GroupDMChannel } from 'discord.js';

const client = new Discord.Client();

client.on('ready', () => {
    console.log(`Helper bot logged in as ${client.user.tag}!`);
    client.user.setStatus('dnd')
});

client.login(config.getHelperToken());

process.on('message', (msg: ProcessEvent) => {
    switch(msg.type) {
        case 'SPOILER':
            let data = msg.data as SpoilerMsg
            sendSpoiler(data.channel, data.message)
            break
        case 'EXIT':
            exit()
            break
        case 'INVITE_REQUEST':
            replyInvite()
            break
    }
})

function sendSpoiler(channel: string, msg: string) {
    let chan = client.channels.get(channel)
    if (chan) {
        (<TextChannel | GroupDMChannel>chan).send(msg)
    }
}

function replyInvite() {
    if (process) {
        client.generateInvite().then(inv => {
            (<any> process).send({ 
                type: 'INVITE_RESPONSE',
                data: {
                    invite: inv
                }
            })
        })
    }
}

function exit() {
    client.destroy().then(() => process.exit())
}

process.on('SIGINT', exit)