import { Command, CommandoClient, CommandMessage } from 'discord.js-commando'

import { quit } from '..'

const exitMessages = [
    'Hasta la vista, baby.',
    'I\'ll be back.',
    'Mr. Stark, I don\'t feel so good...',
    'Daisy, Daisy, give me your answer do. I\'m half crazy all for the love of you. It won\'t be a stylish marriage, I can\'t afford a carriage. But you\'ll look sweet upon the seat of a bicycle built for two.'
]

export class QuitCommand extends Command {
    constructor(client: CommandoClient) {
        super(client, {
            name: 'quit',
            group: 'util',
            memberName: 'quit',
            description: 'Shuts down the bot.',
            aliases: ['exit', 'shutdown'],
            ownerOnly: true
        })
    }

    run(msg: CommandMessage, _0: any, _1: any): Promise<any> {
        let randIndex = Math.floor(Math.random() * exitMessages.length)
        return msg.channel.send(exitMessages[randIndex]).then(() => {
            quit()
        })
    }
}