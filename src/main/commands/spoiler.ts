import { Command, CommandoClient } from 'discord.js-commando'
import { Message, GuildMember } from 'discord.js';

import { ProcessEvent, IDResponse } from '../../interfaces/process'
import { CommandGuildMessage } from '../../interfaces/discord';

export class SpoilerCommand extends Command {
    readonly embedColor: number = 0x9544ff
    helperID: string = ''

    constructor(client: CommandoClient) {
        super (client, {
            name: 'spoiler',
            group: 'misc',
            memberName: 'spoiler',
            description: 'Hides your message with the help of Nano.',
            guildOnly: true,
            aliases: [
                'spoilers',
                's'
            ],
            throttling: {
                usages: 3,
                duration: 60
            }
        })
        if (process) {
            (<any> process).send({ type: 'ID_REQUEST' })
            process.once('message', (resp: ProcessEvent) => {
                if (resp.type == 'ID_RESPONSE') {
                    this.helperID = (<IDResponse>resp.data).id
                } 
            })
        }
    }

    async run(msg: CommandGuildMessage): Promise<any> {
        let helper = await this.client.fetchUser(this.helperID)

        if (!msg.guild.members.some(usr => usr.id == helper.id)) {
            msg.channel.send(`You must add ${helper.tag} for this command to work. Use the invite command to get invite links.`)
            return
        }
        if (msg.deletable) {
            msg.delete()
        }
        msg.author.send(`Spoiler message to #${msg.channel.name} in server ${msg.guild.name}.\nType \`cancel\` any time to cancel this command.\n\nFirst, enter a short, non-spoiler description for your message`)

        try {
            let filter = (m: Message) => {
                return m.author.equals(msg.author)
            }

            let dm = await msg.author.createDM()

            let description = ''
            while (!description) {
                let descReplies = await dm.awaitMessages(filter, { time: 180000, maxMatches: 1, errors: ['time'] })
                let reply = descReplies.first()
                if (reply.attachments.size) {
                    dm.send('You can\'t have attachments in the description. Try again:')
                    continue
                } else {
                    description = reply.content
                    if (description === 'cancel') {
                        msg.author.send('Cancelled.')
                        return
                    }
                }   
            }

            msg.author.send('Now, enter your spoiler.')
            let spoilerReplies = await dm.awaitMessages(filter, { time: 180000, maxMatches: 1, errors: ['time'] })
            let reply = spoilerReplies.first()
            let spoiler = reply.content
            reply.attachments.forEach(attachment => {
                spoiler += '\n' + attachment.url
            })
            if (spoiler === 'cancel') {
                msg.author.send('Cancelled.')
                return
            }

            msg.channel.send({embed: {
                author: {
                    name: msg.author.tag,
                    icon_url: msg.author.displayAvatarURL
                },
                description: '__Spoilers about__: ' + description,
                color: (<GuildMember>msg.guild.members.get(msg.author.id)).displayColor,
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