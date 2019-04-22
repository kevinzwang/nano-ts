import { Command, CommandoClient, CommandMessage } from 'discord.js-commando'
import { Message } from 'discord.js'

export class InviteCommand extends Command {
    constructor(client: CommandoClient) {
        super (client, {
            name: 'invite',
            group: 'util',
            memberName: 'invite',
            description: 'Gives you the invite for this bot.'
        })
    }
    run(msg: CommandMessage): Promise<Message | Message[]> {
        return this.client.generateInvite().then(inv => {
            return msg.channel.send(`<${inv}>`)
        })
    }
}