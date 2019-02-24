import * as Commando from 'discord.js-commando'
import * as path from 'path'
import axios from 'axios'

import * as config from './config';

const client = new Commando.CommandoClient({
    owner: config.getOwner(),
    commandPrefix: <string>config.getPrefix('global'),
    invite: config.getSupportServer(),
    unknownCommandResponse: false
})

client.registry
    .registerGroups([
        ['fun', 'Fun'],
        ['weeb', 'Weeb'],
        ['misc', 'Miscellaneous'],
        ['frc', 'FIRST Robotics Competition'],
    ])
    .registerDefaults()
    .registerCommandsIn(path.join(__dirname, 'commands'));

client.on('ready', () => {
    console.log(`Bot logged in as ${client.user.tag}!`);
});

client.on('commandPrefixChange', (guild, prefix) => {
    if (guild || prefix) {
        let id = guild ? guild.id : 'global'
        config.setPrefix(id, prefix)
    }
})

client.on('error', (err) => {
    console.log(new Date() + ' - uncaught error from bot')
})

client.login(config.getMainToken());

export function exit() {
    client.destroy()
    console.log('\nQuitting...')
    process.exit()
}