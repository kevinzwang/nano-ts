import * as Commando from 'discord.js-commando'
import * as path from 'path'
import axios from 'axios'

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

    // watch bitcoin
    updateBitcoin()
    setInterval(updateBitcoin, 60000)
});

client.on('commandPrefixChange', (guild, prefix) => {
    if (guild || prefix) {
        let id = guild ? guild.id : 'global'
        config.setPrefix(id, prefix)
    }
})

client.on('error', (err) => {
    console.log(err)
})

client.login(config.getMainToken());

export function exit() {
    client.destroy().then(() => process.exit())
    console.log('\nQuitting...')
}

async function updateBitcoin() {
    try {
        let priceResp = await axios.get('https://min-api.cryptocompare.com/data/price?fsym=BTC&tsyms=USD&extraParams=marvin-discord-bot')
        let historicalResp = await axios.get('https://min-api.cryptocompare.com/data/histohour?fsym=BTC&tsym=USD&limit=24&extraParams=marvin-discord-bot')
        let yesterday = historicalResp.data.Data[0].open
        let price = priceResp.data.USD

        let presence = 'BTC - $' + price + ' '

        let diff = (((price / yesterday) - 1) * 100).toFixed(2)
        if (price > yesterday) {
            presence += '▲'
        } else if (price < yesterday) {
            presence += '▼'
        } else {
            presence += '~'
        }
        presence += diff + '%'

        client.user.setPresence({
            game: {
                name: presence
            }
        })
    } catch (err) {
        console.log(err)
        client.user.setPresence({
            game: {
                name: 'BTC - $??? ?'
            }
        })
    }
}

process.on('SIGINT', exit)