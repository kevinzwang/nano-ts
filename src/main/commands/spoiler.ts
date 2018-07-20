import { Command, CommandoClient, CommandMessage } from 'discord.js-commando'
import { Message, TextChannel } from 'discord.js';

import { ProcessEvent } from '../../interfaces/process'
import { getHelperID, getOwner } from '../../config'

export class SpoilerCommand extends Command {
    readonly embedColor: number = 0x9544ff

    constructor(client: CommandoClient) {
        super (client, {
            name: 'spoiler',
            group: 'misc',
            memberName: 'spoiler',
            description: 'Hides your message with the help of Nano.',
            guildOnly: true,
            throttling: {
                usages: 3,
                duration: 60
            }
        })
    }
    async run(msg: CommandMessage): Promise<any> {
        let helper = await this.client.fetchUser(getHelperID())

        if (!msg.guild.members.some(usr => usr.id == helper.id)) {
            msg.channel.send(`You must add ${helper.tag} for this command to work. Use the invite command to get invite links.`)
            return
        }

        msg.author.send(`Spoiler message to #${(<TextChannel>msg.channel).name} in server ${msg.guild.name}.
Type \`cancel\` any time to cancel this command.

First, enter a short, non-spoiler description for your message`)
            .then(() =>{
                msg.reply('Sent you a DM with information.')
            })

        try {
            let filter = (m: Message) => {
                return m.author.equals(msg.author)
            }

            let dm = await msg.author.createDM()

            let descReplies = await dm.awaitMessages(filter, { time: 180000, maxMatches: 1, errors: ['time'] })
            let description = descReplies.first().content
            if (description === 'cancel') {
                msg.author.send('Cancelled.')
                return
            }

            msg.author.send('Now, enter your spoiler.')
            let spoilerReplies = await dm.awaitMessages(filter, { time: 180000, maxMatches: 1, errors: ['time'] })
            let spoiler = spoilerReplies.first().content
            if (spoiler === 'cancel') {
                msg.author.send('Cancelled.')
                return
            }

            msg.channel.send({embed: {
                author: {
                    name: msg.author.tag,
                    icon_url: msg.author.displayAvatarURL
                },
                description: '__Spoilers about:__ ' + description,
                color: this.embedColor,
                footer: {
                    text: `For spoilers to work, you need to block ${helper.tag}.`
                }
            }}).then(()  => {
                msg.author.send('Spoilers sent!')

                let spoilerMsg: ProcessEvent = {
                    type: 'SPOILER', 
                    data: {
                        channel: msg.channel.id,
                        message: spoiler
                    }
                }
                if (process) {
                    (<any> process).send(spoilerMsg)
                }
            })
        } catch (err) {
            console.log(err)
            return msg.author.send(`Took too long to give response, cancelling.`)
        }
    }
}