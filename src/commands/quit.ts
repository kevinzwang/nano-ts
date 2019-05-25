import { Command, CommandoClient, CommandMessage } from 'discord.js-commando'

import { exit } from '..'

const exitMessages = [
    'bye'
]

export class QuitCommand extends Command {
    constructor(client: CommandoClient) {
        super(client, {
            name: 'quit',
            group: 'util',
            memberName: 'quit',
            description: 'Shuts down the bot.',
            aliases: ['exit', 'shutdown', 'q'],
            ownerOnly: true
        })
    }

    run(msg: CommandMessage): any {
        let randIndex = Math.floor(Math.random() * exitMessages.length)
        msg.channel.send(exitMessages[randIndex]).then(() => {
            exit()
        })
    }
}