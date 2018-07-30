import { Command, CommandoClient, CommandMessage } from 'discord.js-commando'
import { Message } from 'discord.js';
import axios from 'axios'


function nekosLife(category: string): Promise<string> {
    return axios.get('https://nekos.life/api/v2/img/' + category).then(resp => {
        return resp.data.url
    })
}

export class NekoCommand extends Command {
    constructor(client: CommandoClient) {
        super (client, {
            name: 'neko',
            group: 'weeb',
            memberName: 'neko',
            description: 'Shows a random catgirl image.',
            aliases: [
                'catgirl',
            ],
            throttling: {
                usages: 3,
                duration: 10
            }
        })
    }
    run(msg: CommandMessage): Promise<Message | Message[]> {
        return nekosLife('neko').then(url => {
            return msg.channel.send(url)
        })
    }
}

export class FoxgirlCommand extends Command {
    constructor(client: CommandoClient) {
        super (client, {
            name: 'foxgirl',
            group: 'weeb',
            memberName: 'foxgirl',
            description: 'Shows a random catgirl image.',
            throttling: {
                usages: 3,
                duration: 10
            }
        })
    }
    run(msg: CommandMessage): Promise<Message | Message[]> {
        return nekosLife('fox_girl').then(url => {
            return msg.channel.send(url)
        })
    }
}