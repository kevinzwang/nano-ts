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
    console.log(new Date() + ' - uncaught error from bot')
})

client.login(config.getMainToken());

export function exit() {
    client.destroy()
    console.log('\nQuitting...')
    process.exit()
}

async function updateBitcoin() {
    try {
        let priceResp = await axios.get('https://min-api.cryptocompare.com/data/price?fsym=BTC&tsyms=USD&e=Coinbase&extraParams=marvin-discord-bot')
        let historicalResp = await axios.get(`https://min-api.cryptocompare.com/data/histominute?fsym=BTC&tsym=USD&limit=1&toTs=${Math.floor(Date.now() / 1000) - 86400}&e=Coinbase&extraParams=marvin-discord-bot`)
        let yesterday = historicalResp.data.Data[1].open
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
        client.user.setPresence({
            game: {
                name: 'BTC - $??? ?'
            }
        })
    }
}