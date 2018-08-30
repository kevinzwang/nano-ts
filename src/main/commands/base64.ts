import { Command, CommandoClient, CommandMessage } from 'discord.js-commando'
import { Message } from 'discord.js';
import { Base64 } from 'js-base64'

export class EncodeCommand extends Command {
    constructor(client: CommandoClient) {
        super (client, {
            name: 'encode',
            group: 'misc',
            memberName: 'encode',
            description: 'Base64 encoder.',
            examples: [
                'encode your face'
            ]
        })
    }
    run(msg: CommandMessage, args: string): Promise<Message | Message[]> {
        return msg.channel.send('```' + Base64.encode(args) + '```')
    }
}

export class DecodeCommand extends Command {
    constructor(client: CommandoClient) {
        super (client, {
            name: 'decode',
            group: 'misc',
            memberName: 'decode',
            description: 'Base64 decoder.',
            examples: [
                'decode eW91ciBmYWNl'
            ]
        })
    }
    run(msg: CommandMessage, args: string): Promise<Message | Message[]> {
        return msg.channel.send('```' + Base64.decode(args) + '```')
    }
}