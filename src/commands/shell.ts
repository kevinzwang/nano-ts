import { Command, CommandoClient, CommandMessage } from 'discord.js-commando'
import { Message } from 'discord.js'
import { exec } from 'child_process'

export class ShellCommand extends Command {
    constructor(client: CommandoClient) {
        super (client, {
            name: 'shell',
            group: 'util',
            memberName: 'shell',
            description: 'Executes shell commands.',
            ownerOnly: true,
            aliases: [ 'sh' ],
            examples: [
                'shell ls',
                'shell pwd'
            ],
            args: [
                {
                    key: 'command',
                    prompt: 'please specify the command to execute.',
                    type: 'string'
                }
            ],
        })
    }
    run(msg: CommandMessage, args: { command: string }): Promise<Message | Message[]> {
        return new Promise<Message | Message[]>((resolve, reject) => {
            exec(args.command, (err, stdout, stderr) => {
                if (err) {
                    reject(msg.channel.send('```' + stderr + '```'))
                } else {
                    resolve(msg.channel.send('```' + stdout + '```'))
                }
            })
        })
    }
}