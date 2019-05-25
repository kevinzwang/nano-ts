import { Command, CommandoClient, CommandMessage } from 'discord.js-commando'
import { Message } from 'discord.js'
import { getAssetPath } from '../../../util/general';
import { description } from '..';

export class DescriptionCommand extends Command {
    constructor(client: CommandoClient) {
        super (client, {
            name: '!description',
            group: 'game',
            memberName: '!description',
            description: 'Shows the game description.',
            aliases: [
                '!descr',
                '!d'
            ],
            throttling: {
                usages: 3,
                duration: 10
            }
        })
    }
    run(msg: CommandMessage,): Promise<Message | Message[]> {
        return msg.channel.send({
            embed: {
                title: 'Spring 2019 game: Demon Slayer',
                color: 0xFFC0CB,
                description: description,
                file: getAssetPath('demon-slayer.jpg'),
                image: {
                    url: 'attachment://demon-slayer.jpg'
                }
            }
        })
    }
}