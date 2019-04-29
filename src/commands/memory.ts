import { Command, CommandoClient, CommandMessage } from 'discord.js-commando'
import { Message } from 'discord.js'

export class MemoryCommand extends Command {
    constructor(client: CommandoClient) {
        super (client, {
            name: 'memory',
            group: 'util',
            memberName: 'memory',
            description: 'Checks memory usage of the bot.',
            ownerOnly: true, 
            aliases: [ 'mem' ],
            examples: [ 'memory' ]
        })
    }
    run(msg: CommandMessage): Promise<Message | Message[]> {
        let memUsed = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)
        let memTotal = (process.memoryUsage().heapTotal / 1024 / 1024).toFixed(1)
        return msg.channel.send(`This bot is using approximately ${memUsed} MB out of ${memTotal} MB of memory.`)
    }
}