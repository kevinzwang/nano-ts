import { Command, CommandoClient, CommandMessage } from 'discord.js-commando'
import { Message } from 'discord.js';

export class TemplateCommand extends Command {
    constructor(client: CommandoClient) {
        super (client, {
            name: 'template',
            group: 'group',
            memberName: 'template',
            description: 'A template for commands.',
            ownerOnly: false, // optional
            aliases: [ // optional
                'tmp',
                'templ'
            ],
            examples: [ // optional
                'template',
                'template foo'
            ],
            throttling: { // optional
                usages: 3,
                duration: 10
            }
        })
    }
    run(msg: CommandMessage, args: string | object | string[], fromPattern: boolean): Promise<Message | Message[]> {
        return new Promise<Message | Message[]>(() => ({msg, args, fromPattern}))
    }
}