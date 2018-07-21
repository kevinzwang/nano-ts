import { Command, CommandoClient, CommandMessage } from 'discord.js-commando'
import { Message } from 'discord.js';

import { ProcessEvent, InviteResponse } from '../../interfaces/process'

export class InviteCommand extends Command {
    constructor(client: CommandoClient) {
        super (client, {
            name: 'invite',
            group: 'util',
            memberName: 'invite',
            description: 'Gives you the invite for this bot.'
        })
    }
    run(msg: CommandMessage): any {
        return this.client.generateInvite().then(inv => {
            if (process) {
                (<any> process).send({ type: 'INVITE_REQUEST' })
                process.on('message', (resp: ProcessEvent) => {
                    if (resp.type === 'INVITE_RESPONSE') {
                        msg.channel.send(`Main: <${inv}>`)
                        msg.channel.send(`Helper: <${(<InviteResponse>resp.data).invite}>`)
                    }
                })
            } else {
                msg.channel.send(`<${inv}>`)
            }
        })
    }
}