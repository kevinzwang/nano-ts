import { Command, CommandoClient, CommandMessage } from 'discord.js-commando'
import { Message } from 'discord.js';

import { mangaListQuery } from '../constants/anilist'
import { MangaList } from "../interfaces/anilist";
import axios from 'axios'

export class AnilistCommand extends Command {
    constructor(client: CommandoClient) {
        super(client, {
            name: 'mangalist',
            group: 'weeb',
            memberName: 'mangalist',
            description: 'A command for getting a person\'s manga list.',
            aliases: [
                'ml'
            ],
            examples: [
                'mangalist watashi',
            ],
            throttling: {
                usages: 3,
                duration: 10
            }
        })
    }
    run(msg: CommandMessage, args: string): Promise<Message | Message[]> {
        return axios.post('https://graphql.anilist.co', 
            {
                query: mangaListQuery,
                variables: {
                    name: args
                }
            }
        ).then(resp => {
            return resp.data.data.User as MangaList
        }).then(al => {
            let color: number = 0x677b94
            switch (al.options.profileColor) {
                case 'blue':
                    color = 0x3db4f2
                    break
                case 'purple':
                    color = 0xc063ff
                    break
                case 'green':
                    color = 0x4cca51
                    break
                case 'orange':
                    color = 0xef881a
                    break
                case 'red':
                    color = 0xe13333
                    break
                case 'pink':
                    color = 0xfc9dd6
                    break
                case 'gray':
                    color = 0x677b94
                    break
                default:
                    color = 0x3db4f2
            }

            let statusDistrib: string = `
Reading:    ${al.stats.mangaStatusDistribution[0].amount}
Completed:  ${al.stats.mangaStatusDistribution[2].amount}
Paused:     ${al.stats.mangaStatusDistribution[4].amount}
Dropped:    ${al.stats.mangaStatusDistribution[3].amount}
Planning:   ${al.stats.mangaStatusDistribution[1].amount}`

            statusDistrib = "```\n" + statusDistrib + "\n```"

            return msg.channel.send({
                embed: {
                    title: al.name,
                    url: al.siteUrl,
                    color: color,
                    thumbnail: {
                        url: al.avatar.large
                    },
                    fields: [
                        {
                            name: "Chapters Read",
                            value: al.stats.chaptersRead ? al.stats.chaptersRead : '¯\\_(ツ)_/¯',
                            inline: true
                        },
                        {
                            name: "Mean Score",
                            value: al.stats.mangaListScores && al.stats.mangaListScores.meanScore ? '' + (al.stats.mangaListScores.meanScore / 10) : '¯\\_(ツ)_/¯',
                            inline: true
                        },
                        {
                            name: 'Manga List',
                            value: statusDistrib,
                            inline: false
                        }
                    ],
                    footer: {
                        icon_url: 'https://avatars2.githubusercontent.com/u/18018524?s=280&v=4',
                        text: 'Fetched from Anilist.co'
                    }
                }
            })
        }).catch(() => {
            return msg.reply(`Could not get user ${args}.`)
        })
    }
}