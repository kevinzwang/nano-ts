import { Command, CommandoClient, CommandMessage } from 'discord.js-commando'
import { Message } from 'discord.js'

export class TemplateCommand extends Command {
    constructor(client: CommandoClient) {
        super (client, {
            name: 'template',
            group: 'group',
            memberName: 'template',
            description: 'A template for commands.',
            ownerOnly: false, // optional
            guildOnly: false, // optional
            aliases: [ // optional
                'tmp',
                'templ'
            ],
            patterns: [/hello world/],
            examples: [ // optional
                'template',
                'template foo'
            ],
            argsType: 'single', // optional
            args: [ // optional
                {
                    key: 'arg',
                    prompt: 'please specify an argument.',
                    type: 'string'
                }
            ],
            throttling: { // optional
                usages: 3,
                duration: 10
            }
        })
    }
    run(msg: CommandMessage, args: string | string[] | { arg: string }, fromPattern: boolean): Promise<Message | Message[]> {
        return new Promise<Message | Message[]>(() => ({msg, args, fromPattern}))
    }
}