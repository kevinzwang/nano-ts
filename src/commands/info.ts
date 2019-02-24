import { Command, CommandoClient, CommandMessage } from 'discord.js-commando'
import { Message } from 'discord.js';
import * as config from '../config';


export class InfoCommand extends Command {
    constructor(client: CommandoClient) {
        super (client, {
            name: 'info',
            group: 'util',
            memberName: 'info',
            description: 'Displays information about this bot.'
        })
    }
    run(msg: CommandMessage): Promise<Message | Message[]> {
        return msg.channel.send({
            embed: {
                title: 'About Nano',
                color: 0xffffff,
                description: 'Nano is an all-purpose Discord bot written in Typescript using the Discord.js library.',
                fields: [
                    {
                        name: 'Owner',
                        value: this.client.owners[0].toString(),
                        inline: true
                    },
                    {
                        name: 'Servers',
                        value: this.client.guilds.size,
                        inline: true
                    },
                    {
                        name: 'Dev Server',
                        value: config.getSupportServer() ? config.getSupportServer() : '¯\\_(ツ)_/¯'
                    },
                    {
                        name: 'Github',
                        value: config.getGithub() ? config.getGithub() : '¯\\_(ツ)_/¯'
                    }
                ]
            }
        })
    }
}