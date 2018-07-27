import { Command, CommandoClient, CommandMessage } from 'discord.js-commando'
import { Message, TextChannel, DMChannel, GroupDMChannel } from 'discord.js';

import { animeListQuery } from '../../constants/anilist'
import { AnimeList } from "../../interfaces/anilist";
import axios from 'axios'

export class AnilistCommand extends Command {
    constructor(client: CommandoClient) {
        super(client, {
            name: 'anilist',
            group: 'weeb',
            memberName: 'anilist',
            description: 'A command for getting a person\'s anime list.',
            aliases: [
                'al'
            ],
            examples: [
                'anilist watashi',
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
                query: animeListQuery,
                variables: {
                    name: args
                }
            }
        ).then(resp => {
            return resp.data.data.User as AnimeList
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
Watching:   ${al.stats.animeStatusDistribution[0].amount}
Completed:  ${al.stats.animeStatusDistribution[2].amount}
Paused:     ${al.stats.animeStatusDistribution[4].amount}
Dropped:    ${al.stats.animeStatusDistribution[3].amount}
Planning:   ${al.stats.animeStatusDistribution[1].amount}`

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
                            name: "Days Watched",
                            value: al.stats.watchedTime ? '' + (Math.floor(al.stats.watchedTime/144) / 10) : '¯\\_(ツ)_/¯', // weird way to have one digit after decimal point from minutes to days
                            inline: true
                        },
                        {
                            name: "Mean Score",
                            value: al.stats.animeListScores && al.stats.animeListScores.meanScore ? al.stats.animeListScores.meanScore + '/100' : '¯\\_(ツ)_/¯',
                            inline: true
                        },
                        {
                            name: 'Anime List',
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