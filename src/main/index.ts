import * as Commando from 'discord.js-commando'
import * as path from 'path'

import * as config from '../config';

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
    ])
    .registerDefaults()
    .registerCommandsIn(path.join(__dirname, 'commands'));

client.on('ready', () => {
    console.log(`Main bot logged in as ${client.user.tag}!`);
});

client.on('commandPrefixChange', (guild, prefix) => {
    if (guild || prefix) {
        let id = guild ? guild.id : 'global'
        config.setPrefix(id, prefix)
    }
})

client.login(config.getMainToken());

export function exit() {
    client.destroy().then(() => process.exit())
    console.log('\nQuitting...')
}

process.on('SIGINT', exit)