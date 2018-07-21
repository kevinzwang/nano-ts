import * as Discord from 'discord.js'

import * as config from '../config';
import { ProcessEvent, SpoilerMsg } from '../interfaces/process'
import { TextChannel, GroupDMChannel } from 'discord.js';

const client = new Discord.Client();

client.on('ready', () => {
    console.log(`Helper bot logged in as ${client.user.tag}!`);
    client.user.setStatus('dnd')
});

let responses = [
    'Sorry, I\'m only here to help Marvin.',
    'Just block me already!',
    'I-it\'s not like I like you or anything!',
    'Seriously, I hate you.',
    'Baka!',
    'Jesus, don\'t you have something better to do?.',
    'You\'ve exausted my automated responses. Looping back...',
    'Sorry, I\'m only here to help Marvin.',
    'Ok, I lied. There were still more responses.',
    'But this is the last one. I swear!',
    'Sorry, I\'m only here to help Marvin.',
    'Just block me already!',
    'I-it\'s not like I like you or anything!',
    'Seriously, I hate you.',
    'Baka!',
    'If you don\'t stop talking to me, **I\'m** blocking **you**.',
    'I\'m gonna block you, you hear me?',
    'Blocking in 3...',
    '2...',
    '1...',
    '0...',
    '-1...',
    'How do you do this again?',
    'Ah, found the button.',
    'Bye!!! It was good talking to you. JK.'
]

let respCount: any= {}

client.on('message', (msg) => {
    if (msg.guild == null && !msg.author.equals(client.user)) {
        if (respCount[msg.author.id] == undefined) {
            respCount[msg.author.id] = 0
        }
        if (respCount[msg.author.id] == responses.length) {
            return
        }
        msg.channel.send(responses[respCount[msg.author.id]])
        respCount[msg.author.id] ++
    }
})

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