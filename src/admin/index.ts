import * as Discord from 'discord.js'

import * as config from '../config';

const client = new Discord.Client();

client.on('ready', () => {
    console.log(`Admin bot logged in as ${client.user.tag}!`)
});

client.on('error', (err) => {
    console.log(err)
})

client.login(config.getMainToken());

function exit() {
    client.destroy().then(() => process.exit())
}

process.on('SIGINT', exit)