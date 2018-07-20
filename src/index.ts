import * as Commando from 'discord.js-commando'
import * as path from 'path'

import * as config from './config';

const client = new Commando.CommandoClient({
    owner: config.getOwner(),
    commandPrefix: <string>config.getPrefix('global'),
    invite: config.getSupportServer()
})

client.registry
    .registerGroups([
        ['fun', 'Fun'],
        ['weeb', 'Weeb']
    ])
    .registerDefaults()
    .registerCommandsIn(path.join(__dirname, 'commands'));

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('commandPrefixChange', (guild, prefix) => {
    if (guild || prefix) {
        let id = guild ? guild.id : 'global'
        config.setPrefix(id, prefix)
    }
})

client.on('commandRun', (_0: any, _1: any, msg: Commando.CommandMessage) => {
    msg.channel.startTyping()
})

client.login(config.getToken());

export function quit() {
    client.destroy()
    console.log('\nQuitting...')
    process.exit()
}

process.on('SIGINT', quit)